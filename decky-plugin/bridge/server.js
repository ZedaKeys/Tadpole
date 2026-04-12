const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '3456', 10);
const STATE_FILE = process.env.STATE_FILE || path.join(os.tmpdir(), 'tadpole_state.json');
const COMMAND_FILE = process.env.COMMAND_FILE || path.join(os.tmpdir(), 'tadpole_commands.json');
const BRIDGE_VERSION = '0.1.0';
const PB_ERROR_ENDPOINT = 'http://192.168.1.78:8095/api/collections/tadpole_errors/records';
const ERROR_LOG_FILE = path.join(__dirname, 'bridge-error.log');

// ---------------------------------------------------------------------------
// Error logging & reporting
// ---------------------------------------------------------------------------
const errorReportTimestamps = [];
const ERROR_RATE_LIMIT_PER_MINUTE = 10;

function reportBridgeError(message, stack, extra = {}) {
  try {
    const now = Date.now();
    // Rate limit
    const recent = errorReportTimestamps.filter(t => now - t < 60000);
    if (recent.length >= ERROR_RATE_LIMIT_PER_MINUTE) return;
    errorReportTimestamps.length = 0;
    errorReportTimestamps.push(...recent, now);

    const record = {
      source: 'bridge',
      message: String(message || 'Unknown error'),
      stack: stack ? String(stack) : undefined,
      url: `bridge://port:${PORT}`,
      userAgent: `TadpoleBridge/${BRIDGE_VERSION} (${os.type()} ${os.release()})`,
      metadata: { ...extra, pid: process.pid, uptime: process.uptime() },
      version: BRIDGE_VERSION,
      timestamp: new Date().toISOString(),
    };

    // Log locally
    const logLine = `[${record.timestamp}] [ERROR] ${record.message}${record.stack ? '\n  ' + record.stack.split('\n').slice(0, 5).join('\n  ') : ''}\n`;
    try {
      fs.appendFileSync(ERROR_LOG_FILE, logLine);
      // Keep error log under 1MB
      try {
        const stat = fs.statSync(ERROR_LOG_FILE);
        if (stat.size > 1024 * 1024) {
          const content = fs.readFileSync(ERROR_LOG_FILE, 'utf8');
          const lines = content.split('\n');
          fs.writeFileSync(ERROR_LOG_FILE, lines.slice(-500).join('\n'));
        }
      } catch {}
    } catch {}

    // Report to PocketBase (fire and forget, 3s timeout)
    const postData = JSON.stringify(record);
    const url = new URL(PB_ERROR_ENDPOINT);
    const req = http.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 3000,
    }, () => {});
    req.on('error', () => {}); // silently fail
    req.on('timeout', () => { req.destroy(); });
    req.write(postData);
    req.end();
  } catch {
    // Never let error reporting crash the server
  }
}

// Wrap a function with error catching that reports
function safeWrap(fn, label) {
  return function (...args) {
    try {
      const result = fn.apply(this, args);
      if (result && typeof result.catch === 'function') {
        return result.catch(err => {
          reportBridgeError(`${label}: ${err?.message || err}`, err?.stack, { args: args.map(a => typeof a) });
        });
      }
      return result;
    } catch (err) {
      reportBridgeError(`${label}: ${err?.message || err}`, err?.stack);
    }
  };
}

// ---------------------------------------------------------------------------
// Express app + status page
// ---------------------------------------------------------------------------
const app = express();

// CORS for phone app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

let currentState = null;
let previousState = null;
let connectedClients = 0;
const stateHistory = [];          // rolling buffer of last 100 snapshots
const eventLog = [];              // recent detected events

// JSON status endpoint for DeckyLoader plugin & programmatic consumers
app.get('/status', safeWrap((req, res) => {
  res.json({
    name: 'Tadpole Bridge Server',
    version: BRIDGE_VERSION,
    uptime: process.uptime(),
    stateFile: STATE_FILE,
    commandFile: COMMAND_FILE,
    stateFileExists: fs.existsSync(STATE_FILE),
    connectedClients,
    currentState,
    recentEvents: eventLog.slice(-20),
    historyLength: stateHistory.length,
  });
}, 'GET /status'));

