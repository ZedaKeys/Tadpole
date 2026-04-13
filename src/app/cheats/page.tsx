"use client";

import { useState } from "react";
import { useGameConnection } from "@/hooks/useGameConnection";
import { Coins, Moon, Package, Send, AlertCircle } from "lucide-react";

// Common BG3 items for quick-spawn
const QUICK_ITEMS = [
  { id: "WPN_Potion_Healing_001", name: "Potion of Healing" },
  { id: "WPN_Potion_Healing_Greater_001", name: "Greater Healing" },
  { id: "WPN_Potion_Speed_001", name: "Potion of Speed" },
  { id: "WPN_Potion_Invisibility_001", name: "Invisibility Potion" },
  { id: "WPN_Potion_Antidote_001", name: "Antidote" },
  { id: "WPN_Scroll_Revivify_001", name: "Scroll of Revivify" },
  { id: "LOB_Armor_Medium_WonderousItem_CloakOfProtection_001", name: "Cloak of Protection" },
  { id: "LOB_Armor_Ring_RingOfProtection_001", name: "Ring of Protection" },
];

export default function CheatsPage() {
  const { isConnected, sendCommand } = useGameConnection();
  const [goldAmount, setGoldAmount] = useState("500");
  const [customItem, setCustomItem] = useState("");
  const [lastAction, setLastAction] = useState("");

  const send = (action: string, extra: Record<string, unknown> = {}) => {
    sendCommand({ action, ...extra });
    setLastAction(action);
    setTimeout(() => setLastAction(""), 2000);
  };

  if (!isConnected) {
    return (
      <div style={{ padding: "24px 16px", textAlign: "center" }}>
        <AlertCircle size={32} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Connect to your game first</div>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 4 }}>Go to the Live tab to connect</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Cheats</h1>

      {/* Status flash */}
      {lastAction && (
        <div style={{
          padding: "8px 12px", borderRadius: 8, marginBottom: 12,
          background: "rgba(72,191,227,0.1)", border: "1px solid rgba(72,191,227,0.2)",
          fontSize: 12, color: "#48bfe3", textAlign: "center",
        }}>
          Sent: {lastAction}
        </div>
      )}

      {/* Add Gold */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Coins size={16} style={{ color: "#f4a261" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Add Gold</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            value={goldAmount}
            onChange={(e) => setGoldAmount(e.target.value)}
            style={{
              flex: 1, padding: "0 12px", height: 44, borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#e8e8ef", fontSize: 16, fontFamily: "JetBrains Mono, monospace",
              outline: "none",
            }}
          />
          <button
            onClick={() => send("add_gold", { value: parseInt(goldAmount) || 0 })}
            disabled={!goldAmount}
            style={{
              height: 44, padding: "0 20px", borderRadius: 8,
              background: "#f4a261", color: "#000", fontWeight: 600, fontSize: 13,
              border: "none", cursor: "pointer", opacity: goldAmount ? 1 : 0.4,
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[100, 500, 1000, 5000].map((amt) => (
            <button
              key={amt}
              onClick={() => { setGoldAmount(String(amt)); send("add_gold", { value: amt }); }}
              style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: "rgba(244,162,97,0.1)", border: "1px solid rgba(244,162,97,0.15)",
                color: "#f4a261", cursor: "pointer",
              }}
            >
              +{amt}
            </button>
          ))}
        </div>
      </section>

      {/* Rest */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Moon size={16} style={{ color: "#8b5cf6" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Trigger Rest</span>
        </div>
        <button
          onClick={() => send("trigger_rest")}
          style={{
            width: "100%", height: 48, borderRadius: 8,
            background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)",
            color: "#8b5cf6", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          Long Rest
        </button>
      </section>

      {/* Quick Items */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Package size={16} style={{ color: "#52b788" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Spawn Items</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {QUICK_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => send("give_item", { itemId: item.id })}
              style={{
                padding: "10px 12px", borderRadius: 8, textAlign: "left",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      {/* Custom Item ID */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Package size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Custom Item</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder="Item template ID..."
            style={{
              flex: 1, padding: "0 12px", height: 44, borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#e8e8ef", fontSize: 13, fontFamily: "JetBrains Mono, monospace",
              outline: "none",
            }}
          />
          <button
            onClick={() => send("give_item", { itemId: customItem })}
            disabled={!customItem.trim()}
            style={{
              height: 44, padding: "0 16px", borderRadius: 8,
              background: "rgba(82,183,136,0.15)", border: "1px solid rgba(82,183,136,0.2)",
              color: "#52b788", fontWeight: 600, fontSize: 13,
              cursor: "pointer", opacity: customItem.trim() ? 1 : 0.3,
            }}
          >
            Spawn
          </button>
        </div>
      </section>
    </div>
  );
}
