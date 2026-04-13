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
const BRIDGE_VERSION = '0.7.1';

// Auth token for write operations (commands). Auto-generated if not set.
// Set BRIDGE_TOKEN env var to a fixed value for persistent auth.
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || (() => {
  const crypto = require('crypto');
  const token = crypto.randomBytes(16).toString('hex');
  console.log(`[auth] Generated bridge token: ${token}`);
  console.log(`[auth] Set BRIDGE_TOKEN env var to persist this across restarts.`);
  return token;
})();

const ALLOWED_COMMANDS = new Set([
  'trigger_rest', 'add_gold', 'give_item', 'heal_party',
  'revive', 'god_mode', 'teleport_to_waypoint',
]);

const PB_ERROR_ENDPOINT = 'https://pb.gohanlab.uk/api/collections/tadpole_errors/records';
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

// CORS — restrict to known origins + local network
const ALLOWED_ORIGINS = [
  'http://localhost',
  'http://127.0.0.1',
  'http://192.168.',
  'http://10.',
  'http://172.',
  'https://tadpole-omega.vercel.app',
  'https://split-easy-one.vercel.app',
];

app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || !origin;
  res.header('Access-Control-Allow-Origin', isAllowed ? (origin || '*') : '');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// ---------------------------------------------------------------------------
// Rate limiting (simple in-memory)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map(); // ip -> { count, resetAt }
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 120; // requests per window

function rateLimiter(req, res, next) {
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'Rate limited', retry_after: Math.ceil((entry.resetAt - now) / 1000) });
    return;
  }
  next();
}

app.use(rateLimiter);

// ---------------------------------------------------------------------------
// HTML escape utility (prevents XSS)
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// @ts-check
// ---------------------------------------------------------------------------
// Type definitions (JSDoc — plain JS, no build step needed)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} GameCharacter
 * @property {string} guid
 * @property {string} name
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} level
 * @property {{ x: number, y: number, z: number }} position
 */

/**
 * @typedef {Object} GameEvent
 * @property {string} type
 * @property {number} timestamp
 * @property {string} [area]
 */

/**
 * @typedef {Object} GameState
 * @property {number} timestamp
 * @property {string} area
 * @property {boolean} inCombat
 * @property {GameCharacter|null} host
 * @property {GameCharacter[]} party
 * @property {number} gold
 * @property {GameEvent[]} events
 */

/**
 * @typedef {Object} BridgeEvent
 * @property {string} type
 * @property {number} timestamp
 * @property {string} [detail]
 */

/** @type {GameState|null} */
let currentState = null;
/** @type {GameState|null} */
let previousState = null;
let connectedClients = 0;
/** @type {(GameState & { _receivedAt: number })[]} */
const stateHistory = [];          // rolling buffer of last 100 snapshots
/** @type {BridgeEvent[]} */
const eventLog = [];              // recent detected events

// JSON status endpoint for DeckyLoader plugin & programmatic consumers
// ---------------------------------------------------------------------------
// Serve phone app (static export) from bridge/phone-app/ directory
// This lets users access the app via HTTP directly, bypassing the HTTPS/mixed-content issue.
// To populate: build the Next.js app as static export (npm run build) and copy `out/` to `bridge/phone-app/`
// ---------------------------------------------------------------------------
const PHONE_APP_DIR = path.join(__dirname, 'phone-app');

