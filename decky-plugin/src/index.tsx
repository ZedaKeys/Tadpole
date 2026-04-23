import { definePlugin, callable, toaster, addEventListener, removeEventListener } from "@decky/api";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  ToggleField,
  staticClasses,
} from "@decky/ui";
import { FunctionComponent, useState, useEffect, useCallback, useRef, Component, ReactNode } from "react";
import { FaFrog } from "react-icons/fa";

// ---------------------------------------------------------------------------
// Error Boundary - prevents white-screen crashes
// ---------------------------------------------------------------------------

class TadpoleErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tadpole ErrorBoundary caught an error:', error, errorInfo);
    toaster.toast({ title: "Tadpole Error", body: "An error occurred. Check the log for details." });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 14, marginBottom: 10 }}>Something went wrong</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 15 }}>{this.state.error?.message}</div>
          <div style={{ fontSize: 11, opacity: 0.5 }}>Restart the plugin from Decky settings to recover.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// API callables
// ---------------------------------------------------------------------------

const callGetStatus = callable<[], {
  bridge_running: boolean; bg3_running: boolean; ip: string;
  connected_clients: number; game_state: any; recent_events: any[];
  node_installed: boolean;
}>("get_status");

const callGetDiagnostics = callable<[], {
  node_installed: boolean; node_version: string | null;
  node_binary: string; bridge_found: boolean; bridge_path: string | null;
  lua_installed: boolean; bg3se_installed: boolean; bg3_install_dir: string | null;
  bg3_running: boolean; ip: string;
  bg3_mod_dir: string | null; ready: boolean; paths_checked: Record<string, { path: string; exists: boolean }>;
  plugin_version: string; home: string; decky_user_home: string;
}>("get_diagnostics");

const callCheckHealth = callable<[], { healthy: boolean }>("check_health");
const callStartBridge = callable<[number, string], { success: boolean; message: string }>("start_bridge");
const callStopBridge = callable<[], { success: boolean; message: string }>("stop_bridge");
const callGetSettings = callable<[], any>("get_settings");
const callSaveSettings = callable<[any], { success: boolean }>("save_settings");
const callInstallEverything = callable<[], { success: boolean; results?: any; step?: string }>("install_everything");
const callCheckUpdate = callable<[], {
  update_available: boolean; current_version: string;
  latest_version: string; download_url?: string; error?: string;
}>("check_update");
const callPerformUpdate = callable<[string], { success: boolean; message: string }>("perform_update");
const callGetLog = callable<[], { log: string }>("get_log");
const callGetLaunchOptions = callable<[], { success: boolean; current: string; recommended: string; has_dwrite: boolean; error?: string }>("get_launch_options");
const callSetLaunchOptions = callable<[string], { success: boolean; message: string; value?: string }>("set_launch_options");
const callCopyToClipboard = callable<[string], { success: boolean; error?: string }>("copy_to_clipboard");
const callSendCommand = callable<[string, string], { success: boolean; message: string }>("send_command");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PluginSettings { port: number; autoStart: boolean; bridgeDir: string; }
const DEFAULT_SETTINGS: PluginSettings = { port: 3456, autoStart: true, bridgeDir: "~/tadpole/bridge" };

type Tab = "live" | "setup" | "cheats" | "settings";

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

