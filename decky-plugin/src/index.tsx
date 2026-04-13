import { definePlugin, callable, toaster } from "@decky/api";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  ToggleField,
  TextField,
  staticClasses,
} from "@decky/ui";
import { FunctionComponent, useState, useEffect, useCallback, useRef } from "react";
import { FaFrog } from "react-icons/fa";

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PluginSettings { port: number; autoStart: boolean; bridgeDir: string; }
const DEFAULT_SETTINGS: PluginSettings = { port: 3456, autoStart: true, bridgeDir: "/home/deck/tadpole/bridge" };

type Tab = "live" | "setup" | "settings";

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

const TadpolePanel: FunctionComponent = () => {
  const [settings, setSettings] = useState<PluginSettings>({ ...DEFAULT_SETTINGS });
  const [tab, setTab] = useState<Tab>("live");

  // Status
  const [bridgeRunning, setBridgeRunning] = useState(false);
  const [bridgeHealthy, setBridgeHealthy] = useState(false);
  const [bg3Running, setBg3Running] = useState(false);
  const [ip, setIp] = useState("...");
  const [connectedClients, setConnectedClients] = useState(0);
  const [gameState, setGameState] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [nodeMissing, setNodeMissing] = useState(false);

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

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartRef = useRef(false);

  // Load settings + diagnostics on mount
  useEffect(() => {
    callGetSettings().then((s: any) => { if (s && Object.keys(s).length > 0) setSettings({ ...DEFAULT_SETTINGS, ...s }); }).catch(() => {});
    runDiagnostics();
  }, []);

  const runDiagnostics = useCallback(async () => {
    try {
      const d = await callGetDiagnostics();
      setDiagnostics(d);
      setReady(d.ready);
      if (!d.ready && tab === "live") setTab("setup");
    } catch {}
  }, [tab]);

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
      } else {
        setBridgeHealthy(false);
      }
    } catch {}
  }, []);

  const updateSettings = useCallback((s: PluginSettings) => {
    setSettings(s);
    callSaveSettings(s).catch(() => {});
  }, []);

  const startBridge = useCallback(async () => {
    setLoading(true);
    try {
      const r = await callStartBridge(settings.port, settings.bridgeDir);
      toaster.toast({ title: "Tadpole", body: r.message });
    } catch { toaster.toast({ title: "Error", body: "Failed to start bridge" }); }
    setTimeout(async () => { await fetchStatus(); setLoading(false); }, 1500);
  }, [settings, fetchStatus]);

  const stopBridge = useCallback(async () => {
    setLoading(true);
    try {
      const r = await callStopBridge();
      if (r.success) toaster.toast({ title: "Tadpole", body: r.message });
    } catch { toaster.toast({ title: "Error", body: "Failed to stop" }); }
    setTimeout(async () => { await fetchStatus(); setLoading(false); }, 500);
  }, [fetchStatus]);

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    try {
      const r = await callInstallEverything();
      if (r.success) {
        toaster.toast({ title: "Setup Complete!", body: "Everything installed" });
        await runDiagnostics();
        await fetchStatus();
        if (diagnostics?.ready) setTab("live");
      } else {
        toaster.toast({ title: "Setup Failed", body: `Failed at ${r.step || "unknown"}` });
      }
    } catch { toaster.toast({ title: "Error", body: "Installation failed" }); }
    setInstalling(false);
  }, [runDiagnostics, fetchStatus, diagnostics]);

  // Polling
  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchStatus]);

  // Auto-start
  useEffect(() => {
    if (autoStartRef.current) return;
    if (settings.autoStart && bg3Running && !bridgeRunning && !nodeMissing) {
      autoStartRef.current = true;
      startBridge();
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

  const hpColor = (pct: number) => pct > 0.6 ? "#52b788" : pct > 0.3 ? "#f4a261" : "#e76f51";
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
            <div style={s.dot(bridgeRunning && bridgeHealthy ? "#52b788" : bridgeRunning ? "#f4a261" : "#e76f51")} />
            <span style={{ ...s.value, fontSize: 11, color: bridgeRunning && bridgeHealthy ? "#52b788" : bridgeRunning ? "#f4a261" : "#e76f51" }}>
              {bridgeRunning && bridgeHealthy ? "Online" : bridgeRunning ? "Unhealthy" : "Offline"}
            </span>
          </div>
          {bridgeRunning && connectedClients > 0 && (
            <span style={s.pill("#52b788")}>{connectedClients} phone{connectedClients !== 1 ? "s" : ""}</span>
          )}
          {bg3Running && (
            <span style={s.pill("rgba(120,180,255,0.8)")}>BG3</span>
          )}
        </div>
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
          <div style={{ ...s.muted, marginBottom: 4, textAlign: "center" }}>Open on phone: tadpole-omega.vercel.app</div>
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
                toaster.toast({ title: r.success ? "Updated!" : "Failed", body: r.message });
              } catch { toaster.toast({ title: "Error", body: "Update failed" }); }
              setUpdating(false);
            }} disabled={updating}>
              {updating ? "Updating..." : "Install Update"}
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

      <div style={{ textAlign: "center", padding: "8px 0 4px", ...s.muted, fontSize: 10 }}>
        Tadpole v0.7.0
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div style={s.root}>
      {/* Tab bar */}
      <div style={s.tabRow}>
        {(["live", "setup", "settings"] as Tab[]).map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {t === "live" ? "Live" : t === "setup" ? "Setup" : "Settings"}
          </button>
        ))}
      </div>

      {tab === "live" && <LiveTab />}
      {tab === "setup" && <SetupTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
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
