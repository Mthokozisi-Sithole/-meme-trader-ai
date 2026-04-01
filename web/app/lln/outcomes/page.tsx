"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { SignalOutcome } from "@/types";

export const dynamic = "force-dynamic";

const OUTCOME_TABS = [
  { key: "",        label: "All" },
  { key: "WIN",     label: "WIN" },
  { key: "NEUTRAL", label: "NEUTRAL" },
  { key: "LOSS",    label: "LOSS" },
];

function outcomeColor(o: string | null | undefined): string {
  if (o === "WIN") return "var(--green)";
  if (o === "LOSS") return "var(--red)";
  return "var(--yellow)";
}

function roiColor(roi: number | null | undefined): string {
  if (roi == null) return "var(--text-dim)";
  return roi >= 0 ? "var(--green)" : "var(--red)";
}

function fmt(n: number | null | undefined, d = 2): string {
  return n == null ? "—" : n.toFixed(d);
}

function bandBg(band: string | null | undefined): { color: string; bg: string } {
  if (band === "Strong Buy") return { color: "var(--green)", bg: "rgba(0,217,126,0.12)" };
  if (band === "Watch") return { color: "var(--yellow)", bg: "rgba(245,197,67,0.12)" };
  if (band === "Risky") return { color: "#f97316", bg: "rgba(249,115,22,0.12)" };
  return { color: "var(--red)", bg: "rgba(255,68,102,0.12)" };
}

// ── MFE/MAE mini chart ────────────────────────────────────────────────────────

function ExcursionBar({ mfe, mae }: { mfe: number | null; mae: number | null }) {
  if (mfe == null && mae == null) return <span style={{ color: "var(--text-dim)" }}>—</span>;
  const maxAbs = Math.max(Math.abs(mfe || 0), Math.abs(mae || 0), 1);
  const mfePct = ((mfe || 0) / maxAbs) * 100;
  const maePct = (Math.abs(mae || 0) / maxAbs) * 100;

  return (
    <div className="flex items-center gap-1 text-[9px]">
      <span style={{ color: "var(--green)" }}>↑{fmt(mfe, 0)}%</span>
      <div className="w-14 h-2 flex overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        <div style={{ width: `${mfePct}%`, background: "var(--green)", opacity: 0.6 }} />
        <div style={{ width: `${maePct}%`, background: "var(--red)", opacity: 0.6 }} />
      </div>
      <span style={{ color: "var(--red)" }}>↓{fmt(mae, 0)}%</span>
    </div>
  );
}

export default function OutcomesPage() {
  const [activeOutcome, setActiveOutcome] = useState("");

  const { data: outcomes, isLoading } = useSWR<SignalOutcome[]>(
    ["lln/outcomes", activeOutcome],
    () => api.lln.outcomes({ limit: 200, outcome: activeOutcome || undefined }),
    { refreshInterval: 30_000 }
  );

  const wins = outcomes?.filter((o) => o.outcome === "WIN").length || 0;
  const losses = outcomes?.filter((o) => o.outcome === "LOSS").length || 0;
  const neutrals = outcomes?.filter((o) => o.outcome === "NEUTRAL").length || 0;
  const avgRoi = outcomes?.length
    ? (outcomes.reduce((sum, o) => sum + (o.final_roi || 0), 0) / outcomes.length)
    : null;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold mono" style={{ color: "var(--text-primary)" }}>
          Signal Outcomes
        </h1>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          Entry vs current price · ROI from entry · MFE/MAE excursion profile
        </p>
      </div>

      {/* Summary stats */}
      {outcomes?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Shown", value: outcomes.length.toString(), color: "var(--blue)" },
            { label: "WIN", value: wins.toString(), color: "var(--green)" },
            { label: "NEUTRAL", value: neutrals.toString(), color: "var(--yellow)" },
            { label: "Avg ROI", value: fmt(avgRoi) + "%", color: roiColor(avgRoi) },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="text-[10px] uppercase" style={{ color: "var(--text-dim)" }}>{label}</div>
              <div className="text-lg font-bold mono" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Outcome filter tabs */}
      <div className="flex gap-1">
        {OUTCOME_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveOutcome(key)}
            className="px-3 py-1.5 text-xs transition-all"
            style={{
              background: activeOutcome === key ? "rgba(68,136,255,0.15)" : "var(--bg-card)",
              color: activeOutcome === key ? "var(--blue)" : "var(--text-secondary)",
              border: `1px solid ${activeOutcome === key ? "rgba(68,136,255,0.4)" : "var(--border)"}`,
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
                <th className="py-2 px-3 text-left font-semibold" style={{ color: "var(--text-secondary)" }}>Coin</th>
                <th className="py-2 px-3 text-left font-semibold hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>Band</th>
                <th className="py-2 px-3 text-right font-semibold" style={{ color: "var(--text-secondary)" }}>Entry</th>
                <th className="py-2 px-3 text-right font-semibold hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>Target</th>
                <th className="py-2 px-3 text-right font-semibold hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>SL</th>
                <th className="py-2 px-3 text-right font-semibold" style={{ color: "var(--text-secondary)" }}>ROI</th>
                <th className="py-2 px-3 text-left font-semibold hidden lg:table-cell" style={{ color: "var(--text-secondary)" }}>MFE / MAE</th>
                <th className="py-2 px-3 text-center font-semibold" style={{ color: "var(--text-secondary)" }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center" style={{ color: "var(--text-dim)" }}>
                    Loading outcomes…
                  </td>
                </tr>
              ) : !outcomes?.length ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center" style={{ color: "var(--text-dim)" }}>
                    No outcomes yet. The LLN worker processes signals every 60 seconds.
                  </td>
                </tr>
              ) : (
                outcomes.map((o) => {
                  const { color: bColor, bg: bBg } = bandBg(o.band);
                  return (
                    <tr
                      key={o.signal_id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td className="py-2 px-3">
                        <div className="font-bold" style={{ color: "var(--text-primary)" }}>{o.coin_symbol}</div>
                        {o.narrative_category && (
                          <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>{o.narrative_category}</div>
                        )}
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell">
                        {o.band && (
                          <span className="px-1.5 py-0.5 text-[10px]" style={{ background: bBg, color: bColor }}>
                            {o.band}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right mono" style={{ color: "var(--text-secondary)" }}>
                        ${fmt(o.entry_price, 6)}
                      </td>
                      <td className="py-2 px-3 text-right mono hidden md:table-cell" style={{ color: "var(--green)" }}>
                        ${fmt(o.exit_target, 6)}
                      </td>
                      <td className="py-2 px-3 text-right mono hidden md:table-cell" style={{ color: "var(--red)" }}>
                        ${fmt(o.stop_loss, 6)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="mono font-bold" style={{ color: roiColor(o.final_roi) }}>
                          {o.final_roi != null ? (o.final_roi >= 0 ? "+" : "") + fmt(o.final_roi) + "%" : "—"}
                        </span>
                      </td>
                      <td className="py-2 px-3 hidden lg:table-cell">
                        <ExcursionBar mfe={o.mfe} mae={o.mae} />
                      </td>
                      <td className="py-2 px-3 text-center">
                        {o.outcome && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              color: outcomeColor(o.outcome),
                              background: o.outcome === "WIN" ? "rgba(0,217,126,0.1)" : o.outcome === "LOSS" ? "rgba(255,68,102,0.1)" : "rgba(245,197,67,0.1)",
                            }}
                          >
                            {o.outcome}
                          </span>
                        )}
                      </td>
                    </tr>
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
