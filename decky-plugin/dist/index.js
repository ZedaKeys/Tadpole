const manifest = {"name":"Tadpole BG3 Companion"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const toaster = api.toaster;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var {
        attr,
        size,
        title
      } = props,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaFrog (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M446.53 97.43C439.67 60.23 407.19 32 368 32c-39.23 0-71.72 28.29-78.54 65.54C126.75 112.96-.5 250.12 0 416.98.11 451.9 29.08 480 64 480h304c8.84 0 16-7.16 16-16 0-17.67-14.33-32-32-32h-79.49l35.8-48.33c24.14-36.23 10.35-88.28-33.71-106.6-23.89-9.93-51.55-4.65-72.24 10.88l-32.76 24.59c-7.06 5.31-17.09 3.91-22.41-3.19-5.3-7.08-3.88-17.11 3.19-22.41l34.78-26.09c36.84-27.66 88.28-27.62 125.13 0 10.87 8.15 45.87 39.06 40.8 93.21L469.62 480H560c8.84 0 16-7.16 16-16 0-17.67-14.33-32-32-32h-53.63l-98.52-104.68 154.44-86.65A58.16 58.16 0 0 0 576 189.94c0-21.4-11.72-40.95-30.48-51.23-40.56-22.22-98.99-41.28-98.99-41.28zM368 136c-13.26 0-24-10.75-24-24 0-13.26 10.74-24 24-24 13.25 0 24 10.74 24 24 0 13.25-10.75 24-24 24z"},"child":[]}]})(props);
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const C = {
    surface: "#16213e", surfaceLight: "#1f2b47",
    border: "#2a3a5c", text: "#e0e0e0", textDim: "#7a8ba8",
    accent: "#48bfe3", green: "#52b788", greenGlow: "rgba(82,183,136,0.5)",
    red: "#e76f51", orange: "#f4a261", gold: "#f4a261", blue: "#3b82f6",
};
// ---------------------------------------------------------------------------
// Callables
// ---------------------------------------------------------------------------
const callGetStatus = callable("get_status");
const callGetDiagnostics = callable("get_diagnostics");
const callCheckHealth = callable("check_health");
const callStartBridge = callable("start_bridge");
const callStopBridge = callable("stop_bridge");
const callGetSettings = callable("get_settings");
const callSaveSettings = callable("save_settings");
// Install/update callables
const callInstallEverything = callable("install_everything");
const callInstallNode = callable("install_node");
const callInstallBridge = callable("install_bridge");
const callInstallLuaMod = callable("install_lua_mod");
const callInstallBg3se = callable("install_bg3se");
const callCheckUpdate = callable("check_update");
const callPerformUpdate = callable("perform_update");
const callGetLog = callable("get_log");
const callGetManualCommands = callable("get_manual_commands");
const DEFAULT_SETTINGS = { port: 3456, autoStart: true, bridgeDir: "/home/deck/tadpole/bridge" };
const EVENT_ICONS = {
    combat_started: "!", combat_ended: "OK", area_changed: ">",
    hp_critical: "!!", dialog_started: "D", dialog_ended: "D",
    level_up: "^", party_changed: "+", death: "X", rest: "R", loot: "$",
};
// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------
const StatusBadge = ({ label, active, activeColor = C.green, inactiveColor = C.red, }) => (SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [SP_JSX.jsx("div", { style: {
                width: 8, height: 8, borderRadius: "50%",
                backgroundColor: active ? activeColor : inactiveColor,
                boxShadow: active ? `0 0 8px ${activeColor}80` : `0 0 4px ${inactiveColor}50`,
            } }), SP_JSX.jsx("span", { style: { fontSize: 13, fontWeight: 600, color: active ? activeColor : inactiveColor }, children: label })] }));
const Pill = ({ label, color = C.accent }) => (SP_JSX.jsx("span", { style: {
        display: "inline-block", padding: "2px 8px", borderRadius: 10,
        fontSize: 10, fontWeight: 600, color, backgroundColor: `${color}18`, border: `1px solid ${color}30`,
    }, children: label }));
