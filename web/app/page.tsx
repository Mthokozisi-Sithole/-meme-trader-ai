"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { api, type MarketStats } from "@/lib/api";
import { NarrativeHeatmap } from "@/components/NarrativeHeatmap";
import { ScoreRing } from "@/components/ScoreRing";
import { useWsData } from "@/lib/ws";
import type { Signal, Alert } from "@/types";

export const dynamic = "force-dynamic";

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmtPrice(n: number | null | undefined): string {
 if (n == null) return "—";
 if (n < 0.000001) return `$${n.toExponential(2)}`;
 if (n < 0.001) return `$${n.toFixed(6)}`;
 if (n < 1) return `$${n.toFixed(4)}`;
 return `$${n.toLocaleString(undefined, { maximumFractionDigits: 3 })}`;
}

function fmtCompact(n: number | null | undefined): string {
 if (n == null) return "—";
 if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
 if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
 if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
 return `$${n.toFixed(0)}`;
}

function fmtAge(iso: string): string {
 const diff = (Date.now() - new Date(iso).getTime()) / 1000;
 if (diff < 60) return `${diff.toFixed(0)}s ago`;
 if (diff < 3600) return `${(diff / 60).toFixed(0)}m ago`;
 return `${(diff / 3600).toFixed(1)}h ago`;
}

const BAND_COLOR: Record<string, string> = {
 "Strong Buy": "var(--green)",
 Watch: "var(--yellow)",
 Risky: "#f97316",
 Avoid: "var(--red)",
};

const BAND_BG: Record<string, string> = {
 "Strong Buy": "rgba(0,217,126,0.1)",
 Watch: "rgba(245,197,67,0.1)",
 Risky: "rgba(249,115,22,0.1)",
 Avoid: "rgba(255,68,102,0.1)",
};

// ── Stat Tile ──────────────────────────────────────────────────────────────────

function StatTile({
 label,
 value,
 sub,
 color = "var(--text-primary)",
 alert,
}: {
 label: string;
 value: string | number;
 sub?: string;
 color?: string;
 alert?: boolean;
}) {
 return (
 <div
 className=" px-4 py-3"
 style={{
 background: "var(--bg-card)",
 border: `1px solid ${alert ? "rgba(255,68,102,0.3)" : "var(--border)"}`,
 }}
 >
 <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "var(--text-dim)" }}>
 {label}
 </div>
 <div className="mono text-2xl font-black" style={{ color }}>
 {value}
 </div>
 {sub && (
 <div className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
 {sub}
 </div>
 )}
 </div>
 );
}

// ── Signal Row ────────────────────────────────────────────────────────────────

