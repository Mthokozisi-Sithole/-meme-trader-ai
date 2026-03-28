"use client";

import useSWR from "swr";
import { api, type NarrativePerf } from "@/lib/api";

export const dynamic = "force-dynamic";

// ── Pure SVG chart helpers ────────────────────────────────────────────────────

const NARRATIVE_COLORS: Record<string, string> = {
 AI: "#4488ff",
 Political: "#ef4444",
 Cult: "#a855f7",
 Animal: "#f5c543",
 Space: "#818cf8",
 Celebrity: "#ec4899",
 Gaming: "#22d3ee",
 Food: "#f97316",
 Finance: "#64748b",
 Other: "#404060",
};

const BAND_COLORS: Record<string, string> = {
 "Strong Buy": "#00d97e",
 Watch: "#f5c543",
 Risky: "#f97316",
 Avoid: "#ff4466",
};

const CHAIN_COLORS: Record<string, string> = {
 solana: "#9945ff",
 ethereum: "#627eea",
 bsc: "#f0b90b",
 base: "#0052ff",
};

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

interface BarData {
 label: string;
 value: number;
 color?: string;
}

function SVGBarChart({
 data,
 height = 140,
 maxVal,
}: {
 data: BarData[];
 height?: number;
 maxVal?: number;
}) {
 if (!data.length) return null;
 const max = maxVal ?? Math.max(...data.map((d) => d.value), 1);
 const barW = Math.min(40, Math.floor(280 / data.length) - 4);
 const gap = Math.floor(300 / data.length);
 const chartH = height - 28;

 return (
 <svg width="100%" viewBox={`0 0 ${data.length * gap + 20} ${height}`} className="overflow-visible">
 {data.map((d, i) => {
 const barH = Math.max(2, (d.value / max) * chartH);
 const x = i * gap + (gap - barW) / 2;
 const y = chartH - barH + 4;
 const color = d.color ?? "#4488ff";
 return (
 <g key={d.label}>
 <rect
 x={x} y={y} width={barW} height={barH}
 rx="2" fill={color} fillOpacity={0.85}
 />
 <text
 x={x + barW / 2}
 y={height - 2}
 textAnchor="middle"
 fill="#404060"
 fontSize="8"
 fontFamily="ui-monospace"
 >
 {d.label}
 </text>
 <text
 x={x + barW / 2}
 y={y - 3}
 textAnchor="middle"
 fill={color}
 fontSize="8"
 fontFamily="ui-monospace"
 fontWeight="bold"
 >
 {d.value}
 </text>
 </g>
 );
 })}
 </svg>
 );
}

// ── SVG Donut Chart ───────────────────────────────────────────────────────────

interface DonutSlice {
 label: string;
 value: number;
 color: string;
}

function SVGDonut({ data, size = 160 }: { data: DonutSlice[]; size?: number }) {
 const total = data.reduce((s, d) => s + d.value, 0);
 if (total === 0) return null;

 const cx = size / 2;
 const cy = size / 2;
 const r = size * 0.34;
 const inner = size * 0.2;

 let angle = -Math.PI / 2;
 const slices = data.map((d) => {
 const sweep = (d.value / total) * 2 * Math.PI;
 const startAngle = angle;
 angle += sweep;
 return { ...d, startAngle, sweep };
 });

 function arcPath(
 cx: number,
 cy: number,
 r: number,
 inner: number,
 start: number,
 sweep: number
 ): string {
 const end = start + sweep * 0.98; // slight gap
 const x1 = cx + r * Math.cos(start);
 const y1 = cy + r * Math.sin(start);
 const x2 = cx + r * Math.cos(end);
 const y2 = cy + r * Math.sin(end);
 const ix1 = cx + inner * Math.cos(end);
 const iy1 = cy + inner * Math.sin(end);
 const ix2 = cx + inner * Math.cos(start);
 const iy2 = cy + inner * Math.sin(start);
 const large = sweep > Math.PI ? 1 : 0;
 return `M${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} L${ix1},${iy1} A${inner},${inner},0,${large},0,${ix2},${iy2} Z`;
 }

 return (
 <div className="flex items-center gap-4">
 <svg width={size} height={size}>
 {slices.map((s) => (
 <path
 key={s.label}
 d={arcPath(cx, cy, r, inner, s.startAngle, s.sweep)}
 fill={s.color}
 fillOpacity={0.85}
 />
 ))}
 <circle cx={cx} cy={cy} r={inner - 2} fill="var(--bg-card)" />
 <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--text-primary)"
 fontSize="10" fontWeight="bold" fontFamily="ui-monospace">
 {data.length}
 </text>
 <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-dim)"
 fontSize="7" fontFamily="ui-monospace">
 chains
 </text>
 </svg>
 <div className="space-y-1.5">
 {slices.map((s) => (
 <div key={s.label} className="flex items-center gap-2">
 <div className="w-2 h-2 shrink-0" style={{ background: s.color }} />
 <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
 {s.label}
 </span>
 <span className="mono text-[10px] font-bold ml-auto" style={{ color: s.color }}>
 {s.value}
 </span>
 </div>
 ))}
 </div>
 </div>
 );
}

