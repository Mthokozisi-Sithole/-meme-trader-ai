"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LLN_PAGES = [
  { href: "/lln",            label: "Terminal",   icon: "⚡" },
  { href: "/lln/patterns",   label: "Patterns",   icon: "🔬" },
  { href: "/lln/strategies", label: "Strategies", icon: "♟️" },
  { href: "/lln/outcomes",   label: "Outcomes",   icon: "📊" },
  { href: "/lln/risk",       label: "Risk Lab",   icon: "🎲" },
  { href: "/lln/regimes",    label: "Regimes",    icon: "🌊" },
  { href: "/lln/features",   label: "Features",   icon: "🧩" },
];

export default function LLNLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      {/* LLN sub-navigation */}
      <div
        className="border-b px-4 overflow-x-auto"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-1 py-1 min-w-max">
          {/* Section badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold tracking-widest mr-3 shrink-0"
            style={{
              background: "rgba(68,136,255,0.15)",
              border: "1px solid rgba(68,136,255,0.35)",
              color: "var(--blue)",
            }}
          >
            ∑ LLN QUANT
          </div>

          {LLN_PAGES.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap transition-all",
                  isActive ? "font-semibold" : "opacity-60 hover:opacity-100"
                )}
                style={{
                  color: isActive ? "var(--blue)" : "var(--text-secondary)",
                  background: isActive ? "rgba(68,136,255,0.1)" : "transparent",
                  borderBottom: isActive ? "2px solid var(--blue)" : "2px solid transparent",
                }}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