function SignalRow({ signal, isNew }: { signal: Signal; isNew?: boolean }) {
 const bandColor = BAND_COLOR[signal.band] ?? "var(--text-secondary)";
 const bandBg = BAND_BG[signal.band] ?? "transparent";

 return (
 <tr
 className={isNew ? "fade-in" : ""}
 style={{ borderBottom: "1px solid var(--border)" }}
 >
 {/* Symbol */}
 <td className="py-2 pl-3 pr-2">
 <Link href={`/coins/${signal.coin_symbol}`}
 className="flex items-center gap-2 group">
 <div className="w-1 h-6 " style={{ background: bandColor }} />
 <span className="mono text-xs font-bold group-hover:opacity-70 transition-opacity"
 style={{ color: "var(--text-primary)" }}>
 {signal.coin_symbol}
 </span>
 </Link>
 </td>

 {/* Band */}
 <td className="py-2 px-2">
 <span
 className="text-[10px] font-bold px-2 py-0.5 "
 style={{ color: bandColor, background: bandBg }}
 >
 {signal.band}
 </span>
 </td>

 {/* Score ring (mini) */}
 <td className="py-2 px-2">
 <div className="flex items-center gap-2">
 <div className="relative w-6 h-6">
 <svg width="24" height="24" style={{ transform: "rotate(-90deg)" }}>
 <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
 <circle
 cx="12" cy="12" r="9"
 fill="none" stroke={bandColor} strokeWidth="3"
 strokeDasharray={`${2 * Math.PI * 9}`}
 strokeDashoffset={`${2 * Math.PI * 9 * (1 - signal.score / 100)}`}
 strokeLinecap="round"
 />
 </svg>
 </div>
 <span className="mono text-xs font-bold" style={{ color: bandColor }}>
 {signal.score.toFixed(1)}
 </span>
 </div>
 </td>

 {/* Sub-scores */}
 <td className="py-2 px-2 hidden md:table-cell">
 <div className="flex gap-1.5">
 {[
 { v: signal.score_breakdown.sentiment, l: "S" },
 { v: signal.score_breakdown.technical, l: "T" },
 { v: signal.score_breakdown.liquidity, l: "L" },
 { v: signal.score_breakdown.momentum, l: "M" },
 ].map(({ v, l }) => {
 const c = v >= 70 ? "var(--green)" : v >= 50 ? "var(--yellow)" : v >= 30 ? "#f97316" : "var(--red)";
 return (
 <div key={l} className="flex flex-col items-center gap-0.5">
 <span className="mono text-[9px] font-bold" style={{ color: c }}>{v.toFixed(0)}</span>
 <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>{l}</span>
 </div>
 );
 })}
 </div>
 </td>

 {/* Entry */}
 <td className="py-2 px-2 hidden lg:table-cell">
 <div className="mono text-[10px]" style={{ color: "var(--blue)" }}>
 {fmtPrice(signal.trade_levels.entry_low)}
 <span style={{ color: "var(--text-dim)" }}> – </span>
 {fmtPrice(signal.trade_levels.entry_high)}
 </div>
 </td>

 {/* Exit */}
 <td className="py-2 px-2 hidden lg:table-cell">
 <span className="mono text-[10px]" style={{ color: "var(--green)" }}>
 {fmtPrice(signal.trade_levels.exit_target)}
 </span>
 </td>

 {/* SL */}
 <td className="py-2 px-2 hidden lg:table-cell">
 <span className="mono text-[10px]" style={{ color: "var(--red)" }}>
 {fmtPrice(signal.trade_levels.stop_loss)}
 </span>
 </td>

 {/* Risk */}
 <td className="py-2 px-2">
 <RiskDot level={signal.risk_level} flags={signal.risk_flags} />
 </td>

 {/* Age */}
 <td className="py-2 pr-3 hidden sm:table-cell">
 <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
 {fmtAge(signal.created_at)}
 </span>
 </td>
 </tr>
 );
}

function RiskDot({ level, flags }: { level: string; flags: string[] }) {
 const colors: Record<string, string> = {
 low: "var(--green)",
 medium: "var(--yellow)",
 high: "#f97316",
 extreme: "var(--red)",
 };
 const color = colors[level] ?? "var(--text-dim)";
 return (
 <div className="flex items-center gap-1" title={flags.join(", ")}>
 <div className="w-1.5 h-1.5 " style={{ background: color }} />
 <span className="text-[10px] capitalize" style={{ color }}>{level}</span>
 {flags.length > 0 && (
 <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>({flags.length})</span>
 )}
 </div>
 );
}

// ── Alert Row ─────────────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: Alert }) {
 const sev: Record<string, string> = {
 info: "var(--blue)",
 warning: "var(--yellow)",
 critical: "var(--red)",
 };
 const color = sev[alert.severity] ?? "var(--text-secondary)";
 return (
 <div
 className="flex items-start gap-3 py-2 px-3 "
 style={{ background: "var(--bg-card)", border: `1px solid rgba(${hexTriplet(color)},0.2)` }}
 >
 <div className="w-1 h-4 mt-0.5 shrink-0" style={{ background: color }} />
 <div className="min-w-0">
 <span className="font-bold text-xs" style={{ color }}>{alert.coin_symbol}</span>
 <span className="text-xs ml-2" style={{ color: "var(--text-secondary)" }}>{alert.message}</span>
 </div>
 <span className="ml-auto text-[10px] shrink-0" style={{ color: "var(--text-dim)" }}>
 {fmtAge(alert.created_at)}
 </span>
 </div>
 );
}