// ── SVG Radar ─────────────────────────────────────────────────────────────────

function SVGRadar({ data }: { data: { label: string; score: number; ops: number }[] }) {
 if (!data.length) return null;
 const size = 200;
 const cx = size / 2;
 const cy = size / 2;
 const r = 75;
 const n = data.length;
 const angles = data.map((_, i) => ((2 * Math.PI * i) / n) - Math.PI / 2);

 function pt(frac: number, idx: number): [number, number] {
 const angle = angles[idx];
 return [cx + r * frac * Math.cos(angle), cy + r * frac * Math.sin(angle)];
 }

 const rings = [0.25, 0.5, 0.75, 1.0];
 const scorePoints = data.map((d, i) => pt(d.score / 100, i));
 const opsPoints = data.map((d, i) => pt(Math.min(d.ops / 100, 1), i));

 function polyline(points: [number, number][]): string {
 return points.map(([x, y]) => `${x},${y}`).join(" ");
 }

 return (
 <svg width={size} height={size}>
 {/* Grid rings */}
 {rings.map((f) => (
 <polygon
 key={f}
 points={polyline(angles.map((_, i) => pt(f, i)))}
 fill="none"
 stroke="rgba(255,255,255,0.05)"
 strokeWidth="1"
 />
 ))}
 {/* Spokes */}
 {angles.map((_, i) => {
 const [x, y] = pt(1, i);
 return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
 stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
 })}
 {/* Score polygon */}
 <polygon
 points={polyline(scorePoints)}
 fill="rgba(68,136,255,0.15)"
 stroke="#4488ff"
 strokeWidth="1.5"
 />
 {/* Ops polygon */}
 <polygon
 points={polyline(opsPoints)}
 fill="rgba(0,217,126,0.1)"
 stroke="#00d97e"
 strokeWidth="1"
 />
 {/* Labels */}
 {data.map((d, i) => {
 const [x, y] = pt(1.2, i);
 return (
 <text key={d.label} x={x} y={y + 3}
 textAnchor="middle" fontSize="8" fill="#7070a0"
 fontFamily="ui-monospace">
 {d.label.slice(0, 4)}
 </text>
 );
 })}
 {/* Legend */}
 <rect x={4} y={size - 28} width={8} height={3} fill="#4488ff" rx="1" />
 <text x={14} y={size - 26} fontSize="7" fill="#7070a0" fontFamily="ui-monospace">Score</text>
 <rect x={4} y={size - 20} width={8} height={3} fill="#00d97e" rx="1" />
 <text x={14} y={size - 18} fontSize="7" fill="#7070a0" fontFamily="ui-monospace">Opp Rate</text>
 </svg>
 );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
 return (
 <div className=" overflow-hidden"
 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
 <div className="px-4 py-2.5 border-b flex items-baseline gap-2"
 style={{ borderColor: "var(--border)" }}>
 <span className="text-xs font-semibold uppercase tracking-wider"
 style={{ color: "var(--text-secondary)" }}>
 {title}
 </span>
 {sub && <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{sub}</span>}
 </div>
 <div className="p-4">{children}</div>
 </div>
 );
}

