"use client";

import { usePathname, useRouter } from "next/navigation";
import { Activity, BookOpen, Gamepad2, Settings, Map } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const tabs = [
    { href: "/", label: t("nav.live"), icon: Activity },
    { href: "/browse", label: t("nav.browse") || "Browse", icon: BookOpen },
    { href: "/games", label: t("nav.games") || "Games", icon: Gamepad2 },
    { href: "/map", label: t("nav.map") || "Map", icon: Map },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: 60, display: "flex", alignItems: "center",
      background: "rgba(10,10,15,0.97)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      zIndex: 1000,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer",
              color: active ? "#c6a255" : "rgba(255,255,255,0.3)",
              transition: "color 0.15s",
              padding: 0, height: "100%",
            }}
          >
            <tab.icon size={20} strokeWidth={active ? 2.2 : 1.5} />
            <span style={{ fontSize: 9, fontWeight: active ? 600 : 400, letterSpacing: 0.3 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
