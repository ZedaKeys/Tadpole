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
// Callable wrappers — each maps to a Python method on the Plugin class
// ---------------------------------------------------------------------------

const callGetStatus = callable<[], {
  bridge_running: boolean;
  bg3_running: boolean;
  ip: string;
  connected_clients: number;
  game_state: BridgeGameState | null;
  recent_events: { type: string; timestamp: number; detail?: string }[];
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
// Types — mirrors the bridge server's JSON state
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

interface PluginSettings {
  port: number;
  autoStart: boolean;
  bridgeDir: string;
}

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: PluginSettings = {
  port: 3456,
  autoStart: true,
  bridgeDir: "/home/deck/tadpole/bridge",
};

// ---------------------------------------------------------------------------
// Status dot component
// ---------------------------------------------------------------------------

const StatusDot: VFC<{ running: boolean }> = ({ running }) => (
  <span
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: running ? "#52b788" : "#e76f51",
      marginRight: 8,
      verticalAlign: "middle",
      boxShadow: running
        ? "0 0 6px rgba(82,183,136,0.6)"
        : "0 0 6px rgba(231,111,81,0.6)",
    }}
  />
);

// ---------------------------------------------------------------------------
// HP Bar component
// ---------------------------------------------------------------------------

const HPBar: VFC<{ name: string; hp: number; maxHp: number }> = ({
  name,
  hp,
  maxHp,
}) => {
  const pct = maxHp > 0 ? Math.max(0, Math.min(hp / maxHp, 1)) : 0;
  const color =
    pct > 0.5 ? "#52b788" : pct > 0.25 ? "#f4a261" : "#e76f51";

  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 2,
          color: "#c0c0c0",
        }}
      >
        <span>{name}</span>
        <span>
          {hp}/{maxHp}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: "#2a2a3e",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct * 100}%`,
            backgroundColor: color,
            borderRadius: 3,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main panel content
// ---------------------------------------------------------------------------

const TadpolePanel: VFC = () => {
  const [settings, setSettings] = useState<PluginSettings>({ ...DEFAULT_SETTINGS });
  const [bridgeRunning, setBridgeRunning] = useState(false);
  const [bg3Running, setBg3Running] = useState(false);
  const [ip, setIp] = useState("...");
  const [connectedClients, setConnectedClients] = useState(0);
  const [gameState, setGameState] = useState<BridgeGameState | null>(null);
  const [recentEvents, setRecentEvents] = useState<
    { type: string; timestamp: number; detail?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [nodeMissing, setNodeMissing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartAttemptedRef = useRef(false);

  // ---- Load settings from backend on mount ----
  useEffect(() => {
    callGetSettings()
      .then((saved) => {
        if (saved && Object.keys(saved).length > 0) {
          setSettings({ ...DEFAULT_SETTINGS, ...saved });
        }
      })
      .catch(() => {});
  }, []);

  // ---- Fetch status from the Python backend ----
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
    } catch (e) {
      // Backend not responding — keep last state
    }
  }, []);

  // ---- Persist settings when they change ----
  const updateSettings = useCallback((newSettings: PluginSettings) => {
    setSettings(newSettings);
    callSaveSettings(newSettings).catch(() => {});
  }, []);

  // ---- Start the bridge ----
  const startBridge = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callStartBridge(settings.port, settings.bridgeDir);
      if (result.success) {
        toaster.toast({ title: "Tadpole", body: result.message });
      } else {
        toaster.toast({ title: "Tadpole Error", body: result.message });
      }
    } catch {
      toaster.toast({ title: "Tadpole Error", body: "Failed to start bridge" });
    }
    // Give the bridge a moment to start
    setTimeout(async () => {
      await fetchStatus();
      setLoading(false);
    }, 1500);
  }, [settings, fetchStatus]);

  // ---- Stop the bridge ----
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

  // ---- Polling ----
  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchStatus]);

  // ---- Auto-start bridge when BG3 launches (once) ----
  useEffect(() => {
    if (autoStartAttemptedRef.current) return;
    if (settings.autoStart && bg3Running && !bridgeRunning && !nodeMissing) {
      autoStartAttemptedRef.current = true;
      startBridge();
    }
  }, [bg3Running, bridgeRunning, settings.autoStart, startBridge, nodeMissing]);

  // ---- Toast notifications for important events ----
  const prevClientsRef = useRef(0);
  useEffect(() => {
    // Phone connected/disconnected
    if (connectedClients > prevClientsRef.current && prevClientsRef.current === 0) {
      toaster.toast({ title: "Phone Connected", body: `A phone app is now connected (${connectedClients})` });
    }
    prevClientsRef.current = connectedClients;
  }, [connectedClients]);

  // Toast for critical game events from recentEvents
  const prevEventsLenRef = useRef(0);
  useEffect(() => {
    if (recentEvents.length <= prevEventsLenRef.current) {
      prevEventsLenRef.current = recentEvents.length;
      return;
    }
    // Only toast the new events
    const newEvents = recentEvents.slice(prevEventsLenRef.current);
    for (const evt of newEvents) {
      if (evt.type === "combat_started") {
        toaster.toast({ title: "Combat!", body: "Combat has begun!" });
      } else if (evt.type === "hp_critical") {
        toaster.toast({ title: "HP Critical!", body: evt.detail || "A party member is critically low!" });
      }
    }
    prevEventsLenRef.current = recentEvents.length;
  }, [recentEvents]);

  // ---- Render ----
  return (
    <div>
      {/* Node.js missing warning */}
      {nodeMissing && (
        <PanelSection title="Warning">
          <PanelSectionRow>
            <div style={{ padding: "8px 0", color: "#e76f51", fontSize: 13 }}>
              Node.js is not installed. Install it in Desktop Mode:
              <br />
              <code style={{ color: "#72ddf7", fontSize: 12 }}>
                sudo pacman -S nodejs npm
              </code>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* Connection Status */}
      <PanelSection title="Connection">
        <PanelSectionRow>
          <div style={{ padding: "4px 0", fontSize: 14 }}>
            <StatusDot running={bridgeRunning} />
            <span style={{ color: bridgeRunning ? "#52b788" : "#e76f51" }}>
              {bridgeRunning ? "Bridge Running" : "Bridge Stopped"}
            </span>
          </div>
        </PanelSectionRow>

        {bridgeRunning && (
          <PanelSectionRow>
            <div
              style={{ padding: "2px 0", fontSize: 12, color: "#8d99ae" }}
            >
              IP: {ip}:{settings.port}
            </div>
          </PanelSectionRow>
        )}

        <PanelSectionRow>
          <div
            style={{
              padding: "2px 0",
              fontSize: 12,
              color: connectedClients > 0 ? "#48bfe3" : "#8d99ae",
            }}
          >
            Connected phones: {connectedClients}
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={loading || nodeMissing}
            onClick={bridgeRunning ? stopBridge : startBridge}
          >
            {loading
              ? "..."
              : bridgeRunning
                ? "Stop Bridge"
                : "Start Bridge"}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {/* BG3 Status */}
      <PanelSection title="Game Status">
        <PanelSectionRow>
          <div style={{ padding: "4px 0", fontSize: 14 }}>
            <StatusDot running={bg3Running} />
            <span style={{ color: bg3Running ? "#72ddf7" : "#8d99ae" }}>
              {bg3Running ? "BG3 Running" : "Launch BG3 to begin"}
            </span>
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* Live Game State */}
      {gameState && (
        <PanelSection title="Live Game">
          {/* Area */}
          {gameState.area && (
            <PanelSectionRow>
              <div style={{ padding: "4px 0", fontSize: 13 }}>
                <span style={{ color: "#48bfe3" }}>Area:</span>{" "}
                <span style={{ color: "#eee" }}>{gameState.area}</span>
              </div>
            </PanelSectionRow>
          )}

          {/* Combat / Dialog indicator */}
          <PanelSectionRow>
            <div style={{ padding: "4px 0", fontSize: 13 }}>
              {gameState.inCombat && (
                <span
                  style={{
                    color: "#e76f51",
                    fontWeight: "bold",
                    marginRight: 12,
                  }}
                >
                  In Combat
                </span>
              )}
              {gameState.inDialog && (
                <span style={{ color: "#f4a261", fontWeight: "bold" }}>
                  In Dialog
                </span>
              )}
              {!gameState.inCombat && !gameState.inDialog && (
                <span style={{ color: "#8d99ae" }}>Exploring</span>
              )}
            </div>
          </PanelSectionRow>

          {/* Gold */}
          {typeof gameState.gold === "number" && (
            <PanelSectionRow>
              <div style={{ padding: "4px 0", fontSize: 13 }}>
                <span style={{ color: "#f4a261" }}>Gold:</span>{" "}
                <span style={{ color: "#eee" }}>{gameState.gold}</span>
              </div>
            </PanelSectionRow>
          )}

          {/* Host HP */}
          {gameState.host && gameState.host.maxHp > 0 && (
            <PanelSectionRow>
              <div style={{ padding: "8px 0" }}>
                <HPBar
                  name={gameState.host.name || "Host"}
                  hp={gameState.host.hp}
                  maxHp={gameState.host.maxHp}
                />
              </div>
            </PanelSectionRow>
          )}

          {/* Party HP */}
          {gameState.party && gameState.party.length > 0 && (
            <PanelSectionRow>
              <div style={{ padding: "4px 0" }}>
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

          {/* Recent events */}
          {recentEvents.length > 0 && (
            <PanelSectionRow>
              <div style={{ padding: "8px 0" }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#48bfe3",
                    marginBottom: 4,
                  }}
                >
                  Recent Events
                </div>
                {recentEvents.slice(-5).reverse().map((evt, i) => (
                  <div
                    key={i}
                    style={{ fontSize: 11, color: "#8d99ae", marginBottom: 2 }}
                  >
                    <span style={{ color: "#72ddf7" }}>{evt.type}</span>
                    {evt.detail ? ` - ${evt.detail}` : ""}
                  </div>
                ))}
              </div>
            </PanelSectionRow>
          )}
        </PanelSection>
      )}

      {/* Phone App Info */}
      <PanelSection title="Phone App">
        <PanelSectionRow>
          <div style={{ padding: "4px 0", fontSize: 12, color: "#8d99ae" }}>
            Open on your phone:
            <br />
            <span style={{ color: "#48bfe3", fontSize: 13 }}>
              https://tadpole-omega.vercel.app
            </span>
            <br />
            <br />
            Enter this IP:
            <br />
            <span style={{ color: "#eee", fontSize: 14 }}>
              {ip}:{settings.port}
            </span>
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* Settings */}
      <PanelSection title="Settings">
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
      </PanelSection>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Plugin definition — uses the official @decky/api definePlugin
// ---------------------------------------------------------------------------

export default definePlugin(() => {
  return {
    name: "Tadpole BG3 Companion",
    titleView: (
      <div className={staticClasses.Title}>Tadpole BG3 Companion</div>
    ),
    content: <TadpolePanel />,
    icon: <FaFrog />,
    onDismount: () => {
      // Optionally stop bridge on plugin unmount
      // callStopBridge().catch(() => {});
    },
  };
});