// ── Narrative Table ───────────────────────────────────────────────────────────

function NarrativeTable({ data }: { data: NarrativePerf[] }) {
 if (!data.length) {
 return (
 <div className="py-8 text-center text-xs" style={{ color: "var(--text-dim)" }}>
 No narrative data yet — run the DEX worker to populate
 </div>
 );
 }
 const maxScore = Math.max(...data.map((d) => d.avg_score), 1);

 return (
 <table className="w-full">
 <thead>
 <tr style={{ borderBottom: "1px solid var(--border)" }}>
 {["Category", "Tokens", "Opportunities", "Avg Score", "Momentum", "Narrative Fit"].map((h) => (
 <th key={h}
 className="pb-2 text-left text-[9px] font-semibold uppercase tracking-widest px-1 first:pl-0"
 style={{ color: "var(--text-dim)" }}>
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {data.map((row) => {
 const color = NARRATIVE_COLORS[row.category] ?? "#666";
 const barW = (row.avg_score / maxScore) * 100;
 const oppRate = row.total > 0 ? ((row.opportunities / row.total) * 100).toFixed(0) : "0";
 return (
 <tr key={row.category} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
 <td className="py-2 pl-0 pr-1">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 " style={{ background: color }} />
 <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
 {row.category}
 </span>
 </div>
 </td>
 <td className="py-2 px-1">
 <span className="mono text-xs" style={{ color: "var(--text-secondary)" }}>{row.total}</span>
 </td>
 <td className="py-2 px-1">
 <div className="flex items-center gap-1">
 <span className="mono text-xs font-bold" style={{ color: "var(--green)" }}>
 {row.opportunities}
 </span>
 <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>({oppRate}%)</span>
 </div>
 </td>
 <td className="py-2 px-1">
 <div className="flex items-center gap-2">
 <div className="w-20 h-1.5 overflow-hidden"
 style={{ background: "rgba(255,255,255,0.06)" }}>
 <div className="h-full" style={{ width: `${barW}%`, background: color }} />
 </div>
 <span className="mono text-xs font-bold" style={{ color }}>
 {row.avg_score.toFixed(1)}
 </span>
 </div>
 </td>
 <td className="py-2 px-1">
 <span className="mono text-xs" style={{ color: "var(--text-secondary)" }}>
 {row.avg_momentum.toFixed(1)}
 </span>
 </td>
 <td className="py-2 px-1">
 <span className="mono text-xs" style={{ color: "var(--text-secondary)" }}>
 {row.avg_narrative.toFixed(1)}
 </span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 );
}

// ── Trending Pools Table ──────────────────────────────────────────────────────

function fmtCompact(n: number | null | undefined): string {
 if (n == null) return "—";
 if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
 if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
 if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
 return `$${n.toFixed(0)}`;
}

function fmtPct(n: number | null | undefined) {
 if (n == null) return { text: "—", color: "var(--text-dim)" };
 return { text: (n >= 0 ? "+" : "") + n.toFixed(1) + "%", color: n >= 0 ? "var(--green)" : "var(--red)" };
}

function fmtAge(h: number | null | undefined): string {
 if (h == null) return "—";
 if (h < 1) return `${Math.round(h * 60)}m`;
 if (h < 24) return `${h.toFixed(1)}h`;
 return `${(h / 24).toFixed(1)}d`;
}

function PoolsTable({ network, title, description }: { network: string; title: string; description: string }) {
 const { data, isLoading } = useSWR(
 `/market/pools/${network}`,
 () => network === "trending" ? api.market.trending("solana", 15) : api.market.newPools("all", 15),
 { refreshInterval: 15_000 }
 );

 if (isLoading) {
 return (
 <div>
 <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>{title}</div>
 <div className="space-y-1">
 {Array.from({ length: 5 }).map((_, i) => (
 <div key={i} className="h-6 animate-pulse" style={{ background: "var(--bg-surface)" }} />
 ))}
 </div>
 </div>
 );
 }

 if (!data?.length) {
 return (
 <div>
 <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{title}</div>
 <div className="text-xs py-4 text-center" style={{ color: "var(--text-dim)" }}>
 {description} — check API connectivity
 </div>
 </div>
 );
 }

 return (
 <div>
 <div className="flex items-baseline gap-2 mb-2">
 <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{title}</span>
 <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>{description}</span>
 </div>
 <div className="overflow-auto">
 <table className="w-full">
 <thead>
 <tr style={{ borderBottom: "1px solid var(--border)" }}>
 {["Symbol", "Chain", "Narrative", "Liquidity", "Vol 1h", "1h Δ", "24h Δ", "Buy%", "Age"].map((h) => (
 <th key={h}
 className="pb-1.5 text-left text-[9px] font-semibold uppercase tracking-widest px-1 first:pl-0"
 style={{ color: "var(--text-dim)" }}>
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {data.map((p, i) => {
 const ch = { solana: "SOL", ethereum: "ETH", bsc: "BSC", base: "BASE" }[p.chain] ?? p.chain;
 const chColor = CHAIN_COLORS[p.chain] ?? "#666";
 const p1h = fmtPct(p.price_change_1h);
 const p24h = fmtPct(p.price_change_24h);
 const narColor = NARRATIVE_COLORS[p.narrative_category ?? ""] ?? "#555";
 const bp = p.buy_pressure_pct;

 return (
 <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
 <td className="py-1.5 pl-0 pr-1">
 <span className="mono text-xs font-bold" style={{ color: "var(--text-primary)" }}>
 {p.symbol.slice(0, 12)}
 </span>
 </td>
 <td className="py-1.5 px-1">
 <span className="text-[9px] font-bold" style={{ color: chColor }}>{ch}</span>
 </td>
 <td className="py-1.5 px-1">
 {p.narrative_category && (
 <span className="text-[9px] px-1 "
 style={{ color: narColor, background: `${narColor}18` }}>
 {p.narrative_category}
 </span>
 )}
 </td>
 <td className="py-1.5 px-1">
 <span className="mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
 {fmtCompact(p.liquidity_usd)}
 </span>
 </td>
 <td className="py-1.5 px-1">
 <span className="mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
 {fmtCompact(p.volume_1h)}
 </span>
 </td>
 <td className="py-1.5 px-1">
 <span className="mono text-[10px] font-bold" style={{ color: p1h.color }}>{p1h.text}</span>
 </td>
 <td className="py-1.5 px-1">
 <span className="mono text-[10px]" style={{ color: p24h.color }}>{p24h.text}</span>
 </td>
 <td className="py-1.5 px-1">
 {bp != null ? (
 <div className="flex items-center gap-1">
 <div className="w-8 h-1 overflow-hidden"
 style={{ background: "rgba(255,68,102,0.3)" }}>
 <div className="h-full" style={{
 width: `${bp}%`,
 background: bp >= 60 ? "var(--green)" : bp >= 50 ? "var(--yellow)" : "var(--red)"
 }} />
 </div>
 <span className="mono text-[9px]" style={{ color: "var(--text-secondary)" }}>
 {bp.toFixed(0)}%
 </span>
 </div>
 ) : <span style={{ color: "var(--text-dim)" }}>—</span>}
 </td>
 <td className="py-1.5 px-1">
 <span className="mono text-[10px]" style={{ color: "var(--text-dim)" }}>
 {fmtAge(p.token_age_hours)}
 </span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 );
}

// ── Page ──────────────────────────────────────────────────────────────────────

import React from "react";

export default function AnalyticsPage() {
 const { data: narratives } = useSWR(
 "/market/narrative-performance",
 api.market.narrativePerformance,
 { refreshInterval: 15_000 }
 );
 const { data: stats } = useSWR(
 "/market/stats",
 api.market.stats,
 { refreshInterval: 10_000 }
 );
 const { data: scoreDist } = useSWR(
 "/market/score-distribution",
 api.market.scoreDistribution
 );

 // Chart data
 const scoreBarData = (scoreDist ?? []).map((d) => {
 const lo = parseInt(d.range.split("-")[0]);
 return {
 label: d.range.replace("-", "–"),
 value: d.count,
 color:
 lo >= 80 ? "#00d97e" : lo >= 60 ? "#f5c543" : lo >= 40 ? "#f97316" : "#ff4466",
 };
 });

 const bandBarData = ["Strong Buy", "Watch", "Risky", "Avoid"].map((b) => ({
 label: b === "Strong Buy" ? "Strong" : b,
 value: stats?.signals.band_counts[b] ?? 0,
 color: BAND_COLORS[b],
 }));

 const chainDonutData = (stats?.dex.chains ?? []).map((c) => ({
 label: c.chain.toUpperCase(),
 value: c.count,
 color: CHAIN_COLORS[c.chain] ?? "#555",
 }));

 const radarData = (narratives ?? []).slice(0, 8).map((d) => ({
 label: d.category,
 score: d.avg_score,
 ops: Math.min((d.opportunities / Math.max(d.total, 1)) * 100, 100),
 }));

 return (
 <div className="pt-4 space-y-4">
 {/* Header */}
 <div>
 <h1 className="text-lg font-black tracking-wider uppercase"
 style={{ color: "var(--text-primary)", letterSpacing: "0.12em" }}>
 Market Analytics
 </h1>
 <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
 Narrative intelligence · score distributions · live pool discovery from GeckoTerminal
 </p>
 </div>

 {/* Global stats */}
 {stats && (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
 {[
 { label: "Total Signals", value: stats.signals.total, color: "var(--text-primary)" },
 { label: "Avg Signal Score", value: stats.signals.avg_score.toFixed(1), color: "var(--blue)" },
 { label: "Snipe Ops", value: stats.dex.snipe_opportunities, color: "var(--purple)" },
 { label: "Unread Alerts", value: stats.alerts.unread, color: stats.alerts.unread > 0 ? "var(--red)" : "var(--text-dim)" },
 ].map(({ label, value, color }) => (
 <div key={label} className=" px-3 py-2.5"
 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
 <div className="text-[9px] uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
 {label}
 </div>
 <div className="mono text-xl font-black mt-0.5" style={{ color }}>{value}</div>
 </div>
 ))}
 </div>
 )}

 {/* Charts row */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Panel title="Signal Score Distribution" sub="all coins by score bucket">
 {scoreBarData.length > 0 ? (
 <SVGBarChart data={scoreBarData} />
 ) : (
 <div className="h-32 flex items-center justify-center text-xs"
 style={{ color: "var(--text-dim)" }}>
 No signal data yet
 </div>
 )}
 </Panel>

 <Panel title="Band Distribution" sub="current signals by band">
 {bandBarData.some((d) => d.value > 0) ? (
 <SVGBarChart data={bandBarData} />
 ) : (
 <div className="h-32 flex items-center justify-center text-xs"
 style={{ color: "var(--text-dim)" }}>
 No band data yet
 </div>
 )}
 </Panel>

 <Panel title="Chain Coverage" sub="DEX tokens by chain">
 {chainDonutData.length > 0 ? (
 <SVGDonut data={chainDonutData} />
 ) : (
 <div className="h-32 flex items-center justify-center text-xs"
 style={{ color: "var(--text-dim)" }}>
 No chain data yet
 </div>
 )}
 </Panel>
 </div>

 {/* Narrative row */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <Panel title="Narrative Radar" sub="avg score vs opportunity rate">
 {radarData.length > 0 ? (
 <div className="flex justify-center">
 <SVGRadar data={radarData} />
 </div>
 ) : (
 <div className="h-48 flex items-center justify-center text-xs"
 style={{ color: "var(--text-dim)" }}>
 No narrative data yet
 </div>
 )}
 </Panel>

 <div className="lg:col-span-2">
 <Panel title="Narrative Performance" sub="DEX scanner breakdown">
 <NarrativeTable data={narratives ?? []} />
 </Panel>
 </div>
 </div>

 {/* Live pool discovery */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <Panel title="Trending Pools" sub="GeckoTerminal — Solana">
 <PoolsTable
 network="trending"
 title=""
 description="top Solana pools by volume"
 />
 </Panel>
 <Panel title="New Pools" sub="GeckoTerminal — all chains">
 <PoolsTable
 network="new"
 title=""
 description="newly created across chains"
 />
 </Panel>
 </div>
 </div>
 );
}
