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
// API callables
// ---------------------------------------------------------------------------
const callGetStatus = callable("get_status");
const callGetDiagnostics = callable("get_diagnostics");
const callCheckHealth = callable("check_health");
const callStartBridge = callable("start_bridge");
const callStopBridge = callable("stop_bridge");
const callGetSettings = callable("get_settings");
const callSaveSettings = callable("save_settings");
const callInstallEverything = callable("install_everything");
const callCheckUpdate = callable("check_update");
const callPerformUpdate = callable("perform_update");
const callGetLog = callable("get_log");
const DEFAULT_SETTINGS = { port: 3456, autoStart: true, bridgeDir: "/home/deck/tadpole/bridge" };
// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------
const TadpolePanel = () => {
    const [settings, setSettings] = SP_REACT.useState({ ...DEFAULT_SETTINGS });
    const [tab, setTab] = SP_REACT.useState("live");
    // Status
    const [bridgeRunning, setBridgeRunning] = SP_REACT.useState(false);
    const [bridgeHealthy, setBridgeHealthy] = SP_REACT.useState(false);
    const [bg3Running, setBg3Running] = SP_REACT.useState(false);
    const [ip, setIp] = SP_REACT.useState("...");
    const [connectedClients, setConnectedClients] = SP_REACT.useState(0);
    const [gameState, setGameState] = SP_REACT.useState(null);
    const [recentEvents, setRecentEvents] = SP_REACT.useState([]);
    const [loading, setLoading] = SP_REACT.useState(false);
    const [nodeMissing, setNodeMissing] = SP_REACT.useState(false);
    // Setup
    const [diagnostics, setDiagnostics] = SP_REACT.useState(null);
    const [installing, setInstalling] = SP_REACT.useState(false);
    const [ready, setReady] = SP_REACT.useState(false);
    // Settings
    const [checkingUpdate, setCheckingUpdate] = SP_REACT.useState(false);
    const [updateInfo, setUpdateInfo] = SP_REACT.useState(null);
    const [updating, setUpdating] = SP_REACT.useState(false);
    const [showLog, setShowLog] = SP_REACT.useState(false);
    const [logText, setLogText] = SP_REACT.useState("");
    const pollRef = SP_REACT.useRef(null);
    const autoStartRef = SP_REACT.useRef(false);
    const runDiagnostics = SP_REACT.useCallback(async () => {
        try {
            const d = await callGetDiagnostics();
            setDiagnostics(d);
            setReady(d.ready);
            if (!d.ready && tab === "live")
                setTab("setup");
        }
        catch { }
    }, [tab]);
    // Load settings + diagnostics on mount
    SP_REACT.useEffect(() => {
        callGetSettings().then((s) => { if (s && Object.keys(s).length > 0)
            setSettings({ ...DEFAULT_SETTINGS, ...s }); }).catch(() => { });
        runDiagnostics();
    }, [runDiagnostics]);
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
    const handleInstall = SP_REACT.useCallback(async () => {
        setInstalling(true);
        try {
            const r = await callInstallEverything();
            if (r.success) {
                toaster.toast({ title: "Setup Complete!", body: "Everything installed" });
                await runDiagnostics();
                await fetchStatus();
                if (diagnostics?.ready)
                    setTab("live");
            }
            else {
                toaster.toast({ title: "Setup Failed", body: `Failed at ${r.step || "unknown"}` });
            }
        }
        catch {
            toaster.toast({ title: "Error", body: "Installation failed" });
        }
        setInstalling(false);
    }, [runDiagnostics, fetchStatus, diagnostics]);
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
    // Computed
    const partyHp = (() => {
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
    const hasLiveData = gameState && bg3Running && (gameState.host?.maxHp > 0 || gameState.party?.length > 0);
    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const s = {
        root: { padding: "6px 0" },
        tabRow: { display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 8 },
        tab: (active) => ({
            flex: 1, padding: "8px 0", textAlign: "center",
            fontSize: 12, fontWeight: 600, color: active ? "#fff" : "rgba(255,255,255,0.4)",
            background: active ? "rgba(255,255,255,0.1)" : "transparent",
            border: "none", cursor: "pointer",
        }),
        card: (border) => ({
            padding: "10px 12px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${border || "rgba(255,255,255,0.06)"}`,
            marginBottom: 8,
        }),
        row: (between = true) => ({
            display: "flex", alignItems: "center",
            justifyContent: between ? "space-between" : "flex-start",
            gap: 8,
        }),
        dot: (color) => ({
            width: 7, height: 7, borderRadius: "50%", backgroundColor: color,
            boxShadow: `0 0 6px ${color}60`,
        }),
        label: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
        value: { fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 },
        muted: { fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 },
        ip: {
            fontFamily: "monospace", fontSize: 13, color: "rgba(120,180,255,0.9)",
            textAlign: "center", padding: "4px 0",
        },
        hpBar: (pct, color) => ({
            height: "100%", width: `${pct * 100}%`, backgroundColor: color,
            borderRadius: 3, transition: "width 0.4s ease",
        }),
        eventRow: { display: "flex", gap: 6, fontSize: 11, padding: "2px 0" },
        pill: (color) => ({
            display: "inline-block", padding: "2px 8px", borderRadius: 10,
            fontSize: 10, fontWeight: 700, color,
            background: `${color}15`, border: `1px solid ${color}25`,
        }),
    };
    const hpColor = (pct) => pct > 0.6 ? "#52b788" : pct > 0.3 ? "#f4a261" : "#e76f51";
    const EVENT_ICON = {
        combat_started: "!", combat_ended: "+", area_changed: ">",
        hp_critical: "!!", level_up: "^", death: "X", rest: "R",
    };
    // -----------------------------------------------------------------------
    // Tab: Live
    // -----------------------------------------------------------------------
    const LiveTab = () => (SP_JSX.jsxs("div", { children: [SP_JSX.jsx("div", { style: s.card(), children: SP_JSX.jsxs("div", { style: s.row(), children: [SP_JSX.jsxs("div", { style: s.row(false), children: [SP_JSX.jsx("div", { style: s.dot(bridgeRunning && bridgeHealthy ? "#52b788" : bridgeRunning ? "#f4a261" : "#e76f51") }), SP_JSX.jsx("span", { style: { ...s.value, fontSize: 11, color: bridgeRunning && bridgeHealthy ? "#52b788" : bridgeRunning ? "#f4a261" : "#e76f51" }, children: bridgeRunning && bridgeHealthy ? "Online" : bridgeRunning ? "Unhealthy" : "Offline" })] }), bridgeRunning && connectedClients > 0 && (SP_JSX.jsxs("span", { style: s.pill("#52b788"), children: [connectedClients, " phone", connectedClients !== 1 ? "s" : ""] })), bg3Running && (SP_JSX.jsx("span", { style: s.pill("rgba(120,180,255,0.8)"), children: "BG3" }))] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: loading || nodeMissing, onClick: bridgeRunning ? stopBridge : startBridge, children: loading ? "..." : bridgeRunning ? "Stop Bridge" : "Start Bridge" }) }), bridgeRunning && (SP_JSX.jsxs("div", { style: s.card("rgba(120,180,255,0.12)"), children: [SP_JSX.jsx("div", { style: { ...s.muted, marginBottom: 4, textAlign: "center" }, children: "Open on phone: tadpole-omega.vercel.app" }), SP_JSX.jsxs("div", { style: s.ip, children: [ip, ":", settings.port] })] })), hasLiveData && (SP_JSX.jsxs("div", { style: s.card(), children: [SP_JSX.jsxs("div", { style: { ...s.row(), marginBottom: 8 }, children: [gameState.area && SP_JSX.jsx("span", { style: { ...s.value, fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: gameState.area }), SP_JSX.jsxs("div", { style: { ...s.row(false), gap: 4, flexShrink: 0 }, children: [gameState.inCombat && SP_JSX.jsx("span", { style: s.pill("#e76f51"), children: "Combat" }), gameState.inDialog && SP_JSX.jsx("span", { style: s.pill("#f4a261"), children: "Dialog" }), !gameState.inCombat && !gameState.inDialog && SP_JSX.jsx("span", { style: s.pill("#52b788"), children: "Explore" })] })] }), SP_JSX.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 8 }, children: [typeof gameState.gold === "number" && (SP_JSX.jsxs("div", { style: { textAlign: "center", padding: "4px 0" }, children: [SP_JSX.jsx("div", { style: { ...s.muted, fontSize: 10 }, children: "Gold" }), SP_JSX.jsx("div", { style: { ...s.value, color: "#f4a261" }, children: gameState.gold })] })), partyHp.m > 0 && (SP_JSX.jsxs("div", { style: { textAlign: "center", padding: "4px 0" }, children: [SP_JSX.jsx("div", { style: { ...s.muted, fontSize: 10 }, children: "Party HP" }), SP_JSX.jsxs("div", { style: { ...s.value, color: hpColor(partyHp.c / partyHp.m) }, children: [partyHp.c, "/", partyHp.m] })] })), gameState.party && (SP_JSX.jsxs("div", { style: { textAlign: "center", padding: "4px 0" }, children: [SP_JSX.jsx("div", { style: { ...s.muted, fontSize: 10 }, children: "Party" }), SP_JSX.jsx("div", { style: s.value, children: gameState.party.length + 1 })] }))] }), gameState.host?.maxHp > 0 && (SP_JSX.jsx(HpRow, { name: gameState.host.name || "Host", hp: gameState.host.hp, maxHp: gameState.host.maxHp, bold: true })), gameState.party?.map((m, i) => m.maxHp > 0 ? (SP_JSX.jsx(HpRow, { name: m.name, hp: m.hp, maxHp: m.maxHp }, m.guid || i)) : null), recentEvents.length > 0 && (SP_JSX.jsxs("div", { style: { marginTop: 6 }, children: [SP_JSX.jsx("div", { style: { ...s.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }, children: "Recent" }), recentEvents.slice(-4).reverse().map((evt, i) => (SP_JSX.jsxs("div", { style: s.eventRow, children: [SP_JSX.jsx("span", { style: { color: "rgba(255,255,255,0.3)" }, children: EVENT_ICON[evt.type] || "-" }), SP_JSX.jsxs("span", { style: { color: "rgba(255,255,255,0.45)" }, children: [evt.type.replace(/_/g, " "), evt.detail ? ` - ${evt.detail}` : ""] })] }, i)))] }))] })), !hasLiveData && bridgeRunning && (SP_JSX.jsx("div", { style: s.card(), children: SP_JSX.jsx("div", { style: { ...s.muted, textAlign: "center" }, children: bg3Running ? "Waiting for game data... make sure the Lua mod is installed." : "Start BG3 to see live data here." }) }))] }));
    // -----------------------------------------------------------------------
    // Tab: Setup
    // -----------------------------------------------------------------------
    const SetupTab = () => (SP_JSX.jsx("div", { children: diagnostics?.ready ? (SP_JSX.jsxs("div", { style: s.card("rgba(82,183,136,0.2)"), children: [SP_JSX.jsx("div", { style: { ...s.value, color: "#52b788", textAlign: "center", marginBottom: 4 }, children: "All set!" }), SP_JSX.jsx("div", { style: { ...s.muted, textAlign: "center" }, children: "Everything is installed and ready." })] })) : (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs("div", { style: { ...s.card(), marginBottom: 6 }, children: [SP_JSX.jsx("div", { style: { ...s.value, fontSize: 14, marginBottom: 6 }, children: "Tadpole Setup" }), SP_JSX.jsx("div", { style: s.muted, children: "One click installs everything you need." })] }), diagnostics && (SP_JSX.jsxs("div", { style: s.card(), children: [SP_JSX.jsx(CheckLine, { label: "BG3 Script Extender", ok: diagnostics.bg3se_installed }), SP_JSX.jsx(CheckLine, { label: diagnostics.node_installed ? `Node.js ${diagnostics.node_version || ""}` : "Node.js", ok: diagnostics.node_installed }), SP_JSX.jsx(CheckLine, { label: "Bridge Server", ok: diagnostics.bridge_found }), SP_JSX.jsx(CheckLine, { label: "BG3 Lua Mod", ok: diagnostics.lua_installed })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleInstall, disabled: installing, children: installing ? "Installing..." : "Install Everything" }) })] })) }));
    // -----------------------------------------------------------------------
    // Tab: Settings
    // -----------------------------------------------------------------------
    const SettingsTab = () => (SP_JSX.jsxs("div", { children: [SP_JSX.jsx("div", { style: s.card(), children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-start with BG3", checked: settings.autoStart, onChange: (v) => updateSettings({ ...settings, autoStart: v }) }) }), SP_JSX.jsxs("div", { style: s.card(), children: [SP_JSX.jsxs("div", { style: { ...s.row(), marginBottom: 6 }, children: [SP_JSX.jsx("span", { style: s.label, children: "Port" }), SP_JSX.jsx("span", { style: s.value, children: settings.port })] }), SP_JSX.jsxs("div", { style: s.row(), children: [SP_JSX.jsx("span", { style: s.label, children: "Bridge Dir" }), SP_JSX.jsx("span", { style: { ...s.value, fontSize: 10, fontFamily: "monospace", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }, children: settings.bridgeDir })] })] }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => {
                        setCheckingUpdate(true);
                        try {
                            const info = await callCheckUpdate();
                            setUpdateInfo(info);
                            if (info.update_available)
                                toaster.toast({ title: "Update Available", body: `v${info.latest_version}` });
                            else if (!info.error)
                                toaster.toast({ title: "Up to Date", body: `v${info.current_version}` });
                        }
                        catch {
                            toaster.toast({ title: "Error", body: "Could not check updates" });
                        }
                        setCheckingUpdate(false);
                    }, disabled: checkingUpdate, children: checkingUpdate ? "Checking..." : "Check for Updates" }) }), updateInfo?.update_available && (SP_JSX.jsxs("div", { style: s.card("rgba(120,180,255,0.15)"), children: [SP_JSX.jsxs("div", { style: { ...s.row(), marginBottom: 4 }, children: [SP_JSX.jsxs("span", { style: { ...s.value, color: "rgba(120,180,255,0.9)", fontSize: 12 }, children: ["Update v", updateInfo.latest_version] }), SP_JSX.jsxs("span", { style: s.label, children: ["from v", updateInfo.current_version] })] }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => {
                                setUpdating(true);
                                try {
                                    const r = await callPerformUpdate(updateInfo.download_url);
                                    toaster.toast({ title: r.success ? "Updated!" : "Failed", body: r.message });
                                }
                                catch {
                                    toaster.toast({ title: "Error", body: "Update failed" });
                                }
                                setUpdating(false);
                            }, disabled: updating, children: updating ? "Updating..." : "Install Update" }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => {
                        try {
                            const r = await callGetLog();
                            setLogText(r.log);
                        }
                        catch {
                            setLogText("Could not read log");
                        }
                        setShowLog(!showLog);
                    }, children: showLog ? "Hide Log" : "View Log" }) }), showLog && (SP_JSX.jsx("div", { style: {
                    ...s.card(), fontFamily: "monospace", fontSize: 10,
                    color: "rgba(255,255,255,0.35)", maxHeight: 200, overflowY: "auto",
                    whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.4,
                }, children: logText || "Loading..." })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => { runDiagnostics(); setTab("setup"); }, children: "Run Setup / Diagnostics" }) }), SP_JSX.jsx("div", { style: { textAlign: "center", padding: "8px 0 4px", ...s.muted, fontSize: 10 }, children: "Tadpole v0.7.0" })] }));
    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (SP_JSX.jsxs("div", { style: s.root, children: [SP_JSX.jsx("div", { style: s.tabRow, children: ["live", "setup", "settings"].map(t => (SP_JSX.jsx("button", { style: s.tab(tab === t), onClick: () => setTab(t), children: t === "live" ? "Live" : t === "setup" ? "Setup" : "Settings" }, t))) }), tab === "live" && SP_JSX.jsx(LiveTab, {}), tab === "setup" && SP_JSX.jsx(SetupTab, {}), tab === "settings" && SP_JSX.jsx(SettingsTab, {})] }));
};
// ---------------------------------------------------------------------------
// Shared Components
// ---------------------------------------------------------------------------
const CheckLine = ({ label, ok }) => (SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }, children: [SP_JSX.jsx("div", { style: {
                width: 18, height: 18, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                color: ok ? "#52b788" : "#e76f51",
                background: ok ? "rgba(82,183,136,0.12)" : "rgba(231,111,81,0.12)",
                border: `1px solid ${ok ? "rgba(82,183,136,0.25)" : "rgba(231,111,81,0.25)"}`,
                flexShrink: 0,
            }, children: ok ? "+" : "!" }), SP_JSX.jsx("span", { style: { fontSize: 12, color: ok ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }, children: label })] }));
