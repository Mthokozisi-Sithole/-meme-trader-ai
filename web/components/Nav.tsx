"use client";

import React, { useState } from "react";
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
  { href: "/wallets", label: "Wallets" },
  { href: "/behavioral", label: "Behavioral" },
  { href: "/liquidity", label: "Liquidity" },
  { href: "/lln", label: "LLN" },
  { href: "/coins", label: "Coins" },
  { href: "/alerts", label: "Alerts" },
];

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: alerts } = useSWR<Alert[]>(
    "/alerts/unread",
    () => api.alerts.list(true),
    { refreshInterval: 10_000 }
  );
  const unread = alerts?.length ?? 0;

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-1 px-4 py-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-3 shrink-0" onClick={() => setMenuOpen(false)}>
          <div className="w-6 h-6" style={{ background: "linear-gradient(135deg, #4488ff, #a855f7)" }} />
          <span className="text-sm font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>
            MEME<span style={{ color: "var(--blue)" }}>TRADER</span>
            <span style={{ color: "var(--text-secondary)" }}>.AI</span>
          </span>
        </Link>

        {/* Live indicator */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 text-xs shrink-0"
          style={{ background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.2)" }}
        >
          <div className="w-1.5 h-1.5 live-dot" style={{ background: "var(--green)" }} />
          <span style={{ color: "var(--green)" }}>LIVE</span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5 ml-2">
          {LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            const isAlerts = label === "Alerts";
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "relative text-xs px-3 py-1.5 transition-all",
                  isActive ? "font-semibold" : "hover:opacity-100"
                )}
                style={{
                  color: isActive ? "var(--blue)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-card)" : "transparent",
                  borderBottom: isActive ? "2px solid var(--blue)" : "2px solid transparent",
                }}
              >
                {label}
                {isAlerts && unread > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold"
                    style={{ background: "var(--red)", color: "white" }}
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Timestamp — desktop only */}
        <div className="hidden sm:block ml-auto text-xs mono shrink-0" style={{ color: "var(--text-dim)" }}>
          <LiveClock />
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="ml-auto md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{ color: "var(--text-secondary)" }}
        >
          <span
            className="block w-5 h-0.5 transition-all origin-center"
            style={{
              background: "currentColor",
              transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block w-5 h-0.5 transition-all"
            style={{
              background: "currentColor",
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-5 h-0.5 transition-all origin-center"
            style={{
              background: "currentColor",
              transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          {LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            const isAlerts = label === "Alerts";
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-sm border-b transition-colors"
                style={{
                  color: isActive ? "var(--blue)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-card)" : "transparent",
                  borderColor: "var(--border)",
                  borderLeft: isActive ? "3px solid var(--blue)" : "3px solid transparent",
                }}
              >
                {label}
                {isAlerts && unread > 0 && (
                  <span
                    className="flex items-center justify-center w-5 h-5 text-[10px] font-bold"
                    style={{ background: "var(--red)", color: "white" }}
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="px-4 py-2 text-xs mono" style={{ color: "var(--text-dim)" }}>
            <LiveClock />
          </div>
        </div>
      )}
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
