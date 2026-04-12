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
// Colors — consistent dark theme
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
// Callable wrappers — each maps to a Python method on the Plugin class
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

const callStartBridge = callable<[port: number, bridge_dir: string], {
  success: boolean;
  message: string;
}>("start_bridge");

const callStopBridge = callable<[], {
  success: boolean;
  message: string;
}>("stop_bridge");

const callGetIP = callable<[], { ip: string }>("get_ip");

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
  class?: string;
  conditions?: string[];
}

interface BridgeGameState {
  timestamp: number;
  area: string;
  inCombat: boolean;
  inDialog?: boolean;
  host?: PartyMember;
  party?: PartyMember[];
  gold?: number;
  turn?: number;
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

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() / 1000) - ts);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

const EVENT_ICONS: Record<string, string> = {
  combat_started: "⚔️",
  combat_ended: "✅",
  area_changed: "🗺️",
  hp_critical: "💔",
  dialog_started: "💬",
  dialog_ended: "💬",
  level_up: "⬆️",
  party_changed: "👥",
  death: "💀",
  rest: "🏕️",
  loot: "💰",
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** Status indicator with glow effect */
const StatusBadge: VFC<{
  label: string;
  active: boolean;
  activeColor?: string;
  inactiveColor?: string;
}> = ({ label, active, activeColor = C.green, inactiveColor = C.red }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: active ? activeColor : inactiveColor,
      boxShadow: active
        ? `0 0 8px ${activeColor}80`
        : `0 0 4px ${inactiveColor}50`,
      transition: "all 0.3s ease",
    }} />
    <span style={{
      fontSize: 13,
      fontWeight: 600,
      color: active ? activeColor : inactiveColor,
      letterSpacing: 0.3,
    }}>
      {label}
    </span>
  </div>
);

/** Compact stat row */
const StatRow: VFC<{ label: string; value: string | number; color?: string }> = ({
  label, value, color = C.textDim,
}) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
  }}>
    <span style={{ fontSize: 12, color: C.textDim }}>{label}</span>
    <span style={{ fontSize: 13, color, fontWeight: 600 }}>{value}</span>
  </div>
);

