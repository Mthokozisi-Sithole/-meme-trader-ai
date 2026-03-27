"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Alert } from "@/types";

const LINKS = [
  { href: "/", label: "Terminal" },
  { href: "/sniper", label: "Sniper" },
  { href: "/analytics", label: "Analytics" },
  { href: "/tokens", label: "DEX Tokens" },
  { href: "/coins", label: "Coins" },
  { href: "/alerts", label: "Alerts" },
];

export function Nav() {
  const pathname = usePathname();

  const { data: alerts } = useSWR<Alert[]>(
    "/alerts/unread",
    () => api.alerts.list(true),
    { refreshInterval: 10_000 }
  );
  const unread = alerts?.length ?? 0;

  return (
    <nav
      className="sticky top-0 z-50 flex items-center gap-1 px-4 py-2 border-b"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
        <div className="w-6 h-6 rounded" style={{ background: "linear-gradient(135deg, #4488ff, #a855f7)" }} />
        <span className="text-sm font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>
          MEME<span style={{ color: "var(--blue)" }}>TRADER</span>
          <span style={{ color: "var(--text-secondary)" }}>.AI</span>
        </span>
      </Link>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 mr-4 px-2 py-1 rounded text-xs"
        style={{ background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.2)" }}>
        <div className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: "var(--green)" }} />
        <span style={{ color: "var(--green)" }}>LIVE</span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-0.5">
        {LINKS.map(({ href, label }) => {
          const isActive = pathname === href;
          const isAlerts = label === "Alerts";
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative text-xs px-3 py-1.5 rounded transition-all",
                isActive
                  ? "font-semibold"
                  : "hover:opacity-100"
              )}
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive ? "var(--bg-card)" : "transparent",
                border: isActive ? "1px solid var(--border)" : "1px solid transparent",
              }}
            >
              {label}
              {isAlerts && unread > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                  style={{ background: "var(--red)", color: "white" }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Timestamp */}
      <div className="ml-auto text-xs mono" style={{ color: "var(--text-dim)" }}>
        <LiveClock />
      </div>
    </nav>
  );
}

function LiveClock() {
  const [time, setTime] = React.useState("");

  React.useEffect(() => {
    const tick = () => setTime(new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span>{time}</span>;
}

import React from "react";