const StatRow = ({ label, value, color = C.textDim }) => (SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }, children: [SP_JSX.jsx("span", { style: { fontSize: 12, color: C.textDim }, children: label }), SP_JSX.jsx("span", { style: { fontSize: 13, color, fontWeight: 600 }, children: value })] }));
const HPBar = ({ name, hp, maxHp, isHost = false, }) => {
    const pct = maxHp > 0 ? Math.max(0, Math.min(hp / maxHp, 1)) : 0;
    const color = pct > 0.6 ? C.green : pct > 0.3 ? C.orange : C.red;
    const glow = pct > 0.6 ? C.greenGlow : pct > 0.3 ? "none" : "rgba(231,111,81,0.5)";
    return (SP_JSX.jsxs("div", { style: { marginBottom: isHost ? 8 : 5 }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }, children: [SP_JSX.jsx("span", { style: { fontSize: isHost ? 13 : 11, fontWeight: isHost ? 600 : 500, color: isHost ? C.text : C.textDim }, children: name }), SP_JSX.jsxs("span", { style: { fontSize: isHost ? 12 : 10, color, fontWeight: 600 }, children: [hp, "/", maxHp] })] }), SP_JSX.jsx("div", { style: { height: isHost ? 8 : 5, borderRadius: isHost ? 4 : 3, backgroundColor: C.surface, overflow: "hidden" }, children: SP_JSX.jsx("div", { style: {
                        height: "100%", width: `${pct * 100}%`, backgroundColor: color,
                        borderRadius: isHost ? 4 : 3, transition: "width 0.4s ease",
                        boxShadow: glow !== "none" ? `0 0 6px ${glow}` : "none",
                    } }) })] }));
};
const Divider = () => SP_JSX.jsx("div", { style: { height: 1, backgroundColor: C.border, margin: "8px 0", opacity: 0.5 } });
const SectionHeader = ({ title, icon }) => (SP_JSX.jsxs("div", { style: { fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 2 }, children: [icon && SP_JSX.jsx("span", { style: { marginRight: 6 }, children: icon }), title] }));
const CheckItem = ({ label, ok, detail }) => (SP_JSX.jsxs("div", { style: {
        padding: "8px 12px", borderRadius: 8, marginBottom: 4,
        backgroundColor: ok ? `${C.green}10` : `${C.red}10`,
        border: `1px solid ${ok ? `${C.green}30` : `${C.red}30`}`,
    }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [SP_JSX.jsx("span", { style: { fontSize: 14 }, children: ok ? "[OK]" : "[X]" }), SP_JSX.jsx("span", { style: { fontSize: 12, fontWeight: 600, color: ok ? C.green : C.red }, children: label })] }), detail && SP_JSX.jsx("div", { style: { fontSize: 11, color: C.textDim, marginLeft: 22, marginTop: 2 }, children: detail })] }));
