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
    gold: "#f4a261"};
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
const DEFAULT_SETTINGS = {
    port: 3456,
    autoStart: true,
    bridgeDir: "/home/deck/tadpole/bridge",
};
const EVENT_ICONS = {
    combat_started: "⚔️", combat_ended: "✅", area_changed: "🗺️",
    hp_critical: "💔", dialog_started: "💬", dialog_ended: "💬",
    level_up: "⬆️", party_changed: "👥", death: "💀",
    rest: "🏕️", loot: "💰",
};
// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
const StatusBadge = ({ label, active, activeColor = C.green, inactiveColor = C.red }) => (SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [SP_JSX.jsx("div", { style: {
                width: 8, height: 8, borderRadius: "50%",
                backgroundColor: active ? activeColor : inactiveColor,
                boxShadow: active ? `0 0 8px ${activeColor}80` : `0 0 4px ${inactiveColor}50`,
                transition: "all 0.3s ease",
            } }), SP_JSX.jsx("span", { style: {
                fontSize: 13, fontWeight: 600,
                color: active ? activeColor : inactiveColor,
                letterSpacing: 0.3,
            }, children: label })] }));
const Pill = ({ label, color = C.accent }) => (SP_JSX.jsx("span", { style: {
        display: "inline-block", padding: "2px 8px", borderRadius: 10,
        fontSize: 10, fontWeight: 600, color,
        backgroundColor: `${color}18`, border: `1px solid ${color}30`,
    }, children: label }));
const StatRow = ({ label, value, color = C.textDim, }) => (SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }, children: [SP_JSX.jsx("span", { style: { fontSize: 12, color: C.textDim }, children: label }), SP_JSX.jsx("span", { style: { fontSize: 13, color, fontWeight: 600 }, children: value })] }));
const HPBar = ({ name, hp, maxHp, isHost = false, }) => {
    const pct = maxHp > 0 ? Math.max(0, Math.min(hp / maxHp, 1)) : 0;
    const color = pct > 0.6 ? C.green : pct > 0.3 ? C.orange : C.red;
    const glow = pct > 0.6 ? C.greenGlow : pct > 0.3 ? "none" : C.redGlow;
    return (SP_JSX.jsxs("div", { style: { marginBottom: isHost ? 8 : 5 }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }, children: [SP_JSX.jsx("span", { style: { fontSize: isHost ? 13 : 11, fontWeight: isHost ? 600 : 500, color: isHost ? C.text : C.textDim }, children: name }), SP_JSX.jsxs("span", { style: { fontSize: isHost ? 12 : 10, color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }, children: [hp, "/", maxHp] })] }), SP_JSX.jsx("div", { style: { height: isHost ? 8 : 5, borderRadius: isHost ? 4 : 3, backgroundColor: C.surface, overflow: "hidden" }, children: SP_JSX.jsx("div", { style: {
                        height: "100%", width: `${pct * 100}%`, backgroundColor: color,
                        borderRadius: isHost ? 4 : 3, transition: "width 0.4s ease, background-color 0.4s ease",
                        boxShadow: `0 0 6px ${glow}` ,
                    } }) })] }));
};
const Divider = () => SP_JSX.jsx("div", { style: { height: 1, backgroundColor: C.border, margin: "8px 0", opacity: 0.5 } });
const SectionHeader = ({ title, icon }) => (SP_JSX.jsxs("div", { style: {
        fontSize: 11, fontWeight: 700, color: C.accent,
        textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 2,
    }, children: [icon && SP_JSX.jsx("span", { style: { marginRight: 6 }, children: icon }), title] }));
