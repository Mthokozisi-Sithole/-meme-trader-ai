"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { PatternPerformance, ReturnDistribution } from "@/types";

export const dynamic = "force-dynamic";

const GROUP_TABS = [
  { key: "band",          label: "Signal Band" },
  { key: "narrative",     label: "Narrative" },
  { key: "risk_level",    label: "Risk Level" },
  { key: "liquidity_tier", label: "Liquidity Tier" },
];

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

// ── ROI Histogram ─────────────────────────────────────────────────────────────

function ROIHistogram({ dist }: { dist: ReturnDistribution | undefined }) {
  if (!dist?.histogram_data?.length) return null;
  const maxCount = Math.max(...dist.histogram_data.map((b) => b.count), 1);
  const H = 80;
  const barW = Math.floor(300 / dist.histogram_data.length) - 1;

  return (
    <div className="mt-3">
      <div className="text-[10px] mb-1" style={{ color: "var(--text-dim)" }}>
        Return Distribution
      </div>
      <svg viewBox={`0 0 ${dist.histogram_data.length * (barW + 1)} ${H + 16}`} className="w-full" style={{ height: "80px" }}>
        {dist.histogram_data.map((bucket, i) => {
          const barH = (bucket.count / maxCount) * H;
          const isPositive = bucket.lower >= 0;
          const color = isPositive ? "var(--green)" : "var(--red)";
          return (
            <rect
              key={i}
              x={i * (barW + 1)}
              y={H - barH}
              width={barW}
              height={barH}
              fill={color}
              opacity={0.7}
            />
          );
        })}
        {/* Zero line */}
        {dist.histogram_data.some((b) => b.lower < 0) && dist.histogram_data.some((b) => b.lower >= 0) && (
          <line
            x1={dist.histogram_data.findIndex((b) => b.lower >= 0) * (barW + 1)}
            y1={0}
            x2={dist.histogram_data.findIndex((b) => b.lower >= 0) * (barW + 1)}
            y2={H}
            stroke="var(--text-dim)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}
        <text x={0} y={H + 12} fontSize="8" fill="var(--text-dim)">
          {fmt(dist.p10)}%
        </text>
        <text x={dist.histogram_data.length * (barW + 1)} y={H + 12} textAnchor="end" fontSize="8" fill="var(--text-dim)">
          {fmt(dist.p90)}%
        </text>
      </svg>
    </div>
  );
}

// ── Pattern Row (expandable) ──────────────────────────────────────────────────

function PatternRow({
  p,
  dist,
  isExpanded,
  onToggle,
}: {
  p: PatternPerformance;
  dist: ReturnDistribution | undefined;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const ev = p.expected_value;
  const wr = p.win_rate;

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer transition-colors hover:opacity-90"
        style={{ background: isExpanded ? "rgba(68,136,255,0.06)" : "transparent", borderBottom: "1px solid var(--border)" }}
      >
        <td className="py-2 px-3">
          <div className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>
            {p.group_value}
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
            n={p.sample_size}
          </div>
        </td>
        <td className="py-2 px-3 text-right">
          <span className="mono text-xs font-bold" style={{ color: wr != null && wr >= 0.5 ? "var(--green)" : "var(--red)" }}>
            {fmtPct(wr)}
          </span>
          {p.ci_lower != null && p.ci_upper != null && (
            <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
              [{fmtPct(p.ci_lower)}, {fmtPct(p.ci_upper)}]
            </div>
          )}
        </td>
        <td className="py-2 px-3 text-right">
          <span className="mono text-xs font-bold" style={{ color: evColor(ev) }}>
            {fmt(ev)}%
          </span>
        </td>
        <td className="py-2 px-3 text-right mono text-xs hidden md:table-cell">
          {fmt(p.avg_roi)}%
        </td>
        <td className="py-2 px-3 text-right mono text-xs hidden lg:table-cell">
          {fmt(p.sharpe_ratio, 2)}
        </td>
        <td className="py-2 px-3 text-right mono text-xs hidden lg:table-cell">
          {fmt(p.profit_factor, 2)}
        </td>
        <td className="py-2 px-3 text-center text-[10px]">
          {p.probability_positive_ev != null && (
            <span
              className="px-1.5 py-0.5"
              style={{
                background: (p.probability_positive_ev) >= 0.6 ? "rgba(0,217,126,0.15)" : "rgba(255,68,102,0.15)",
                color: (p.probability_positive_ev) >= 0.6 ? "var(--green)" : "var(--red)",
                border: `1px solid ${(p.probability_positive_ev) >= 0.6 ? "rgba(0,217,126,0.3)" : "rgba(255,68,102,0.3)"}`,
              }}
            >
              {(p.probability_positive_ev * 100).toFixed(0)}% P(EV&gt;0)
            </span>
          )}
        </td>
        <td className="py-2 px-2 text-right text-xs" style={{ color: "var(--text-dim)" }}>
          {isExpanded ? "▲" : "▼"}
        </td>
      </tr>

      {isExpanded && (
        <tr style={{ background: "var(--bg-card)" }}>
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-2">
              {[
                { label: "Avg MFE", value: fmt(p.avg_mfe) + "%" },
                { label: "Avg MAE", value: fmt(p.avg_mae) + "%" },
                { label: "Median ROI", value: fmt(p.median_roi) + "%" },
                { label: "Sortino", value: fmt(p.sortino_ratio, 2) },
                { label: "Bayesian WR", value: fmtPct(p.bayesian_win_rate) },
                { label: "Wins", value: p.win_count.toString() },
                { label: "Losses", value: p.loss_count.toString() },
                { label: "Neutral", value: p.neutral_count.toString() },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>{label}</div>
                  <div className="font-bold mono" style={{ color: "var(--text-primary)" }}>{value}</div>
                </div>
              ))}
            </div>
            {dist && <ROIHistogram dist={dist} />}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PatternsPage() {
  const [activeGroup, setActiveGroup] = useState("band");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: patterns, isLoading } = useSWR<PatternPerformance[]>(
    ["lln/patterns", activeGroup],
    () => api.lln.patterns({ group_by: activeGroup, min_sample: 3 }),
    { refreshInterval: 30_000 }
  );

  const { data: distributions } = useSWR<ReturnDistribution[]>(
    ["lln/distributions", activeGroup],
    () => api.lln.distributions(activeGroup),
    { refreshInterval: 60_000 }
  );

  const sorted = [...(patterns || [])].sort(
    (a, b) => (b.expected_value || -Infinity) - (a.expected_value || -Infinity)
  );

  const getDistFor = (value: string) =>
    distributions?.find((d) => d.group_by === activeGroup && d.group_value === value);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold mono" style={{ color: "var(--text-primary)" }}>
          Pattern Intelligence
        </h1>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          Statistical performance grouped by signal properties · click any row to expand
        </p>
      </div>

      {/* Group tabs */}
      <div className="flex gap-1 flex-wrap">
        {GROUP_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveGroup(key); setExpandedRow(null); }}
            className="px-3 py-1.5 text-xs transition-all"
            style={{
              background: activeGroup === key ? "rgba(68,136,255,0.15)" : "var(--bg-card)",
              color: activeGroup === key ? "var(--blue)" : "var(--text-secondary)",
              border: `1px solid ${activeGroup === key ? "rgba(68,136,255,0.4)" : "var(--border)"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                <th className="py-2 px-3 text-left font-semibold" style={{ color: "var(--text-secondary)" }}>Group</th>
                <th className="py-2 px-3 text-right font-semibold" style={{ color: "var(--text-secondary)" }}>Win Rate</th>
                <th className="py-2 px-3 text-right font-semibold" style={{ color: "var(--text-secondary)" }}>EV</th>
                <th className="py-2 px-3 text-right font-semibold hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>Avg ROI</th>
                <th className="py-2 px-3 text-right font-semibold hidden lg:table-cell" style={{ color: "var(--text-secondary)" }}>Sharpe</th>
                <th className="py-2 px-3 text-right font-semibold hidden lg:table-cell" style={{ color: "var(--text-secondary)" }}>Profit Factor</th>
                <th className="py-2 px-3 text-center font-semibold" style={{ color: "var(--text-secondary)" }}>Confidence</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs" style={{ color: "var(--text-dim)" }}>
                    Loading patterns…
                  </td>
                </tr>
              ) : !sorted.length ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs" style={{ color: "var(--text-dim)" }}>
                    Accumulating data — patterns appear once ≥3 outcomes are recorded per group.
                  </td>
                </tr>
              ) : (
                sorted.map((p) => {
                  const key = `${p.group_by}:${p.group_value}`;
                  return (
                    <PatternRow
                      key={key}
                      p={p}
                      dist={getDistFor(p.group_value)}
                      isExpanded={expandedRow === key}
                      onToggle={() => setExpandedRow(expandedRow === key ? null : key)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