/** HP bar with smooth animation and color gradient */
const HPBar: VFC<{
  name: string;
  hp: number;
  maxHp: number;
  isHost?: boolean;
}> = ({ name, hp, maxHp, isHost = false }) => {
  const pct = maxHp > 0 ? Math.max(0, Math.min(hp / maxHp, 1)) : 0;
  const color = pct > 0.6 ? C.green : pct > 0.3 ? C.orange : C.red;
  const glow = pct > 0.6 ? C.greenGlow : pct > 0.3 ? "none" : C.redGlow;

  return (
    <div style={{ marginBottom: isHost ? 8 : 5 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 3,
      }}>
        <span style={{
          fontSize: isHost ? 13 : 11,
          fontWeight: isHost ? 600 : 500,
          color: isHost ? C.text : C.textDim,
        }}>
          {name}
        </span>
        <span style={{
          fontSize: isHost ? 12 : 10,
          color,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}>
          {hp}/{maxHp}
        </span>
      </div>
      <div style={{
        height: isHost ? 8 : 5,
        borderRadius: isHost ? 4 : 3,
        backgroundColor: C.surface,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct * 100}%`,
          backgroundColor: color,
          borderRadius: isHost ? 4 : 3,
          transition: "width 0.4s ease, background-color 0.4s ease",
          boxShadow: glow ? `0 0 6px ${glow}` : "none",
        }} />
      </div>
    </div>
  );
};

/** Divider */
const Divider = () => (
  <div style={{
    height: 1,
    backgroundColor: C.border,
    margin: "8px 0",
    opacity: 0.5,
  }} />
);

/** Section header */
const SectionHeader: VFC<{ title: string; icon?: string }> = ({ title, icon }) => (
  <div style={{
    fontSize: 11,
    fontWeight: 700,
    color: C.accent,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 2,
  }}>
    {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
    {title}
  </div>
);

/** Pill/badge */
const Pill: VFC<{ label: string; color?: string }> = ({ label, color = C.accent }) => (
  <span style={{
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 600,
    color,
    backgroundColor: `${color}18`,
    border: `1px solid ${color}30`,
  }}>
    {label}
  </span>
);

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

const TadpolePanel: VFC = () => {
  const [settings, setSettings] = useState<PluginSettings>({ ...DEFAULT_SETTINGS });
  const [bridgeRunning, setBridgeRunning] = useState(false);
  const [bg3Running, setBg3Running] = useState(false);
  const [ip, setIp] = useState("...");
  const [connectedClients, setConnectedClients] = useState(0);
  const [gameState, setGameState] = useState<BridgeGameState | null>(null);
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [nodeMissing, setNodeMissing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartAttemptedRef = useRef(false);
  const prevClientsRef = useRef(0);
  const prevEventsLenRef = useRef(0);

  // Load settings
  useEffect(() => {
    callGetSettings()
      .then((saved) => {
        if (saved && Object.keys(saved).length > 0) {
          setSettings({ ...DEFAULT_SETTINGS, ...saved });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch status
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
    } catch {}
  }, []);

  // Persist settings
  const updateSettings = useCallback((newSettings: PluginSettings) => {
    setSettings(newSettings);
    callSaveSettings(newSettings).catch(() => {});
  }, []);

  // Start bridge
  const startBridge = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callStartBridge(settings.port, settings.bridgeDir);
      toaster.toast({
        title: "Tadpole",
        body: result.message,
      });
    } catch {
      toaster.toast({ title: "Tadpole Error", body: "Failed to start bridge" });
    }
    setTimeout(async () => {
      await fetchStatus();
      setLoading(false);
    }, 1500);
  }, [settings, fetchStatus]);

  // Stop bridge
  const stopBridge = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callStopBridge();
      if (result.success) {
        toaster.toast({ title: "Tadpole", body: result.message });
      }
    } catch {
      toaster.toast({ title: "Tadpole Error", body: "Failed to stop bridge" });
    }
    setTimeout(async () => {
      await fetchStatus();
      setLoading(false);
    }, 500);
  }, [fetchStatus]);

  // Polling
  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchStatus]);

  // Auto-start
  useEffect(() => {
    if (autoStartAttemptedRef.current) return;
    if (settings.autoStart && bg3Running && !bridgeRunning && !nodeMissing) {
      autoStartAttemptedRef.current = true;
      startBridge();
    }
  }, [bg3Running, bridgeRunning, settings.autoStart, startBridge, nodeMissing]);

  // Phone connection toast
  useEffect(() => {
    if (connectedClients > prevClientsRef.current && prevClientsRef.current === 0) {
      toaster.toast({
        title: "Phone Connected",
        body: `A phone app is now connected (${connectedClients})`,
      });
    } else if (connectedClients === 0 && prevClientsRef.current > 0) {
      toaster.toast({
        title: "Phone Disconnected",
        body: "No phones connected",
      });
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
      if (evt.type === "combat_started") {
        toaster.toast({ title: "Combat!", body: "Combat has begun!" });
      } else if (evt.type === "hp_critical") {
        toaster.toast({ title: "HP Critical!", body: evt.detail || "A party member is critically low!" });
      } else if (evt.type === "death") {
        toaster.toast({ title: "Party Member Down!", body: evt.detail || "Someone has fallen!" });
      } else if (evt.type === "level_up") {
        toaster.toast({ title: "Level Up!", body: evt.detail || "A party member leveled up!" });
      }
    }
    prevEventsLenRef.current = recentEvents.length;
  }, [recentEvents]);

  // Computed state
  const totalPartyHp = (() => {
    let current = 0, max = 0;
    if (gameState?.host && gameState.host.maxHp > 0) {
      current += gameState.host.hp;
      max += gameState.host.maxHp;
    }
    if (gameState?.party) {
      for (const m of gameState.party) {
        if (m.maxHp > 0) { current += m.hp; max += m.maxHp; }
      }
    }
    return { current, max };
  })();

  return (
    <div style={{ padding: "4px 0" }}>
      {/* Node.js warning */}
      {nodeMissing && (
        <PanelSection title="">
          <PanelSectionRow>
            <div style={{
              padding: "10px 12px",
              borderRadius: 8,
              backgroundColor: `${C.red}15`,
              border: `1px solid ${C.red}30`,
              color: C.red,
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              <strong>Node.js required.</strong>
              <br />
              Install in Desktop Mode:
              <br />
              <code style={{ color: C.accent, fontSize: 11 }}>sudo pacman -S nodejs npm</code>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* ── Connection ── */}
      <PanelSection title="">
        <SectionHeader title="Connection" icon="🔗" />

        <PanelSectionRow>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <StatusBadge
              label={bridgeRunning ? "Bridge Active" : "Bridge Offline"}
              active={bridgeRunning}
            />
            {bridgeRunning && connectedClients > 0 && (
              <Pill label={`${connectedClients} phone${connectedClients !== 1 ? "s" : ""}`} color={C.green} />
            )}
          </div>
        </PanelSectionRow>

        {bridgeRunning && (
          <PanelSectionRow>
            <div style={{
              padding: "6px 10px",
              borderRadius: 6,
              backgroundColor: C.surface,
              fontFamily: "monospace",
              fontSize: 12,
              color: C.accent,
              textAlign: "center" as const,
              border: `1px solid ${C.border}`,
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
            <span style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}>
              {loading ? "⟳" : bridgeRunning ? "■" : "▶"}
              {loading ? "Working..." : bridgeRunning ? "Stop Bridge" : "Start Bridge"}
            </span>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {/* ── Game Status ── */}
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

        {!bg3Running && (
          <PanelSectionRow>
            <div style={{
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: C.surface,
              fontSize: 11,
              color: C.textDim,
              textAlign: "center" as const,
              border: `1px solid ${C.border}`,
            }}>
              Launch Baldur's Gate 3 to begin
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* ── Live Game ── */}
      {gameState && bg3Running && (
        <PanelSection title="">
          <SectionHeader title="Live" icon="📊" />

          {/* Area + status row */}
          <PanelSectionRow>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 0",
            }}>
              {gameState.area && (
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {gameState.area}
                </span>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                {gameState.inCombat && <Pill label="Combat" color={C.red} />}
                {gameState.inDialog && <Pill label="Dialog" color={C.orange} />}
                {!gameState.inCombat && !gameState.inDialog && (
                  <Pill label="Explore" color={C.green} />
                )}
              </div>
            </div>
          </PanelSectionRow>

          <Divider />

          {/* Stats row */}
          <PanelSectionRow>
            <div style={{ display: "flex", gap: 12 }}>
              {typeof gameState.gold === "number" && (
                <StatRow label="Gold" value={`🪙 ${gameState.gold}`} color={C.gold} />
              )}
              {totalPartyHp.max > 0 && (
                <StatRow
                  label="Party HP"
                  value={`${totalPartyHp.current}/${totalPartyHp.max}`}
                  color={totalPartyHp.current / totalPartyHp.max > 0.5 ? C.green : C.red}
                />
              )}
              {gameState.party && (
                <StatRow label="Party" value={`${gameState.party.length + 1} members`} color={C.accent} />
              )}
            </div>
          </PanelSectionRow>

          <Divider />

          {/* Host HP */}
          {gameState.host && gameState.host.maxHp > 0 && (
            <PanelSectionRow>
              <HPBar
                name={gameState.host.name || "Host"}
                hp={gameState.host.hp}
                maxHp={gameState.host.maxHp}
                isHost
              />
            </PanelSectionRow>
          )}

          {/* Party HP */}
          {gameState.party && gameState.party.length > 0 && (
            <PanelSectionRow>
              <div style={{ padding: "2px 0" }}>
                {gameState.party.map((member, i) =>
                  member.maxHp > 0 ? (
                    <HPBar
                      key={member.guid || i}
                      name={member.name}
                      hp={member.hp}
                      maxHp={member.maxHp}
                    />
                  ) : null
                )}
              </div>
            </PanelSectionRow>
          )}

          {/* Recent Events */}
          {recentEvents.length > 0 && (
            <>
              <Divider />
              <PanelSectionRow>
                <div style={{ padding: "4px 0" }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: C.textDim,
                    textTransform: "uppercase" as const,
                    letterSpacing: 0.8,
                    marginBottom: 4,
                  }}>
                    Recent
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {recentEvents.slice(-5).reverse().map((evt, i) => (
                      <div key={i} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                      }}>
                        <span style={{ fontSize: 12 }}>
                          {EVENT_ICONS[evt.type] || "•"}
                        </span>
                        <span style={{ color: C.textDim, flex: 1 }}>
                          {evt.type.replace(/_/g, " ")}
                          {evt.detail ? ` — ${evt.detail}` : ""}
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
      <PanelSection title="">
        <SectionHeader title="Phone App" icon="📱" />

        <PanelSectionRow>
          <div style={{
            padding: "10px 12px",
            borderRadius: 8,
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>
              Open on your phone:
            </div>
            <div style={{
              fontSize: 13,
              color: C.accent,
              fontWeight: 600,
              fontFamily: "monospace",
              marginBottom: 8,
              wordBreak: "break-all",
            }}>
              https://tadpole-omega.vercel.app
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>
              Enter this IP:
            </div>
            <div style={{
              fontSize: 14,
              color: C.text,
              fontWeight: 700,
              fontFamily: "monospace",
              padding: "6px 10px",
              backgroundColor: C.surfaceLight,
              borderRadius: 6,
              textAlign: "center" as const,
              border: `1px solid ${C.border}`,
              letterSpacing: 0.5,
            }}>
              {ip}:{settings.port}
            </div>
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* ── Settings ── */}
      <PanelSection title="">
        <SectionHeader title="Settings" icon="⚙️" />

        <PanelSectionRow>
          <ToggleField
            label="Auto-start with BG3"
            checked={settings.autoStart}
            onChange={(checked) =>
              updateSettings({ ...settings, autoStart: checked })
            }
          />
        </PanelSectionRow>

        {showSettings && (
          <>
            <PanelSectionRow>
              <TextField
                label="Bridge Port"
                value={String(settings.port)}
                onChange={(val) => {
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num > 0 && num < 65536) {
                    updateSettings({ ...settings, port: num });
                  }
                }}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <TextField
                label="Bridge Directory"
                value={settings.bridgeDir}
                onChange={(val) =>
                  updateSettings({ ...settings, bridgeDir: val })
                }
              />
            </PanelSectionRow>
          </>
        )}

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? "Hide Advanced" : "Show Advanced"}
          </ButtonItem>
        </PanelSectionRow>

        {/* Version footer */}
        <PanelSectionRow>
          <div style={{
            textAlign: "center" as const,
            fontSize: 10,
            color: C.textDim,
            opacity: 0.5,
            padding: "8px 0 4px",
          }}>
            Tadpole v0.2.0
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
    titleView: (
      <div className={staticClasses.Title}>Tadpole BG3 Companion</div>
    ),
    content: <TadpolePanel />,
    icon: <FaFrog />,
    onDismount: () => {},
  };
});
