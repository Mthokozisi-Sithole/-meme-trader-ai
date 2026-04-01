"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { RegimeStat } from "@/types";

export const dynamic = "force-dynamic";

function fmt(n: number | null | undefined, d = 1) {
  return n == null ? "—" : n.toFixed(d);
}
function fmtPct(n: number | null | undefined) {
  return n == null ? "—" : (n * 100).toFixed(1) + "%";
}

const REGIME_META: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  trending:      { label: "Trending",      color: "var(--green)",  bg: "rgba(0,217,126,0.08)",  desc: "Avg change >5% + buy pressure >60%" },
  volatile:      { label: "Volatile",      color: "var(--red)",    bg: "rgba(255,68,102,0.08)", desc: "Price std dev >25%" },
  low_liquidity: { label: "Low Liquidity", color: "var(--yellow)", bg: "rgba(245,197,67,0.08)", desc: "Avg liquidity <$5k" },
  ranging:       { label: "Ranging",       color: "var(--blue)",   bg: "rgba(68,136,255,0.08)", desc: "No dominant condition" },
};

function regimeMeta(regime: string) {
  return REGIME_META[regime] || { label: regime, color: "var(--text-secondary)", bg: "var(--bg-card)", desc: "" };
}

// ── Regime Timeline ───────────────────────────────────────────────────────────

