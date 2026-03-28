"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { LiquidityEvent } from "@/types";

export const dynamic = "force-dynamic";

const EVENT_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  add: { bg: "rgba(0,217,126,0.15)", color: "var(--green)" },
  remove: { bg: "rgba(255,68,102,0.15)", color: "var(--red)" },
  migrate: { bg: "rgba(255,152,0,0.15)", color: "#ff9800" },
  lock: { bg: "rgba(68,136,255,0.15)", color: "var(--blue)" },
  unlock: { bg: "rgba(255,235,59,0.15)", color: "var(--yellow)" },
};

function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  let str: string;
  if (abs >= 1e9) str = `$${(abs / 1e9).toFixed(2)}B`;
  else if (abs >= 1e6) str = `$${(abs / 1e6).toFixed(2)}M`;
  else if (abs >= 1e3) str = `$${(abs / 1e3).toFixed(1)}K`;
  else str = `$${abs.toFixed(0)}`;
  return n < 0 ? `-${str}` : str;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function EventTypeBadge({ type }: { type: LiquidityEvent["event_type"] }) {
  const style = EVENT_TYPE_COLORS[type] ?? { bg: "var(--bg-card)", color: "var(--text-secondary)" };
  return (
    <span
      className="text-[11px] font-semibold px-1.5 py-0.5 uppercase"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}44` }}
    >
      {type}
    </span>
  );
}

function RiskScore({ score }: { score: number }) {
  const color = score > 70 ? "var(--red)" : score > 40 ? "var(--yellow)" : "var(--green)";
  return (
    <span className="mono text-xs font-semibold" style={{ color }}>
      {score}
    </span>
  );
}

function EventsTable({ events }: { events: LiquidityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-sm" style={{ color: "var(--text-dim)" }}>
        No liquidity events yet — events are recorded as the DEX worker detects LP add/remove/migrate activity.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border" style={{ borderColor: "var(--border)" }}>
      <table className="min-w-full divide-y text-sm" style={{ borderColor: "var(--border)" }}>
        <thead style={{ background: "var(--bg-card)" }}>
          <tr>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-dim)" }}>Token</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden sm:table-cell" style={{ color: "var(--text-dim)" }}>Chain</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-dim)" }}>Event</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-dim)" }}>Amount</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden md:table-cell" style={{ color: "var(--text-dim)" }}>% Change</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-dim)" }}>Risk</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden sm:table-cell" style={{ color: "var(--text-dim)" }}>Dev Wallet</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-dim)" }}>Status</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden xl:table-cell" style={{ color: "var(--text-dim)" }}>Time</th>
          </tr>
        </thead>
        <tbody style={{ background: "var(--bg-base)" }}>
          {events.map((e) => (
            <tr
              key={e.id}
              className="transition-colors"
              style={{
                borderBottom: "1px solid var(--border)",
                background: e.is_suspicious ? "rgba(255,68,102,0.03)" : undefined,
              }}
              onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--bg-card)")}
              onMouseLeave={(ev) => (ev.currentTarget.style.background = e.is_suspicious ? "rgba(255,68,102,0.03)" : "transparent")}
            >
              <td className="px-3 py-2">
                <div className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {e.token_symbol ?? e.token_address.slice(0, 8) + "…"}
                </div>
                <div className="text-[11px] mono" style={{ color: "var(--text-dim)" }}>
                  {e.token_address.slice(0, 8)}…
                </div>
              </td>
              <td className="px-3 py-2 text-xs hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                {e.chain.toUpperCase()}
              </td>
              <td className="px-3 py-2">
                <EventTypeBadge type={e.event_type} />
              </td>
              <td className="px-3 py-2 mono text-xs" style={{ color: "var(--text-primary)" }}>
                {fmtUsd(e.amount_usd)}
              </td>
              <td className="px-3 py-2 mono text-xs hidden md:table-cell">
                {e.pct_change != null ? (
                  <span
                    style={{
                      color: e.pct_change >= 0 ? "var(--green)" : "var(--red)",
                      fontWeight: 600,
                    }}
                  >
                    {e.pct_change >= 0 ? "+" : ""}
                    {e.pct_change.toFixed(1)}%
                  </span>
                ) : (
                  <span style={{ color: "var(--text-dim)" }}>—</span>
                )}
              </td>
              <td className="px-3 py-2">
                <RiskScore score={e.risk_score} />
              </td>
              <td className="px-3 py-2 hidden sm:table-cell">
                {e.is_dev_wallet ? (
                  <span
                    className="text-[11px] font-semibold px-1.5 py-0.5"
                    style={{ background: "rgba(68,136,255,0.15)", color: "var(--blue)", border: "1px solid rgba(68,136,255,0.3)" }}
                  >
                    DEV
                  </span>
                ) : (
                  <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>—</span>
                )}
              </td>
              <td className="px-3 py-2">
                {e.is_suspicious ? (
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5"
                    style={{ background: "rgba(255,68,102,0.15)", color: "var(--red)", border: "1px solid rgba(255,68,102,0.4)" }}
                  >
                    SUSPICIOUS
                  </span>
                ) : (
                  <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>—</span>
                )}
              </td>
              <td className="px-3 py-2 text-xs hidden xl:table-cell" style={{ color: "var(--text-dim)" }}>
                {fmtTime(e.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LiquidityPage() {
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [chain, setChain] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "suspicious">("all");

  const { data: allEvents, isLoading, error } = useSWR<LiquidityEvent[]>(
    ["/liquidity/events", chain, suspiciousOnly],
    () =>
      api.liquidity.events({
        chain: chain || undefined,
        is_suspicious: suspiciousOnly || undefined,
        limit: 200,
      }),
    { refreshInterval: 20_000 }
  );

  const { data: suspiciousEvents } = useSWR<LiquidityEvent[]>(
    "/liquidity/suspicious",
    () => api.liquidity.suspicious(),
    { refreshInterval: 20_000 }
  );

  const displayedEvents = activeTab === "suspicious"
    ? (suspiciousEvents ?? [])
    : (allEvents ?? []);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Liquidity Monitor
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
            {allEvents != null ? `${allEvents.length} events tracked` : "Loading…"}
            {suspiciousEvents && suspiciousEvents.length > 0 && (
              <span style={{ color: "var(--red)" }}>
                {" — "}{suspiciousEvents.length} suspicious
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="text-sm px-3 py-2 focus:outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <option value="">All Chains</option>
          <option value="solana">Solana</option>
          <option value="ethereum">Ethereum</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={suspiciousOnly}
            onChange={(e) => setSuspiciousOnly(e.target.checked)}
            className="accent-red-500"
          />
          Suspicious only
        </label>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b" style={{ borderColor: "var(--border)" }}>
        {(["all", "suspicious"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              color: activeTab === tab ? "var(--blue)" : "var(--text-secondary)",
              background: activeTab === tab ? "var(--bg-card)" : "transparent",
              borderBottom: activeTab === tab ? "2px solid var(--blue)" : "2px solid transparent",
            }}
          >
            {tab === "all" ? "All Events" : (
              <span>
                Suspicious Events
                {suspiciousEvents && suspiciousEvents.length > 0 && (
                  <span
                    className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5"
                    style={{ background: "var(--red)", color: "white" }}
                  >
                    {suspiciousEvents.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-16 text-sm" style={{ color: "var(--text-dim)" }}>
          Loading liquidity events…
        </div>
      )}
      {error && (
        <div className="p-4 text-sm border" style={{ background: "rgba(255,68,102,0.08)", borderColor: "rgba(255,68,102,0.3)", color: "var(--red)" }}>
          Failed to load. Is the API running?
        </div>
      )}

      {!isLoading && !error && (
        <EventsTable events={displayedEvents} />
      )}
    </div>
  );
}
