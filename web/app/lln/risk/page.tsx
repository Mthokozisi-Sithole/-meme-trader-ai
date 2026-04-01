"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { RiskSummary, SimulationResult } from "@/types";

export const dynamic = "force-dynamic";

function fmt(n: number | null | undefined, d = 1) {
  return n == null ? "—" : n.toFixed(d);
}
function fmtPct(n: number | null | undefined) {
  return n == null ? "—" : (n * 100).toFixed(1) + "%";
}

// ── Equity Curve ──────────────────────────────────────────────────────────────

function EquityCurve({ sim }: { sim: SimulationResult }) {
  const p10 = sim.equity_p10 || [];
  const p50 = sim.equity_p50 || [];
  const p90 = sim.equity_p90 || [];
  if (!p50.length) return null;

  const allVals = [...p10, ...p50, ...p90].filter(Boolean);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const W = 360, H = 100, pad = 6;
  const n = p50.length;

  const toX = (i: number) => pad + (i / (n - 1)) * (W - pad * 2);
  const toY = (v: number) => H - pad - ((v - minV) / range) * (H - pad * 2);

  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");

  const isBullish = (p50[p50.length - 1] || 0) >= 10000;
  const mainColor = isBullish ? "var(--green)" : "var(--red)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "100px" }}>
      {/* Shade band */}
      <path
        d={
          path(p90) +
          " " +
          [...p10].reverse().map((v, i) => `L${toX(p10.length - 1 - i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ") +
          " Z"
        }
        fill={isBullish ? "rgba(0,217,126,0.07)" : "rgba(255,68,102,0.07)"}
      />
      <path d={path(p90)} fill="none" stroke={mainColor} strokeWidth="1" strokeOpacity={0.3} strokeDasharray="3 3" />
      <path d={path(p10)} fill="none" stroke={mainColor} strokeWidth="1" strokeOpacity={0.3} strokeDasharray="3 3" />
      <path d={path(p50)} fill="none" stroke={mainColor} strokeWidth="2" />
      {/* Baseline */}
      <line x1={pad} y1={toY(10000).toFixed(1)} x2={W - pad} y2={toY(10000).toFixed(1)}
        stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
  );
}

// ── Simulation Card ───────────────────────────────────────────────────────────

const STRATEGY_LABELS: Record<string, string> = {
  all_signals:     "All Signals",
  strong_buy:      "Strong Buy",
  watch_strong_buy:"Watch + Strong Buy",
  ai_narrative:    "AI Narrative",
  low_risk:        "Low Risk",
};

function SimCard({ sim }: { sim: SimulationResult }) {
  const label = STRATEGY_LABELS[sim.strategy] || sim.strategy;
  const survival = sim.survival_probability || 0;
  const isGood = survival >= 0.8;
  const rorBad = (sim.risk_of_ruin || 0) > 0.2;

  return (
    <div className="p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>{label}</div>
        <div className="text-[10px] mono" style={{ color: "var(--text-dim)" }}>
          {sim.n_simulations.toLocaleString()} sims × {sim.n_trades} trades
        </div>
      </div>

      <EquityCurve sim={sim} />

      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        <div>
          <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>Median Final</div>
          <div className="mono font-bold" style={{ color: (sim.median_final_equity || 0) >= 10000 ? "var(--green)" : "var(--red)" }}>
            ${fmt(sim.median_final_equity, 0)}
          </div>
        </div>
        <div>
          <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>Survival P</div>
          <div className="mono font-bold" style={{ color: isGood ? "var(--green)" : "var(--red)" }}>
            {fmtPct(sim.survival_probability)}
          </div>
        </div>
        <div>
          <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>Risk of Ruin</div>
          <div className="mono font-bold" style={{ color: rorBad ? "var(--red)" : "var(--green)" }}>
            {fmtPct(sim.risk_of_ruin)}
          </div>
        </div>
        <div>
          <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>Max DD (P90)</div>
          <div className="mono font-bold" style={{ color: (sim.max_drawdown_worst || 0) > 50 ? "var(--red)" : "var(--yellow)" }}>
            {fmt(sim.max_drawdown_worst)}%
          </div>
        </div>
      </div>

      {/* Percentile range */}
      <div className="flex items-center gap-1 mt-2 text-[10px]">
        <span style={{ color: "var(--red)" }}>P10 ${fmt(sim.p10_final_equity, 0)}</span>
        <span style={{ color: "var(--text-dim)" }}>·</span>
        <span style={{ color: "var(--text-secondary)" }}>P50 ${fmt(sim.median_final_equity, 0)}</span>
        <span style={{ color: "var(--text-dim)" }}>·</span>
        <span style={{ color: "var(--green)" }}>P90 ${fmt(sim.p90_final_equity, 0)}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RiskLabPage() {
  const { data: risk, isLoading } = useSWR<RiskSummary>(
    "lln/risk",
    () => api.lln.risk(),
    { refreshInterval: 60_000 }
  );

  const sims = risk?.simulations || [];
  const allSim = sims.find((s) => s.strategy === "all_signals");

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-lg font-bold mono" style={{ color: "var(--text-primary)" }}>
          Risk Lab
        </h1>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          Monte Carlo simulation · drawdown scenarios · risk of ruin · survival probability
        </p>
      </div>

      {/* Global risk banner */}
      {allSim && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Global Survival P", value: fmtPct(allSim.survival_probability), good: (allSim.survival_probability || 0) >= 0.8 },
            { label: "Risk of Ruin", value: fmtPct(allSim.risk_of_ruin), good: (allSim.risk_of_ruin || 1) < 0.2 },
            { label: "Max DD (Median)", value: fmt(allSim.max_drawdown_median) + "%", good: false },
            { label: "Max DD (Worst 10%)", value: fmt(allSim.max_drawdown_worst) + "%", good: false },
          ].map(({ label, value, good }) => (
            <div key={label} className="p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="text-[10px] uppercase" style={{ color: "var(--text-dim)" }}>{label}</div>
              <div className="text-lg font-bold mono" style={{ color: good ? "var(--green)" : "var(--red)" }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simulation cards */}
      {isLoading ? (
        <div className="text-xs py-8 text-center" style={{ color: "var(--text-dim)" }}>
          Loading simulations…
        </div>
      ) : !sims.length ? (
        <div
          className="p-6 text-xs text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
        >
          Monte Carlo simulations require ≥10 signal outcomes. The LLN worker runs every 60 seconds.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sims.map((sim) => (
            <SimCard key={sim.strategy} sim={sim} />
          ))}
        </div>
      )}

      {/* Methodology note */}
      <div
        className="p-4 text-xs space-y-1"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
      >
        <div className="font-semibold" style={{ color: "var(--text-secondary)" }}>Methodology</div>
        <div>Starting equity: <span className="mono">$10,000</span> · Risk per trade: <span className="mono">2%</span></div>
        <div>Returns are sampled with replacement from historical signal outcomes.</div>
        <div>
          <span style={{ color: "var(--green)" }}>P90 curve</span> = best-case scenario ·{" "}
          <span style={{ color: "var(--text-secondary)" }}>P50 curve</span> = median outcome ·{" "}
          <span style={{ color: "var(--red)" }}>P10 curve</span> = worst-case scenario
        </div>
        <div>Survival = equity &gt; $0 after {sims[0]?.n_trades || 100} trades</div>
      </div>
    </div>
  );
}