const TadpolePanel: FunctionComponent = () => {
  const [settings, setSettings] = useState<PluginSettings>({ ...DEFAULT_SETTINGS });
  const [tab, setTab] = useState<Tab>("live");

  // Status
  const [bridgeRunning, setBridgeRunning] = useState(false);
  const [bridgeHealthy, setBridgeHealthy] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [bg3Running, setBg3Running] = useState(false);
  const [ip, setIp] = useState("...");
  const [connectedClients, setConnectedClients] = useState(0);
  const [gameState, setGameState] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [nodeMissing, setNodeMissing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Connection stability refs
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failCountRef = useRef(0);
  const backoffMsRef = useRef(2000);
  const backoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHealthyRef = useRef(false);
  const warningToastShownRef = useRef(false);

  // Setup
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [installing, setInstalling] = useState(false);
  const [ready, setReady] = useState(false);

  // Settings
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logText, setLogText] = useState("");

  // Launch
  const [launchCurrent, setLaunchCurrent] = useState("");
  const LAUNCH_CMD_DWRITE = 'WINEDLLOVERRIDES="DWrite.dll=n,b" %command%';
  const LAUNCH_CMD_LSFG = 'WINEDLLOVERRIDES="DWrite.dll=n,b" ~/lsfg %command%';
  const [launchHasDwrite, setLaunchHasDwrite] = useState(false);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchCopied, setLaunchCopied] = useState("");

  // Cheats
  const [cheatLoading, setCheatLoading] = useState(false);
  const [godModeEnabled, setGodModeEnabled] = useState(false);

  // Phase 2: collapsible section state
  const [charSheetOpen, setCharSheetOpen] = useState(false);
  const [statusEffectsOpen, setStatusEffectsOpen] = useState(false);

  const autoStartRef = useRef(false);
  const tabRef = useRef<Tab>(tab);
  tabRef.current = tab;

  const runDiagnostics = useCallback(async () => {
    try {
      const d = await callGetDiagnostics();
      setDiagnostics(d);
      setReady(d.ready);
      if (!d.ready && tabRef.current === "live") setTab("setup");
      return d;
    } catch (e) {
      console.error('Diagnostics failed:', e);
    }
  }, []);

  // Load settings + diagnostics on mount
  useEffect(() => {
    callGetSettings().then((s: any) => { if (s && Object.keys(s).length > 0) setSettings({ ...DEFAULT_SETTINGS, ...s }); }).catch(() => {});
    runDiagnostics().finally(() => setInitialLoading(false));
  }, [runDiagnostics]);

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
      if (data.bridge_running) {
        const h = await callCheckHealth();
        setBridgeHealthy(h.healthy);
        // Detect healthy→unhealthy transition
        if (prevHealthyRef.current && !h.healthy) {
          console.warn('[tadpole] Bridge went from healthy to unhealthy');
        }
        prevHealthyRef.current = h.healthy;
      } else {
        setBridgeHealthy(false);
        prevHealthyRef.current = false;
      }
      // Success: reset backoff and failure counter
      failCountRef.current = 0;
      backoffMsRef.current = 2000;
      warningToastShownRef.current = false;
      setReconnecting(false);
    } catch (e) {
      console.error('Failed to fetch status:', e);
      setBridgeRunning(false);
      setBridgeHealthy(false);
      setReconnecting(true);
      failCountRef.current++;
      backoffMsRef.current = Math.min(backoffMsRef.current * 2, 30000);
      // Show warning toast after 5 consecutive failures
      if (failCountRef.current >= 5 && !warningToastShownRef.current) {
        warningToastShownRef.current = true;
        toaster.toast({ title: "Tadpole Warning", body: `Bridge unreachable (${failCountRef.current} failed polls). Retrying...` });
      }
    }
  }, []);

  const updateSettings = useCallback((s: PluginSettings) => {
    setSettings(s);
    callSaveSettings(s).catch(() => toaster.toast({ title: "Error", body: "Failed to save settings" }));
  }, []);

  const startBridge = useCallback(async () => {
    setLoading(true);
    try {
      const r = await callStartBridge(settings.port, settings.bridgeDir);
      toaster.toast({ title: "Tadpole", body: r.message });
    } catch { toaster.toast({ title: "Error", body: "Failed to start bridge" }); }
    try {
      await fetchStatus();
    } catch (e) {
      console.error('Status check after start failed:', e);
    }
    setLoading(false);
  }, [settings, fetchStatus]);

  const stopBridge = useCallback(async () => {
    setLoading(true);
    try {
      const r = await callStopBridge();
      toaster.toast({ title: "Tadpole", body: r.message });
    } catch { toaster.toast({ title: "Error", body: "Failed to stop" }); }
    try {
      await fetchStatus();
    } catch (e) {
      console.error('Status check after stop failed:', e);
    }
    setLoading(false);
  }, [fetchStatus]);

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    try {
      const r = await callInstallEverything();
      if (r.success) {
        toaster.toast({ title: "Setup Complete!", body: "Everything installed" });
        const d = await runDiagnostics();
        await fetchStatus();
        if (d?.ready) setTab("live");
      } else {
        toaster.toast({ title: "Setup Failed", body: `Failed at ${r.step || "unknown"}` });
      }
    } catch { toaster.toast({ title: "Error", body: "Installation failed" }); }
    setInstalling(false);
  }, [runDiagnostics, fetchStatus]);

  // Reactive game state updates via decky.emit (no polling)
  // Listen for game-state-update events pushed from main.py's WS listener
  useEffect(() => {
    const handler = (data: any) => {
      if (data?.game_state) {
        setGameState(data.game_state);
      }
      if (data?.recent_events) {
        setRecentEvents(data.recent_events);
      }
    };

    // Subscribe to reactive updates from Python backend
    addEventListener('game-state-update', handler);
    return () => {
      removeEventListener('game-state-update', handler);
    };
  }, []);

  // Connection monitoring — periodic checks for bridge/BG3 status (not game state)
  // Only run when live tab is active. Uses slower interval since game data comes via events.
  useEffect(() => {
    if (tab !== "live") return;

    // Initial fetch on tab switch
    fetchStatus();

    // Clear any existing backoff timer
    if (backoffTimerRef.current) {
      clearTimeout(backoffTimerRef.current);
      backoffTimerRef.current = null;
    }

    // Reset backoff when switching to live tab
    backoffMsRef.current = 2000;
    failCountRef.current = 0;
    setReconnecting(false);

    // Slower health/bridge check interval (every 10s) — game state comes via events
    pollRef.current = setInterval(fetchStatus, 10000);

    // Separate health check interval (every 10s)
    healthCheckRef.current = setInterval(async () => {
      try {
        const h = await callCheckHealth();
        const wasHealthy = prevHealthyRef.current;
        setBridgeHealthy(h.healthy);
        prevHealthyRef.current = h.healthy;
        // Show subtle indicator when bridge goes from healthy to unhealthy
        if (wasHealthy && !h.healthy) {
          console.warn('[tadpole] Health check: bridge is unhealthy');
        }
      } catch {
        setBridgeHealthy(false);
        prevHealthyRef.current = false;
      }
    }, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (healthCheckRef.current) clearInterval(healthCheckRef.current);
      if (backoffTimerRef.current) clearTimeout(backoffTimerRef.current);
    };
  }, [fetchStatus, tab]);

  // Exponential backoff reconnection: when reconnecting state is active,
  // schedule retries with increasing delay
  useEffect(() => {
    if (!reconnecting || tab !== "live") return;

    if (backoffTimerRef.current) clearTimeout(backoffTimerRef.current);
    backoffTimerRef.current = setTimeout(async () => {
      await fetchStatus();
    }, backoffMsRef.current);

    return () => {
      if (backoffTimerRef.current) clearTimeout(backoffTimerRef.current);
    };
  }, [reconnecting, tab, fetchStatus]);

  // Auto-fetch launch options when switching to Settings tab (launch section is there)
  useEffect(() => {
    if (tab !== "settings") return;
    (async () => {
      try {
        const info = await callGetLaunchOptions();
        if (info.success) {
          setLaunchCurrent(info.current);
          setLaunchHasDwrite(info.has_dwrite);
        }
      } catch {}
    })();
  }, [tab]);

  // Auto-start bridge when BG3 starts (if enabled)
  useEffect(() => {
    if (bg3Running && !bridgeRunning) {
      // BG3 is running but bridge isn't — try auto-start if enabled
      if (settings.autoStart && !nodeMissing && !autoStartRef.current) {
        autoStartRef.current = true;
        startBridge();
      }
    } else if (!bg3Running) {
      // BG3 stopped — reset auto-start so it can fire again next time
      autoStartRef.current = false;
    }
  }, [bg3Running, bridgeRunning, settings.autoStart, startBridge, nodeMissing]);

  // Computed
  const partyHp = (() => {
    let c = 0, m = 0;
    if (gameState?.host?.maxHp > 0) { c += gameState.host.hp; m += gameState.host.maxHp; }
    gameState?.party?.forEach((p: any) => { if (p.maxHp > 0) { c += p.hp; m += p.maxHp; } });
    return { c, m };
  })();

  const hasLiveData = gameState && bg3Running && (gameState.host?.maxHp > 0 || gameState.party?.length > 0);

  // -----------------------------------------------------------------------
  // Styles
  // -----------------------------------------------------------------------
  const s = {
    root: { padding: "6px 0" },
    tabRow: { display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 8 } as React.CSSProperties,
    tab: (active: boolean): React.CSSProperties => ({
      flex: 1, padding: "8px 0", textAlign: "center" as const,
      fontSize: 12, fontWeight: 600, color: active ? "#fff" : "rgba(255,255,255,0.4)",
      background: active ? "rgba(255,255,255,0.1)" : "transparent",
      border: "none", cursor: "pointer",
    }),
    card: (border?: string): React.CSSProperties => ({
      padding: "10px 12px", borderRadius: 10,
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${border || "rgba(255,255,255,0.06)"}`,
      marginBottom: 8,
    }),
    row: (between = true): React.CSSProperties => ({
      display: "flex", alignItems: "center",
      justifyContent: between ? "space-between" : "flex-start",
      gap: 8,
    }),
    dot: (color: string): React.CSSProperties => ({
      width: 7, height: 7, borderRadius: "50%", backgroundColor: color,
      boxShadow: `0 0 6px ${color}60`,
    }),
    label: { fontSize: 12, color: "rgba(255,255,255,0.5)" } as React.CSSProperties,
    value: { fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 } as React.CSSProperties,
    muted: { fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 } as React.CSSProperties,
    ip: {
      fontFamily: "monospace", fontSize: 13, color: "rgba(120,180,255,0.9)",
      textAlign: "center" as const, padding: "4px 0",
    } as React.CSSProperties,
    hpBar: (pct: number, color: string): React.CSSProperties => ({
      height: "100%", width: `${pct * 100}%`, backgroundColor: color,
      borderRadius: 3, transition: "width 0.4s ease",
    }),
    eventRow: { display: "flex", gap: 6, fontSize: 11, padding: "2px 0" } as React.CSSProperties,
    pill: (color: string): React.CSSProperties => ({
      display: "inline-block", padding: "2px 8px", borderRadius: 10,
      fontSize: 10, fontWeight: 700, color,
      background: `${color}15`, border: `1px solid ${color}25`,
    }),
  };

  const EVENT_ICON: Record<string, string> = {
    combat_started: "!", combat_ended: "+", area_changed: ">",
    hp_critical: "!!", level_up: "^", death: "X", rest: "R",
  };

  // -----------------------------------------------------------------------
  // Tab: Live
  // -----------------------------------------------------------------------
  const LiveTab = () => (
    <div>
      {/* Status bar */}
      <div style={s.card()}>
        <div style={s.row()}>
          <div style={s.row(false)}>
            <div style={s.dot(reconnecting ? "#e76f51" : bridgeRunning && bridgeHealthy ? "#52b788" : bridgeRunning ? "#f4a261" : "#e76f51")} />
            <span style={{ ...s.value, fontSize: 11, color: reconnecting ? "#e76f51" : bridgeRunning && bridgeHealthy ? "#52b788" : bridgeRunning ? "#f4a261" : "#e76f51" }}>
              {reconnecting ? "Reconnecting..." : bridgeRunning && bridgeHealthy ? (bg3Running ? "Online — BG3 Running" : "Online — BG3 Not Running") : bridgeRunning ? "Unhealthy" : "Offline — Start Bridge"}
            </span>
            {reconnecting && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                (attempt {failCountRef.current + 1})
              </span>
            )}
          </div>
          {bridgeRunning && !reconnecting && connectedClients > 0 && (
            <span style={s.pill("#52b788")}>{connectedClients} phone{connectedClients !== 1 ? "s" : ""}</span>
          )}
          {bg3Running && (
            <span style={s.pill("rgba(120,180,255,0.8)")}>BG3</span>
          )}
        </div>
        {/* Unhealthy warning indicator */}
        {bridgeRunning && !bridgeHealthy && !reconnecting && (
          <div style={{ ...s.muted, fontSize: 10, color: "#f4a261", marginTop: 4, textAlign: "center" }}>
            Bridge is running but unhealthy — some features may not work
          </div>
        )}
      </div>

      {/* Bridge control */}
      <PanelSectionRow>
        <ButtonItem layout="below" disabled={loading || nodeMissing} onClick={bridgeRunning ? stopBridge : startBridge}>
          {loading ? "..." : bridgeRunning ? "Stop Bridge" : "Start Bridge"}
        </ButtonItem>
      </PanelSectionRow>

      {/* Phone IP */}
      {bridgeRunning && (
        <div style={s.card("rgba(120,180,255,0.12)")}>
          <div style={{ ...s.muted, marginBottom: 4, textAlign: "center" }}>Open on your phone:</div>
          <div style={s.ip}>{ip}:{settings.port}</div>
        </div>
      )}

      {/* Live game data */}
      {hasLiveData && (
        <div style={s.card()}>
          {/* State pills */}
          <div style={{ ...s.row(), marginBottom: 8 }}>
            {gameState.area && <span style={{ ...s.value, fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gameState.area}</span>}
            <div style={{ ...s.row(false), gap: 4, flexShrink: 0 }}>
              {gameState.inCombat && <span style={s.pill("#e76f51")}>Combat</span>}
              {gameState.inDialog && <span style={s.pill("#f4a261")}>Dialog</span>}
              {!gameState.inCombat && !gameState.inDialog && <span style={s.pill("#52b788")}>Explore</span>}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
            {typeof gameState.gold === "number" && (
              <div style={{ textAlign: "center", padding: "4px 0" }}>
                <div style={{ ...s.muted, fontSize: 10 }}>Gold</div>
                <div style={{ ...s.value, color: "#f4a261" }}>{gameState.gold}</div>
              </div>
            )}
            {partyHp.m > 0 && (
              <div style={{ textAlign: "center", padding: "4px 0" }}>
                <div style={{ ...s.muted, fontSize: 10 }}>Party HP</div>
                <div style={{ ...s.value, color: hpColor(partyHp.c / partyHp.m) }}>{partyHp.c}/{partyHp.m}</div>
              </div>
            )}
            {gameState.party && (
              <div style={{ textAlign: "center", padding: "4px 0" }}>
                <div style={{ ...s.muted, fontSize: 10 }}>Party</div>
                <div style={s.value}>{gameState.party.length + 1}</div>
              </div>
            )}
          </div>

          {/* Action Resources Bar (inline, always visible) */}
          {gameState.host?.actionResources && gameState.host.actionResources.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {gameState.host.actionResources.map((res: any, ri: number) => {
                const totalSlots = res.slots || [];
                const totalAmount = totalSlots.reduce((acc: number, sl: any) => acc + (sl.amount || 0), 0);
                const totalMax = totalSlots.reduce((acc: number, sl: any) => acc + (sl.maxAmount || 0), 0);
                if (totalMax <= 0) return null;
                let color = "rgba(255,255,255,0.5)";
                if (res.name === "Action") color = "#52b788";
                else if (res.name === "Bonus Action") color = "rgba(100,149,237,0.9)";
                else if (res.name === "Reaction") color = "#f4a261";
                else if (res.name?.includes("Sorcery")) color = "rgba(168,85,247,0.9)";
                else if (res.name?.includes("Channel")) color = "rgba(255,215,0,0.9)";
                else if (res.name?.includes("Spell")) color = "rgba(120,180,255,0.9)";
                return (
                  <div key={ri} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 6, background: `${color}12`, border: `1px solid ${color}20` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, boxShadow: `0 0 4px ${color}60` }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>{res.name}</span>
                    {totalSlots.length <= 1 ? (
                      <span style={{ fontSize: 10, fontWeight: 600, color }}>{Math.round(totalAmount)}/{Math.round(totalMax)}</span>
                    ) : (
                      <div style={{ display: "flex", gap: 2 }}>
                        {totalSlots.map((sl: any, si: number) => (
                          <div key={si} style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: sl.amount > 0 ? color : `${color}30`, transition: "background-color 0.2s" }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* HP bars */}
          {gameState.host?.maxHp > 0 && (
            <HpRow name={gameState.host.name || "Host"} hp={gameState.host.hp} maxHp={gameState.host.maxHp} bold />
          )}
          {gameState.party?.map((m: any, i: number) => m.maxHp > 0 ? (
            <HpRow key={m.guid || i} name={m.name} hp={m.hp} maxHp={m.maxHp} />
          ) : null)}

          {/* Recent events */}
          {recentEvents.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ ...s.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Recent</div>
              {recentEvents.slice(-4).reverse().map((evt: any, i: number) => (
                <div key={i} style={s.eventRow}>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>{EVENT_ICON[evt.type] || "-"}</span>
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>{evt.type.replace(/_/g, " ")}{evt.detail ? ` - ${evt.detail}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Character Sheet (collapsible) */}
      {hasLiveData && (
        <div style={s.card()}>
          <div
            style={{ ...s.row(), cursor: "pointer", userSelect: "none" }}
            onClick={() => setCharSheetOpen(!charSheetOpen)}
          >
            <span style={{ ...s.value, fontSize: 12 }}>
              {charSheetOpen ? "▾" : "▸"} Character Sheet
            </span>
            {gameState.host?.name && <span style={s.muted}>{gameState.host.name}</span>}
          </div>
          {charSheetOpen && (
            <div style={{ marginTop: 8 }}>
              {/* Name, Level */}
              {gameState.host?.name && (
                <div style={{ ...s.row(), marginBottom: 4 }}>
                  <span style={{ ...s.value, fontSize: 14 }}>{gameState.host.name}</span>
                  {gameState.host.level != null && <span style={s.pill("rgba(120,180,255,0.8)")}>Lv {gameState.host.level}</span>}
                </div>
              )}
              {/* Character flags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                {gameState.host?.hasTadpole && <span style={s.pill("rgba(168,85,247,0.7)")}>Tadpole</span>}
                {gameState.host?.isAvatar && <span style={s.pill("rgba(120,180,255,0.6)")}>Avatar</span>}
              </div>
              {/* AC, Proficiency Bonus */}
              <div style={{ ...s.row(), marginBottom: 6 }}>
                {gameState.host?.armorClass != null && (
                  <div style={{ textAlign: "center", padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ ...s.muted, fontSize: 9 }}>AC</div>
                    <div style={{ ...s.value, fontSize: 13 }}>{gameState.host.armorClass}</div>
                  </div>
                )}
                {gameState.host?.proficiencyBonus != null && (
                  <div style={{ textAlign: "center", padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ ...s.muted, fontSize: 9 }}>Prof</div>
                    <div style={{ ...s.value, fontSize: 13 }}>+{gameState.host.proficiencyBonus}</div>
                  </div>
                )}
              </div>
              {/* Ability Scores 2×3 grid */}
              {gameState.host?.abilityScores && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, marginBottom: 6 }}>
                  {[
                    { key: "str", label: "STR" },
                    { key: "dex", label: "DEX" },
                    { key: "con", label: "CON" },
                    { key: "int", label: "INT" },
                    { key: "wis", label: "WIS" },
                    { key: "cha", label: "CHA" },
                  ].map((abi) => {
                    const score = gameState.host.abilityScores?.[abi.key];
                    const mod = gameState.host.abilityModifiers?.[abi.key];
                    return score != null ? (
                      <div key={abi.key} style={{ textAlign: "center", padding: "3px 0", borderRadius: 4, background: "rgba(255,255,255,0.03)" }}>
                        <div style={{ ...s.muted, fontSize: 9 }}>{abi.label}</div>
                        <div style={{ ...s.value, fontSize: 12 }}>
                          {score}{" "}
                          <span style={{ fontSize: 10, color: mod >= 0 ? "#52b788" : "#e76f51" }}>
                            ({mod >= 0 ? "+" : ""}{mod})
                          </span>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              {/* XP Progress Bar */}
              {(() => {
                const xpDetail = gameState.host?.experienceDetail;
                const nextXp = xpDetail?.nextLevelXp ?? gameState.host?.experience?.nextLevelXp;
                const curXp = xpDetail?.currentLevelXp ?? gameState.host?.experience?.currentLevelXp;
                if (!nextXp || nextXp <= 0) return null;
                return (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ ...s.row(), marginBottom: 2 }}>
                      <span style={{ ...s.muted, fontSize: 10 }}>XP</span>
                      <span style={{ ...s.muted, fontSize: 10 }}>
                        {curXp ?? 0} / {nextXp}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, ((curXp ?? 0) / nextXp) * 100)}%`,
                        backgroundColor: "rgba(120,180,255,0.7)", borderRadius: 2,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                );
              })()}
              {/* Spell Slots as pips */}
              {gameState.host?.spellSlots && (() => {
                const levels = ["level1","level2","level3","level4","level5","level6","level7","level8","level9"];
                const slots = levels.map((l, idx) => {
                  const sl = gameState.host.spellSlots[l];
                  return sl && sl.max > 0 ? { level: idx + 1, current: sl.current || 0, max: sl.max } : null;
                }).filter(Boolean);
                if (slots.length === 0) return null;
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {slots.map((sl: any) => (
                      <div key={sl.level} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 6, background: "rgba(120,180,255,0.08)", border: "1px solid rgba(120,180,255,0.12)" }}>
                        <span style={{ fontSize: 9, color: "rgba(120,180,255,0.7)" }}>{sl.level}</span>
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: sl.max }).map((_, pi: number) => (
                            <div key={pi} style={{
                              width: 5, height: 5, borderRadius: "50%",
                              backgroundColor: pi < sl.current ? "rgba(120,180,255,0.9)" : "rgba(120,180,255,0.15)",
                              transition: "background-color 0.2s",
                            }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Status Effects (collapsible) */}
      {hasLiveData && (
        <div style={s.card()}>
          <div
            style={{ ...s.row(), cursor: "pointer", userSelect: "none" }}
            onClick={() => setStatusEffectsOpen(!statusEffectsOpen)}
          >
            <span style={{ ...s.value, fontSize: 12 }}>
              {statusEffectsOpen ? "▾" : "▸"} Status Effects
            </span>
            {gameState.host?.conditions?.length > 0 && (
              <span style={{ ...s.muted, fontSize: 10 }}>{gameState.host.conditions.length} active</span>
            )}
          </div>
          {statusEffectsOpen && (
            <div style={{ marginTop: 8 }}>
              {/* Concentration */}
              {gameState.host?.concentration && (
                <div style={{ ...s.row(), marginBottom: 6, padding: "4px 8px", borderRadius: 6, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <span style={{ fontSize: 10, color: "rgba(168,85,247,0.9)", fontWeight: 600 }}>Concentrating</span>
                </div>
              )}
              {/* Sneaking / Invulnerable flags */}
              {(gameState.host?.isSneaking || gameState.host?.isInvulnerable) && (
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  {gameState.host.isSneaking && <span style={s.pill("#52b788")}>Sneaking</span>}
                  {gameState.host.isInvulnerable && <span style={s.pill("rgba(255,215,0,0.8)")}>Invulnerable</span>}
                </div>
              )}
              {/* Active Conditions */}
              {gameState.host?.conditions?.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ ...s.muted, fontSize: 9, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>Conditions</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {gameState.host.conditions.map((cond: string, i: number) => {
                      const lc = cond.toLowerCase();
                      const condColor = lc.includes("poison") ? "#e76f51"
                        : lc.includes("bless") || lc.includes("shield") ? "#52b788"
                        : lc.includes("haste") ? "#f4a261"
                        : "rgba(255,255,255,0.5)";
                      return <span key={i} style={s.pill(condColor)}>{cond}</span>;
                    })}
                  </div>
                </div>
              )}
              {/* Passive Features */}
              {gameState.host?.passives?.length > 0 && (
                <div>
                  <div style={{ ...s.muted, fontSize: 9, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>Passives</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {gameState.host.passives.map((passive: string, i: number) => (
                      <span key={i} style={{
                        ...s.pill("rgba(255,255,255,0.25)"),
                        fontSize: 9, fontWeight: 400,
                      }}>{passive}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No game data hint */}
      {!hasLiveData && bridgeRunning && (
        <div style={s.card()}>
          <div style={{ ...s.muted, textAlign: "center" }}>
            {bg3Running ? "Waiting for game data... make sure the Lua mod is installed." : "Start BG3 to see live data here."}
          </div>
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Tab: Setup
  // -----------------------------------------------------------------------
  const SetupTab = () => (
    <div>
      {diagnostics?.ready ? (
        <div style={s.card("rgba(82,183,136,0.2)")}>
          <div style={{ ...s.value, color: "#52b788", textAlign: "center", marginBottom: 4 }}>All set!</div>
          <div style={{ ...s.muted, textAlign: "center" }}>Everything is installed and ready.</div>
        </div>
      ) : (
        <>
          <div style={{ ...s.card(), marginBottom: 6 }}>
            <div style={{ ...s.value, fontSize: 14, marginBottom: 6 }}>Tadpole Setup</div>
            <div style={s.muted}>One click installs everything you need.</div>
          </div>

          {/* Status checks */}
          {diagnostics && (
            <div style={s.card()}>
              <CheckLine label="BG3 Script Extender" ok={diagnostics.bg3se_installed} />
              <CheckLine label={diagnostics.node_installed ? `Node.js ${diagnostics.node_version || ""}` : "Node.js"} ok={diagnostics.node_installed} />
              <CheckLine label="Bridge Server" ok={diagnostics.bridge_found} />
              <CheckLine label="BG3 Lua Mod" ok={diagnostics.lua_installed} />
            </div>
          )}

          <PanelSectionRow>
            <ButtonItem layout="below" onClick={handleInstall} disabled={installing}>
              {installing ? "Installing..." : "Install Everything"}
            </ButtonItem>
          </PanelSectionRow>
        </>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Tab: Cheats
  // -----------------------------------------------------------------------
  const CheatsTab = () => (
    <div>
      <div style={s.card()}>
        <div style={{ ...s.value, fontSize: 14, marginBottom: 6 }}>Cheat Commands</div>
        <div style={s.muted}>Send commands to the BG3 Lua mod. Game must be running with the mod installed.</div>
      </div>

      {/* Heal Party */}
      <div style={s.card("rgba(82,183,136,0.2)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <span style={{ fontSize: 14, marginRight: 8 }}>💚</span>
            <span style={{ ...s.value, fontSize: 13, color: "#52b788" }}>Heal Party</span>
          </div>
        </div>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={cheatLoading} onClick={async () => {
            setCheatLoading(true);
            try {
              const r = await callSendCommand("heal_party", "");
              toaster.toast({ title: r.success ? "Done" : "Failed", body: r.message });
            } catch { toaster.toast({ title: "Error", body: "Could not send command" }); }
            setCheatLoading(false);
          }}>
            Heal Full Party
          </ButtonItem>
        </PanelSectionRow>
      </div>

      {/* Revive All */}
      <div style={s.card("rgba(100,149,237,0.2)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <span style={{ fontSize: 14, marginRight: 8 }}>💙</span>
            <span style={{ ...s.value, fontSize: 13, color: "rgba(100,149,237,0.9)" }}>Revive All</span>
          </div>
        </div>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={cheatLoading} onClick={async () => {
            setCheatLoading(true);
            try {
              const r = await callSendCommand("revive", "");
              toaster.toast({ title: r.success ? "Done" : "Failed", body: r.message });
            } catch { toaster.toast({ title: "Error", body: "Could not send command" }); }
            setCheatLoading(false);
          }}>
            Revive All Party Members
          </ButtonItem>
        </PanelSectionRow>
      </div>

      {/* Full Restore */}
      <div style={s.card("rgba(82,183,136,0.2)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <span style={{ fontSize: 14, marginRight: 8 }}>✨</span>
            <span style={{ ...s.value, fontSize: 13, color: "#52b788" }}>Full Restore</span>
          </div>
        </div>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={cheatLoading} onClick={async () => {
            setCheatLoading(true);
            try {
              const r = await callSendCommand("full_restore", "");
              toaster.toast({ title: r.success ? "Done" : "Failed", body: r.message });
            } catch { toaster.toast({ title: "Error", body: "Could not send command" }); }
            setCheatLoading(false);
          }}>
            Full HP &amp; Resources
          </ButtonItem>
        </PanelSectionRow>
      </div>

      {/* Add Gold */}
      <div style={s.card("rgba(244,162,97,0.15)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <span style={{ fontSize: 14, marginRight: 8 }}>💰</span>
            <span style={{ ...s.value, fontSize: 13, color: "#f4a261" }}>Add Gold</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[100, 500, 1000, 5000].map(amount => (
            <ButtonItem key={amount} layout="below" style={{ flex: 1, minWidth: 0 }} disabled={cheatLoading} onClick={async () => {
              setCheatLoading(true);
              try {
                const r = await callSendCommand("add_gold", String(amount));
                toaster.toast({ title: r.success ? "Done" : "Failed", body: r.message });
              } catch { toaster.toast({ title: "Error", body: "Could not send command" }); }
              setCheatLoading(false);
            }}>
              +{amount}
            </ButtonItem>
          ))}
        </div>
      </div>

      {/* Long Rest */}
      <div style={s.card("rgba(168,85,247,0.15)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <span style={{ fontSize: 14, marginRight: 8 }}>🌙</span>
            <span style={{ ...s.value, fontSize: 13, color: "rgba(168,85,247,0.9)" }}>Long Rest</span>
          </div>
        </div>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={cheatLoading} onClick={async () => {
            setCheatLoading(true);
            try {
              const r = await callSendCommand("long_rest", "");
              toaster.toast({ title: r.success ? "Done" : "Failed", body: r.message });
            } catch { toaster.toast({ title: "Error", body: "Could not send command" }); }
            setCheatLoading(false);
          }}>
            Trigger Long Rest
          </ButtonItem>
        </PanelSectionRow>
      </div>

      {/* Short Rest */}
      <div style={s.card("rgba(168,85,247,0.15)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <span style={{ fontSize: 14, marginRight: 8 }}>⛅</span>
            <span style={{ ...s.value, fontSize: 13, color: "rgba(168,85,247,0.9)" }}>Short Rest</span>
          </div>
        </div>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={cheatLoading} onClick={async () => {
            setCheatLoading(true);
            try {
              const r = await callSendCommand("short_rest", "");
              toaster.toast({ title: r.success ? "Done" : "Failed", body: r.message });
            } catch { toaster.toast({ title: "Error", body: "Could not send command" }); }
            setCheatLoading(false);
          }}>
            Trigger Short Rest
          </ButtonItem>
        </PanelSectionRow>
      </div>

      {/* God Mode */}
      <div style={s.card("rgba(255,215,0,0.15)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <span style={{ fontSize: 14, marginRight: 8 }}>👑</span>
            <span style={{ ...s.value, fontSize: 13, color: "rgba(255,215,0,0.9)" }}>God Mode</span>
          </div>
          {godModeEnabled && <span style={s.pill("rgba(255,215,0,0.8)")}>ON</span>}
        </div>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={cheatLoading} onClick={async () => {
            setCheatLoading(true);
            const newVal = godModeEnabled ? "0" : "1";
            try {
              const r = await callSendCommand("god_mode", newVal);
              if (r.success) setGodModeEnabled(!godModeEnabled);
              toaster.toast({ title: r.success ? "Done" : "Failed", body: r.message });
            } catch { toaster.toast({ title: "Error", body: "Could not send command" }); }
            setCheatLoading(false);
          }}>
            {godModeEnabled ? "Disable God Mode" : "Enable God Mode"}
          </ButtonItem>
        </PanelSectionRow>
      </div>

      {/* Reset Cooldowns */}
      <div style={s.card("rgba(100,149,237,0.2)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <span style={{ fontSize: 14, marginRight: 8 }}>🔄</span>
            <span style={{ ...s.value, fontSize: 13, color: "rgba(100,149,237,0.9)" }}>Reset Cooldowns</span>
          </div>
        </div>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={cheatLoading} onClick={async () => {
            setCheatLoading(true);
            try {
              const r = await callSendCommand("reset_cooldowns", "");
              toaster.toast({ title: r.success ? "Done" : "Failed", body: r.message });
            } catch { toaster.toast({ title: "Error", body: "Could not send command" }); }
            setCheatLoading(false);
          }}>
            Reset All Cooldowns
          </ButtonItem>
        </PanelSectionRow>
      </div>

      {/* Toggle Combat */}
      <div style={s.card("rgba(231,111,81,0.2)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <span style={{ fontSize: 14, marginRight: 8 }}>⚔️</span>
            <span style={{ ...s.value, fontSize: 13, color: "#e76f51" }}>Toggle Combat</span>
          </div>
        </div>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={cheatLoading} onClick={async () => {
            setCheatLoading(true);
            try {
              const r = await callSendCommand("toggle_combat", "");
              toaster.toast({ title: r.success ? "Done" : "Failed", body: r.message });
            } catch { toaster.toast({ title: "Error", body: "Could not send command" }); }
            setCheatLoading(false);
          }}>
            Enter / Exit Combat
          </ButtonItem>
        </PanelSectionRow>
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Tab: Settings
  // -----------------------------------------------------------------------
  const SettingsTab = () => (
    <div>
      <div style={s.card()}>
        <ToggleField label="Auto-start with BG3" checked={settings.autoStart}
          onChange={(v: any) => updateSettings({ ...settings, autoStart: v })} />
      </div>

      <div style={s.card()}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <span style={s.label}>Port</span>
          <span style={s.value}>{settings.port}</span>
        </div>
        <div style={s.row()}>
          <span style={s.label}>Bridge Dir</span>
          <span style={{ ...s.value, fontSize: 10, fontFamily: "monospace", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{settings.bridgeDir}</span>
        </div>
      </div>

      <PanelSectionRow>
        <ButtonItem layout="below" onClick={async () => {
          setCheckingUpdate(true);
          try {
            const info = await callCheckUpdate();
            setUpdateInfo(info);
            if (info.update_available) toaster.toast({ title: "Update Available", body: `v${info.latest_version}` });
            else if (!info.error) toaster.toast({ title: "Up to Date", body: `v${info.current_version}` });
          } catch { toaster.toast({ title: "Error", body: "Could not check updates" }); }
          setCheckingUpdate(false);
        }} disabled={checkingUpdate}>
          {checkingUpdate ? "Checking..." : "Check for Updates"}
        </ButtonItem>
      </PanelSectionRow>

      {updateInfo?.update_available && (
        <div style={s.card("rgba(120,180,255,0.15)")}>
          <div style={{ ...s.row(), marginBottom: 4 }}>
            <span style={{ ...s.value, color: "rgba(120,180,255,0.9)", fontSize: 12 }}>Update v{updateInfo.latest_version}</span>
            <span style={s.label}>from v{updateInfo.current_version}</span>
          </div>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={async () => {
              setUpdating(true);
              try {
                const r = await callPerformUpdate(updateInfo.download_url);
                toaster.toast({ title: r.success ? "Downloaded!" : "Failed", body: r.message });
              } catch { toaster.toast({ title: "Error", body: "Download failed" }); }
              setUpdating(false);
            }} disabled={updating}>
              {updating ? "Downloading..." : "Download Update"}
            </ButtonItem>
          </PanelSectionRow>
        </div>
      )}

      <PanelSectionRow>
        <ButtonItem layout="below" onClick={async () => {
          try { const r = await callGetLog(); setLogText(r.log); } catch { setLogText("Could not read log"); }
          setShowLog(!showLog);
        }}>
          {showLog ? "Hide Log" : "View Log"}
        </ButtonItem>
      </PanelSectionRow>
      {showLog && (
        <div style={{
          ...s.card(), fontFamily: "monospace", fontSize: 10,
          color: "rgba(255,255,255,0.35)", maxHeight: 200, overflowY: "auto",
          whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.4,
        }}>
          {logText || "Loading..."}
        </div>
      )}

      <PanelSectionRow>
        <ButtonItem layout="below" onClick={() => { runDiagnostics(); setTab("setup"); }}>
          Run Setup / Diagnostics
        </ButtonItem>
      </PanelSectionRow>

      {/* ---- BG3 Launch Options (moved from Launch tab) ---- */}

      <div style={{ ...s.card(), marginTop: 12 }}>
        <div style={{ ...s.value, fontSize: 14, marginBottom: 6 }}>BG3 Launch Options</div>
        <div style={s.muted}>Required for BG3 Script Extender. Steam needs a restart after changing these.</div>
      </div>

      {/* Current status */}
      <div style={s.card(launchHasDwrite ? "rgba(82,183,136,0.2)" : "rgba(231,111,81,0.15)")}>
        <div style={{ ...s.row(), marginBottom: 6 }}>
          <div style={s.row(false)}>
            <div style={s.dot(launchHasDwrite ? "#52b788" : "#e76f51")} />
            <span style={{ ...s.value, fontSize: 12, color: launchHasDwrite ? "#52b788" : "#e76f51" }}>
              {launchHasDwrite ? "DWrite override set" : "DWrite override missing"}
            </span>
          </div>
        </div>
        {launchCurrent && (
          <div style={{ ...s.muted, fontFamily: "monospace", fontSize: 10, background: "rgba(255,255,255,0.04)", padding: "6px 8px", borderRadius: 6, wordBreak: "break-all" }}>
            {launchCurrent}
          </div>
        )}
      </div>

      {/* DWrite command (standard) */}
      <div style={s.card("rgba(120,180,255,0.12)")}>
        <div style={{ ...s.row(), marginBottom: 4 }}>
          <div style={{ ...s.label, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, flex: 1 }}>Standard (BG3SE only)</div>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(120,180,255,0.9)", background: "rgba(255,255,255,0.04)", padding: "8px 10px", borderRadius: 6, wordBreak: "break-all", lineHeight: 1.5 }}>
          {LAUNCH_CMD_DWRITE}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <ButtonItem layout="below" style={{ flex: 1, minWidth: 0 }} onClick={async () => {
              try {
                const r = await callCopyToClipboard(LAUNCH_CMD_DWRITE);
                if (r.success) {
                  setLaunchCopied("dwrite");
                  toaster.toast({ title: "Copied!", body: "Paste this in Steam launch options" });
                  setTimeout(() => setLaunchCopied(""), 2000);
                } else { toaster.toast({ title: "Copy Failed", body: r.error || "Unknown error" }); }
              } catch { toaster.toast({ title: "Copy Failed", body: "Copy manually from the text above" }); }
            }}>
              {launchCopied === "dwrite" ? "✓ Copied" : "📋 Copy"}
            </ButtonItem>
            <ButtonItem layout="below" style={{ flex: 1, minWidth: 0 }} disabled={launchLoading} onClick={async () => {
              setLaunchLoading(true);
              try {
                const r = await callSetLaunchOptions(LAUNCH_CMD_DWRITE);
                if (r.success) {
                  toaster.toast({ title: "Set!", body: "Restart Steam to apply" });
                  const info = await callGetLaunchOptions();
                  if (info.success) { setLaunchCurrent(info.current); setLaunchHasDwrite(info.has_dwrite); }
                } else { toaster.toast({ title: "Failed", body: r.message }); }
              } catch { toaster.toast({ title: "Error", body: "Could not set launch options" }); }
              setLaunchLoading(false);
            }}>
              Auto-Set
            </ButtonItem>
        </div>
      </div>

      {/* Lossless Scaling command */}
      <div style={s.card("rgba(168,85,247,0.12)")}>
        <div style={{ ...s.row(), marginBottom: 4 }}>
          <div style={{ ...s.label, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, flex: 1 }}>With Lossless Scaling (LSFG)</div>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(168,85,247,0.9)", background: "rgba(255,255,255,0.04)", padding: "8px 10px", borderRadius: 6, wordBreak: "break-all", lineHeight: 1.5 }}>
          {LAUNCH_CMD_LSFG}
        </div>
        <div style={{ ...s.muted, fontSize: 10, marginTop: 4, marginBottom: 8 }}>
          Use this if you have Lossless Scaling installed with LSFG frame generation.
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <ButtonItem layout="below" style={{ flex: 1, minWidth: 0 }} onClick={async () => {
              try {
                const r = await callCopyToClipboard(LAUNCH_CMD_LSFG);
                if (r.success) {
                  setLaunchCopied("lsfg");
                  toaster.toast({ title: "Copied!", body: "Paste this in Steam launch options" });
                  setTimeout(() => setLaunchCopied(""), 2000);
                } else { toaster.toast({ title: "Copy Failed", body: r.error || "Unknown error" }); }
              } catch { toaster.toast({ title: "Copy Failed", body: "Copy manually from the text above" }); }
            }}>
              {launchCopied === "lsfg" ? "✓ Copied" : "📋 Copy"}
            </ButtonItem>
            <ButtonItem layout="below" style={{ flex: 1, minWidth: 0 }} disabled={launchLoading} onClick={async () => {
              setLaunchLoading(true);
              try {
                const r = await callSetLaunchOptions(LAUNCH_CMD_LSFG);
                if (r.success) {
                  toaster.toast({ title: "Set!", body: "Restart Steam to apply" });
                  const info = await callGetLaunchOptions();
                  if (info.success) { setLaunchCurrent(info.current); setLaunchHasDwrite(info.has_dwrite); }
                } else { toaster.toast({ title: "Failed", body: r.message }); }
              } catch { toaster.toast({ title: "Error", body: "Could not set launch options" }); }
              setLaunchLoading(false);
            }}>
              Auto-Set
            </ButtonItem>
        </div>
      </div>

      {/* Refresh launch status */}
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={async () => {
          setLaunchLoading(true);
          try {
            const info = await callGetLaunchOptions();
            if (info.success) {
              setLaunchCurrent(info.current);
              setLaunchHasDwrite(info.has_dwrite);
              toaster.toast({ title: "Refreshed", body: info.has_dwrite ? "DWrite override active" : "DWrite override not found" });
            }
          } catch { toaster.toast({ title: "Error", body: "Could not read launch options" }); }
          setLaunchLoading(false);
        }}>
          Refresh Launch Status
        </ButtonItem>
      </PanelSectionRow>

      <div style={{ textAlign: "center", padding: "8px 0 4px", ...s.muted, fontSize: 10 }}>
        Tadpole v{diagnostics?.plugin_version || "unknown"}
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <TadpoleErrorBoundary>
      <div style={s.root}>
        {/* Tab bar */}
        <div style={s.tabRow}>
          {(["live", "setup", "cheats", "settings"] as Tab[]).map(t => (
            <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
              {t === "live" ? "Live" : t === "setup" ? "Setup" : t === "cheats" ? "Cheats" : "Settings"}
            </button>
          ))}
        </div>

        {initialLoading ? (
          <div style={{ textAlign: "center", padding: 20, opacity: 0.5, fontSize: 13 }}>Loading...</div>
        ) : (
          <>
            {tab === "live" && <LiveTab />}
            {tab === "setup" && <SetupTab />}
            {tab === "cheats" && <CheatsTab />}
            {tab === "settings" && <SettingsTab />}
          </>
        )}
      </div>
    </TadpoleErrorBoundary>
  );
};

// ---------------------------------------------------------------------------
// Shared Components
// ---------------------------------------------------------------------------

const CheckLine: FunctionComponent<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
    <div style={{
      width: 18, height: 18, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700,
      color: ok ? "#52b788" : "#e76f51",
      background: ok ? "rgba(82,183,136,0.12)" : "rgba(231,111,81,0.12)",
      border: `1px solid ${ok ? "rgba(82,183,136,0.25)" : "rgba(231,111,81,0.25)"}`,
      flexShrink: 0,
    }}>{ok ? "+" : "!"}</div>
    <span style={{ fontSize: 12, color: ok ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}>{label}</span>
  </div>
);

const HpRow: FunctionComponent<{ name: string; hp: number; maxHp: number; bold?: boolean }> = ({ name, hp, maxHp, bold }) => {
  const pct = maxHp > 0 ? Math.max(0, Math.min(hp / maxHp, 1)) : 0;
  const color = hpColor(pct);
  return (
    <div style={{ marginBottom: bold ? 6 : 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span style={{ fontSize: bold ? 12 : 11, fontWeight: bold ? 600 : 500, color: bold ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)" }}>{name}</span>
        <span style={{ fontSize: bold ? 11 : 10, color, fontWeight: 600 }}>{hp}/{maxHp}</span>
      </div>
      <div style={{ height: bold ? 6 : 4, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct * 100}%`, backgroundColor: color,
          borderRadius: 3, transition: "width 0.4s ease",
          boxShadow: pct < 0.3 ? `0 0 4px ${color}50` : "none",
        }} />
      </div>
    </div>
  );
};

function hpColor(pct: number): string {
  return pct > 0.6 ? "#52b788" : pct > 0.3 ? "#f4a261" : "#e76f51";
}

// ---------------------------------------------------------------------------
export default definePlugin(() => ({
  name: "Tadpole BG3 Companion",
  titleView: <div className={staticClasses.Title}>Tadpole</div>,
  content: <TadpolePanel />,
  icon: <FaFrog />,
  onDismount: () => {},
}));
