1|"use client";

export const metadata = { title: 'Cheats — Tadpole' };

import { useState } from "react";
import { useGameConnection } from "@/hooks/useGameConnection";
import {
  Coins, Moon, Package, Send, AlertCircle, Heart, Shield, Skull,
  Zap, TrendingUp, Star, Swords, X, Sparkles
} from "lucide-react";

const QUICK_ITEMS = [
  { id: "WPN_Potion_Healing_001", name: "Healing Potion" },
  { id: "WPN_Potion_Healing_Greater_001", name: "Greater Healing" },
  { id: "WPN_Potion_Speed_001", name: "Speed Potion" },
  { id: "WPN_Potion_Invisibility_001", name: "Invisibility Potion" },
  { id: "WPN_Potion_Antidote_001", name: "Antidote" },
  { id: "WPN_Scroll_Revivify_001", name: "Scroll of Revivify" },
];

const QUICK_BUFFS = [
  { id: "HASTE", name: "Haste", duration: 0 },
  { id: "INVISIBILITY", name: "Invisibility", duration: 0 },
  { id: "BLESS", name: "Bless", duration: 0 },
  { id: "MIRROR_IMAGE", name: "Mirror Image", duration: 0 },
  { id: "FLY", name: "Fly", duration: 0 },
  { id: "FREEDOM_OF_MOVEMENT", name: "Freedom of Movement", duration: 0 },
  { id: "ENHANCE_ABILITY", name: "Enhance Ability", duration: 0 },
  { id: "PROTECTION_FROM_EVIL_AND_GOOD", name: "Protection from Evil", duration: 0 },
  { id: "LONGSTRIDER", name: "Longstrider", duration: 0 },
  { id: "RESIST_FIRE", name: "Fire Resistance", duration: 0 },
  { id: "RESIST_COLD", name: "Cold Resistance", duration: 0 },
  { id: "RESIST_LIGHTNING", name: "Lightning Resistance", duration: 0 },
];

const btnStyle = (color: string): React.CSSProperties => ({
  padding: "14px 12px", borderRadius: 10, textAlign: "center",
  background: `rgba(${color},0.1)`, border: `1px solid rgba(${color},0.2)`,
  color: `rgb(${color})`, fontSize: 13, fontWeight: 600, cursor: "pointer",
  minHeight: 44,
});

const sectionHeader = (icon: React.ReactNode, label: string) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
    {icon}
    <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
  </div>
);

