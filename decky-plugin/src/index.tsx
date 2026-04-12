import { definePlugin, callable, toaster } from "@decky/api";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  ToggleField,
  TextField,
  staticClasses,
} from "@decky/ui";
import { VFC, useState, useEffect, useCallback, useRef } from "react";
import { FaFrog } from "react-icons/fa";

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const C = {
  bg: "#1a1a2e", surface: "#16213e", surfaceLight: "#1f2b47",
  border: "#2a3a5c", text: "#e0e0e0", textDim: "#7a8ba8",
  accent: "#48bfe3", green: "#52b788", greenGlow: "rgba(82,183,136,0.5)",
  red: "#e76f51", orange: "#f4a261", gold: "#f4a261", blue: "#3b82f6",
};

// ---------------------------------------------------------------------------
// Callables
// ---------------------------------------------------------------------------

const callGetStatus = callable<[], {
  bridge_running: boolean; bg3_running: boolean; ip: string;
  connected_clients: number; game_state: any; recent_events: any[];
  node_installed: boolean;
}>("get_status");

const callGetDiagnostics = callable<[], {
  node_installed: boolean; node_version: string | null;
  node_binary: string; bridge_found: boolean; bridge_path: string | null;
  lua_installed: boolean; bg3_running: boolean; ip: string;
  bg3_mod_dir: string | null; ready: boolean; paths_checked: Record<string, { path: string; exists: boolean }>;
  plugin_version: string; home: string; decky_user_home: string;
}>("get_diagnostics");

const callCheckHealth = callable<[], { healthy: boolean }>("check_health");

const callStartBridge = callable<[number, string], { success: boolean; message: string }>("start_bridge");
const callStopBridge = callable<[], { success: boolean; message: string }>("stop_bridge");
const callGetSettings = callable<[], any>("get_settings");
const callSaveSettings = callable<[any], { success: boolean }>("save_settings");

// Install/update callables
const callInstallEverything = callable<[], { success: boolean; results?: any; step?: string }>("install_everything");
const callInstallNode = callable<[], { success: boolean; message: string }>("install_node");
const callInstallBridge = callable<[], { success: boolean; message: string; path?: string }>("install_bridge");
const callInstallLuaMod = callable<[], { success: boolean; message: string }>("install_lua_mod");
const callCheckUpdate = callable<[], {
  update_available: boolean; current_version: string;
  latest_version: string; download_url?: string; release_notes?: string; error?: string;
}>("check_update");
const callPerformUpdate = callable<[string], { success: boolean; message: string }>("perform_update");
const callGetLog = callable<[], { log: string }>("get_log");
const callGetManualCommands = callable<[], { commands: Array<{ label: string; command: string; category: string }> }>("get_manual_commands");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PluginSettings { port: number; autoStart: boolean; bridgeDir: string; }
const DEFAULT_SETTINGS: PluginSettings = { port: 3456, autoStart: true, bridgeDir: "/home/deck/tadpole/bridge" };

const EVENT_ICONS: Record<string, string> = {
  combat_started: "!", combat_ended: "OK", area_changed: ">",
  hp_critical: "!!", dialog_started: "D", dialog_ended: "D",
  level_up: "^", party_changed: "+", death: "X", rest: "R", loot: "$",
};

// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------

const StatusBadge: VFC<{ label: string; active: boolean; activeColor?: string; inactiveColor?: string }> = ({
  label, active, activeColor = C.green, inactiveColor = C.red,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{
      width: 8, height: 8, borderRadius: "50%",
      backgroundColor: active ? activeColor : inactiveColor,
      boxShadow: active ? `0 0 8px ${activeColor}80` : `0 0 4px ${inactiveColor}50`,
    }} />
    <span style={{ fontSize: 13, fontWeight: 600, color: active ? activeColor : inactiveColor }}>{label}</span>
  </div>
);

const Pill: VFC<{ label: string; color?: string }> = ({ label, color = C.accent }) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", borderRadius: 10,
    fontSize: 10, fontWeight: 600, color, backgroundColor: `${color}18`, border: `1px solid ${color}30`,
  }}>{label}</span>
);

