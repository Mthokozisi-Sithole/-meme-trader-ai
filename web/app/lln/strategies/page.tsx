"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { StrategyPerformance } from "@/types";

export const dynamic = "force-dynamic";

function fmt(n: number | null | undefined, d = 1) {
  return n == null ? "—" : n.toFixed(d);
}
function fmtPct(n: number | null | undefined) {
  return n == null ? "—" : (n * 100).toFixed(1) + "%";
}
function evColor(ev: number | null | undefined) {
  if (ev == null) return "var(--text-dim)";
  return ev > 5 ? "var(--green)" : ev > 0 ? "var(--yellow)" : "var(--red)";
}

// ── Strategy Card ─────────────────────────────────────────────────────────────

function StrategyCard({ s }: { s: StrategyPerformance }) {
  const isPositive = (s.expected_value || 0) > 0;
  const accentColor = isPositive ? "var(--green)" : "var(--red)";
  const evBg = isPositive ? "rgba(0,217,126,0.08)" : "rgba(255,68,102,0.08)";
  const evBorder = isPositive ? "rgba(0,217,126,0.25)" : "rgba(255,68,102,0.25)";

  const metrics = [
    { label: "Win Rate", value: fmtPct(s.win_rate), color: (s.win_rate || 0) >= 0.5 ? "var(--green)" : "var(--red)" },
    { label: "Avg ROI", value: fmt(s.avg_roi) + "%", color: (s.avg_roi || 0) >= 0 ? "var(--green)" : "var(--red)" },
    { label: "Median ROI", value: fmt(s.median_roi) + "%", color: (s.median_roi || 0) >= 0 ? "var(--green)" : "var(--red)" },
    { label: "Sharpe", value: fmt(s.sharpe_ratio, 2), color: (s.sharpe_ratio || 0) >= 1 ? "var(--green)" : "var(--yellow)" },
    { label: "Sortino", value: fmt(s.sortino_ratio, 2), color: (s.sortino_ratio || 0) >= 1 ? "var(--green)" : "var(--yellow)" },
    { label: "Profit Factor", value: fmt(s.profit_factor, 2), color: (s.profit_factor || 0) >= 1.5 ? "var(--green)" : "var(--yellow)" },
    { label: "Max Drawdown", value: fmt(s.max_drawdown) + "%", color: "var(--red)" },
    { label: "Risk of Ruin", value: fmtPct(s.risk_of_ruin), color: (s.risk_of_ruin || 1) <= 0.1 ? "var(--green)" : "var(--red)" },
  ];

  return (
    <div
      className="p-4 flex flex-col gap-3"
      style={{ background: "var(--bg-card)", border: `1px solid ${evBorder}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {s.strategy_name}
          </div>
          {s.description && (
            <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>
              {s.description}
            </div>
          )}
        </div>
        {/* EV badge */}
        <div
          className="px-2 py-1 text-sm font-bold mono whitespace-nowrap shrink-0"
          style={{ background: evBg, border: `1px solid ${evBorder}`, color: accentColor }}
        >
          EV: {fmt(s.expected_value)}%
        </div>
      </div>

      {/* Sample size bar */}
      <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
        {s.total_signals} signals · {s.win_count}W / {s.loss_count}L / {s.total_signals - s.win_count - s.loss_count}N
      </div>

      {/* Win/Loss bar */}
      {s.total_signals > 0 && (
        <div className="w-full h-2 flex overflow-hidden rounded-sm">
          <div
            style={{ width: `${((s.win_count / s.total_signals) * 100).toFixed(1)}%`, background: "var(--green)" }}
          />
          <div
            style={{
              width: `${(((s.total_signals - s.win_count - s.loss_count) / s.total_signals) * 100).toFixed(1)}%`,
              background: "rgba(245,197,67,0.5)",
            }}
          />
          <div
            style={{ flex: 1, background: "rgba(255,68,102,0.4)" }}
          />
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-4 gap-2">
        {metrics.map(({ label, value, color }) => (
          <div key={label}>
            <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
              {label}
            </div>
            <div className="text-xs font-bold mono" style={{ color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Calmar ratio if available */}
      {s.calmar_ratio != null && (
        <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
          Calmar Ratio: <span className="mono" style={{ color: "var(--text-secondary)" }}>{fmt(s.calmar_ratio, 2)}</span>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StrategiesPage() {
  const { data: strategies, isLoading } = useSWR<StrategyPerformance[]>(
    "lln/strategies",
    () => api.lln.strategies(),
    { refreshInterval: 30_000 }
  );

  const sorted = [...(strategies || [])].sort(
    (a, b) => (b.expected_value || -Infinity) - (a.expected_value || -Infinity)
  );

  const best = sorted[0];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold mono" style={{ color: "var(--text-primary)" }}>
            Strategy Performance
          </h1>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
            Pre-defined filter combinations evaluated against historical signal outcomes
          </p>
        </div>
        {best && (
          <div
            className="text-xs px-3 py-2 hidden sm:block"
            style={{
              background: "rgba(0,217,126,0.08)",
              border: "1px solid rgba(0,217,126,0.25)",
              color: "var(--green)",
            }}
          >
            Best: <strong>{best.strategy_name}</strong> · EV {fmt(best.expected_value)}%
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-xs py-8 text-center" style={{ color: "var(--text-dim)" }}>
          Loading strategies…
        </div>
      ) : !sorted.length ? (
        <div
          className="p-6 text-xs text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
        >
          Strategy data will appear once the LLN worker has processed ≥5 signal outcomes.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((s) => (
            <StrategyCard key={s.strategy_name} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
