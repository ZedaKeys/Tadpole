import { definePlugin, callable, toaster } from "@decky/api";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  ToggleField,
  TextField,
  staticClasses,
  Navigation,
} from "@decky/ui";
import { VFC, useState, useEffect, useCallback, useRef } from "react";
import { FaFrog } from "react-icons/fa";

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const C = {
  bg: "#1a1a2e",
  surface: "#16213e",
  surfaceLight: "#1f2b47",
  border: "#2a3a5c",
  text: "#e0e0e0",
  textDim: "#7a8ba8",
  accent: "#48bfe3",
  green: "#52b788",
  greenGlow: "rgba(82,183,136,0.5)",
  red: "#e76f51",
  redGlow: "rgba(231,111,81,0.5)",
  orange: "#f4a261",
  gold: "#f4a261",
  purple: "#a855f7",
  blue: "#3b82f6",
};

// ---------------------------------------------------------------------------
// Callables
// ---------------------------------------------------------------------------

const callGetStatus = callable<[], {
  bridge_running: boolean;
  bg3_running: boolean;
  ip: string;
  connected_clients: number;
  game_state: BridgeGameState | null;
  recent_events: GameEvent[];
  node_installed: boolean;
}>("get_status");

const callGetDiagnostics = callable<[], {
  node_installed: boolean;
  node_version: string | null;
  bridge_found: boolean;
  bridge_path: string | null;
  lua_installed: boolean;
  bg3_running: boolean;
  ip: string;
  ready: boolean;
  error?: string;
}>("get_diagnostics");

const callCheckHealth = callable<[], {
  healthy: boolean;
  clients?: number;
  error?: string;
}>("check_health");

const callStartBridge = callable<[port: number, bridge_dir: string], {
  success: boolean;
  message: string;
}>("start_bridge");

const callStopBridge = callable<[], {
  success: boolean;
  message: string;
}>("stop_bridge");

const callGetSettings = callable<[], PluginSettings>("get_settings");
const callSaveSettings = callable<[settings: PluginSettings], {
  success: boolean;
  message?: string;
}>("save_settings");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PartyMember {
  guid?: string;
  name: string;
  hp: number;
  maxHp: number;
  level?: number;
}

interface BridgeGameState {
  timestamp: number;
  area: string;
  inCombat: boolean;
  inDialog?: boolean;
  host?: PartyMember;
  party?: PartyMember[];
  gold?: number;
}

interface GameEvent {
  type: string;
  timestamp: number;
  detail?: string;
}

interface PluginSettings {
  port: number;
  autoStart: boolean;
  bridgeDir: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
  port: 3456,
  autoStart: true,
  bridgeDir: "/home/deck/tadpole/bridge",
};

const EVENT_ICONS: Record<string, string> = {
  combat_started: "⚔️", combat_ended: "✅", area_changed: "🗺️",
  hp_critical: "💔", dialog_started: "💬", dialog_ended: "💬",
  level_up: "⬆️", party_changed: "👥", death: "💀",
  rest: "🏕️", loot: "💰",
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const StatusBadge: VFC<{
  label: string; active: boolean;
  activeColor?: string; inactiveColor?: string;
}> = ({ label, active, activeColor = C.green, inactiveColor = C.red }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{
      width: 8, height: 8, borderRadius: "50%",
      backgroundColor: active ? activeColor : inactiveColor,
      boxShadow: active ? `0 0 8px ${activeColor}80` : `0 0 4px ${inactiveColor}50`,
      transition: "all 0.3s ease",
    }} />
    <span style={{
      fontSize: 13, fontWeight: 600,
      color: active ? activeColor : inactiveColor,
      letterSpacing: 0.3,
    }}>{label}</span>
  </div>
);

const Pill: VFC<{ label: string; color?: string }> = ({ label, color = C.accent }) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", borderRadius: 10,
    fontSize: 10, fontWeight: 600, color,
    backgroundColor: `${color}18`, border: `1px solid ${color}30`,
  }}>{label}</span>
);