app.use('/phone', safeWrap((req, res, next) => {
  // Try to serve the static phone app from bridge/phone-app/
  const subpath = req.path === '/' ? '/index.html' : req.path;
  const filePath = path.join(PHONE_APP_DIR, subpath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PHONE_APP_DIR)) {
    return res.status(403).send('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }

  // For SPA: fall back to index.html for client-side routing
  const indexPath = path.join(PHONE_APP_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // No phone app deployed — show instruction page
  res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tadpole - Access via HTTP</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:480px;margin:2em auto;padding:0 1.5em;background:#1a1a2e;color:#eee;text-align:center}
  h1{color:#48bfe3;font-size:1.5em}
  .box{background:#16213e;border-radius:12px;padding:1.5em;margin:1em 0;text-align:left}
  .step{margin:0.75em 0;padding-left:1.5em;position:relative}
  .step::before{content:attr(data-n);position:absolute;left:0;color:#48bfe3;font-weight:bold}
  code{background:#0d1b2a;padding:2px 6px;border-radius:4px;font-size:0.9em;color:#72ddf7}
  .ok{color:#52b788} .warn{color:#f4a261}
  a{color:#48bfe3}
  .ip{font-size:1.3em;color:#52b788;font-weight:bold;letter-spacing:0.5px}
</style></head><body>
<h1>🐸 Tadpole</h1>
<p style="color:#8d99ae">Game Companion App</p>

<div class="box">
  <h2 style="color:#72ddf7;font-size:1em;margin-top:0">✅ You're on the right page!</h2>
  <p>You accessed the app via <strong>HTTP</strong>, which means WebSocket connections will work.</p>
  <p>Your Steam Deck IP: <span class="ip">${escapeHtml(req.hostname || req.socket.localAddress || 'unknown')}</span></p>
</div>

<div class="box">
  <h2 style="color:#f4a261;font-size:1em;margin-top:0">⚠️ If you came from the HTTPS version</h2>
  <p><strong>Bookmark this page instead!</strong> The HTTPS version at
  <code>tadpole-omega.vercel.app</code> cannot connect to the bridge because browsers
  block <code>ws://</code> from HTTPS pages.</p>
  <p>This HTTP version works perfectly because everything is on the same network.</p>
</div>

<div class="box">
  <h2 style="color:#72ddf7;font-size:1em;margin-top:0">📋 Full Setup</h2>
  <div class="step" data-n="1.">
    Make sure the bridge server is running on your Steam Deck.
  </div>
  <div class="step" data-n="2.">
    Open this URL <strong>on your phone</strong>:<br>
    <code>http://${escapeHtml(req.hostname || req.socket.localAddress || 'unknown')}:${PORT}/phone</code>
  </div>
  <div class="step" data-n="3.">
    Enter the Deck's IP in the connection panel and tap Connect.
  </div>
  <div class="step" data-n="4.">
    Done! Your game data will appear live.
  </div>
</div>

<p style="color:#8d99ae;font-size:0.8em">
  Bridge v${BRIDGE_VERSION} &middot; Port ${PORT} &middot;
  <span class="${currentState ? 'ok' : 'warn'}">${currentState ? 'Game connected' : 'Waiting for game data'}</span>
</p>
</body></html>`);
}, 'GET /phone'));

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

app.get('/health', safeWrap((req, res) => {
  res.json({ healthy: true, version: BRIDGE_VERSION, uptime: process.uptime() });
}, 'GET /health'));

// Token endpoint — LAN-only, returns the bridge auth token for the phone app
// This is safe because the bridge is on a local network (not exposed to internet)
app.get('/token', safeWrap((req, res) => {
  const ip = req.socket.remoteAddress || '';
  // Only allow LAN access
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' ||
      ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    res.json({ token: BRIDGE_TOKEN });
  } else {
    res.status(403).json({ error: 'LAN access only' });
  }
}, 'GET /token'));

app.get('/', (req, res) => {
  // Redirect to phone app for better UX
  // Use the host from the request so the phone app can auto-connect
  const host = req.headers.host?.split(':')[0] || 'localhost';
  return res.redirect(`/phone`);
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
/**
 * Compare two state snapshots and detect game events.
 * @param {GameState|null} prev - Previous state snapshot
 * @param {GameState} curr - Current state snapshot
 * @returns {BridgeEvent[]} Detected events
 */
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

    // Write atomically via temp file with restricted permissions
    const tmpFile = COMMAND_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(commands, null, 2), { mode: 0o600 });
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
        // Auth check — commands require a valid token
        if (!msg.token || msg.token !== BRIDGE_TOKEN) {
          ws.send(JSON.stringify({
            type: 'command_rejected',
            action: msg.action,
            reason: 'Invalid or missing auth token',
            timestamp: Date.now() / 1000,
          }));
          console.warn(`[auth] Rejected command "${msg.action}" from ${clientIp} — no valid token`);
          return;
        }

        // Whitelist check — only known commands allowed
        if (!ALLOWED_COMMANDS.has(msg.action)) {
          ws.send(JSON.stringify({
            type: 'command_rejected',
            action: msg.action,
            reason: 'Unknown command',
            timestamp: Date.now() / 1000,
          }));
          console.warn(`[auth] Rejected unknown command "${msg.action}" from ${clientIp}`);
          return;
        }

        // Sanitize numeric parameters
        if (msg.value !== undefined) msg.value = Number(msg.value) || 0;
        if (msg.itemId !== undefined) msg.itemId = String(msg.itemId).replace(/[^a-zA-Z0-9_-]/g, '');

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
  console.log(`   Phone App: http://${lanIp}:${PORT}/phone`);
  console.log(`   State:    ${STATE_FILE}`);
  console.log(`   Commands: ${COMMAND_FILE}`);
  console.log(`   ErrorLog: ${ERROR_LOG_FILE}`);
  console.log('────────────────────────────────────────');
  console.log('   Waiting for phone apps to connect...');
  console.log('');

  startStateWatcher();

  // -----------------------------------------------------------------------
  // mDNS advertisement (optional — skip if bonjour-service not installed)
  // -----------------------------------------------------------------------
  try {
    const bonjour = require('bonjour-service')();
    const MDNS_HOSTNAME = process.env.MDNS_HOSTNAME || 'tadpole';

    // Advertise the Tadpole-specific service for the phone app
    const tadpoleSvc = bonjour.publish({
      name: 'Tadpole Bridge',
      type: 'tadpole',
      port: PORT,
      host: MDNS_HOSTNAME,
      txt: {
        version: BRIDGE_VERSION,
        path: '/phone',
        ws: '/ws',
      },
    });
    tadpoleSvc.on('up', () => {
      console.log(`[mDNS] Advertising _tadpole._tcp as ${MDNS_HOSTNAME}.local:${PORT}`);
    });
    tadpoleSvc.on('error', (err) => {
      console.warn(`[mDNS] Tadpole service error: ${err.message}`);
    });

    // Also advertise as standard _http._tcp for generic mDNS browsers
    const httpSvc = bonjour.publish({
      name: 'Tadpole Bridge (HTTP)',
      type: 'http',
      port: PORT,
      host: MDNS_HOSTNAME,
      txt: {
        version: BRIDGE_VERSION,
        path: '/phone',
      },
    });
    httpSvc.on('up', () => {
      console.log(`[mDNS] Advertising _http._tcp as ${MDNS_HOSTNAME}.local:${PORT}`);
    });
    httpSvc.on('error', (err) => {
      console.warn(`[mDNS] HTTP service error: ${err.message}`);
    });

    // Store reference for graceful shutdown
    global._bonjour = bonjour;
  } catch (err) {
    console.warn(`[mDNS] bonjour-service not available — mDNS discovery disabled. (${err.message})`);
    console.warn('[mDNS] Install with: npm install bonjour-service');
  }
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

  // Stop mDNS advertisements
  if (global._bonjour) {
    try {
      global._bonjour.unpublishAll(() => {
        try { global._bonjour.destroy(); } catch {}
      });
    } catch {}
  }

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
