"use client";

import { VERSION } from "@/lib/version";
import { useGameConnection } from "@/hooks/useGameConnection";
import { Wifi, WifiOff, Info } from "lucide-react";

export default function SettingsPage() {
  const { isConnected, connectionStatus, disconnect, getLastHost } = useGameConnection();
  const host = getLastHost();

  return (
    <div style={{ padding: "16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Settings</h1>

      {/* Connection */}
      <section style={{
        padding: 14, borderRadius: 10, marginBottom: 16,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          {isConnected ? <Wifi size={16} style={{ color: "#52b788" }} /> : <WifiOff size={16} style={{ color: "rgba(255,255,255,0.3)" }} />}
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        {isConnected && (
          <>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
              Host: <span style={{ color: "#48bfe3", fontFamily: "JetBrains Mono, monospace" }}>{host}</span>
            </div>
            <button
              onClick={disconnect}
              style={{
                width: "100%", height: 40, borderRadius: 8,
                background: "rgba(231,111,81,0.1)", border: "1px solid rgba(231,111,81,0.2)",
                color: "#e76f51", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Disconnect
            </button>
          </>
        )}
        {!isConnected && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            {connectionStatus === "mixed-content-blocked"
              ? "HTTPS blocks WebSocket. Use the HTTP URL from your Deck instead."
              : "Go to the Live tab to connect."}
          </div>
        )}
      </section>

      {/* About */}
      <section style={{
        padding: 14, borderRadius: 10,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Info size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>About</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          <div>Tadpole v{VERSION}</div>
          <div style={{ marginTop: 4 }}>Live BG3 companion with real-time HP, combat tracking, and game commands.</div>
          <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            Unofficial fan-made app. Not affiliated with Larian Studios.
          </div>
        </div>
      </section>
    </div>
  );
}