const StatRow: VFC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = C.textDim }) => (
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
  const glow = pct > 0.6 ? C.greenGlow : pct > 0.3 ? "none" : "rgba(231,111,81,0.5)";
  return (
    <div style={{ marginBottom: isHost ? 8 : 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: isHost ? 13 : 11, fontWeight: isHost ? 600 : 500, color: isHost ? C.text : C.textDim }}>{name}</span>
        <span style={{ fontSize: isHost ? 12 : 10, color, fontWeight: 600 }}>{hp}/{maxHp}</span>
      </div>
      <div style={{ height: isHost ? 8 : 5, borderRadius: isHost ? 4 : 3, backgroundColor: C.surface, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct * 100}%`, backgroundColor: color,
          borderRadius: isHost ? 4 : 3, transition: "width 0.4s ease",
          boxShadow: glow !== "none" ? `0 0 6px ${glow}` : "none",
        }} />
      </div>
    </div>
  );
};

const Divider = () => <div style={{ height: 1, backgroundColor: C.border, margin: "8px 0", opacity: 0.5 }} />;

const SectionHeader: VFC<{ title: string; icon?: string }> = ({ title, icon }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 2 }}>
    {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{title}
  </div>
);

const CheckItem: VFC<{ label: string; ok: boolean; detail?: string }> = ({ label, ok, detail }) => (
  <div style={{
    padding: "8px 12px", borderRadius: 8, marginBottom: 4,
    backgroundColor: ok ? `${C.green}10` : `${C.red}10`,
    border: `1px solid ${ok ? `${C.green}30` : `${C.red}30`}`,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14 }}>{ok ? "[OK]" : "[X]"}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: ok ? C.green : C.red }}>{label}</span>
    </div>
    {detail && <div style={{ fontSize: 11, color: C.textDim, marginLeft: 22, marginTop: 2 }}>{detail}</div>}
  </div>
);

// Copyable command block - shows command text that can be selected/copied
const CopyableCommand: VFC<{ label: string; command: string; category: string }> = ({ label, command, category }) => {
  const borderColor = category === "install" ? C.blue : category === "debug" ? C.orange : C.textDim;
  return (
    <div style={{
      padding: "8px 10px", borderRadius: 8, marginBottom: 6,
      backgroundColor: C.surface, border: `1px solid ${borderColor}40`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }}>{label}</div>
      <div style={{
        padding: "6px 8px", borderRadius: 4, backgroundColor: "#0d0d1a",
        fontFamily: "monospace", fontSize: 10, color: C.accent,
        whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.4,
        border: `1px solid ${C.border}`, userSelect: "all",
      }}>{command}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Setup Wizard
// ---------------------------------------------------------------------------

const SetupWizard: VFC<{
  diagnostics: any;
  onInstall: () => void;
  installing: boolean;
  installStep: string;
  onClose: () => void;
  manualCommands: Array<{ label: string; command: string; category: string }>;
  showManual: boolean;
  onToggleManual: () => void;
}> = ({ diagnostics, onInstall, installing, installStep, onClose, manualCommands, showManual, onToggleManual }) => (
  <div>
    <SectionHeader title="Setup Check" />

    <CheckItem label={diagnostics.node_installed ? `Node.js ${diagnostics.node_version || ""}` : "Node.js"} ok={diagnostics.node_installed}
      detail={diagnostics.node_installed ? `Binary: ${diagnostics.node_binary}` : "Will download prebuilt binary (no sudo)"} />
    <CheckItem label="Bridge Server" ok={diagnostics.bridge_found}
      detail={diagnostics.bridge_found ? diagnostics.bridge_path : "Will download from GitHub"} />
    <CheckItem label="BG3 Lua Mod" ok={diagnostics.lua_installed}
      detail={diagnostics.lua_installed ? "TadpoleCompanion.lua found" : diagnostics.bg3_mod_dir ? "Will install to BG3 LuaScripts folder" : "BG3 ScriptExtender not found"} />

    {diagnostics.ready ? (
      <PanelSectionRow>
        <div style={{
          padding: "8px 12px", borderRadius: 8, backgroundColor: `${C.green}15`,
          border: `1px solid ${C.green}30`, textAlign: "center", marginTop: 4,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>All set! Ready to play.</span>
        </div>
      </PanelSectionRow>
    ) : (
      <>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={onInstall} disabled={installing}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {installing ? "..." : ">"}
              {installing
                ? installStep === "node" ? "Installing Node.js..."
                  : installStep === "bridge" ? "Downloading bridge..."
                  : "Installing Lua mod..."
                : "Install Everything (Auto)"}
            </span>
          </ButtonItem>
        </PanelSectionRow>

        {/* Manual commands fallback */}
        {manualCommands.filter(c => c.category === "install").length > 0 && (
          <>
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={onToggleManual}>
                {showManual ? "Hide Manual Commands" : "Show Manual Install Commands"}
              </ButtonItem>
            </PanelSectionRow>
            {showManual && (
              <PanelSectionRow>
                <div style={{
                  padding: "8px 10px", borderRadius: 8, backgroundColor: "#0d0d1a",
                  border: `1px solid ${C.border}`, marginBottom: 4,
                }}>
                  <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6, lineHeight: 1.3 }}>
                    If auto-install fails, switch to Desktop Mode, open a terminal, and run these commands:
                  </div>
                  {manualCommands.filter(c => c.category === "install").map((cmd, i) => (
                    <CopyableCommand key={i} label={cmd.label} command={cmd.command} category={cmd.category} />
                  ))}
                </div>
              </PanelSectionRow>
            )}
          </>
        )}
      </>
    )}

    <PanelSectionRow>
      <ButtonItem layout="below" onClick={onClose}>
        {diagnostics.ready ? "Close" : "Skip Setup"}
      </ButtonItem>
    </PanelSectionRow>
  </div>
);

// ---------------------------------------------------------------------------
// Diagnostics Detail Panel
// ---------------------------------------------------------------------------

const DiagnosticsPanel: VFC<{ diagnostics: any; onRefresh: () => void }> = ({ diagnostics, onRefresh }) => (
  <div>
    <SectionHeader title="Diagnostics" />
    <PanelSectionRow>
      <ButtonItem layout="below" onClick={onRefresh}>Refresh</ButtonItem>
    </PanelSectionRow>

    {/* Version info */}
    <div style={{ padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface, border: `1px solid ${C.border}`, marginBottom: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }}>Version</div>
      <StatRow label="Plugin" value={diagnostics.plugin_version || "?"} color={C.accent} />
      <StatRow label="Node.js" value={diagnostics.node_version || "NOT INSTALLED"} color={diagnostics.node_version ? C.green : C.red} />
      <StatRow label="Home Dir" value={diagnostics.home || "?"} color={C.textDim} />
      <StatRow label="Decky User" value={diagnostics.decky_user_home || "?"} color={C.textDim} />
      <StatRow label="LAN IP" value={diagnostics.ip || "?"} color={C.accent} />
    </div>

    {/* Paths checked */}
    {diagnostics.paths_checked && (
      <div style={{ padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface, border: `1px solid ${C.border}`, marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }}>Paths</div>
        {Object.entries(diagnostics.paths_checked).map(([key, info]: [string, any]) => (
          <div key={key} style={{ padding: "3px 0", display: "flex", alignItems: "flex-start", gap: 6 }}>
            <span style={{ fontSize: 11, color: info.exists ? C.green : C.red, fontWeight: 600, flexShrink: 0 }}>
              {info.exists ? "[OK]" : "[X]"}
            </span>
            <div>
              <div style={{ fontSize: 10, color: C.textDim }}>{key.replace(/_/g, " ")}</div>
              <div style={{ fontSize: 9, color: C.textDim, fontFamily: "monospace", wordBreak: "break-all" }}>{info.path}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

const TadpolePanel: VFC = () => {
  const [settings, setSettings] = useState<PluginSettings>({ ...DEFAULT_SETTINGS });
  const [bridgeRunning, setBridgeRunning] = useState(false);
  const [bridgeHealthy, setBridgeHealthy] = useState(false);
  const [bg3Running, setBg3Running] = useState(false);
  const [ip, setIp] = useState("...");
  const [connectedClients, setConnectedClients] = useState(0);
  const [gameState, setGameState] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [nodeMissing, setNodeMissing] = useState(false);

  // Setup
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installStep, setInstallStep] = useState("");
  const [manualCommands, setManualCommands] = useState<Array<{ label: string; command: string; category: string }>>([]);
  const [showManual, setShowManual] = useState(false);

  // Update
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  // Log viewer
  const [showLog, setShowLog] = useState(false);
  const [logText, setLogText] = useState("");

  // Diagnostics panel
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleViewLog = useCallback(async () => {
    try {
      const r = await callGetLog();
      setLogText(r.log);
      setShowLog(!showLog);
    } catch { setLogText("Could not read log"); setShowLog(true); }
  }, [showLog]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartRef = useRef(false);
  const prevClientsRef = useRef(0);
  const prevEventsRef = useRef(0);

  // Load settings + diagnostics on mount
  useEffect(() => {
    callGetSettings().then(s => { if (s && Object.keys(s).length > 0) setSettings({ ...DEFAULT_SETTINGS, ...s }); }).catch(() => {});
    runDiagnostics();
  }, []);

  const runDiagnostics = useCallback(async () => {
    try {
      const d = await callGetDiagnostics();
      setDiagnostics(d);
      if (d && !d.ready && !showSetup) setShowSetup(true);
    } catch {}
    // Also fetch manual commands
    try {
      const mc = await callGetManualCommands();
      setManualCommands(mc.commands || []);
    } catch {}
  }, [showSetup]);

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

  // One-click install
  const handleInstallEverything = useCallback(async () => {
    setInstalling(true);
    setInstallStep("node");
    try {
      const r = await callInstallEverything();
      if (r.success) {
        toaster.toast({ title: "Setup Complete!", body: "Everything installed successfully" });
        setShowSetup(false);
        await runDiagnostics();
        await fetchStatus();
      } else {
        toaster.toast({ title: "Setup Failed", body: `Failed at ${r.step || "unknown step"}` });
        // Refresh manual commands after failure so user sees what to do
        try {
          const mc = await callGetManualCommands();
          setManualCommands(mc.commands || []);
        } catch {}
      }
    } catch { toaster.toast({ title: "Error", body: "Installation failed" }); }
    setInstalling(false);
    setInstallStep("");
  }, [runDiagnostics, fetchStatus]);

  // Check for updates
  const handleCheckUpdate = useCallback(async () => {
    setCheckingUpdate(true);
    try {
      const info = await callCheckUpdate();
      setUpdateInfo(info);
      if (info.update_available) {
        toaster.toast({ title: "Update Available", body: `v${info.latest_version} is out!` });
      } else if (!info.error) {
        toaster.toast({ title: "Up to Date", body: `v${info.current_version} is the latest` });
      }
    } catch { toaster.toast({ title: "Error", body: "Could not check for updates" }); }
    setCheckingUpdate(false);
  }, []);

  // Perform update
  const handlePerformUpdate = useCallback(async (url: string) => {
    setUpdating(true);
    try {
      const r = await callPerformUpdate(url);
      if (r.success) {
        toaster.toast({ title: "Updated!", body: r.message });
      } else {
        toaster.toast({ title: "Update Failed", body: r.message });
      }
    } catch { toaster.toast({ title: "Error", body: "Update failed" }); }
    setUpdating(false);
  }, []);

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

  // Phone toasts
  useEffect(() => {
    if (connectedClients > prevClientsRef.current && prevClientsRef.current === 0)
      toaster.toast({ title: "Phone Connected", body: `Phone connected (${connectedClients})` });
    else if (connectedClients === 0 && prevClientsRef.current > 0)
      toaster.toast({ title: "Phone Disconnected", body: "No phones connected" });
    prevClientsRef.current = connectedClients;
  }, [connectedClients]);

  // Event toasts
  useEffect(() => {
    if (recentEvents.length <= prevEventsRef.current) { prevEventsRef.current = recentEvents.length; return; }
    for (const evt of recentEvents.slice(prevEventsRef.current)) {
      if (evt.type === "combat_started") toaster.toast({ title: "Combat!", body: "Fight!" });
      else if (evt.type === "death") toaster.toast({ title: "Down!", body: evt.detail || "Someone fell!" });
      else if (evt.type === "level_up") toaster.toast({ title: "Level Up!", body: evt.detail || "" });
    }
    prevEventsRef.current = recentEvents.length;
  }, [recentEvents]);

  const totalHp = (() => {
    let c = 0, m = 0;
    if (gameState?.host?.maxHp > 0) { c += gameState.host.hp; m += gameState.host.maxHp; }
    gameState?.party?.forEach((p: any) => { if (p.maxHp > 0) { c += p.hp; m += p.maxHp; } });
    return { c, m };
  })();

  return (
    <div style={{ padding: "4px 0" }}>
      {/* -- Setup Wizard -- */}
      {showSetup && diagnostics && (
        <PanelSection title="">
          <SetupWizard
            diagnostics={diagnostics}
            onInstall={handleInstallEverything}
            installing={installing}
            installStep={installStep}
            onClose={() => setShowSetup(false)}
            manualCommands={manualCommands}
            showManual={showManual}
            onToggleManual={() => setShowManual(!showManual)}
          />
        </PanelSection>
      )}

      {/* -- First run welcome (no setup shown yet) -- */}
      {!showSetup && diagnostics && !diagnostics.ready && (
        <PanelSection title="">
          <PanelSectionRow>
            <div style={{
              padding: "12px", borderRadius: 10, backgroundColor: C.surface,
              border: `1px solid ${C.border}`, textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: C.accent }}>TADPOLE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Welcome to Tadpole!</div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>
                Let's set up everything you need.
              </div>
              <ButtonItem layout="below" onClick={() => { runDiagnostics(); setShowSetup(true); }}>
                One-Click Setup
              </ButtonItem>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* -- Connection -- */}
      {!showSetup && (
        <PanelSection title="">
          <SectionHeader title="Connection" />
          <PanelSectionRow>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <StatusBadge
                label={bridgeRunning ? (bridgeHealthy ? "Bridge Active" : "Bridge (unhealthy)") : "Bridge Offline"}
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
                textAlign: "center", border: `1px solid ${C.border}`,
              }}>{ip}:{settings.port}</div>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <ButtonItem layout="below" disabled={loading || nodeMissing} onClick={bridgeRunning ? stopBridge : startBridge}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {loading ? "..." : bridgeRunning ? "[Stop]" : "[Start]"}
                {loading ? "Working..." : bridgeRunning ? "Stop Bridge" : "Start Bridge"}
              </span>
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* -- Game -- */}
      {!showSetup && (
        <PanelSection title="">
          <SectionHeader title="Game" />
          <PanelSectionRow>
            <StatusBadge label={bg3Running ? "BG3 Running" : "BG3 Not Detected"} active={bg3Running} activeColor={C.accent} inactiveColor={C.textDim} />
          </PanelSectionRow>
          {!bg3Running && (
            <PanelSectionRow>
              <div style={{
                padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface,
                fontSize: 11, color: C.textDim, textAlign: "center", border: `1px solid ${C.border}`,
              }}>
                {bridgeRunning ? "Bridge ready -- launch BG3 to connect" : "Start the bridge, then launch BG3"}
              </div>
            </PanelSectionRow>
          )}
        </PanelSection>
      )}

      {/* -- Live Game -- */}
      {gameState && bg3Running && !showSetup && (
        <PanelSection title="">
          <SectionHeader title="Live" />
          <PanelSectionRow>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              {gameState.area && <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{gameState.area}</span>}
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
              {typeof gameState.gold === "number" && <StatRow label="Gold" value={`Gold: ${gameState.gold}`} color={C.gold} />}
              {totalHp.m > 0 && <StatRow label="Party HP" value={`${totalHp.c}/${totalHp.m}`} color={totalHp.c / totalHp.m > 0.5 ? C.green : C.red} />}
              {gameState.party && <StatRow label="Party" value={`${gameState.party.length + 1} members`} color={C.accent} />}
            </div>
          </PanelSectionRow>
          <Divider />
          {gameState.host?.maxHp > 0 && (
            <PanelSectionRow><HPBar name={gameState.host.name || "Host"} hp={gameState.host.hp} maxHp={gameState.host.maxHp} isHost /></PanelSectionRow>
          )}
          {gameState.party?.length > 0 && (
            <PanelSectionRow>
              <div style={{ padding: "2px 0" }}>
                {gameState.party.map((m: any, i: number) => m.maxHp > 0 ? <HPBar key={m.guid || i} name={m.name} hp={m.hp} maxHp={m.maxHp} /> : null)}
              </div>
            </PanelSectionRow>
          )}
          {recentEvents.length > 0 && (
            <>
              <Divider />
              <PanelSectionRow>
                <div style={{ padding: "4px 0" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Recent</div>
                  {recentEvents.slice(-5).reverse().map((evt: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                      <span>{EVENT_ICONS[evt.type] || "-"}</span>
                      <span style={{ color: C.textDim }}>{evt.type.replace(/_/g, " ")}{evt.detail ? ` -- ${evt.detail}` : ""}</span>
                    </div>
                  ))}
                </div>
              </PanelSectionRow>
            </>
          )}
        </PanelSection>
      )}

      {/* -- Phone App -- */}
      {!showSetup && (
        <PanelSection title="">
          <SectionHeader title="Phone App" />
          <PanelSectionRow>
            <div style={{
              padding: "10px 12px", borderRadius: 8, backgroundColor: C.surface, border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>Open on your phone:</div>
              <div style={{ fontSize: 13, color: C.accent, fontWeight: 600, fontFamily: "monospace", marginBottom: 8 }}>
                https://tadpole-omega.vercel.app
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>Enter this IP:</div>
              <div style={{
                fontSize: 14, color: C.text, fontWeight: 700, fontFamily: "monospace",
                padding: "6px 10px", backgroundColor: C.surfaceLight, borderRadius: 6,
                textAlign: "center", border: `1px solid ${C.border}`,
              }}>{ip}:{settings.port}</div>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* -- Settings -- */}
      <PanelSection title="">
        <SectionHeader title="Settings" />

        <PanelSectionRow>
          <ToggleField label="Auto-start with BG3" checked={settings.autoStart}
            onChange={(v: any) => updateSettings({ ...settings, autoStart: v })} />
        </PanelSectionRow>

        {/* Update checker */}
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleCheckUpdate} disabled={checkingUpdate}>
            {checkingUpdate ? "Checking..." : "Check for Updates"}
          </ButtonItem>
        </PanelSectionRow>

        {updateInfo?.update_available && (
          <PanelSectionRow>
            <div style={{
              padding: "10px 12px", borderRadius: 8,
              backgroundColor: `${C.blue}15`, border: `1px solid ${C.blue}30`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.blue, marginBottom: 4 }}>
                Update: v{updateInfo.latest_version}
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8 }}>
                Current: v{updateInfo.current_version}
              </div>
              <ButtonItem layout="below" onClick={() => handlePerformUpdate(updateInfo.download_url)} disabled={updating}>
                {updating ? "Updating..." : "Install Update"}
              </ButtonItem>
            </div>
          </PanelSectionRow>
        )}

        {/* Re-run setup */}
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => { runDiagnostics(); setShowSetup(true); }}>
            Run Setup / Diagnostics
          </ButtonItem>
        </PanelSectionRow>

        {/* Diagnostics detail */}
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => setShowDiagnostics(!showDiagnostics)}>
            {showDiagnostics ? "Hide Diagnostics" : "Show Diagnostics"}
          </ButtonItem>
        </PanelSectionRow>
        {showDiagnostics && diagnostics && (
          <PanelSectionRow>
            <DiagnosticsPanel diagnostics={diagnostics} onRefresh={runDiagnostics} />
          </PanelSectionRow>
        )}

        {/* Individual install buttons (advanced) */}
        {showSettings && (
          <>
            <PanelSectionRow><ButtonItem layout="below" onClick={async () => { const r = await callInstallNode(); toaster.toast({ title: "Node.js", body: r.message }); }}>Install Node.js</ButtonItem></PanelSectionRow>
            <PanelSectionRow><ButtonItem layout="below" onClick={async () => { const r = await callInstallBridge(); toaster.toast({ title: "Bridge", body: r.message }); }}>Install Bridge Server</ButtonItem></PanelSectionRow>
            <PanelSectionRow><ButtonItem layout="below" onClick={async () => { const r = await callInstallLuaMod(); toaster.toast({ title: "Lua Mod", body: r.message }); }}>Install BG3 Mod</ButtonItem></PanelSectionRow>
            <PanelSectionRow>
              <TextField label="Bridge Port" value={String(settings.port)}
                onChange={(v: any) => { const n = parseInt(v, 10); if (!isNaN(n) && n > 0) updateSettings({ ...settings, port: n }); }} />
            </PanelSectionRow>
            <PanelSectionRow>
              <TextField label="Bridge Directory" value={settings.bridgeDir}
                onChange={(v: any) => updateSettings({ ...settings, bridgeDir: v })} />
            </PanelSectionRow>
          </>
        )}

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? "Hide Advanced" : "Show Advanced"}
          </ButtonItem>
        </PanelSectionRow>

        {/* Log viewer */}
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleViewLog}>
            {showLog ? "Hide Log" : "View Log"}
          </ButtonItem>
        </PanelSectionRow>
        {showLog && (
          <PanelSectionRow>
            <div style={{
              padding: "8px 10px", borderRadius: 8, backgroundColor: "#0d0d1a",
              border: `1px solid ${C.border}`, fontFamily: "monospace",
              fontSize: 10, color: C.textDim, maxHeight: 250, overflowY: "auto",
              whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.4,
            }}>
              {logText || "Loading..."}
            </div>
          </PanelSectionRow>
        )}

        {/* Manual commands (always visible in settings) */}
        {manualCommands.length > 0 && (
          <>
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={() => setShowManual(!showManual)}>
                {showManual ? "Hide Terminal Commands" : "Show Terminal Commands"}
              </ButtonItem>
            </PanelSectionRow>
            {showManual && (
              <PanelSectionRow>
                <div style={{
                  padding: "8px 10px", borderRadius: 8, backgroundColor: "#0d0d1a",
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6, lineHeight: 1.3 }}>
                    Switch to Desktop Mode, open a terminal, and run these:
                  </div>
                  {manualCommands.map((cmd, i) => (
                    <CopyableCommand key={i} label={cmd.label} command={cmd.command} category={cmd.category} />
                  ))}
                </div>
              </PanelSectionRow>
            )}
          </>
        )}

        <PanelSectionRow>
          <div style={{ textAlign: "center", fontSize: 10, color: C.textDim, opacity: 0.5, padding: "8px 0 4px" }}>
            Tadpole v0.5.0
          </div>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
};

// ---------------------------------------------------------------------------
export default definePlugin(() => ({
  name: "Tadpole BG3 Companion",
  titleView: <div className={staticClasses.Title}>Tadpole BG3 Companion</div>,
  content: <TadpolePanel />,
  icon: <FaFrog />,
  onDismount: () => {},
}));