// Copyable command block - shows command text that can be selected/copied
const CopyableCommand = ({ label, command, category }) => {
    const borderColor = category === "install" ? C.blue : category === "debug" ? C.orange : C.textDim;
    return (SP_JSX.jsxs("div", { style: {
            padding: "8px 10px", borderRadius: 8, marginBottom: 6,
            backgroundColor: C.surface, border: `1px solid ${borderColor}40`,
        }, children: [SP_JSX.jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }, children: label }), SP_JSX.jsx("div", { style: {
                    padding: "6px 8px", borderRadius: 4, backgroundColor: "#0d0d1a",
                    fontFamily: "monospace", fontSize: 10, color: C.accent,
                    whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.4,
                    border: `1px solid ${C.border}`, userSelect: "all",
                }, children: command })] }));
};
// ---------------------------------------------------------------------------
// Setup Wizard
// ---------------------------------------------------------------------------
const SetupWizard = ({ diagnostics, onInstall, installing, installStep, onClose, manualCommands, showManual, onToggleManual }) => (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(SectionHeader, { title: "Setup Check" }), SP_JSX.jsx(CheckItem, { label: diagnostics.bg3se_installed ? "BG3 Script Extender" : "BG3 Script Extender", ok: diagnostics.bg3se_installed, detail: diagnostics.bg3se_installed ? "DWrite.dll found in BG3 bin" : diagnostics.bg3_install_dir ? "Will download and install DWrite.dll" : "BG3 install not found -- install game first" }), SP_JSX.jsx(CheckItem, { label: diagnostics.node_installed ? `Node.js ${diagnostics.node_version || ""}` : "Node.js", ok: diagnostics.node_installed, detail: diagnostics.node_installed ? `Binary: ${diagnostics.node_binary}` : "Will download prebuilt binary (no sudo)" }), SP_JSX.jsx(CheckItem, { label: "Bridge Server", ok: diagnostics.bridge_found, detail: diagnostics.bridge_found ? diagnostics.bridge_path : "Will download from GitHub" }), SP_JSX.jsx(CheckItem, { label: "BG3 Lua Mod", ok: diagnostics.lua_installed, detail: diagnostics.lua_installed ? "TadpoleCompanion.lua found" : diagnostics.bg3_mod_dir ? "Will install to BG3 LuaScripts folder" : "Needs BG3 Script Extender first" }), diagnostics.bg3se_installed && !diagnostics.lua_installed && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                    padding: "10px 12px", borderRadius: 8, marginTop: 4,
                    backgroundColor: `${C.orange}10`, border: `1px solid ${C.orange}30`,
                }, children: [SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, color: C.orange, marginBottom: 4 }, children: "One more step needed:" }), SP_JSX.jsxs("div", { style: { fontSize: 11, color: C.textDim, lineHeight: 1.5 }, children: ["1. Close BG3 completely if running", SP_JSX.jsx("br", {}), "2. Launch BG3 again -- Script Extender will set up its folders on first run", SP_JSX.jsx("br", {}), "3. Come back here and hit Install Everything again to add the Lua mod"] })] }) })), diagnostics.ready ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                    padding: "8px 12px", borderRadius: 8, backgroundColor: `${C.green}15`,
                    border: `1px solid ${C.green}30`, textAlign: "center", marginTop: 4,
                }, children: SP_JSX.jsx("span", { style: { fontSize: 13, fontWeight: 600, color: C.green }, children: "All set! Ready to play." }) }) })) : (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onInstall, disabled: installing, children: SP_JSX.jsxs("span", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }, children: [installing ? "..." : ">", installing
                                    ? installStep === "bg3se" ? "Installing BG3 Script Extender..."
                                        : installStep === "node" ? "Installing Node.js..."
                                            : installStep === "bridge" ? "Downloading bridge..."
                                                : "Installing Lua mod..."
                                    : "Install Everything (Auto)"] }) }) }), manualCommands.filter(c => c.category === "install").length > 0 && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onToggleManual, children: showManual ? "Hide Manual Commands" : "Show Manual Install Commands" }) }), showManual && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                                    padding: "8px 10px", borderRadius: 8, backgroundColor: "#0d0d1a",
                                    border: `1px solid ${C.border}`, marginBottom: 4,
                                }, children: [SP_JSX.jsx("div", { style: { fontSize: 10, color: C.textDim, marginBottom: 6, lineHeight: 1.3 }, children: "If auto-install fails, switch to Desktop Mode, open a terminal, and run these commands:" }), manualCommands.filter(c => c.category === "install").map((cmd, i) => (SP_JSX.jsx(CopyableCommand, { label: cmd.label, command: cmd.command, category: cmd.category }, i)))] }) }))] }))] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onClose, children: diagnostics.ready ? "Close" : "Skip Setup" }) })] }));