function hexTriplet(cssVar: string): string {
 const map: Record<string, string> = {
 "var(--blue)": "68,136,255",
 "var(--yellow)": "245,197,67",
 "var(--red)": "255,68,102",
 "var(--green)": "0,217,126",
 };
 return map[cssVar] ?? "128,128,128";
}

// ── Page ──────────────────────────────────────────────────────────────────────

type BandFilter = "All" | "Strong Buy" | "Watch" | "Risky" | "Avoid";

export default function TerminalPage() {
 const [band, setBand] = useState<BandFilter>("All");
 const [seenIds, setSeenIds] = useState<Set<number>>(new Set());

 // WebSocket live signals
 const { data: wsSignals, status: wsStatus, lastTs } = useWsData<Signal>("/ws/signals");

 // Fallback SWR polling (tight — WS preferred)
 const { data: swrSignals } = useSWR<Signal[]>(
 "/signals/",
 () => api.signals.list(50),
 { refreshInterval: 8_000, fallbackData: [] }
 );

 // Use WS data if connected, else fall back to SWR
 const allSignals = wsSignals.length > 0 ? wsSignals : (swrSignals ?? []);

 // Market stats
 const { data: stats } = useSWR<MarketStats>(
 "/market/stats",
 api.market.stats,
 { refreshInterval: 10_000 }
 );

 // Narratives
 const { data: narratives } = useSWR(
 "/market/narrative-performance",
 api.market.narrativePerformance,
 { refreshInterval: 15_000 }
 );

 // Alerts
 const { data: alerts } = useSWR<Alert[]>(
 "/alerts/unread",
 () => api.alerts.list(true),
 { refreshInterval: 8_000, fallbackData: [] }
 );

 // Track new signals for fade-in
 useEffect(() => {
 if (!allSignals.length) return;
 setSeenIds((prev) => {
 const next = new Set(prev);
 allSignals.forEach((s) => next.add(s.id));
 return next;
 });
 }, [allSignals]);

 const filtered = useMemo(() => {
 const base = band === "All" ? allSignals : allSignals.filter((s) => s.band === band);
 return [...base].sort((a, b) => b.score - a.score);
 }, [allSignals, band]);

 const strongBuys = allSignals.filter((s) => s.band === "Strong Buy").length;
 const avgScore = allSignals.length
 ? (allSignals.reduce((a, s) => a + s.score, 0) / allSignals.length).toFixed(1)
 : "—";

 return (
 <div className="pt-2 space-y-4">
 {/* Header */}
 <div className="flex items-center justify-between pt-2">
 <div>
 <h1
 className="text-lg font-black tracking-wider uppercase cursor-blink"
 style={{ color: "var(--text-primary)", letterSpacing: "0.15em" }}
 >
 Intelligence Terminal
 </h1>
 <div className="flex items-center gap-3 mt-0.5">
 <span className="text-xs" style={{ color: "var(--text-dim)" }}>
 {allSignals.length} signals loaded
 </span>
 <span
 className={`text-xs mono ${wsStatus === "connected" ? "" : "opacity-50"}`}
 style={{ color: wsStatus === "connected" ? "var(--green)" : "var(--yellow)" }}
 >
 {wsStatus === "connected" ? "● WS LIVE" : wsStatus === "reconnecting" ? "◌ RECONNECTING" : "● POLLING"}
 </span>
 {lastTs && (
 <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
 last: {lastTs.slice(11, 19)} UTC
 </span>
 )}
 </div>
 </div>
 <Link
 href="/sniper"
 className="text-xs px-4 py-2 font-bold transition-all"
 style={{
 background: "rgba(68,136,255,0.15)",
 border: "1px solid rgba(68,136,255,0.3)",
 color: "var(--blue)",
 }}
 >
 Open Sniper →
 </Link>
 </div>

 {/* Stat tiles */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
 <StatTile
 label="Total Signals"
 value={allSignals.length}
 sub="coins tracked"
 />
 <StatTile
 label="Strong Buys"
 value={strongBuys}
 sub={`${allSignals.length ? ((strongBuys / allSignals.length) * 100).toFixed(0) : 0}% of signals`}
 color="var(--green)"
 />
 <StatTile
 label="Avg Score"
 value={avgScore}
 sub="composite / 100"
 color="var(--blue)"
 />
 <StatTile
 label="Snipe Ops"
 value={stats?.dex.snipe_opportunities ?? "—"}
 sub={`${stats?.dex.strong_buys ?? 0} strong buy`}
 color="var(--purple)"
 />
 </div>

 {/* Main split: signals + right panel */}
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

 {/* Signal table — takes 2/3 */}
 <div
 className="xl:col-span-2 overflow-hidden"
 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
 >
 {/* Table header */}
 <div
 className="flex items-center justify-between px-3 py-2 border-b"
 style={{ borderColor: "var(--border)" }}
 >
 <span className="text-xs font-semibold uppercase tracking-wider"
 style={{ color: "var(--text-secondary)" }}>
 Live Signals
 </span>
 <div className="flex items-center gap-1">
 {(["All", "Strong Buy", "Watch", "Risky", "Avoid"] as BandFilter[]).map((b) => (
 <button
 key={b}
 onClick={() => setBand(b)}
 className="text-[10px] px-2 py-0.5 transition-all"
 style={{
 color: band === b
 ? (b === "All" ? "var(--text-primary)" : BAND_COLOR[b])
 : "var(--text-dim)",
 background: band === b ? "var(--bg-surface)" : "transparent",
 border: `1px solid ${band === b ? "var(--border-glow)" : "transparent"}`,
 }}
 >
 {b === "All" ? "ALL" : b.slice(0, 2).toUpperCase()}
 {b !== "All" && allSignals.filter((s) => s.band === b).length > 0 && (
 <span className="ml-1 opacity-50">
 {allSignals.filter((s) => s.band === b).length}
 </span>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Table */}
 <div className="overflow-auto" style={{ maxHeight: "520px" }}>
 <table className="w-full">
 <thead>
 <tr style={{ borderBottom: "1px solid var(--border)" }}>
 {["Symbol", "Band", "Score", "S/T/L/M", "Entry", "Exit", "SL", "Risk", "Age"].map((h, i) => (
 <th
 key={h}
 className={`py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider ${
 i === 3 ? "hidden md:table-cell" :
 i >= 4 && i <= 6 ? "hidden lg:table-cell" :
 i === 8 ? "hidden sm:table-cell" : ""
 } ${i === 0 ? "pl-3 pr-2" : i === 8 ? "pr-3" : "px-2"}`}
 style={{ color: "var(--text-dim)" }}
 >
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filtered.map((signal) => (
 <SignalRow
 key={signal.id}
 signal={signal}
 isNew={!seenIds.has(signal.id)}
 />
 ))}
 {filtered.length === 0 && (
 <tr>
 <td colSpan={9} className="py-12 text-center text-xs"
 style={{ color: "var(--text-dim)" }}>
 {band !== "All" ? `No ${band} signals` : "Waiting for data…"}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Footer */}
 <div
 className="flex items-center justify-between px-3 py-2 border-t text-[10px]"
 style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
 >
 <span>Score = 35% sentiment + 25% technical + 25% liquidity + 15% momentum</span>
 <span>{filtered.length} / {allSignals.length} shown</span>
 </div>
 </div>

 {/* Right panel */}
 <div className="flex flex-col gap-4">

 {/* Top opportunities */}
 {stats?.top_tokens && stats.top_tokens.length > 0 && (
 <div
 className=" overflow-hidden"
 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
 >
 <div className="px-3 py-2 border-b text-xs font-semibold uppercase tracking-wider"
 style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
 Top Snipe Opportunities
 </div>
 <div className="divide-y divide-white/5">
 {stats.top_tokens.map((t, i) => {
 const score = t.score ?? 0;
 const color = score >= 80 ? "var(--green)" : score >= 60 ? "var(--yellow)" : "#f97316";
 return (
 <div key={i} className="flex items-center gap-3 px-3 py-2">
 <span className="mono text-[10px] w-4" style={{ color: "var(--text-dim)" }}>
 {i + 1}
 </span>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
 {t.symbol}
 </span>
 <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
 {t.chain?.toUpperCase()}
 </span>
 {t.narrative && (
 <span className="text-[9px] px-1 "
 style={{ background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
 {t.narrative}
 </span>
 )}
 </div>
 {t.price_change_1h != null && (
 <span className="text-[10px]"
 style={{ color: t.price_change_1h >= 0 ? "var(--green)" : "var(--red)" }}>
 {t.price_change_1h >= 0 ? "+" : ""}{t.price_change_1h.toFixed(1)}% 1h
 </span>
 )}
 </div>
 <div className="text-right">
 <div className="mono text-sm font-black" style={{ color }}>{score.toFixed(0)}</div>
 <div className="text-[9px]" style={{ color: "var(--text-dim)" }}>
 {fmtCompact(t.liquidity_usd)} liq
 </div>
 </div>
 </div>
 );
 })}
 </div>
 <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
 <Link href="/sniper" className="text-[10px]" style={{ color: "var(--blue)" }}>
 View all snipe opportunities →
 </Link>
 </div>
 </div>
 )}

 {/* Alerts panel */}
 <div
 className=" overflow-hidden flex-1"
 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
 >
 <div className="flex items-center justify-between px-3 py-2 border-b"
 style={{ borderColor: "var(--border)" }}>
 <span className="text-xs font-semibold uppercase tracking-wider"
 style={{ color: "var(--text-secondary)" }}>
 Risk Alerts
 </span>
 {alerts && alerts.length > 0 && (
 <span
 className="text-[10px] font-bold px-1.5 py-0.5 "
 style={{ background: "rgba(255,68,102,0.2)", color: "var(--red)" }}
 >
 {alerts.length} unread
 </span>
 )}
 </div>
 <div className="p-2 space-y-1.5 overflow-auto" style={{ maxHeight: "220px" }}>
 {alerts && alerts.length > 0 ? (
 alerts.slice(0, 8).map((a) => <AlertRow key={a.id} alert={a} />)
 ) : (
 <div className="py-6 text-center text-xs" style={{ color: "var(--text-dim)" }}>
 No active alerts
 </div>
 )}
 </div>
 {alerts && alerts.length > 0 && (
 <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
 <Link href="/alerts" className="text-[10px]" style={{ color: "var(--blue)" }}>
 View all alerts →
 </Link>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Narrative Heatmap */}
 <div
 className=" overflow-hidden"
 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
 >
 <div className="flex items-center justify-between px-3 py-2 border-b"
 style={{ borderColor: "var(--border)" }}>
 <div>
 <span className="text-xs font-semibold uppercase tracking-wider"
 style={{ color: "var(--text-secondary)" }}>
 Narrative Intelligence
 </span>
 <span className="ml-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
 heat by avg snipe score
 </span>
 </div>
 <Link href="/analytics" className="text-[10px]" style={{ color: "var(--blue)" }}>
 Full Analytics →
 </Link>
 </div>
 <div className="p-3">
 <NarrativeHeatmap
 data={narratives ?? []}
 loading={!narratives}
 />
 </div>
 </div>
 </div>
 );
}
