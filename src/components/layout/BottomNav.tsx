"use client";

import { usePathname, useRouter } from "next/navigation";
import { Activity, Zap, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const tabs = [
    { href: "/", label: t("nav.live"), icon: Activity },
    { href: "/cheats", label: t("nav.cheats"), icon: Zap },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: 56, display: "flex", alignItems: "center",
      background: "rgba(10,10,15,0.95)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      zIndex: 1000,
    }}>
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer",
              color: active ? "#48bfe3" : "rgba(255,255,255,0.3)",
              transition: "color 0.15s",
              padding: 0, height: "100%",
            }}
          >
            <tab.icon size={20} strokeWidth={active ? 2.2 : 1.5} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: 0.3 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