export default function CheatsPage() {
  const { isConnected, sendCommand } = useGameConnection();
  const [goldAmount, setGoldAmount] = useState("500");
  const [customItem, setCustomItem] = useState("");
  const [lastAction, setLastAction] = useState("");
  const [godMode, setGodMode] = useState(false);
  const [setLevel, setSetLevel] = useState("12");
  const [setHp, setSetHp] = useState("999");
  const [xpAmount, setXpAmount] = useState("500");
  const [customStatus, setCustomStatus] = useState("");

  const send = (action: string, extra: Record<string, unknown> = {}) => {
    sendCommand({ action, ...extra });
    setLastAction(action);
    setTimeout(() => setLastAction(""), 2000);
  };

  if (!isConnected) {
    return (
      <div style={{ padding: "48px 16px", textAlign: "center" }}>
        <AlertCircle size={32} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Connect to your game first</div>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 4 }}>Go to the Live tab to connect</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", paddingBottom: 80 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#e8e8ef" }}>Cheats</h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>Commands sent via bridge to BG3</p>

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

      {/* === CHARACTER === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<Star size={16} style={{ color: "#c6a255" }} />, "Character")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => send("heal_party")} style={btnStyle("82,183,136")}>
            Heal Party
          </button>
          <button onClick={() => send("revive")} style={btnStyle("231,111,81")}>
            Revive All
          </button>
          <button onClick={() => send("full_restore")} style={{ ...btnStyle("198,162,85"), gridColumn: "1 / -1" }}>
            Full Restore (HP + Statuses + Cooldowns)
          </button>
        </div>
      </section>

      {/* === SET LEVEL === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<TrendingUp size={16} style={{ color: "#a78bfa" }} />, "Set Level")}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number" min={1} max={12} value={setLevel}
            onChange={(e) => setSetLevel(e.target.value)}
            placeholder="1-12"
            style={{
              flex: 1, padding: "0 12px", height: 44, borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#e8e8ef", fontSize: 16, fontFamily: "monospace", outline: "none",
            }}
          />
          <button
            onClick={() => send("set_level", { value: parseInt(setLevel) || 1 })}
            style={{
              height: 44, padding: "0 20px", borderRadius: 8,
              background: "#a78bfa", color: "#000", fontWeight: 600, fontSize: 13,
              border: "none", cursor: "pointer",
            }}
          >
            Set
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((lvl) => (
            <button
              key={lvl}
              onClick={() => { setSetLevel(String(lvl)); send("set_level", { value: lvl }); }}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.15)",
                color: "#a78bfa", cursor: "pointer",
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </section>

      {/* === SET HP === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<Heart size={16} style={{ color: "#f43f5e" }} />, "Set HP")}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number" value={setHp}
            onChange={(e) => setSetHp(e.target.value)}
            placeholder="HP value"
            style={{
              flex: 1, padding: "0 12px", height: 44, borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#e8e8ef", fontSize: 16, fontFamily: "monospace", outline: "none",
            }}
          />
          <button
            onClick={() => send("set_hp", { value: parseInt(setHp) || 100 })}
            style={{
              height: 44, padding: "0 20px", borderRadius: 8,
              background: "#f43f5e", color: "#fff", fontWeight: 600, fontSize: 13,
              border: "none", cursor: "pointer",
            }}
          >
            Set
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[100, 500, 999, 9999].map((hp) => (
            <button
              key={hp}
              onClick={() => { setSetHp(String(hp)); send("set_hp", { value: hp }); }}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.15)",
                color: "#f43f5e", cursor: "pointer",
              }}
            >
              {hp} HP
            </button>
          ))}
        </div>
      </section>

      {/* === ADD XP === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<Sparkles size={16} style={{ color: "#facc15" }} />, "Add XP")}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number" value={xpAmount}
            onChange={(e) => setXpAmount(e.target.value)}
            placeholder="XP amount"
            style={{
              flex: 1, padding: "0 12px", height: 44, borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#e8e8ef", fontSize: 16, fontFamily: "monospace", outline: "none",
            }}
          />
          <button
            onClick={() => send("add_xp", { value: parseInt(xpAmount) || 100 })}
            style={{
              height: 44, padding: "0 20px", borderRadius: 8,
              background: "#facc15", color: "#000", fontWeight: 600, fontSize: 13,
              border: "none", cursor: "pointer",
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[100, 500, 1000, 5000, 10000].map((xp) => (
            <button
              key={xp}
              onClick={() => { setXpAmount(String(xp)); send("add_xp", { value: xp }); }}
              style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.15)",
                color: "#facc15", cursor: "pointer",
              }}
            >
              +{xp}
            </button>
          ))}
        </div>
      </section>

      {/* === GOLD === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<Coins size={16} style={{ color: "#f4a261" }} />, "Gold")}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number" value={goldAmount}
            onChange={(e) => setGoldAmount(e.target.value)}
            style={{
              flex: 1, padding: "0 12px", height: 44, borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#e8e8ef", fontSize: 16, fontFamily: "monospace", outline: "none",
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
          {[100, 500, 1000, 5000, 10000].map((amt) => (
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

      {/* === REST === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<Moon size={16} style={{ color: "#8b5cf6" }} />, "Rest")}
        <button
          onClick={() => send("trigger_rest")}
          style={{
            width: "100%", height: 48, borderRadius: 8,
            background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)",
            color: "#8b5cf6", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          Long Rest (Free)
        </button>
      </section>

      {/* === GOD MODE === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<Shield size={16} style={{ color: "#48bfe3" }} />, "God Mode")}
        <button
          onClick={() => { send("god_mode", { enabled: !godMode }); setGodMode(!godMode); }}
          style={{
            width: "100%", height: 48, borderRadius: 8,
            background: godMode ? "rgba(72,191,227,0.15)" : "rgba(255,255,255,0.04)",
            border: godMode ? "1px solid rgba(72,191,227,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: godMode ? "#48bfe3" : "rgba(255,255,255,0.5)",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Shield size={18} />
          {godMode ? "God Mode: ON" : "God Mode: OFF"}
        </button>
      </section>

      {/* === BUFFS === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<Zap size={16} style={{ color: "#48bfe3" }} />, "Quick Buffs")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {QUICK_BUFFS.map((buff) => (
            <button
              key={buff.id}
              onClick={() => send("apply_status", { statusId: buff.id, duration: 0 })}
              style={{
                padding: "12px", borderRadius: 8, textAlign: "left",
                background: "rgba(72,191,227,0.06)", border: "1px solid rgba(72,191,227,0.12)",
                color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer",
                minHeight: 44,
              }}
            >
              {buff.name}
            </button>
          ))}
        </div>
      </section>

      {/* === CUSTOM STATUS === */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Zap size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Custom Status</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text" value={customStatus}
            onChange={(e) => setCustomStatus(e.target.value)}
            placeholder="Status ID (e.g. HASTE)..."
            style={{
              flex: 1, padding: "0 12px", height: 44, borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#e8e8ef", fontSize: 13, fontFamily: "monospace", outline: "none",
            }}
          />
          <button
            onClick={() => send("apply_status", { statusId: customStatus, duration: 0 })}
            disabled={!customStatus.trim()}
            style={{
              height: 44, padding: "0 16px", borderRadius: 8,
              background: "rgba(72,191,227,0.15)", border: "1px solid rgba(72,191,227,0.2)",
              color: "#48bfe3", fontWeight: 600, fontSize: 13,
              cursor: "pointer", opacity: customStatus.trim() ? 1 : 0.3,
            }}
          >
            Apply
          </button>
          <button
            onClick={() => send("remove_status", { statusId: customStatus })}
            disabled={!customStatus.trim()}
            style={{
              height: 44, padding: "0 16px", borderRadius: 8,
              background: "rgba(231,111,81,0.15)", border: "1px solid rgba(231,111,81,0.2)",
              color: "#e76f51", fontWeight: 600, fontSize: 13,
              cursor: "pointer", opacity: customStatus.trim() ? 1 : 0.3,
            }}
          >
            <X size={16} />
          </button>
        </div>
      </section>

      {/* === SPAWN ITEMS === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<Package size={16} style={{ color: "#52b788" }} />, "Spawn Items")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {QUICK_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => send("give_item", { itemId: item.id })}
              style={{
                padding: "12px", borderRadius: 8, textAlign: "left",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer",
                minHeight: 44,
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      {/* === CUSTOM ITEM === */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Package size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Custom Item</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text" value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder="Item template ID..."
            style={{
              flex: 1, padding: "0 12px", height: 44, borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#e8e8ef", fontSize: 13, fontFamily: "monospace", outline: "none",
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

      {/* === COMBAT === */}
      <section style={{ marginBottom: 24 }}>
        {sectionHeader(<Swords size={16} style={{ color: "#e76f51" }} />, "Combat")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => send("toggle_combat")} style={btnStyle("231,111,81")}>
            Toggle Combat
          </button>
          <button onClick={() => send("reset_cooldowns")} style={btnStyle("139,92,246")}>
            Reset Cooldowns
          </button>
        </div>
      </section>
    </div>
  );
}