// ---------------------------------------------------------------------------
// Diagnostics Detail Panel
// ---------------------------------------------------------------------------
const DiagnosticsPanel = ({ diagnostics, onRefresh }) => (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(SectionHeader, { title: "Diagnostics" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onRefresh, children: "Refresh" }) }), SP_JSX.jsxs("div", { style: { padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface, border: `1px solid ${C.border}`, marginBottom: 6 }, children: [SP_JSX.jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }, children: "Version" }), SP_JSX.jsx(StatRow, { label: "Plugin", value: diagnostics.plugin_version || "?", color: C.accent }), SP_JSX.jsx(StatRow, { label: "Node.js", value: diagnostics.node_version || "NOT INSTALLED", color: diagnostics.node_version ? C.green : C.red }), SP_JSX.jsx(StatRow, { label: "Home Dir", value: diagnostics.home || "?", color: C.textDim }), SP_JSX.jsx(StatRow, { label: "Decky User", value: diagnostics.decky_user_home || "?", color: C.textDim }), SP_JSX.jsx(StatRow, { label: "LAN IP", value: diagnostics.ip || "?", color: C.accent })] }), diagnostics.paths_checked && (SP_JSX.jsxs("div", { style: { padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface, border: `1px solid ${C.border}`, marginBottom: 6 }, children: [SP_JSX.jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }, children: "Paths" }), Object.entries(diagnostics.paths_checked).map(([key, info]) => (SP_JSX.jsxs("div", { style: { padding: "3px 0", display: "flex", alignItems: "flex-start", gap: 6 }, children: [SP_JSX.jsx("span", { style: { fontSize: 11, color: info.exists ? C.green : C.red, fontWeight: 600, flexShrink: 0 }, children: info.exists ? "[OK]" : "[X]" }), SP_JSX.jsxs("div", { children: [SP_JSX.jsx("div", { style: { fontSize: 10, color: C.textDim }, children: key.replace(/_/g, " ") }), SP_JSX.jsx("div", { style: { fontSize: 9, color: C.textDim, fontFamily: "monospace", wordBreak: "break-all" }, children: info.path })] })] }, key)))] }))] }));
// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------
const TadpolePanel = () => {
    const [settings, setSettings] = SP_REACT.useState({ ...DEFAULT_SETTINGS });
    const [bridgeRunning, setBridgeRunning] = SP_REACT.useState(false);
    const [bridgeHealthy, setBridgeHealthy] = SP_REACT.useState(false);
    const [bg3Running, setBg3Running] = SP_REACT.useState(false);
    const [ip, setIp] = SP_REACT.useState("...");
    const [connectedClients, setConnectedClients] = SP_REACT.useState(0);
    const [gameState, setGameState] = SP_REACT.useState(null);
    const [recentEvents, setRecentEvents] = SP_REACT.useState([]);
    const [loading, setLoading] = SP_REACT.useState(false);
    const [showSettings, setShowSettings] = SP_REACT.useState(false);
    const [nodeMissing, setNodeMissing] = SP_REACT.useState(false);
    // Setup
    const [diagnostics, setDiagnostics] = SP_REACT.useState(null);
    const [showSetup, setShowSetup] = SP_REACT.useState(false);
    const [installing, setInstalling] = SP_REACT.useState(false);
    const [installStep, setInstallStep] = SP_REACT.useState("");
    const [manualCommands, setManualCommands] = SP_REACT.useState([]);
    const [showManual, setShowManual] = SP_REACT.useState(false);
    // Update
    const [updateInfo, setUpdateInfo] = SP_REACT.useState(null);
    const [updating, setUpdating] = SP_REACT.useState(false);
    const [checkingUpdate, setCheckingUpdate] = SP_REACT.useState(false);
    // Log viewer
    const [showLog, setShowLog] = SP_REACT.useState(false);
    const [logText, setLogText] = SP_REACT.useState("");
    // Diagnostics panel
    const [showDiagnostics, setShowDiagnostics] = SP_REACT.useState(false);
    const handleViewLog = SP_REACT.useCallback(async () => {
        try {
            const r = await callGetLog();
            setLogText(r.log);
            setShowLog(!showLog);
        }
        catch {
            setLogText("Could not read log");
            setShowLog(true);
        }
    }, [showLog]);
    const pollRef = SP_REACT.useRef(null);
    const autoStartRef = SP_REACT.useRef(false);
    const prevClientsRef = SP_REACT.useRef(0);
    const prevEventsRef = SP_REACT.useRef(0);
    // Load settings + diagnostics on mount
    SP_REACT.useEffect(() => {
        callGetSettings().then(s => { if (s && Object.keys(s).length > 0)
            setSettings({ ...DEFAULT_SETTINGS, ...s }); }).catch(() => { });
        runDiagnostics();
    }, []);
    const runDiagnostics = SP_REACT.useCallback(async () => {
        try {
            const d = await callGetDiagnostics();
            setDiagnostics(d);
            if (d && !d.ready && !showSetup)
                setShowSetup(true);
        }
        catch { }
        // Also fetch manual commands
        try {
            const mc = await callGetManualCommands();
            setManualCommands(mc.commands || []);
        }
        catch { }
    }, [showSetup]);
    const fetchStatus = SP_REACT.useCallback(async () => {
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
            }
            else {
                setBridgeHealthy(false);
            }
        }
        catch { }
    }, []);
    const updateSettings = SP_REACT.useCallback((s) => {
        setSettings(s);
        callSaveSettings(s).catch(() => { });
    }, []);
    const startBridge = SP_REACT.useCallback(async () => {
        setLoading(true);
        try {
            const r = await callStartBridge(settings.port, settings.bridgeDir);
            toaster.toast({ title: "Tadpole", body: r.message });
        }
        catch {
            toaster.toast({ title: "Error", body: "Failed to start bridge" });
        }
        setTimeout(async () => { await fetchStatus(); setLoading(false); }, 1500);
    }, [settings, fetchStatus]);
    const stopBridge = SP_REACT.useCallback(async () => {
        setLoading(true);
        try {
            const r = await callStopBridge();
            if (r.success)
                toaster.toast({ title: "Tadpole", body: r.message });
        }
        catch {
            toaster.toast({ title: "Error", body: "Failed to stop" });
        }
        setTimeout(async () => { await fetchStatus(); setLoading(false); }, 500);
    }, [fetchStatus]);
    // One-click install
    const handleInstallEverything = SP_REACT.useCallback(async () => {
        setInstalling(true);
        setInstallStep("bg3se");
        try {
            const r = await callInstallEverything();
            if (r.success) {
                toaster.toast({ title: "Setup Complete!", body: "Everything installed successfully" });
                setShowSetup(false);
                await runDiagnostics();
                await fetchStatus();
            }
            else {
                toaster.toast({ title: "Setup Failed", body: `Failed at ${r.step || "unknown step"}` });
                // Refresh manual commands after failure so user sees what to do
                try {
                    const mc = await callGetManualCommands();
                    setManualCommands(mc.commands || []);
                }
                catch { }
            }
        }
        catch {
            toaster.toast({ title: "Error", body: "Installation failed" });
        }
        setInstalling(false);
        setInstallStep("");
    }, [runDiagnostics, fetchStatus]);
    // Check for updates
    const handleCheckUpdate = SP_REACT.useCallback(async () => {
        setCheckingUpdate(true);
        try {
            const info = await callCheckUpdate();
            setUpdateInfo(info);
            if (info.update_available) {
                toaster.toast({ title: "Update Available", body: `v${info.latest_version} is out!` });
            }
            else if (!info.error) {
                toaster.toast({ title: "Up to Date", body: `v${info.current_version} is the latest` });
            }
        }
        catch {
            toaster.toast({ title: "Error", body: "Could not check for updates" });
        }
        setCheckingUpdate(false);
    }, []);
    // Perform update
    const handlePerformUpdate = SP_REACT.useCallback(async (url) => {
        setUpdating(true);
        try {
            const r = await callPerformUpdate(url);
            if (r.success) {
                toaster.toast({ title: "Updated!", body: r.message });
            }
            else {
                toaster.toast({ title: "Update Failed", body: r.message });
            }
        }
        catch {
            toaster.toast({ title: "Error", body: "Update failed" });
        }
        setUpdating(false);
    }, []);
    // Polling
    SP_REACT.useEffect(() => {
        fetchStatus();
        pollRef.current = setInterval(fetchStatus, 2000);
        return () => { if (pollRef.current)
            clearInterval(pollRef.current); };
    }, [fetchStatus]);
    // Auto-start
    SP_REACT.useEffect(() => {
        if (autoStartRef.current)
            return;
        if (settings.autoStart && bg3Running && !bridgeRunning && !nodeMissing) {
            autoStartRef.current = true;
            startBridge();
        }
    }, [bg3Running, bridgeRunning, settings.autoStart, startBridge, nodeMissing]);
    // Phone toasts
    SP_REACT.useEffect(() => {
        if (connectedClients > prevClientsRef.current && prevClientsRef.current === 0)
            toaster.toast({ title: "Phone Connected", body: `Phone connected (${connectedClients})` });
        else if (connectedClients === 0 && prevClientsRef.current > 0)
            toaster.toast({ title: "Phone Disconnected", body: "No phones connected" });
        prevClientsRef.current = connectedClients;
    }, [connectedClients]);
    // Event toasts
    SP_REACT.useEffect(() => {
        if (recentEvents.length <= prevEventsRef.current) {
            prevEventsRef.current = recentEvents.length;
            return;
        }
        for (const evt of recentEvents.slice(prevEventsRef.current)) {
            if (evt.type === "combat_started")
                toaster.toast({ title: "Combat!", body: "Fight!" });
            else if (evt.type === "death")
                toaster.toast({ title: "Down!", body: evt.detail || "Someone fell!" });
            else if (evt.type === "level_up")
                toaster.toast({ title: "Level Up!", body: evt.detail || "" });
        }
        prevEventsRef.current = recentEvents.length;
    }, [recentEvents]);
    const totalHp = (() => {
        let c = 0, m = 0;
        if (gameState?.host?.maxHp > 0) {
            c += gameState.host.hp;
            m += gameState.host.maxHp;
        }
        gameState?.party?.forEach((p) => { if (p.maxHp > 0) {
            c += p.hp;
            m += p.maxHp;
        } });
        return { c, m };
    })();
    return (SP_JSX.jsxs("div", { style: { padding: "4px 0" }, children: [showSetup && diagnostics && (SP_JSX.jsx(DFL.PanelSection, { title: "", children: SP_JSX.jsx(SetupWizard, { diagnostics: diagnostics, onInstall: handleInstallEverything, installing: installing, installStep: installStep, onClose: () => setShowSetup(false), manualCommands: manualCommands, showManual: showManual, onToggleManual: () => setShowManual(!showManual) }) })), !showSetup && diagnostics && !diagnostics.ready && (SP_JSX.jsx(DFL.PanelSection, { title: "", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                            padding: "12px", borderRadius: 10, backgroundColor: C.surface,
                            border: `1px solid ${C.border}`, textAlign: "center",
                        }, children: [SP_JSX.jsx("div", { style: { fontSize: 18, fontWeight: 700, marginBottom: 8, color: C.accent }, children: "TADPOLE" }), SP_JSX.jsx("div", { style: { fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }, children: "Welcome to Tadpole!" }), SP_JSX.jsx("div", { style: { fontSize: 12, color: C.textDim, marginBottom: 8 }, children: "Let's set up everything you need." }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => { runDiagnostics(); setShowSetup(true); }, children: "One-Click Setup" })] }) }) })), !showSetup && (SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Connection" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [SP_JSX.jsx(StatusBadge, { label: bridgeRunning ? (bridgeHealthy ? "Bridge Active" : "Bridge (unhealthy)") : "Bridge Offline", active: bridgeRunning && bridgeHealthy }), bridgeRunning && connectedClients > 0 && (SP_JSX.jsx(Pill, { label: `${connectedClients} phone${connectedClients !== 1 ? "s" : ""}`, color: C.green }))] }) }), bridgeRunning && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                                padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface,
                                fontFamily: "monospace", fontSize: 12, color: C.accent,
                                textAlign: "center", border: `1px solid ${C.border}`,
                            }, children: [ip, ":", settings.port] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: loading || nodeMissing, onClick: bridgeRunning ? stopBridge : startBridge, children: SP_JSX.jsxs("span", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }, children: [loading ? "..." : bridgeRunning ? "[Stop]" : "[Start]", loading ? "Working..." : bridgeRunning ? "Stop Bridge" : "Start Bridge"] }) }) })] })), !showSetup && (SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Game" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusBadge, { label: bg3Running ? "BG3 Running" : "BG3 Not Detected", active: bg3Running, activeColor: C.accent, inactiveColor: C.textDim }) }), !bg3Running && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                                padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface,
                                fontSize: 11, color: C.textDim, textAlign: "center", border: `1px solid ${C.border}`,
                            }, children: bridgeRunning ? "Bridge ready -- launch BG3 to connect" : "Start the bridge, then launch BG3" }) }))] })), gameState && bg3Running && !showSetup && (SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Live" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }, children: [gameState.area && SP_JSX.jsx("span", { style: { fontSize: 13, fontWeight: 600, color: C.text }, children: gameState.area }), SP_JSX.jsxs("div", { style: { display: "flex", gap: 6 }, children: [gameState.inCombat && SP_JSX.jsx(Pill, { label: "Combat", color: C.red }), gameState.inDialog && SP_JSX.jsx(Pill, { label: "Dialog", color: C.orange }), !gameState.inCombat && !gameState.inDialog && SP_JSX.jsx(Pill, { label: "Explore", color: C.green })] })] }) }), SP_JSX.jsx(Divider, {}), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", gap: 12 }, children: [typeof gameState.gold === "number" && SP_JSX.jsx(StatRow, { label: "Gold", value: `Gold: ${gameState.gold}`, color: C.gold }), totalHp.m > 0 && SP_JSX.jsx(StatRow, { label: "Party HP", value: `${totalHp.c}/${totalHp.m}`, color: totalHp.c / totalHp.m > 0.5 ? C.green : C.red }), gameState.party && SP_JSX.jsx(StatRow, { label: "Party", value: `${gameState.party.length + 1} members`, color: C.accent })] }) }), SP_JSX.jsx(Divider, {}), gameState.host?.maxHp > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(HPBar, { name: gameState.host.name || "Host", hp: gameState.host.hp, maxHp: gameState.host.maxHp, isHost: true }) })), gameState.party?.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { padding: "2px 0" }, children: gameState.party.map((m, i) => m.maxHp > 0 ? SP_JSX.jsx(HPBar, { name: m.name, hp: m.hp, maxHp: m.maxHp }, m.guid || i) : null) }) })), recentEvents.length > 0 && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(Divider, {}), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "4px 0" }, children: [SP_JSX.jsx("div", { style: { fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }, children: "Recent" }), recentEvents.slice(-5).reverse().map((evt, i) => (SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 }, children: [SP_JSX.jsx("span", { children: EVENT_ICONS[evt.type] || "-" }), SP_JSX.jsxs("span", { style: { color: C.textDim }, children: [evt.type.replace(/_/g, " "), evt.detail ? ` -- ${evt.detail}` : ""] })] }, i)))] }) })] }))] })), !showSetup && (SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Phone App" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                                padding: "10px 12px", borderRadius: 8, backgroundColor: C.surface, border: `1px solid ${C.border}`,
                            }, children: [SP_JSX.jsx("div", { style: { fontSize: 11, color: C.textDim, marginBottom: 6 }, children: "Open on your phone:" }), SP_JSX.jsx("div", { style: { fontSize: 13, color: C.accent, fontWeight: 600, fontFamily: "monospace", marginBottom: 8 }, children: "https://tadpole-omega.vercel.app" }), SP_JSX.jsx("div", { style: { fontSize: 11, color: C.textDim, marginBottom: 4 }, children: "Enter this IP:" }), SP_JSX.jsxs("div", { style: {
                                        fontSize: 14, color: C.text, fontWeight: 700, fontFamily: "monospace",
                                        padding: "6px 10px", backgroundColor: C.surfaceLight, borderRadius: 6,
                                        textAlign: "center", border: `1px solid ${C.border}`,
                                    }, children: [ip, ":", settings.port] })] }) })] })), SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Settings" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-start with BG3", checked: settings.autoStart, onChange: (v) => updateSettings({ ...settings, autoStart: v }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleCheckUpdate, disabled: checkingUpdate, children: checkingUpdate ? "Checking..." : "Check for Updates" }) }), updateInfo?.update_available && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                                padding: "10px 12px", borderRadius: 8,
                                backgroundColor: `${C.blue}15`, border: `1px solid ${C.blue}30`,
                            }, children: [SP_JSX.jsxs("div", { style: { fontSize: 13, fontWeight: 600, color: C.blue, marginBottom: 4 }, children: ["Update: v", updateInfo.latest_version] }), SP_JSX.jsxs("div", { style: { fontSize: 11, color: C.textDim, marginBottom: 8 }, children: ["Current: v", updateInfo.current_version] }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => handlePerformUpdate(updateInfo.download_url), disabled: updating, children: updating ? "Updating..." : "Install Update" })] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => { runDiagnostics(); setShowSetup(true); }, children: "Run Setup / Diagnostics" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setShowDiagnostics(!showDiagnostics), children: showDiagnostics ? "Hide Diagnostics" : "Show Diagnostics" }) }), showDiagnostics && diagnostics && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DiagnosticsPanel, { diagnostics: diagnostics, onRefresh: runDiagnostics }) })), showSettings && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => { const r = await callInstallNode(); toaster.toast({ title: "Node.js", body: r.message }); }, children: "Install Node.js" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => { const r = await callInstallBridge(); toaster.toast({ title: "Bridge", body: r.message }); }, children: "Install Bridge Server" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => { const r = await callInstallLuaMod(); toaster.toast({ title: "Lua Mod", body: r.message }); }, children: "Install BG3 Mod" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => { const r = await callInstallBg3se(); toaster.toast({ title: "BG3 Script Extender", body: r.message }); }, children: "Install BG3 Script Extender" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Bridge Port", value: String(settings.port), onChange: (v) => { const n = parseInt(v, 10); if (!isNaN(n) && n > 0)
                                        updateSettings({ ...settings, port: n }); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Bridge Directory", value: settings.bridgeDir, onChange: (v) => updateSettings({ ...settings, bridgeDir: v }) }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setShowSettings(!showSettings), children: showSettings ? "Hide Advanced" : "Show Advanced" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleViewLog, children: showLog ? "Hide Log" : "View Log" }) }), showLog && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                                padding: "8px 10px", borderRadius: 8, backgroundColor: "#0d0d1a",
                                border: `1px solid ${C.border}`, fontFamily: "monospace",
                                fontSize: 10, color: C.textDim, maxHeight: 250, overflowY: "auto",
                                whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.4,
                            }, children: logText || "Loading..." }) })), manualCommands.length > 0 && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setShowManual(!showManual), children: showManual ? "Hide Terminal Commands" : "Show Terminal Commands" }) }), showManual && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                                        padding: "8px 10px", borderRadius: 8, backgroundColor: "#0d0d1a",
                                        border: `1px solid ${C.border}`,
                                    }, children: [SP_JSX.jsx("div", { style: { fontSize: 10, color: C.textDim, marginBottom: 6, lineHeight: 1.3 }, children: "Switch to Desktop Mode, open a terminal, and run these:" }), manualCommands.map((cmd, i) => (SP_JSX.jsx(CopyableCommand, { label: cmd.label, command: cmd.command, category: cmd.category }, i)))] }) }))] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { textAlign: "center", fontSize: 10, color: C.textDim, opacity: 0.5, padding: "8px 0 4px" }, children: "Tadpole v0.6.0" }) })] })] }));
};
// ---------------------------------------------------------------------------
var index = definePlugin(() => ({
    name: "Tadpole BG3 Companion",
    titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "Tadpole BG3 Companion" }),
    content: SP_JSX.jsx(TadpolePanel, {}),
    icon: SP_JSX.jsx(FaFrog, {}),
    onDismount: () => { },
}));

export { index as default };
//# sourceMappingURL=index.js.map