function RegimeTimeline({ regimes }: { regimes: RegimeStat[] }) {
  if (!regimes.length) return null;

  // Show last 20 regime snapshots as a horizontal band
  const recent = [...regimes].slice(0, 20).reverse();
  const W = 360, H = 32;
  const slotW = W / recent.length;

  const regimeColor = (r: string): string => {
    if (r === "trending") return "rgba(0,217,126,0.7)";
    if (r === "volatile") return "rgba(255,68,102,0.7)";
    if (r === "low_liquidity") return "rgba(245,197,67,0.7)";
    return "rgba(68,136,255,0.5)";
  };

  return (
    <div>
      <div className="text-[10px] mb-1" style={{ color: "var(--text-dim)" }}>
        Regime History (most recent →)
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "32px" }}>
        {recent.map((r, i) => (
          <rect
            key={i}
            x={i * slotW}
            y={0}
            width={slotW - 1}
            height={H}
            fill={regimeColor(r.regime)}
            rx={1}
          />
        ))}
      </svg>
      <div className="flex gap-3 mt-1 flex-wrap">
        {Object.entries(REGIME_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-1 text-[9px]" style={{ color: "var(--text-dim)" }}>
            <div className="w-2 h-2 rounded-sm" style={{ background: meta.color, opacity: 0.7 }} />
            {meta.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Regime Card ───────────────────────────────────────────────────────────────

function RegimeCard({ r }: { r: RegimeStat }) {
  const meta = regimeMeta(r.regime);
  const date = r.detected_at ? new Date(r.detected_at).toLocaleString() : "—";

  return (
    <div
      className="p-4 space-y-3"
      style={{
        background: r.is_current ? meta.bg : "var(--bg-card)",
        border: `1px solid ${r.is_current ? meta.color : "var(--border)"}`,
        opacity: r.is_current ? 1 : 0.75,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: meta.color }}>
              {meta.label}
            </span>
            {r.is_current && (
              <span
                className="px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: meta.color, color: "var(--bg-surface)" }}
              >
                CURRENT
              </span>
            )}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>
            {meta.desc}
          </div>
        </div>
        <div className="text-[10px] mono text-right" style={{ color: "var(--text-dim)" }}>
          {date}
        </div>
      </div>

      {/* Market conditions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {[
          { label: "Avg Δ1h", value: fmt(r.avg_price_change_1h) + "%", color: (r.avg_price_change_1h || 0) >= 0 ? "var(--green)" : "var(--red)" },
          { label: "Volatility", value: fmt(r.price_change_stddev) + "%", color: "var(--text-secondary)" },
          { label: "Avg Liq", value: r.avg_liquidity != null ? "$" + (r.avg_liquidity >= 1000 ? (r.avg_liquidity / 1000).toFixed(1) + "k" : r.avg_liquidity.toFixed(0)) : "—", color: "var(--text-secondary)" },
          { label: "Buy Pressure", value: fmt(r.avg_buy_pressure) + "%", color: (r.avg_buy_pressure || 0) >= 50 ? "var(--green)" : "var(--yellow)" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>{label}</div>
            <div className="mono font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Performance in this regime */}
      {(r.avg_win_rate != null || r.avg_roi != null) && (
        <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="text-[10px] mb-2" style={{ color: "var(--text-dim)" }}>
            Signal performance during this regime
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>Win Rate</div>
              <div className="mono font-bold" style={{ color: (r.avg_win_rate || 0) >= 0.5 ? "var(--green)" : "var(--red)" }}>
                {fmtPct(r.avg_win_rate)}
              </div>
            </div>
            <div>
              <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>Avg ROI</div>
              <div className="mono font-bold" style={{ color: (r.avg_roi || 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                {fmt(r.avg_roi)}%
              </div>
            </div>
            {r.best_band && (
              <div>
                <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>Best Band</div>
                <div className="mono font-bold" style={{ color: "var(--text-primary)" }}>{r.best_band}</div>
              </div>
            )}
            {r.best_narrative && (
              <div>
                <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>Best Narrative</div>
                <div className="mono font-bold" style={{ color: "var(--text-primary)" }}>{r.best_narrative}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Token count */}
      {r.token_count != null && (
        <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
          {r.token_count} tokens observed during detection
        </div>
      )}
    </div>
  );
}

// ── Regime Distribution Donut ─────────────────────────────────────────────────

function RegimeDistribution({ regimes }: { regimes: RegimeStat[] }) {
  const counts: Record<string, number> = {};
  for (const r of regimes) {
    counts[r.regime] = (counts[r.regime] || 0) + 1;
  }
  const total = regimes.length;
  if (!total) return null;

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const colors: Record<string, string> = {
    trending: "var(--green)",
    volatile: "var(--red)",
    low_liquidity: "var(--yellow)",
    ranging: "var(--blue)",
  };

  return (
    <div className="p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
        Regime Distribution ({total} snapshots)
      </div>
      <div className="space-y-2">
        {entries.map(([regime, count]) => {
          const pct = (count / total) * 100;
          const meta = regimeMeta(regime);
          return (
            <div key={regime}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span style={{ color: meta.color }}>{meta.label}</span>
                <span className="mono" style={{ color: "var(--text-dim)" }}>{count} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="w-full h-1.5 overflow-hidden" style={{ background: "var(--bg-surface)" }}>
                <div style={{ width: `${pct}%`, background: meta.color, height: "100%", opacity: 0.7 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegimesPage() {
  const { data: regimes, isLoading } = useSWR<RegimeStat[]>(
    "lln/regimes",
    () => api.lln.regimes(),
    { refreshInterval: 60_000 }
  );

  const current = regimes?.find((r) => r.is_current);
  const currentMeta = current ? regimeMeta(current.regime) : null;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-lg font-bold mono" style={{ color: "var(--text-primary)" }}>
          Regime Analysis
        </h1>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          Market state detection · trending / volatile / low_liquidity / ranging · per-regime signal performance
        </p>
      </div>

      {/* Current regime banner */}
      {current && currentMeta && (
        <div
          className="p-4 flex items-center justify-between gap-4"
          style={{ background: currentMeta.bg, border: `1px solid ${currentMeta.color}` }}
        >
          <div>
            <div className="text-[10px] uppercase" style={{ color: "var(--text-dim)" }}>Current Market Regime</div>
            <div className="text-2xl font-bold mono mt-1" style={{ color: currentMeta.color }}>
              {currentMeta.label}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>{currentMeta.desc}</div>
          </div>
          <div className="text-right">
            {current.avg_win_rate != null && (
              <div>
                <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>Win Rate</div>
                <div className="text-lg font-bold mono" style={{ color: (current.avg_win_rate || 0) >= 0.5 ? "var(--green)" : "var(--red)" }}>
                  {fmtPct(current.avg_win_rate)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-xs py-8 text-center" style={{ color: "var(--text-dim)" }}>
          Loading regime data…
        </div>
      ) : !regimes?.length ? (
        <div
          className="p-6 text-xs text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
        >
          Regime detection runs every 60 seconds. Data will appear after the LLN worker&apos;s first cycle.
        </div>
      ) : (
        <>
          {/* Timeline + distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <RegimeTimeline regimes={regimes} />
            </div>
            <RegimeDistribution regimes={regimes} />
          </div>

          {/* Regime cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {regimes.map((r, i) => (
              <RegimeCard key={`${r.regime}-${r.detected_at}-${i}`} r={r} />
            ))}
          </div>
        </>
      )}

      {/* Detection methodology */}
      <div
        className="p-4 text-xs space-y-1"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
      >
        <div className="font-semibold" style={{ color: "var(--text-secondary)" }}>Detection Rules</div>
        <div><span style={{ color: "var(--green)" }}>Trending</span> — avg 1h change &gt;5% AND buy pressure &gt;60%</div>
        <div><span style={{ color: "var(--red)" }}>Volatile</span> — price change std dev &gt;25%</div>
        <div><span style={{ color: "var(--yellow)" }}>Low Liquidity</span> — avg liquidity &lt;$5,000</div>
        <div><span style={{ color: "var(--blue)" }}>Ranging</span> — no dominant condition detected</div>
        <div className="pt-1">Regimes are detected from live DexToken data. Detection runs every 60 seconds.</div>
      </div>
    </div>
  );
}
