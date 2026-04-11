import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ToggleField,
  TextField,
  ButtonItem,
  staticClasses,
  ServerAPI,
  Icons,
  Router,
} from "decky-frontend-lib";
import { VFC, useState, useEffect, useCallback, useRef } from "react";
import { FaFrog } from "react-icons/fa";

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

interface BridgeStatus {
  name: string;
  version: string;
  uptime: number;
  connectedClients: number;
  stateFileExists: boolean;
  currentState: BridgeGameState | null;
  recentEvents: { type: string; timestamp: number; detail?: string }[];
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
const TadpolePanel: VFC<{
  serverAPI: ServerAPI;
  settings: PluginSettings;
  setSettings: (s: PluginSettings) => void;
}> = ({ serverAPI, settings, setSettings }) => {
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

  // ---- Fetch status from the Python backend ----
  const fetchStatus = useCallback(async () => {
    try {
      const resp = await serverAPI.callPluginMethod("get_status", {});
      const data = resp as {
        bridge_running: boolean;
        bg3_running: boolean;
        ip: string;
        connected_clients: number;
        game_state: BridgeGameState | null;
        recent_events: { type: string; timestamp: number; detail?: string }[];
        node_installed: boolean;
      };

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
  }, [serverAPI]);

  // ---- Start the bridge ----
  const startBridge = useCallback(async () => {
    setLoading(true);
    try {
      await serverAPI.callPluginMethod("start_bridge", {
        port: settings.port,
        bridge_dir: settings.bridgeDir,
      });
    } catch {}
    // Give the bridge a moment to start
    setTimeout(async () => {
      await fetchStatus();
      setLoading(false);
    }, 1500);
  }, [serverAPI, settings, fetchStatus]);

  // ---- Stop the bridge ----
  const stopBridge = useCallback(async () => {
    setLoading(true);
    try {
      await serverAPI.callPluginMethod("stop_bridge", {});
    } catch {}
    setTimeout(async () => {
      await fetchStatus();
      setLoading(false);
    }, 500);
  }, [serverAPI, fetchStatus]);

  // ---- Auto-start detection ----
  useEffect(() => {
    fetchStatus();

    // Poll every 2 seconds
    pollRef.current = setInterval(fetchStatus, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchStatus]);

  // ---- Auto-start bridge when BG3 launches ----
  useEffect(() => {
    if (settings.autoStart && bg3Running && !bridgeRunning && !nodeMissing) {
      startBridge();
    }
  }, [bg3Running, bridgeRunning, settings.autoStart, startBridge, nodeMissing]);

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
              setSettings({ ...settings, autoStart: checked })
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
                    setSettings({ ...settings, port: num });
                  }
                }}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <TextField
                label="Bridge Directory"
                value={settings.bridgeDir}
                onChange={(val) =>
                  setSettings({ ...settings, bridgeDir: val })
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
// Plugin definition
// ---------------------------------------------------------------------------
export default definePlugin((serverAPI: ServerAPI) => {
  // Persisted settings
  let settings: PluginSettings = { ...DEFAULT_SETTINGS };

  // Try to load saved settings
  serverAPI
    .callPluginMethod("get_settings", {})
    .then((saved) => {
      const s = saved as PluginSettings | null;
      if (s) settings = { ...DEFAULT_SETTINGS, ...s };
    })
    .catch(() => {});

  const setSettings = (newSettings: PluginSettings) => {
    settings = newSettings;
    serverAPI.callPluginMethod("save_settings", { settings }).catch(() => {});
  };

  return {
    title: <div className={staticClasses.Title}>Tadpole BG3 Companion</div>,
    content: (
      <TadpolePanel
        serverAPI={serverAPI}
        settings={settings}
        setSettings={setSettings}
      />
    ),
    icon: <FaFrog />,
    onDismount: () => {
      // Optionally stop bridge on plugin unmount
      // serverAPI.callPluginMethod("stop_bridge", {}).catch(() => {});
    },
  };
});
