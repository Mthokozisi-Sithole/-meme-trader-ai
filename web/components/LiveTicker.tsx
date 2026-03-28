"use client";

import { useEffect, useState, useCallback } from "react";
import type { DexToken } from "@/types";

const CHAIN_BADGE: Record<string, string> = {
 solana: "#9945ff",
 ethereum: "#627eea",
 bsc: "#f0b90b",
 base: "#0052ff",
};

interface TickerItem {
 symbol: string;
 chain: string;
 score: number | null;
 price_change_1h: number | null;
 band: string | null;
}

interface Props {
 items: TickerItem[];
}

function pct(n: number | null | undefined): string {
 if (n == null) return "—";
 return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

function TickerEntry({ item }: { item: TickerItem }) {
 const chainColor = CHAIN_BADGE[item.chain] ?? "#666";
 const changeColor = (item.price_change_1h ?? 0) >= 0 ? "var(--green)" : "var(--red)";

 return (
 <span className="inline-flex items-center gap-2 px-4 shrink-0">
 {/* Chain dot */}
 <span className="w-1.5 h-1.5 shrink-0" style={{ background: chainColor }} />
 {/* Symbol */}
 <span className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>
 {item.symbol}
 </span>
 {/* Score */}
 {item.score != null && (
 <span className="mono text-xs font-semibold" style={{
 color: item.score >= 80 ? "var(--green)" : item.score >= 60 ? "var(--yellow)" : "var(--text-secondary)"
 }}>
 {item.score.toFixed(0)}
 </span>
 )}
 {/* Price change */}
 <span className="mono text-xs" style={{ color: changeColor }}>
 {pct(item.price_change_1h)}
 </span>
 {/* Separator */}
 <span className="opacity-20 text-xs">|</span>
 </span>
 );
}

export function LiveTicker({ items }: Props) {
 if (!items || items.length === 0) {
 return (
 <div className="h-8 flex items-center px-4"
 style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
 <span className="text-xs" style={{ color: "var(--text-dim)" }}>
 Waiting for live data…
 </span>
 </div>
 );
 }

 // Duplicate for seamless loop
 const doubled = [...items, ...items];

 return (
 <div
 className="overflow-hidden h-8 flex items-center"
 style={{
 background: "var(--bg-surface)",
 borderBottom: "1px solid var(--border)",
 }}
 >
 <div
 className="inline-flex whitespace-nowrap ticker-track"
 style={{ animationDuration: `${Math.max(20, items.length * 3)}s` }}
 >
 {doubled.map((item, i) => (
 <TickerEntry key={`${item.symbol}-${i}`} item={item} />
 ))}
 </div>
 </div>
 );
}
