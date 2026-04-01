"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { LLNOverview, PatternPerformance, SimulationResult } from "@/types";

export const dynamic = "force-dynamic";

function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null) return "—";
  return n.toFixed(digits);
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n * 100).toFixed(1) + "%";
}

function evColor(ev: number | null | undefined): string {
  if (ev == null) return "var(--text-dim)";
  return ev >= 0 ? "var(--green)" : "var(--red)";
}

function bandColor(band: string | null | undefined): string {
  if (!band) return "var(--text-dim)";
  if (band === "Strong Buy") return "var(--green)";
  if (band === "Watch") return "var(--yellow)";
  if (band === "Risky") return "#f97316";
  return "var(--red)";
}

function regimeColor(regime: string | null | undefined): string {
  if (!regime) return "var(--text-dim)";
  if (regime === "trending") return "var(--green)";
  if (regime === "volatile") return "var(--red)";
  if (regime === "low_liquidity") return "#f97316";
  return "var(--yellow)";
}

// ── Equity Curve Chart ────────────────────────────────────────────────────────

function EquityCurve({ sim }: { sim: SimulationResult | undefined }) {
  if (!sim?.equity_p50?.length) {
    return (
      <div
        className="flex items-center justify-center h-40 text-xs"
        style={{ color: "var(--text-dim)", border: "1px dashed var(--border)" }}
      >
        Simulation data accumulating...
      </div>
    );
  }

  const p10 = sim.equity_p10 || [];
  const p50 = sim.equity_p50 || [];
  const p90 = sim.equity_p90 || [];
  const allVals = [...p10, ...p50, ...p90].filter(Boolean);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const W = 400;
  const H = 120;
  const pad = 8;
  const n = p50.length;

  const toX = (i: number) => pad + (i / (n - 1)) * (W - pad * 2);
  const toY = (v: number) => H - pad - ((v - minV) / range) * (H - pad * 2);

  const pathFor = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");

  const isBullish = (p50[p50.length - 1] || 0) > (p50[0] || 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "140px" }}>
      {/* Band fill P10-P90 */}
      <path
        d={
          pathFor(p90) +
          " " +
          p10
            .slice()
            .reverse()
            .map((v, i) => `${i === 0 ? "L" : "L"}${toX(p10.length - 1 - i).toFixed(1)},${toY(v).toFixed(1)}`)
            .join(" ") +
          " Z"
        }
        fill={isBullish ? "rgba(0,217,126,0.08)" : "rgba(255,68,102,0.08)"}
      />
      {/* P10 and P90 dashed */}
      <path d={pathFor(p90)} fill="none" stroke={isBullish ? "rgba(0,217,126,0.3)" : "rgba(255,68,102,0.3)"} strokeWidth="1" strokeDasharray="3 3" />
      <path d={pathFor(p10)} fill="none" stroke={isBullish ? "rgba(0,217,126,0.3)" : "rgba(255,68,102,0.3)"} strokeWidth="1" strokeDasharray="3 3" />
      {/* Median P50 */}
      <path d={pathFor(p50)} fill="none" stroke={isBullish ? "var(--green)" : "var(--red)"} strokeWidth="2" />
      {/* Baseline $10k */}
      <line
        x1={pad} y1={toY(10000).toFixed(1)} x2={W - pad} y2={toY(10000).toFixed(1)}
        stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4"
      />
    </svg>
  );
}

// ── Win/Loss donut ────────────────────────────────────────────────────────────

