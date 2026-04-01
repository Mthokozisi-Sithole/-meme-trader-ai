"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { FeatureImportance } from "@/types";

export const dynamic = "force-dynamic";

function fmt(n: number | null | undefined, d = 3) {
  return n == null ? "—" : n.toFixed(d);
}

const FEATURE_LABELS: Record<string, { label: string; desc: string }> = {
  composite_score:   { label: "Composite Score",   desc: "Overall signal score (0–100)" },
  sentiment_score:   { label: "Sentiment Score",    desc: "Social / community sentiment sub-score" },
  technical_score:   { label: "Technical Score",    desc: "Chart pattern & momentum sub-score" },
  liquidity_score:   { label: "Liquidity Score",    desc: "DEX depth & volume sub-score" },
  momentum_score:    { label: "Momentum Score",     desc: "Price velocity & buy pressure sub-score" },
  band_rank:         { label: "Band Rank",          desc: "Strong Buy=4, Watch=3, Risky=2, Avoid=1" },
};

function directionColor(dir: string | null | undefined): string {
  if (dir === "positive") return "var(--green)";
  if (dir === "negative") return "var(--red)";
  return "var(--text-dim)";
}

function corrColor(r: number | null | undefined): string {
  if (r == null) return "var(--text-dim)";
  const abs = Math.abs(r);
  if (abs >= 0.4) return r > 0 ? "var(--green)" : "var(--red)";
  if (abs >= 0.2) return r > 0 ? "rgba(0,217,126,0.7)" : "rgba(255,68,102,0.7)";
  return "var(--yellow)";
}

// ── Importance Bar Chart ──────────────────────────────────────────────────────