const StatRow: VFC<{ label: string; value: string | number; color?: string }> = ({
  label, value, color = C.textDim,
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
    <span style={{ fontSize: 12, color: C.textDim }}>{label}</span>
    <span style={{ fontSize: 13, color, fontWeight: 600 }}>{value}</span>
  </div>
);

const HPBar: VFC<{ name: string; hp: number; maxHp: number; isHost?: boolean }> = ({
  name, hp, maxHp, isHost = false,
}) => {
  const pct = maxHp > 0 ? Math.max(0, Math.min(hp / maxHp, 1)) : 0;
  const color = pct > 0.6 ? C.green : pct > 0.3 ? C.orange : C.red;
  const glow = pct > 0.6 ? C.greenGlow : pct > 0.3 ? "none" : C.redGlow;
  return (
    <div style={{ marginBottom: isHost ? 8 : 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: isHost ? 13 : 11, fontWeight: isHost ? 600 : 500, color: isHost ? C.text : C.textDim }}>{name}</span>
        <span style={{ fontSize: isHost ? 12 : 10, color, fontWeight: 600, fontVariantNumeric: "tabular-nums" as const }}>{hp}/{maxHp}</span>
      </div>
      <div style={{ height: isHost ? 8 : 5, borderRadius: isHost ? 4 : 3, backgroundColor: C.surface, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct * 100}%`, backgroundColor: color,
          borderRadius: isHost ? 4 : 3, transition: "width 0.4s ease, background-color 0.4s ease",
          boxShadow: glow ? `0 0 6px ${glow}` : "none",
        }} />
      </div>
    </div>
  );
};

const Divider = () => <div style={{ height: 1, backgroundColor: C.border, margin: "8px 0", opacity: 0.5 }} />;

const SectionHeader: VFC<{ title: string; icon?: string }> = ({ title, icon }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: C.accent,
    textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6, marginTop: 2,
  }}>
    {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{title}
  </div>
);

/** Diagnostic checklist item */
const CheckItem: VFC<{
  label: string; ok: boolean; detail?: string; fixCommand?: string;
}> = ({ label, ok, detail, fixCommand }) => (
  <div style={{
    padding: "8px 12px", borderRadius: 8, marginBottom: 4,
    backgroundColor: ok ? `${C.green}10` : `${C.red}10`,
    border: `1px solid ${ok ? `${C.green}30` : `${C.red}30`}`,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14 }}>{ok ? "✅" : "❌"}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: ok ? C.green : C.red }}>{label}</span>
    </div>
    {detail && <div style={{ fontSize: 11, color: C.textDim, marginLeft: 22, marginTop: 2 }}>{detail}</div>}
    {fixCommand && !ok && (
      <div style={{
        marginLeft: 22, marginTop: 4, padding: "4px 8px", borderRadius: 4,
        backgroundColor: C.surface, fontFamily: "monospace", fontSize: 11, color: C.accent,
      }}>
        {fixCommand}
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

const TadpolePanel: VFC = () => {
  const [settings, setSettings] = useState<PluginSettings>({ ...DEFAULT_SETTINGS });
  const [bridgeRunning, setBridgeRunning] = useState(false);
  const [bridgeHealthy, setBridgeHealthy] = useState(false);
  const [bg3Running, setBg3Running] = useState(false);
  const [ip, setIp] = useState("...");
  const [connectedClients, setConnectedClients] = useState(0);
  const [gameState, setGameState] = useState<BridgeGameState | null>(null);
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [nodeMissing, setNodeMissing] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    node_installed: boolean; node_version: string | null;
    bridge_found: boolean; bridge_path: string | null;
    lua_installed: boolean; ready: boolean;
  } | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartAttemptedRef = useRef(false);
  const prevClientsRef = useRef(0);
  const prevEventsLenRef = useRef(0);

  // Load settings + run diagnostics on mount
  useEffect(() => {
    callGetSettings().then((saved) => {
      if (saved && Object.keys(saved).length > 0) setSettings({ ...DEFAULT_SETTINGS, ...saved });
    }).catch(() => {});
    callGetDiagnostics().then((d) => {
      setDiagnostics(d);
      if (d && !d.ready) setShowDiagnostics(true); // Auto-show if issues
    }).catch(() => {});
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await callGetStatus();
      setBridgeRunning(data.bridge_running);
      setBg3Running(data.bg3_running);
      setIp(data.ip);
      setConnectedClients(data.connected_clients);
      setGameState(data.game_state);
      setRecentEvents(data.recent_events || []);
      setNodeMissing(!data.node_installed);

      // Health check if bridge is running
      if (data.bridge_running) {
        const health = await callCheckHealth();
        setBridgeHealthy(health.healthy);
      } else {
        setBridgeHealthy(false);
      }
    } catch {}
  }, []);

  const updateSettings = useCallback((newSettings: PluginSettings) => {
    setSettings(newSettings);
    callSaveSettings(newSettings).catch(() => {});
  }, []);

  const startBridge = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callStartBridge(settings.port, settings.bridgeDir);
      toaster.toast({ title: "Tadpole", body: result.message });
    } catch {
      toaster.toast({ title: "Tadpole Error", body: "Failed to start bridge" });
    }
    setTimeout(async () => { await fetchStatus(); setLoading(false); }, 1500);
  }, [settings, fetchStatus]);

  const stopBridge = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callStopBridge();
      if (result.success) toaster.toast({ title: "Tadpole", body: result.message });
    } catch {
      toaster.toast({ title: "Tadpole Error", body: "Failed to stop bridge" });
    }
    setTimeout(async () => { await fetchStatus(); setLoading(false); }, 500);
  }, [fetchStatus]);

  const runDiagnostics = useCallback(async () => {
    const d = await callGetDiagnostics();
    setDiagnostics(d);
    setShowDiagnostics(true);
  }, []);

  // Polling
  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchStatus]);

  // Auto-start
  useEffect(() => {
    if (autoStartAttemptedRef.current) return;
    if (settings.autoStart && bg3Running && !bridgeRunning && !nodeMissing) {
      autoStartAttemptedRef.current = true;
      startBridge();
    }
  }, [bg3Running, bridgeRunning, settings.autoStart, startBridge, nodeMissing]);

  // Phone connection toasts
  useEffect(() => {
    if (connectedClients > prevClientsRef.current && prevClientsRef.current === 0) {
      toaster.toast({ title: "Phone Connected", body: `Phone app connected (${connectedClients})` });
    } else if (connectedClients === 0 && prevClientsRef.current > 0) {
      toaster.toast({ title: "Phone Disconnected", body: "No phones connected" });
    }
    prevClientsRef.current = connectedClients;
  }, [connectedClients]);

  // Game event toasts
  useEffect(() => {
    if (recentEvents.length <= prevEventsLenRef.current) {
      prevEventsLenRef.current = recentEvents.length;
      return;
    }
    const newEvents = recentEvents.slice(prevEventsLenRef.current);
    for (const evt of newEvents) {
      if (evt.type === "combat_started") toaster.toast({ title: "Combat!", body: "Combat has begun!" });
      else if (evt.type === "hp_critical") toaster.toast({ title: "HP Critical!", body: evt.detail || "A party member is critically low!" });
      else if (evt.type === "death") toaster.toast({ title: "Party Member Down!", body: evt.detail || "Someone has fallen!" });
      else if (evt.type === "level_up") toaster.toast({ title: "Level Up!", body: evt.detail || "A party member leveled up!" });
    }
    prevEventsLenRef.current = recentEvents.length;
  }, [recentEvents]);

  const totalPartyHp = (() => {
    let current = 0, max = 0;
    if (gameState?.host && gameState.host.maxHp > 0) { current += gameState.host.hp; max += gameState.host.maxHp; }
    if (gameState?.party) {
      for (const m of gameState.party) {
        if (m.maxHp > 0) { current += m.hp; max += m.maxHp; }
      }
    }
    return { current, max };
  })();

  // Determine if this is first-run (nothing set up)
  const isFirstRun = diagnostics && !diagnostics.ready;

  return (
    <div style={{ padding: "4px 0" }}>
      {/* ── Setup Wizard (first run) ── */}
      {isFirstRun && !showDiagnostics && (
        <PanelSection title="">
          <PanelSectionRow>
            <div style={{
              padding: "12px", borderRadius: 10, backgroundColor: C.surface,
              border: `1px solid ${C.border}`, textAlign: "center" as const,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🐸</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Welcome to Tadpole!
              </div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>
                A few things need to be set up before we can connect to your game.
              </div>
              <ButtonItem layout="below" onClick={runDiagnostics}>
                Run Setup Check
              </ButtonItem>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* ── Diagnostics Panel ── */}
      {showDiagnostics && diagnostics && (
        <PanelSection title="">
          <SectionHeader title="Setup Check" icon="🔍" />

          <CheckItem
            label={diagnostics.node_installed
              ? `Node.js ${diagnostics.node_version || "installed"}`
              : "Node.js not installed"}
            ok={diagnostics.node_installed}
            detail={diagnostics.node_installed
              ? "Required to run the bridge server"
              : "The bridge server needs Node.js to run"}
            fixCommand="sudo pacman -S nodejs npm"
          />

          <CheckItem
            label={diagnostics.bridge_found
              ? "Bridge server found"
              : "Bridge server not found"}
            ok={diagnostics.bridge_found}
            detail={diagnostics.bridge_found
              ? diagnostics.bridge_path || ""
              : "Download from github.com/ZedaKeys/Tadpole and set the path in Settings"}
          />

          <CheckItem
            label={diagnostics.lua_installed
              ? "BG3 mod installed"
              : "BG3 mod not detected"}
            ok={diagnostics.lua_installed}
            detail={diagnostics.lua_installed
              ? "TadpoleCompanion.lua found"
              : "The Lua mod sends live game data to the bridge"}
          />

          {diagnostics.ready && (
            <PanelSectionRow>
              <div style={{
                padding: "8px 12px", borderRadius: 8,
                backgroundColor: `${C.green}15`, border: `1px solid ${C.green}30`,
                textAlign: "center" as const, marginTop: 4,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>
                  All good! You're ready to play.
                </span>
              </div>
            </PanelSectionRow>
          )}

          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => setShowDiagnostics(false)}>
              {diagnostics.ready ? "Close" : "Close and set up manually"}
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* ── Quick Node.js Warning ── */}
      {nodeMissing && !showDiagnostics && (
        <PanelSection title="">
          <PanelSectionRow>
            <div style={{
              padding: "10px 12px", borderRadius: 8,
              backgroundColor: `${C.red}15`, border: `1px solid ${C.red}30`,
              color: C.red, fontSize: 12, lineHeight: 1.5,
            }}>
              <strong>Node.js is required.</strong>
              <br />Install in Desktop Mode:
              <div style={{
                marginTop: 4, padding: "4px 8px", borderRadius: 4,
                backgroundColor: C.surface, fontFamily: "monospace", fontSize: 11, color: C.accent,
              }}>
                sudo pacman -S nodejs npm
              </div>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* ── Connection ── */}
      {!showDiagnostics && (
        <PanelSection title="">
          <SectionHeader title="Connection" icon="🔗" />

          <PanelSectionRow>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <StatusBadge
                label={bridgeRunning
                  ? bridgeHealthy ? "Bridge Active" : "Bridge (unhealthy)"
                  : "Bridge Offline"}
                active={bridgeRunning && bridgeHealthy}
              />
              {bridgeRunning && connectedClients > 0 && (
                <Pill label={`${connectedClients} phone${connectedClients !== 1 ? "s" : ""}`} color={C.green} />
              )}
            </div>
          </PanelSectionRow>

          {bridgeRunning && (
            <PanelSectionRow>
              <div style={{
                padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface,
                fontFamily: "monospace", fontSize: 12, color: C.accent,
                textAlign: "center" as const, border: `1px solid ${C.border}`,
              }}>
                {ip}:{settings.port}
              </div>
            </PanelSectionRow>
          )}

          <PanelSectionRow>
            <ButtonItem
              layout="below"
              disabled={loading || nodeMissing}
              onClick={bridgeRunning ? stopBridge : startBridge}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {loading ? "⟳" : bridgeRunning ? "■" : "▶"}
                {loading ? "Working..." : bridgeRunning ? "Stop Bridge" : "Start Bridge"}
              </span>
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* ── Game Status ── */}
      {!showDiagnostics && (
        <PanelSection title="">
          <SectionHeader title="Game" icon="🎮" />

          <PanelSectionRow>
            <StatusBadge
              label={bg3Running ? "BG3 Running" : "BG3 Not Detected"}
              active={bg3Running}
              activeColor={C.accent}
              inactiveColor={C.textDim}
            />
          </PanelSectionRow>

          {!bg3Running && bridgeRunning && (
            <PanelSectionRow>
              <div style={{
                padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface,
                fontSize: 11, color: C.textDim, textAlign: "center" as const,
                border: `1px solid ${C.border}`,
              }}>
                Bridge is ready — launch BG3 to connect
              </div>
            </PanelSectionRow>
          )}

          {!bg3Running && !bridgeRunning && (
            <PanelSectionRow>
              <div style={{
                padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface,
                fontSize: 11, color: C.textDim, textAlign: "center" as const,
                border: `1px solid ${C.border}`,
              }}>
                Start the bridge, then launch BG3
              </div>
            </PanelSectionRow>
          )}
        </PanelSection>
      )}

      {/* ── Live Game ── */}
      {gameState && bg3Running && !showDiagnostics && (
        <PanelSection title="">
          <SectionHeader title="Live" icon="📊" />

          <PanelSectionRow>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              {gameState.area && (
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{gameState.area}</span>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                {gameState.inCombat && <Pill label="Combat" color={C.red} />}
                {gameState.inDialog && <Pill label="Dialog" color={C.orange} />}
                {!gameState.inCombat && !gameState.inDialog && <Pill label="Explore" color={C.green} />}
              </div>
            </div>
          </PanelSectionRow>

          <Divider />

          <PanelSectionRow>
            <div style={{ display: "flex", gap: 12 }}>
              {typeof gameState.gold === "number" && (
                <StatRow label="Gold" value={`🪙 ${gameState.gold}`} color={C.gold} />
              )}
              {totalPartyHp.max > 0 && (
                <StatRow label="Party HP" value={`${totalPartyHp.current}/${totalPartyHp.max}`}
                  color={totalPartyHp.current / totalPartyHp.max > 0.5 ? C.green : C.red} />
              )}
              {gameState.party && (
                <StatRow label="Party" value={`${gameState.party.length + 1} members`} color={C.accent} />
              )}
            </div>
          </PanelSectionRow>

          <Divider />

          {gameState.host && gameState.host.maxHp > 0 && (
            <PanelSectionRow>
              <HPBar name={gameState.host.name || "Host"} hp={gameState.host.hp} maxHp={gameState.host.maxHp} isHost />
            </PanelSectionRow>
          )}

          {gameState.party && gameState.party.length > 0 && (
            <PanelSectionRow>
              <div style={{ padding: "2px 0" }}>
                {gameState.party.map((member, i) =>
                  member.maxHp > 0 ? (
                    <HPBar key={member.guid || i} name={member.name} hp={member.hp} maxHp={member.maxHp} />
                  ) : null
                )}
              </div>
            </PanelSectionRow>
          )}

          {recentEvents.length > 0 && (
            <>
              <Divider />
              <PanelSectionRow>
                <div style={{ padding: "4px 0" }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: C.textDim,
                    textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 4,
                  }}>Recent</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {recentEvents.slice(-5).reverse().map((evt, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                        <span style={{ fontSize: 12 }}>{EVENT_ICONS[evt.type] || "•"}</span>
                        <span style={{ color: C.textDim, flex: 1 }}>
                          {evt.type.replace(/_/g, " ")}{evt.detail ? ` — ${evt.detail}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </PanelSectionRow>
            </>
          )}
        </PanelSection>
      )}

      {/* ── Phone App ── */}
      {!showDiagnostics && (
        <PanelSection title="">
          <SectionHeader title="Phone App" icon="📱" />

          <PanelSectionRow>
            <div style={{
              padding: "10px 12px", borderRadius: 8, backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>Open on your phone:</div>
              <div style={{
                fontSize: 13, color: C.accent, fontWeight: 600, fontFamily: "monospace",
                marginBottom: 8, wordBreak: "break-all",
              }}>
                https://tadpole-omega.vercel.app
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>Enter this IP:</div>
              <div style={{
                fontSize: 14, color: C.text, fontWeight: 700, fontFamily: "monospace",
                padding: "6px 10px", backgroundColor: C.surfaceLight, borderRadius: 6,
                textAlign: "center" as const, border: `1px solid ${C.border}`, letterSpacing: 0.5,
              }}>
                {ip}:{settings.port}
              </div>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* ── Settings ── */}
      <PanelSection title="">
        <SectionHeader title="Settings" icon="⚙️" />

        <PanelSectionRow>
          <ToggleField
            label="Auto-start with BG3"
            checked={settings.autoStart}
            onChange={(checked: any) => updateSettings({ ...settings, autoStart: checked })}
          />
        </PanelSectionRow>

        {showSettings && (
          <>
            <PanelSectionRow>
              <TextField
                label="Bridge Port"
                value={String(settings.port)}
                onChange={(val: any) => {
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num > 0 && num < 65536) updateSettings({ ...settings, port: num });
                }}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <TextField
                label="Bridge Directory"
                value={settings.bridgeDir}
                onChange={(val: any) => updateSettings({ ...settings, bridgeDir: val })}
              />
            </PanelSectionRow>
          </>
        )}

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={runDiagnostics}>
            🔍 Run Diagnostics
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? "Hide Advanced" : "Show Advanced"}
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <div style={{
            textAlign: "center" as const, fontSize: 10, color: C.textDim,
            opacity: 0.5, padding: "8px 0 4px",
          }}>
            Tadpole v0.3.0
          </div>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

export default definePlugin(() => {
  return {
    name: "Tadpole BG3 Companion",
    titleView: <div className={staticClasses.Title}>Tadpole BG3 Companion</div>,
    content: <TadpolePanel />,
    icon: <FaFrog />,
    onDismount: () => {},
  };
});