function OutcomeDonut({ wins, losses, neutrals }: { wins: number; losses: number; neutrals: number }) {
  const total = wins + losses + neutrals || 1;
  const winPct = (wins / total) * 100;
  const lossPct = (losses / total) * 100;

  const r = 36;
  const cx = 48;
  const cy = 48;
  const circ = 2 * Math.PI * r;

  const winArc = (winPct / 100) * circ;
  const lossArc = (lossPct / 100) * circ;
  const neutralArc = circ - winArc - lossArc;

  const offset0 = 0;
  const offset1 = offset0 + winArc;
  const offset2 = offset1 + lossArc;

  return (
    <svg viewBox="0 0 96 96" width="96" height="96">
      {/* Neutral */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="rgba(100,116,139,0.3)" strokeWidth="12"
        strokeDasharray={`${neutralArc} ${circ - neutralArc}`}
        strokeDashoffset={-offset2}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Loss */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="var(--red)" strokeWidth="12"
        strokeDasharray={`${lossArc} ${circ - lossArc}`}
        strokeDashoffset={-offset1}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Win */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="var(--green)" strokeWidth="12"
        strokeDasharray={`${winArc} ${circ - winArc}`}
        strokeDashoffset={-offset0}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--green)" fontSize="13" fontWeight="bold" fontFamily="monospace">
        {(winPct).toFixed(0)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-dim)" fontSize="8">
        WIN
      </text>
    </svg>
  );
}