function ImportanceBar({ feature, maxImportance }: { feature: FeatureImportance; maxImportance: number }) {
  const meta = FEATURE_LABELS[feature.feature_name] || { label: feature.feature_name, desc: "" };
  const pct = maxImportance > 0 ? ((feature.importance_score || 0) / maxImportance) * 100 : 0;
  const corrPct = Math.abs(feature.correlation_with_roi || 0) * 100;
  const isPositive = (feature.correlation_with_roi || 0) >= 0;

  return (
    <div className="py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold mono px-1 py-0.5"
              style={{ background: "var(--bg-surface)", color: "var(--text-dim)" }}>
              #{feature.rank}
            </span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {meta.label}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5"
              style={{
                background: feature.direction === "positive" ? "rgba(0,217,126,0.12)" : "rgba(255,68,102,0.12)",
                color: directionColor(feature.direction),
                border: `1px solid ${feature.direction === "positive" ? "rgba(0,217,126,0.3)" : "rgba(255,68,102,0.3)"}`,
              }}
            >
              {feature.direction === "positive" ? "↑ Positive" : feature.direction === "negative" ? "↓ Negative" : "~"}
            </span>
          </div>
          {meta.desc && (
            <div className="text-[10px] mt-0.5 ml-7" style={{ color: "var(--text-dim)" }}>
              {meta.desc}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>Importance</div>
          <div className="mono font-bold text-xs" style={{ color: "var(--text-primary)" }}>
            {fmt(feature.importance_score)}
          </div>
        </div>
      </div>

      {/* Importance bar */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="text-[9px] w-16 text-right" style={{ color: "var(--text-dim)" }}>Importance</div>
        <div className="flex-1 h-2 overflow-hidden" style={{ background: "var(--bg-surface)" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: isPositive ? "var(--green)" : "var(--red)",
              opacity: 0.7,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div className="text-[9px] w-10 mono" style={{ color: "var(--text-secondary)" }}>
          {fmt(feature.importance_score, 2)}
        </div>
      </div>

      {/* Correlation bar */}
      <div className="flex items-center gap-2">
        <div className="text-[9px] w-16 text-right" style={{ color: "var(--text-dim)" }}>Corr(ROI)</div>
        <div className="flex-1 h-2 overflow-hidden relative" style={{ background: "var(--bg-surface)" }}>
          {/* Center line */}
          <div className="absolute top-0 bottom-0" style={{ left: "50%", width: "1px", background: "var(--border)" }} />
          {isPositive ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                width: `${corrPct / 2}%`,
                height: "100%",
                background: "var(--green)",
                opacity: 0.6,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                right: "50%",
                width: `${corrPct / 2}%`,
                height: "100%",
                background: "var(--red)",
                opacity: 0.6,
              }}
            />
          )}
        </div>
        <div className="text-[9px] w-10 mono" style={{ color: corrColor(feature.correlation_with_roi) }}>
          {feature.correlation_with_roi != null
            ? (feature.correlation_with_roi >= 0 ? "+" : "") + fmt(feature.correlation_with_roi, 3)
            : "—"}
        </div>
      </div>
    </div>
  );
}

// ── Correlation Heatmap ───────────────────────────────────────────────────────

function CorrelationHeatmap({ features }: { features: FeatureImportance[] }) {
  if (features.length < 2) return null;

  const labels = features.map((f) => FEATURE_LABELS[f.feature_name]?.label || f.feature_name);
  const shortLabels = labels.map((l) => l.split(" ")[0]);

  // Build synthetic correlation matrix from individual correlations with ROI
  // Real cross-correlations aren't stored; approximate relative similarity
  const n = features.length;
  const cellSize = Math.min(40, Math.floor(280 / n));
  const W = n * cellSize + 60;
  const H = n * cellSize + 60;

  const heatColor = (val: number): string => {
    const abs = Math.min(Math.abs(val), 1);
    const alpha = 0.15 + abs * 0.7;
    if (val > 0) return `rgba(0,217,126,${alpha})`;
    if (val < 0) return `rgba(255,68,102,${alpha})`;
    return `rgba(128,128,128,0.1)`;
  };

  // Approximate correlation matrix: corr(i,j) ≈ corr_i * corr_j (rank-based approx)
  const corrs = features.map((f) => f.correlation_with_roi || 0);
  const maxCorr = Math.max(...corrs.map(Math.abs), 0.001);

  return (
    <div
      className="p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
        Feature → ROI Correlation Heatmap
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: `${W}px`, height: `${H}px` }}>
          {/* Column headers */}
          {shortLabels.map((lbl, j) => (
            <text
              key={`col-${j}`}
              x={60 + j * cellSize + cellSize / 2}
              y={50}
              textAnchor="end"
              fontSize="8"
              fill="var(--text-dim)"
              transform={`rotate(-45, ${60 + j * cellSize + cellSize / 2}, 50)`}
            >
              {lbl}
            </text>
          ))}

          {features.map((fi, i) => {
            const ri = corrs[i] / maxCorr;
            return (
              <g key={i}>
                {/* Row label */}
                <text
                  x={55}
                  y={60 + i * cellSize + cellSize / 2 + 4}
                  textAnchor="end"
                  fontSize="8"
                  fill="var(--text-dim)"
                >
                  {shortLabels[i]}
                </text>
                {features.map((fj, j) => {
                  const rj = corrs[j] / maxCorr;
                  // Approximate cross-correlation
                  const approxCorr = i === j ? 1 : ri * rj;
                  return (
                    <rect
                      key={j}
                      x={60 + j * cellSize}
                      y={60 + i * cellSize}
                      width={cellSize - 1}
                      height={cellSize - 1}
                      fill={heatColor(approxCorr)}
                      rx={1}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="text-[9px] mt-2" style={{ color: "var(--text-dim)" }}>
        Cross-correlations approximated from individual feature-ROI correlations.
        Diagonal = self-correlation (always 1).
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  const { data: features, isLoading } = useSWR<FeatureImportance[]>(
    "lln/features",
    () => api.lln.features(),
    { refreshInterval: 30_000 }
  );

  const sorted = [...(features || [])].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const maxImportance = Math.max(...sorted.map((f) => f.importance_score || 0), 0.001);

  const topFeature = sorted[0];
  const positiveFeatures = sorted.filter((f) => f.direction === "positive");
  const negativeFeatures = sorted.filter((f) => f.direction === "negative");

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-lg font-bold mono" style={{ color: "var(--text-primary)" }}>
          Feature Analysis
        </h1>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          Pearson correlation of signal sub-scores with final ROI · importance ranking
        </p>
      </div>

      {/* Summary tiles */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="text-[10px] uppercase" style={{ color: "var(--text-dim)" }}>Top Feature</div>
            <div className="text-sm font-bold mono mt-1" style={{ color: "var(--green)" }}>
              {topFeature ? (FEATURE_LABELS[topFeature.feature_name]?.label || topFeature.feature_name) : "—"}
            </div>
          </div>
          <div className="p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="text-[10px] uppercase" style={{ color: "var(--text-dim)" }}>Positive Signals</div>
            <div className="text-lg font-bold mono" style={{ color: "var(--green)" }}>{positiveFeatures.length}</div>
          </div>
          <div className="p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="text-[10px] uppercase" style={{ color: "var(--text-dim)" }}>Negative Signals</div>
            <div className="text-lg font-bold mono" style={{ color: "var(--red)" }}>{negativeFeatures.length}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-xs py-8 text-center" style={{ color: "var(--text-dim)" }}>
          Loading feature importance data…
        </div>
      ) : !sorted.length ? (
        <div
          className="p-6 text-xs text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
        >
          Feature importance is computed once ≥10 signal outcomes with score data are available.
        </div>
      ) : (
        <>
          {/* Bar chart + heatmap layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Importance bars */}
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Importance Ranking
              </div>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="px-4">
                  {sorted.map((f) => (
                    <ImportanceBar key={f.feature_name} feature={f} maxImportance={maxImportance} />
                  ))}
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <div className="space-y-4">
              <CorrelationHeatmap features={sorted} />

              {/* Interpretation guide */}
              <div
                className="p-4 text-xs space-y-1.5"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
              >
                <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  Interpretation
                </div>
                <div>
                  <span style={{ color: "var(--green)" }}>Positive correlation</span> — higher sub-score
                  predicts higher ROI outcome
                </div>
                <div>
                  <span style={{ color: "var(--red)" }}>Negative correlation</span> — higher sub-score
                  predicts lower ROI (possible mean-reversion)
                </div>
                <div>
                  Importance = |Pearson r| · values closer to ±1 indicate stronger predictive power
                </div>
                <div className="pt-1">
                  Computed via Pearson correlation over all resolved signal outcomes.
                  Minimum 10 samples required.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