const HpRow = ({ name, hp, maxHp, bold }) => {
    const pct = maxHp > 0 ? Math.max(0, Math.min(hp / maxHp, 1)) : 0;
    const color = hpColor(pct);
    return (SP_JSX.jsxs("div", { style: { marginBottom: bold ? 6 : 4 }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }, children: [SP_JSX.jsx("span", { style: { fontSize: bold ? 12 : 11, fontWeight: bold ? 600 : 500, color: bold ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)" }, children: name }), SP_JSX.jsxs("span", { style: { fontSize: bold ? 11 : 10, color, fontWeight: 600 }, children: [hp, "/", maxHp] })] }), SP_JSX.jsx("div", { style: { height: bold ? 6 : 4, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }, children: SP_JSX.jsx("div", { style: {
                        height: "100%", width: `${pct * 100}%`, backgroundColor: color,
                        borderRadius: 3, transition: "width 0.4s ease",
                        boxShadow: pct < 0.3 ? `0 0 4px ${color}50` : "none",
                    } }) })] }));
};
function hpColor(pct) {
    return pct > 0.6 ? "#52b788" : pct > 0.3 ? "#f4a261" : "#e76f51";
}
// ---------------------------------------------------------------------------
var index = definePlugin(() => ({
    name: "Tadpole BG3 Companion",
    titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "Tadpole" }),
    content: SP_JSX.jsx(TadpolePanel, {}),
    icon: SP_JSX.jsx(FaFrog, {}),
    onDismount: () => { },
}));

export { index as default };
//# sourceMappingURL=index.js.map
