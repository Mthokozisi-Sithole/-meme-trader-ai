"use client";

import type { NarrativePerf } from "@/lib/api";

const NARRATIVE_META: Record<string, { icon: string; color: string; glow: string }> = {
 AI: { icon: "⬡", color: "#4488ff", glow: "rgba(68,136,255,0.3)" },
 Political: { icon: "◈", color: "#ef4444", glow: "rgba(239,68,68,0.3)" },
 Cult: { icon: "◉", color: "#a855f7", glow: "rgba(168,85,247,0.3)" },
 Animal: { icon: "◎", color: "#f5c543", glow: "rgba(245,197,67,0.3)" },
 Space: { icon: "◇", color: "#818cf8", glow: "rgba(129,140,248,0.3)" },
 Celebrity: { icon: "◆", color: "#ec4899", glow: "rgba(236,72,153,0.3)" },
 Gaming: { icon: "◑", color: "#22d3ee", glow: "rgba(34,211,238,0.3)" },
 Food: { icon: "○", color: "#f97316", glow: "rgba(249,115,22,0.3)" },
 Finance: { icon: "□", color: "#64748b", glow: "rgba(100,116,139,0.3)" },
 Other: { icon: "·", color: "#404060", glow: "transparent" },
};

function scoreToOpacity(score: number): number {
 // 0-100 score → 0.08-1.0 opacity
 return 0.08 + (score / 100) * 0.92;
}

interface Props {
 data: NarrativePerf[];
 loading?: boolean;
}

export function NarrativeHeatmap({ data, loading }: Props) {
 if (loading) {
 return (
 <div className="grid grid-cols-5 gap-2">
 {Array.from({ length: 10 }).map((_, i) => (
 <div key={i} className="h-20 animate-pulse"
 style={{ background: "var(--bg-card)" }} />
 ))}
 </div>
 );
 }

 const maxScore = Math.max(...data.map((d) => d.avg_score), 1);

 return (
 <div className="grid grid-cols-5 gap-2">
 {data.map((item) => {
 const meta = NARRATIVE_META[item.category] ?? NARRATIVE_META.Other;
 const intensity = item.avg_score / maxScore;
 const bg = `rgba(${hexToRgb(meta.color)}, ${0.05 + intensity * 0.2})`;
 const border = `rgba(${hexToRgb(meta.color)}, ${0.1 + intensity * 0.4})`;

 return (
 <div
 key={item.category}
 className="relative p-3 cursor-default transition-all hover:brightness-110"
 style={{
 background: bg,
 border: `1px solid ${border}`,
 }}
 title={`${item.category}: ${item.total} tokens, ${item.opportunities} opportunities`}
 >
 {/* Category icon + name */}
 <div className="flex items-center gap-1.5 mb-2">
 <span className="text-lg" style={{ color: meta.color }}>{meta.icon}</span>
 <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
 {item.category}
 </span>
 </div>

 {/* Score */}
 <div className="mono text-xl font-black" style={{ color: meta.color }}>
 {item.avg_score.toFixed(0)}
 </div>
 <div className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
 avg score
 </div>

 {/* Opportunity count */}
 {item.opportunities > 0 && (
 <div
 className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 "
 style={{ background: meta.color, color: "#000" }}
 >
 {item.opportunities}
 </div>
 )}

 {/* Mini score bar */}
 <div className="mt-2 h-0.5 overflow-hidden"
 style={{ background: "rgba(255,255,255,0.05)" }}>
 <div
 className="h-full transition-all"
 style={{ width: `${item.avg_score}%`, background: meta.color }}
 />
 </div>
 </div>
 );
 })}
 </div>
 );
}

function hexToRgb(hex: string): string {
 const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
 if (!result) return "128,128,128";
 return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}