app.get('/', (req, res) => {
  const status = {
    name: 'Tadpole Bridge Server',
    version: '0.1.0',
    uptime: process.uptime(),
    stateFile: STATE_FILE,
    commandFile: COMMAND_FILE,
    stateFileExists: fs.existsSync(STATE_FILE),
    connectedClients,
    currentState,
    recentEvents: eventLog.slice(-20),
    historyLength: stateHistory.length,
  };
  res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Tadpole Bridge</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:720px;margin:2em auto;padding:0 1em;background:#1a1a2e;color:#eee}
  h1{color:#48bfe3} h2{color:#72ddf7}
  pre{background:#16213e;padding:1em;border-radius:8px;overflow-x:auto;font-size:0.85em}
  .ok{color:#52b788} .warn{color:#f4a261} .err{color:#e76f51}
  .meta{color:#8d99ae;font-size:0.85em}
</style></head><body>
<h1>🐸 Tadpole Bridge</h1>
<p class="meta">v0.1.0 &middot; uptime ${Math.floor(status.uptime)}s &middot; port ${PORT}</p>

<h2>Connections</h2>
<p>Connected phone apps: <strong>${status.connectedClients}</strong></p>

<h2>State File</h2>
<p>Path: <code>${status.stateFile}</code> &mdash; <span class="${status.stateFileExists ? 'ok' : 'warn'}">${status.stateFileExists ? 'found' : 'not yet written by Lua mod'}</span></p>
<p>Command file: <code>${status.commandFile}</code></p>

<h2>Current State</h2>
<pre>${status.currentState ? JSON.stringify(status.currentState, null, 2) : 'No state received yet.'}</pre>

<h2>Recent Events (${status.recentEvents.length})</h2>
${status.recentEvents.length
  ? status.recentEvents.map(e => `<div><strong>${e.type}</strong> <span class="meta">${new Date(e.timestamp * 1000).toLocaleTimeString()}</span> ${e.detail || ''}</div>`).reverse().join('\n')
  : '<p>No events detected yet.</p>'}

<h2>History</h2>
<p>${status.historyLength} snapshots buffered (max 100)</p>
</body></html>`);
});

// ---------------------------------------------------------------------------
// HTTP server + WebSocket server
// ---------------------------------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  path: '/ws',
  // ISSUE 8: WebSocket keepalive — ping every 30s, destroy if no pong in 10s
  clientTracking: true,
});

// ---------------------------------------------------------------------------
// Event detection
// ---------------------------------------------------------------------------
function detectEvents(prev, curr) {
  if (!prev) return [];
  const events = [];
  const now = curr.timestamp || Math.floor(Date.now() / 1000);

  // Combat started / ended
  if (!prev.inCombat && curr.inCombat) {
    events.push({ type: 'combat_started', timestamp: now, detail: 'Combat has begun!' });
  } else if (prev.inCombat && !curr.inCombat) {
    events.push({ type: 'combat_ended', timestamp: now, detail: 'Combat ended.' });
  }

  // Area changed
  if (prev.area !== curr.area && curr.area) {
    events.push({ type: 'area_changed', timestamp: now, detail: `${prev.area || '???'} → ${curr.area}` });
  }

  // Dialog started / ended
  if (!prev.inDialog && curr.inDialog) {
    events.push({ type: 'dialog_started', timestamp: now, detail: 'Dialog started.' });
  } else if (prev.inDialog && !curr.inDialog) {
    events.push({ type: 'dialog_ended', timestamp: now, detail: 'Dialog ended.' });
  }

  // HP warnings — check host and all party members
  const checkHp = (label, member) => {
    if (!member) return;
    const pct = member.maxHp > 0 ? member.hp / member.maxHp : 1;
    if (pct <= 0.25 && pct > 0) {
      events.push({
        type: 'hp_critical',
        timestamp: now,
        detail: `${label} HP critical: ${member.hp}/${member.maxHp} (${Math.round(pct * 100)}%)`,
      });
    }
  };
  checkHp(curr.host?.name || 'Host', curr.host);
  if (curr.party) {
    for (const member of curr.party) {
      checkHp(member.name, member);
    }
  }

  // Level up — host or party
  if (curr.host && prev.host && curr.host.level > prev.host.level) {
    events.push({ type: 'level_up', timestamp: now, detail: `${curr.host.name} reached level ${curr.host.level}!` });
  }
  if (curr.party && prev.party) {
    for (let i = 0; i < curr.party.length; i++) {
      const cm = curr.party[i];
      const pm = prev.party[i];
      if (pm && cm.level > pm.level) {
        events.push({ type: 'level_up', timestamp: now, detail: `${cm.name} reached level ${cm.level}!` });
      }
    }
  }

  // Gold changes
  if (typeof prev.gold === 'number' && typeof curr.gold === 'number') {
    const delta = curr.gold - prev.gold;
    if (Math.abs(delta) >= 100) {
      const direction = delta > 0 ? 'gained' : 'spent';
      events.push({ type: 'gold_change', timestamp: now, detail: `${direction} ${Math.abs(delta)} gold (now ${curr.gold})` });
    }
  }

  // Approval changes
  if (curr.partyApprovals && prev.partyApprovals) {
    for (const [name, val] of Object.entries(curr.partyApprovals)) {
      const oldVal = prev.partyApprovals[name];
      if (typeof oldVal === 'number' && val !== oldVal) {
        const direction = val > oldVal ? 'increased' : 'decreased';
        events.push({ type: 'approval_change', timestamp: now, detail: `${name} approval ${direction} (${oldVal} → ${val})` });
      }
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Broadcast helper
// ---------------------------------------------------------------------------
function broadcast(message) {
  const payload = typeof message === 'string' ? message : JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  }
}

// ---------------------------------------------------------------------------
// State file handling
// ---------------------------------------------------------------------------
function readStateFile() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch (err) {
    reportBridgeError(`readStateFile: ${err.message}`, err.stack, { file: STATE_FILE });
    return null;
  }
}

function processStateUpdate() {
  const newState = readStateFile();
  if (!newState) return;

  // Skip if timestamp hasn't changed (identical state)
  if (currentState && newState.timestamp === currentState.timestamp) return;

  previousState = currentState;
  currentState = newState;

  // Rolling buffer
  stateHistory.push({ ...newState, _receivedAt: Date.now() });
  if (stateHistory.length > 100) stateHistory.shift();

  // Detect events
  const events = detectEvents(previousState, currentState);
  for (const evt of events) {
    eventLog.push(evt);
    if (eventLog.length > 200) eventLog.shift();
  }

  // Broadcast state + events to clients
  broadcast({ type: 'state', data: currentState, events });
}

// ---------------------------------------------------------------------------
// File watcher on state file
// ---------------------------------------------------------------------------
let watcherReady = false;

function startStateWatcher() {
  // Ensure the directory exists
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Initial read
  processStateUpdate();

  let debounceTimer = null;
  const handleChange = (eventType, filename) => {
    // Debounce rapid writes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      processStateUpdate();
    }, 100);
  };

  // fs.watch on the directory is more reliable than watching the file itself
  // (the Lua mod may delete+recreate the file)
  try {
    fs.watch(dir, (eventType, filename) => {
      if (filename === path.basename(STATE_FILE)) {
        handleChange(eventType, filename);
      }
    });
    watcherReady = true;
    console.log(`[watcher] Watching directory: ${dir} for ${path.basename(STATE_FILE)}`);
  } catch (err) {
    console.error(`[watcher] Failed to watch ${dir}:`, err.message);
    reportBridgeError(`startStateWatcher: ${err.message}`, err.stack, { dir });
    // Fallback: poll every 2 seconds
    console.log('[watcher] Falling back to polling every 2s');
    setInterval(processStateUpdate, 2000);
  }
}

// ---------------------------------------------------------------------------
// Command file handling
// ---------------------------------------------------------------------------
function writeCommand(command) {
  try {
    // Read existing commands array, or start fresh
    let commands = [];
    if (fs.existsSync(COMMAND_FILE)) {
      const raw = fs.readFileSync(COMMAND_FILE, 'utf8');
      if (raw.trim()) {
        commands = JSON.parse(raw);
        if (!Array.isArray(commands)) commands = [commands];
      }
    }
    commands.push({ ...command, _bridgeTimestamp: Date.now() });

    // Keep only last 50 commands to avoid unbounded growth
    if (commands.length > 50) commands = commands.slice(-50);

    // Write atomically via temp file
    const tmpFile = COMMAND_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(commands, null, 2));
    fs.renameSync(tmpFile, COMMAND_FILE);
    return true;
  } catch (err) {
    console.error('[commands] Error writing command:', err.message);
    reportBridgeError(`writeCommand: ${err.message}`, err.stack, { commandFile: COMMAND_FILE });
    return false;
  }
}

// ---------------------------------------------------------------------------
// WebSocket connection handling
// ---------------------------------------------------------------------------
wss.on('connection', (ws, req) => {
  connectedClients = wss.clients.size;
  const clientIp = req.socket.remoteAddress;
  console.log(`[ws] Client connected (${clientIp}). Total: ${connectedClients}`);

  // Send current state immediately on connect
  if (currentState) {
    ws.send(JSON.stringify({ type: 'state', data: currentState, events: [] }));
  }
  // Send last 100 state snapshots for journal
  if (stateHistory.length > 0) {
    ws.send(JSON.stringify({ type: 'history', data: stateHistory }));
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      console.log(`[ws] Command from ${clientIp}:`, msg.action || msg.type || 'unknown');

      if (msg.action) {
        // It's a command for the Lua mod
        const ok = writeCommand(msg);
        ws.send(JSON.stringify({
          type: 'command_ack',
          action: msg.action,
          success: ok,
          timestamp: Date.now() / 1000,
        }));
        // Also broadcast to other clients so they can update UI
        broadcast({ type: 'command_sent', action: msg.action, from: clientIp });
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() / 1000 }));
      } else if (msg.type === 'get_history') {
        ws.send(JSON.stringify({ type: 'history', data: stateHistory }));
      } else if (msg.type === 'get_events') {
        ws.send(JSON.stringify({ type: 'events', data: eventLog }));
      }
    } catch (err) {
      console.error('[ws] Invalid message:', err.message);
      reportBridgeError(`ws message handler: ${err.message}`, err.stack, { clientIp });
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    connectedClients = wss.clients.size;
    console.log(`[ws] Client disconnected (${clientIp}). Total: ${connectedClients}`);
  });

  ws.on('error', (err) => {
    console.error(`[ws] Error (${clientIp}):`, err.message);
    reportBridgeError(`ws error: ${err.message}`, err.stack, { clientIp });
  });
});

// ---------------------------------------------------------------------------
// Periodic cleanup of stale commands (older than 60s)
// ---------------------------------------------------------------------------
setInterval(() => {
  try {
    if (!fs.existsSync(COMMAND_FILE)) return;
    const raw = fs.readFileSync(COMMAND_FILE, 'utf8');
    if (!raw.trim()) return;
    let commands = JSON.parse(raw);
    if (!Array.isArray(commands)) commands = [commands];
    const cutoff = Date.now() - 60000;
    const fresh = commands.filter(c => (c._bridgeTimestamp || 0) > cutoff);
    if (fresh.length < commands.length) {
      fs.writeFileSync(COMMAND_FILE, JSON.stringify(fresh, null, 2));
    }
  } catch {
    // ignore
  }
}, 10000);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
server.listen(PORT, '0.0.0.0', () => {
  // Try to determine the LAN IP
  const nets = os.networkInterfaces();
  let lanIp = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        lanIp = net.address;
        break;
      }
    }
  }

  console.log('');
  console.log('🐸  Tadpole Bridge Server');
  console.log('────────────────────────────────────────');
  console.log(`   Version:  ${BRIDGE_VERSION}`);
  console.log(`   HTTP:     http://${lanIp}:${PORT}`);
  console.log(`   WebSocket: ws://${lanIp}:${PORT}/ws`);
  console.log(`   State:    ${STATE_FILE}`);
  console.log(`   Commands: ${COMMAND_FILE}`);
  console.log(`   ErrorLog: ${ERROR_LOG_FILE}`);
  console.log('────────────────────────────────────────');
  console.log('   Waiting for phone apps to connect...');
  console.log('');

  startStateWatcher();
});

// ---------------------------------------------------------------------------
// ISSUE 8: WebSocket keepalive — ping every 30s
// ---------------------------------------------------------------------------
const KEEPALIVE_INTERVAL = 30000;
const keepaliveTimer = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === 1) {
      // Mark as terminated if no pong received; ws library doesn't auto-terminate
      if (ws._tadpoleAlive === false) {
        ws.terminate();
        return;
      }
      ws._tadpoleAlive = false;
      ws.ping();
    }
  });
}, KEEPALIVE_INTERVAL);

// Track pong responses to know connections are alive
wss.on('connection', (ws) => {
  ws._tadpoleAlive = true;
  ws.on('pong', () => {
    ws._tadpoleAlive = true;
  });
});

// ---------------------------------------------------------------------------
// ISSUE 7: Graceful shutdown on SIGINT / SIGTERM
// ---------------------------------------------------------------------------
function gracefulShutdown(signal) {
  console.log(`\n[shutdown] Received ${signal}. Closing connections...`);
  clearInterval(keepaliveTimer);

  // Close all WebSocket connections cleanly
  wss.clients.forEach((ws) => {
    try { ws.close(1001, 'Server shutting down'); } catch {}
  });

  // Close the HTTP server (stop accepting new connections)
  server.close(() => {
    console.log('[shutdown] HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 5s if hanging
  setTimeout(() => {
    console.log('[shutdown] Forcing exit after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ---------------------------------------------------------------------------
// Global error handlers — report uncaught errors to PocketBase
// ---------------------------------------------------------------------------
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  reportBridgeError(`uncaughtException: ${err.message}`, err.stack);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  console.error('[unhandledRejection]', msg);
  reportBridgeError(`unhandledRejection: ${msg}`, stack);
});