export default function LLNTerminalPage() {
  const { data: overview, isLoading: ovLoading } = useSWR<LLNOverview>(
    "lln/overview",
    () => api.lln.overview(),
    { refreshInterval: 30_000 }
  );

  const { data: topPatterns } = useSWR<PatternPerformance[]>(
    "lln/patterns/band",
    () => api.lln.patterns({ group_by: "band", min_sample: 3 }),
    { refreshInterval: 60_000 }
  );

  const { data: simulations } = useSWR<SimulationResult[]>(
    "lln/simulations",
    () => api.lln.simulations(),
    { refreshInterval: 60_000 }
  );

  const allSim = simulations?.find((s) => s.strategy === "all_signals");
  const strongBuySim = simulations?.find((s) => s.strategy === "strong_buy");

  const totalOutcomes = (overview?.win_count || 0) + (overview?.loss_count || 0) + (overview?.neutral_count || 0);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div>
          <h1 className="text-lg font-bold mono" style={{ color: "var(--text-primary)" }}>
            ∑ LLN QUANT ENGINE
          </h1>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
            Law of Large Numbers Intelligence — what works over thousands of observations
          </p>
        </div>
        {overview?.last_computed && (
          <div className="sm:ml-auto text-xs mono" style={{ color: "var(--text-dim)" }}>
            Last computed {new Date(overview.last_computed).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Signals Analyzed", value: (overview?.total_signals_analyzed || 0).toLocaleString(), color: "var(--blue)" },
          { label: "Global Win Rate", value: overview?.global_win_rate != null ? fmtPct(overview.global_win_rate) : "—", color: overview?.global_win_rate != null && overview.global_win_rate >= 0.5 ? "var(--green)" : "var(--red)" },
          { label: "Expected Value", value: overview?.global_ev != null ? fmt(overview.global_ev) + "%" : "—", color: evColor(overview?.global_ev) },
          { label: "Sharpe Ratio", value: overview?.global_sharpe != null ? fmt(overview.global_sharpe, 2) : "—", color: (overview?.global_sharpe || 0) >= 1 ? "var(--green)" : "var(--yellow)" },
          { label: "Best Band", value: overview?.best_band || "—", color: bandColor(overview?.best_band) },
          { label: "Market Regime", value: overview?.current_regime?.toUpperCase() || "DETECTING…", color: regimeColor(overview?.current_regime) },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="p-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>
              {label}
            </div>
            <div className="text-lg font-bold mono" style={{ color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome distribution */}
        <div className="p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xs font-bold mb-4 uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Outcome Distribution
          </h2>
          <div className="flex items-center gap-6">
            <OutcomeDonut
              wins={overview?.win_count || 0}
              losses={overview?.loss_count || 0}
              neutrals={overview?.neutral_count || 0}
            />
            <div className="space-y-2 text-xs">
              {[
                { label: "WIN ≥+50%", count: overview?.win_count || 0, color: "var(--green)" },
                { label: "NEUTRAL", count: overview?.neutral_count || 0, color: "var(--yellow)" },
                { label: "LOSS ≤-30%", count: overview?.loss_count || 0, color: "var(--red)" },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                  <span className="mono ml-auto" style={{ color }}>
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--text-dim)" }}>Total</span>
                <span className="mono ml-2" style={{ color: "var(--text-primary)" }}>
                  {totalOutcomes.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Band performance summary */}
        <div className="p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xs font-bold mb-4 uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Band Performance
          </h2>
          {!topPatterns?.length ? (
            <div className="text-xs" style={{ color: "var(--text-dim)" }}>
              Accumulating data…
            </div>
          ) : (
            <div className="space-y-3">
              {topPatterns
                .filter((p) => p.group_by === "band")
                .sort((a, b) => (b.expected_value || 0) - (a.expected_value || 0))
                .map((p) => (
                  <div key={p.group_value}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: bandColor(p.group_value), fontWeight: "bold" }}>
                        {p.group_value}
                      </span>
                      <span className="mono" style={{ color: evColor(p.expected_value) }}>
                        EV: {fmt(p.expected_value)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
                      <span>WR {fmtPct(p.win_rate)}</span>
                      <span>·</span>
                      <span>n={p.sample_size}</span>
                      <span>·</span>
                      <span>Sharpe {fmt(p.sharpe_ratio, 2)}</span>
                    </div>
                    {/* Win rate bar */}
                    <div className="mt-1 w-full h-1 rounded" style={{ background: "var(--bg-surface)" }}>
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${((p.win_rate || 0) * 100).toFixed(0)}%`,
                          background: bandColor(p.group_value),
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Key metrics */}
        <div className="p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-xs font-bold mb-4 uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Global Risk Metrics
          </h2>
          <div className="space-y-3 text-xs">
            {[
              { label: "Profit Factor", value: fmt(allSim ? undefined : undefined, 2), rawVal: overview?.global_profit_factor },
              { label: "Survival Probability", value: allSim?.survival_probability != null ? fmtPct(allSim.survival_probability) : "—", good: (allSim?.survival_probability || 0) >= 0.8 },
              { label: "Risk of Ruin", value: allSim?.risk_of_ruin != null ? fmtPct(allSim.risk_of_ruin) : "—", good: (allSim?.risk_of_ruin || 1) < 0.2 },
              { label: "Max Drawdown (P50)", value: allSim?.max_drawdown_median != null ? fmt(allSim.max_drawdown_median) + "%" : "—", good: false },
              { label: "Best Narrative", value: overview?.best_narrative || "—", good: true },
            ].map(({ label, value, rawVal, good }) => (
              <div key={label} className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span
                  className="mono font-bold"
                  style={{
                    color: rawVal != null ? evColor(rawVal) : good ? "var(--green)" : (value === "—" ? "var(--text-dim)" : "var(--text-primary)"),
                  }}
                >
                  {rawVal != null ? fmt(rawVal, 2) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monte Carlo Equity Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: "All Signals — Monte Carlo (1,000 simulations)", sim: allSim },
          { title: "Strong Buy Only — Monte Carlo", sim: strongBuySim },
        ].map(({ title, sim }) => (
          <div key={title} className="p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                {title}
              </h2>
              {sim && (
                <span className="text-[10px] mono" style={{ color: "var(--text-dim)" }}>
                  n={sim.sample_size} samples
                </span>
              )}
            </div>
            <EquityCurve sim={sim} />
            {sim && (
              <div className="flex gap-4 mt-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
                <span>
                  Median: <span className="mono" style={{ color: "var(--text-primary)" }}>${(sim.median_final_equity || 0).toFixed(0)}</span>
                </span>
                <span>
                  P10: <span className="mono" style={{ color: "var(--red)" }}>${(sim.p10_final_equity || 0).toFixed(0)}</span>
                </span>
                <span>
                  P90: <span className="mono" style={{ color: "var(--green)" }}>${(sim.p90_final_equity || 0).toFixed(0)}</span>
                </span>
                <span className="ml-auto">Starting: $10,000</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* LLN principle banner */}
      <div
        className="p-4 text-xs"
        style={{
          background: "rgba(68,136,255,0.05)",
          border: "1px solid rgba(68,136,255,0.2)",
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ color: "var(--blue)", fontWeight: "bold" }}>∑ Law of Large Numbers: </span>
        As the number of observations grows, sample statistics converge to true population parameters.
        Metrics shown above are statistically meaningful only once sample sizes exceed ~30 observations per group.
        The LLN worker continuously processes new signals — accuracy improves over time automatically.
      </div>
    </div>
  );
}