/** Diagnostic checklist item */
const CheckItem = ({ label, ok, detail, fixCommand }) => (SP_JSX.jsxs("div", { style: {
        padding: "8px 12px", borderRadius: 8, marginBottom: 4,
        backgroundColor: ok ? `${C.green}10` : `${C.red}10`,
        border: `1px solid ${ok ? `${C.green}30` : `${C.red}30`}`,
    }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [SP_JSX.jsx("span", { style: { fontSize: 14 }, children: ok ? "✅" : "❌" }), SP_JSX.jsx("span", { style: { fontSize: 12, fontWeight: 600, color: ok ? C.green : C.red }, children: label })] }), detail && SP_JSX.jsx("div", { style: { fontSize: 11, color: C.textDim, marginLeft: 22, marginTop: 2 }, children: detail }), fixCommand && !ok && (SP_JSX.jsx("div", { style: {
                marginLeft: 22, marginTop: 4, padding: "4px 8px", borderRadius: 4,
                backgroundColor: C.surface, fontFamily: "monospace", fontSize: 11, color: C.accent,
            }, children: fixCommand }))] }));
// ---------------------------------------------------------------------------
// Main panel
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
    const [diagnostics, setDiagnostics] = SP_REACT.useState(null);
    const [showDiagnostics, setShowDiagnostics] = SP_REACT.useState(false);
    const pollRef = SP_REACT.useRef(null);
    const autoStartAttemptedRef = SP_REACT.useRef(false);
    const prevClientsRef = SP_REACT.useRef(0);
    const prevEventsLenRef = SP_REACT.useRef(0);
    // Load settings + run diagnostics on mount
    SP_REACT.useEffect(() => {
        callGetSettings().then((saved) => {
            if (saved && Object.keys(saved).length > 0)
                setSettings({ ...DEFAULT_SETTINGS, ...saved });
        }).catch(() => { });
        callGetDiagnostics().then((d) => {
            setDiagnostics(d);
            if (d && !d.ready)
                setShowDiagnostics(true); // Auto-show if issues
        }).catch(() => { });
    }, []);
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
            // Health check if bridge is running
            if (data.bridge_running) {
                const health = await callCheckHealth();
                setBridgeHealthy(health.healthy);
            }
            else {
                setBridgeHealthy(false);
            }
        }
        catch { }
    }, []);
    const updateSettings = SP_REACT.useCallback((newSettings) => {
        setSettings(newSettings);
        callSaveSettings(newSettings).catch(() => { });
    }, []);
    const startBridge = SP_REACT.useCallback(async () => {
        setLoading(true);
        try {
            const result = await callStartBridge(settings.port, settings.bridgeDir);
            toaster.toast({ title: "Tadpole", body: result.message });
        }
        catch {
            toaster.toast({ title: "Tadpole Error", body: "Failed to start bridge" });
        }
        setTimeout(async () => { await fetchStatus(); setLoading(false); }, 1500);
    }, [settings, fetchStatus]);
    const stopBridge = SP_REACT.useCallback(async () => {
        setLoading(true);
        try {
            const result = await callStopBridge();
            if (result.success)
                toaster.toast({ title: "Tadpole", body: result.message });
        }
        catch {
            toaster.toast({ title: "Tadpole Error", body: "Failed to stop bridge" });
        }
        setTimeout(async () => { await fetchStatus(); setLoading(false); }, 500);
    }, [fetchStatus]);
    const runDiagnostics = SP_REACT.useCallback(async () => {
        const d = await callGetDiagnostics();
        setDiagnostics(d);
        setShowDiagnostics(true);
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
        if (autoStartAttemptedRef.current)
            return;
        if (settings.autoStart && bg3Running && !bridgeRunning && !nodeMissing) {
            autoStartAttemptedRef.current = true;
            startBridge();
        }
    }, [bg3Running, bridgeRunning, settings.autoStart, startBridge, nodeMissing]);
    // Phone connection toasts
    SP_REACT.useEffect(() => {
        if (connectedClients > prevClientsRef.current && prevClientsRef.current === 0) {
            toaster.toast({ title: "Phone Connected", body: `Phone app connected (${connectedClients})` });
        }
        else if (connectedClients === 0 && prevClientsRef.current > 0) {
            toaster.toast({ title: "Phone Disconnected", body: "No phones connected" });
        }
        prevClientsRef.current = connectedClients;
    }, [connectedClients]);
    // Game event toasts
    SP_REACT.useEffect(() => {
        if (recentEvents.length <= prevEventsLenRef.current) {
            prevEventsLenRef.current = recentEvents.length;
            return;
        }
        const newEvents = recentEvents.slice(prevEventsLenRef.current);
        for (const evt of newEvents) {
            if (evt.type === "combat_started")
                toaster.toast({ title: "Combat!", body: "Combat has begun!" });
            else if (evt.type === "hp_critical")
                toaster.toast({ title: "HP Critical!", body: evt.detail || "A party member is critically low!" });
            else if (evt.type === "death")
                toaster.toast({ title: "Party Member Down!", body: evt.detail || "Someone has fallen!" });
            else if (evt.type === "level_up")
                toaster.toast({ title: "Level Up!", body: evt.detail || "A party member leveled up!" });
        }
        prevEventsLenRef.current = recentEvents.length;
    }, [recentEvents]);
    const totalPartyHp = (() => {
        let current = 0, max = 0;
        if (gameState?.host && gameState.host.maxHp > 0) {
            current += gameState.host.hp;
            max += gameState.host.maxHp;
        }
        if (gameState?.party) {
            for (const m of gameState.party) {
                if (m.maxHp > 0) {
                    current += m.hp;
                    max += m.maxHp;
                }
            }
        }
        return { current, max };
    })();
    // Determine if this is first-run (nothing set up)
    const isFirstRun = diagnostics && !diagnostics.ready;
    return (SP_JSX.jsxs("div", { style: { padding: "4px 0" }, children: [isFirstRun && !showDiagnostics && (SP_JSX.jsx(DFL.PanelSection, { title: "", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                            padding: "12px", borderRadius: 10, backgroundColor: C.surface,
                            border: `1px solid ${C.border}`, textAlign: "center",
                        }, children: [SP_JSX.jsx("div", { style: { fontSize: 32, marginBottom: 8 }, children: "\uD83D\uDC38" }), SP_JSX.jsx("div", { style: { fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }, children: "Welcome to Tadpole!" }), SP_JSX.jsx("div", { style: { fontSize: 12, color: C.textDim, marginBottom: 8 }, children: "A few things need to be set up before we can connect to your game." }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: runDiagnostics, children: "Run Setup Check" })] }) }) })), showDiagnostics && diagnostics && (SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Setup Check", icon: "\uD83D\uDD0D" }), SP_JSX.jsx(CheckItem, { label: diagnostics.node_installed
                            ? `Node.js ${diagnostics.node_version || "installed"}`
                            : "Node.js not installed", ok: diagnostics.node_installed, detail: diagnostics.node_installed
                            ? "Required to run the bridge server"
                            : "The bridge server needs Node.js to run", fixCommand: "sudo pacman -S nodejs npm" }), SP_JSX.jsx(CheckItem, { label: diagnostics.bridge_found
                            ? "Bridge server found"
                            : "Bridge server not found", ok: diagnostics.bridge_found, detail: diagnostics.bridge_found
                            ? diagnostics.bridge_path || ""
                            : "Download from github.com/ZedaKeys/Tadpole and set the path in Settings" }), SP_JSX.jsx(CheckItem, { label: diagnostics.lua_installed
                            ? "BG3 mod installed"
                            : "BG3 mod not detected", ok: diagnostics.lua_installed, detail: diagnostics.lua_installed
                            ? "TadpoleCompanion.lua found"
                            : "The Lua mod sends live game data to the bridge" }), diagnostics.ready && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                                padding: "8px 12px", borderRadius: 8,
                                backgroundColor: `${C.green}15`, border: `1px solid ${C.green}30`,
                                textAlign: "center", marginTop: 4,
                            }, children: SP_JSX.jsx("span", { style: { fontSize: 13, fontWeight: 600, color: C.green }, children: "All good! You're ready to play." }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setShowDiagnostics(false), children: diagnostics.ready ? "Close" : "Close and set up manually" }) })] })), nodeMissing && !showDiagnostics && (SP_JSX.jsx(DFL.PanelSection, { title: "", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                            padding: "10px 12px", borderRadius: 8,
                            backgroundColor: `${C.red}15`, border: `1px solid ${C.red}30`,
                            color: C.red, fontSize: 12, lineHeight: 1.5,
                        }, children: [SP_JSX.jsx("strong", { children: "Node.js is required." }), SP_JSX.jsx("br", {}), "Install in Desktop Mode:", SP_JSX.jsx("div", { style: {
                                    marginTop: 4, padding: "4px 8px", borderRadius: 4,
                                    backgroundColor: C.surface, fontFamily: "monospace", fontSize: 11, color: C.accent,
                                }, children: "sudo pacman -S nodejs npm" })] }) }) })), !showDiagnostics && (SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Connection", icon: "\uD83D\uDD17" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [SP_JSX.jsx(StatusBadge, { label: bridgeRunning
                                        ? bridgeHealthy ? "Bridge Active" : "Bridge (unhealthy)"
                                        : "Bridge Offline", active: bridgeRunning && bridgeHealthy }), bridgeRunning && connectedClients > 0 && (SP_JSX.jsx(Pill, { label: `${connectedClients} phone${connectedClients !== 1 ? "s" : ""}`, color: C.green }))] }) }), bridgeRunning && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                                padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface,
                                fontFamily: "monospace", fontSize: 12, color: C.accent,
                                textAlign: "center", border: `1px solid ${C.border}`,
                            }, children: [ip, ":", settings.port] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: loading || nodeMissing, onClick: bridgeRunning ? stopBridge : startBridge, children: SP_JSX.jsxs("span", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }, children: [loading ? "⟳" : bridgeRunning ? "■" : "▶", loading ? "Working..." : bridgeRunning ? "Stop Bridge" : "Start Bridge"] }) }) })] })), !showDiagnostics && (SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Game", icon: "\uD83C\uDFAE" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusBadge, { label: bg3Running ? "BG3 Running" : "BG3 Not Detected", active: bg3Running, activeColor: C.accent, inactiveColor: C.textDim }) }), !bg3Running && bridgeRunning && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                                padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface,
                                fontSize: 11, color: C.textDim, textAlign: "center",
                                border: `1px solid ${C.border}`,
                            }, children: "Bridge is ready \u2014 launch BG3 to connect" }) })), !bg3Running && !bridgeRunning && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                                padding: "6px 10px", borderRadius: 6, backgroundColor: C.surface,
                                fontSize: 11, color: C.textDim, textAlign: "center",
                                border: `1px solid ${C.border}`,
                            }, children: "Start the bridge, then launch BG3" }) }))] })), gameState && bg3Running && !showDiagnostics && (SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Live", icon: "\uD83D\uDCCA" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }, children: [gameState.area && (SP_JSX.jsx("span", { style: { fontSize: 13, fontWeight: 600, color: C.text }, children: gameState.area })), SP_JSX.jsxs("div", { style: { display: "flex", gap: 6 }, children: [gameState.inCombat && SP_JSX.jsx(Pill, { label: "Combat", color: C.red }), gameState.inDialog && SP_JSX.jsx(Pill, { label: "Dialog", color: C.orange }), !gameState.inCombat && !gameState.inDialog && SP_JSX.jsx(Pill, { label: "Explore", color: C.green })] })] }) }), SP_JSX.jsx(Divider, {}), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", gap: 12 }, children: [typeof gameState.gold === "number" && (SP_JSX.jsx(StatRow, { label: "Gold", value: `🪙 ${gameState.gold}`, color: C.gold })), totalPartyHp.max > 0 && (SP_JSX.jsx(StatRow, { label: "Party HP", value: `${totalPartyHp.current}/${totalPartyHp.max}`, color: totalPartyHp.current / totalPartyHp.max > 0.5 ? C.green : C.red })), gameState.party && (SP_JSX.jsx(StatRow, { label: "Party", value: `${gameState.party.length + 1} members`, color: C.accent }))] }) }), SP_JSX.jsx(Divider, {}), gameState.host && gameState.host.maxHp > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(HPBar, { name: gameState.host.name || "Host", hp: gameState.host.hp, maxHp: gameState.host.maxHp, isHost: true }) })), gameState.party && gameState.party.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { padding: "2px 0" }, children: gameState.party.map((member, i) => member.maxHp > 0 ? (SP_JSX.jsx(HPBar, { name: member.name, hp: member.hp, maxHp: member.maxHp }, member.guid || i)) : null) }) })), recentEvents.length > 0 && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(Divider, {}), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "4px 0" }, children: [SP_JSX.jsx("div", { style: {
                                                fontSize: 10, fontWeight: 600, color: C.textDim,
                                                textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                                            }, children: "Recent" }), SP_JSX.jsx("div", { style: { display: "flex", flexDirection: "column", gap: 3 }, children: recentEvents.slice(-5).reverse().map((evt, i) => (SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 }, children: [SP_JSX.jsx("span", { style: { fontSize: 12 }, children: EVENT_ICONS[evt.type] || "•" }), SP_JSX.jsxs("span", { style: { color: C.textDim, flex: 1 }, children: [evt.type.replace(/_/g, " "), evt.detail ? ` — ${evt.detail}` : ""] })] }, i))) })] }) })] }))] })), !showDiagnostics && (SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Phone App", icon: "\uD83D\uDCF1" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                                padding: "10px 12px", borderRadius: 8, backgroundColor: C.surface,
                                border: `1px solid ${C.border}`,
                            }, children: [SP_JSX.jsx("div", { style: { fontSize: 11, color: C.textDim, marginBottom: 6 }, children: "Open on your phone:" }), SP_JSX.jsx("div", { style: {
                                        fontSize: 13, color: C.accent, fontWeight: 600, fontFamily: "monospace",
                                        marginBottom: 8, wordBreak: "break-all",
                                    }, children: "https://tadpole-omega.vercel.app" }), SP_JSX.jsx("div", { style: { fontSize: 11, color: C.textDim, marginBottom: 4 }, children: "Enter this IP:" }), SP_JSX.jsxs("div", { style: {
                                        fontSize: 14, color: C.text, fontWeight: 700, fontFamily: "monospace",
                                        padding: "6px 10px", backgroundColor: C.surfaceLight, borderRadius: 6,
                                        textAlign: "center", border: `1px solid ${C.border}`, letterSpacing: 0.5,
                                    }, children: [ip, ":", settings.port] })] }) })] })), SP_JSX.jsxs(DFL.PanelSection, { title: "", children: [SP_JSX.jsx(SectionHeader, { title: "Settings", icon: "\u2699\uFE0F" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-start with BG3", checked: settings.autoStart, onChange: (checked) => updateSettings({ ...settings, autoStart: checked }) }) }), showSettings && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Bridge Port", value: String(settings.port), onChange: (val) => {
                                        const num = parseInt(val, 10);
                                        if (!isNaN(num) && num > 0 && num < 65536)
                                            updateSettings({ ...settings, port: num });
                                    } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Bridge Directory", value: settings.bridgeDir, onChange: (val) => updateSettings({ ...settings, bridgeDir: val }) }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: runDiagnostics, children: "\uD83D\uDD0D Run Diagnostics" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setShowSettings(!showSettings), children: showSettings ? "Hide Advanced" : "Show Advanced" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                                textAlign: "center", fontSize: 10, color: C.textDim,
                                opacity: 0.5, padding: "8px 0 4px",
                            }, children: "Tadpole v0.3.0" }) })] })] }));
};
// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------
var index = definePlugin(() => {
    return {
        name: "Tadpole BG3 Companion",
        titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "Tadpole BG3 Companion" }),
        content: SP_JSX.jsx(TadpolePanel, {}),
        icon: SP_JSX.jsx(FaFrog, {}),
        onDismount: () => { },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
