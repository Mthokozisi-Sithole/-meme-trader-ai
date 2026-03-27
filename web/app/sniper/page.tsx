"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { api } from "@/lib/api";
import { LiveTicker } from "@/components/LiveTicker";
import { FilterPresetPicker } from "@/components/FilterPresetPicker";
import { useWsData } from "@/lib/ws";
import { PRESETS, computeMetrics } from "@/lib/presets";
import type { DexToken } from "@/types";

export const dynamic = "force-dynamic";

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 0.000001) return `$${n.toExponential(2)}`;
  if (n < 0.001) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

function fmtCompact(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtAge(hours: number | null | undefined): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function fmtPct(n: number | null | undefined): { text: string; color: string } {
  if (n == null) return { text: "—", color: "var(--text-dim)" };
  const color = n >= 0 ? "var(--green)" : "var(--red)";
  return { text: (n >= 0 ? "+" : "") + n.toFixed(1) + "%", color };
}

// ── Chain config ──────────────────────────────────────────────────────────────

const CHAINS: Record<string, { label: string; color: string }> = {
  solana:   { label: "SOL", color: "#9945ff" },
  ethereum: { label: "ETH", color: "#627eea" },
  bsc:      { label: "BSC", color: "#f0b90b" },
  base:     { label: "BASE", color: "#0052ff" },
};

const NARRATIVE_COLORS: Record<string, { color: string; bg: string }> = {
  AI:        { color: "#4488ff", bg: "rgba(68,136,255,0.12)" },
  Political: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  Cult:      { color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  Animal:    { color: "#f5c543", bg: "rgba(245,197,67,0.12)" },
  Space:     { color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  Celebrity: { color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
  Gaming:    { color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  Food:      { color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  Finance:   { color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

const BAND_COLORS: Record<string, string> = {
  "Strong Buy": "var(--green)",
  Watch: "var(--yellow)",
  Risky: "#f97316",
  Avoid: "var(--red)",
};

// ── Buy Pressure Bar ──────────────────────────────────────────────────────────

function PressureBar({ buys, sells }: { buys: number | null; sells: number | null }) {
  const b = buys ?? 0;
  const s = sells ?? 0;
  const total = b + s;
  if (total === 0) return <span style={{ color: "var(--text-dim)" }} className="text-[10px]">—</span>;
  const pct = Math.round((b / total) * 100);
  const color = pct >= 65 ? "var(--green)" : pct >= 50 ? "var(--yellow)" : "var(--red)";

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <span className="mono text-[10px] font-bold" style={{ color }}>{pct}%</span>
        <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>buy</span>
      </div>
      <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,68,102,0.3)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Score Cell ────────────────────────────────────────────────────────────────

function ScoreCell({ score, band }: { score: number | null; band: string | null }) {
  if (score == null) return <span style={{ color: "var(--text-dim)" }}>—</span>;
  const color = BAND_COLORS[band ?? ""] ?? "var(--text-secondary)";
  const r = 10;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div className="flex items-center gap-2">
      <svg width="26" height="26" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="13" cy="13" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle
          cx="13" cy="13" r={r}
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="mono text-xs font-black" style={{ color }}>{score.toFixed(0)}</span>
    </div>
  );
}

// ── Token Row ─────────────────────────────────────────────────────────────────

function TokenRow({ token, isNew }: { token: DexToken; isNew?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const chainCfg = CHAINS[token.chain] ?? { label: token.chain.toUpperCase(), color: "#666" };
  const narCfg = NARRATIVE_COLORS[token.narrative_category ?? ""] ?? { color: "var(--text-dim)", bg: "transparent" };
  const flags: string[] = token.risk_flags ? JSON.parse(token.risk_flags) : [];

  const p5m = fmtPct(token.price_change_5m);
  const p1h = fmtPct(token.price_change_1h);

  return (
    <>
      <tr
        className={isNew ? "fade-in" : ""}
        onClick={() => setExpanded((v) => !v)}
        style={{
          borderBottom: `1px solid ${expanded ? "transparent" : "var(--border)"}`,
          cursor: "pointer",
          background: expanded ? "var(--bg-surface)" : "transparent",
        }}
      >
        {/* Symbol + chain */}
        <td className="py-2 pl-3 pr-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{
              background: token.sniping_opportunity
                ? "var(--green)"
                : token.is_boosted ? "#f5c543" : chainCfg.color,
              boxShadow: token.sniping_opportunity ? "0 0 6px var(--green)" : "none",
            }} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="mono text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  {token.symbol}
                </span>
                <span
                  className="text-[9px] px-1 rounded"
                  style={{ background: `${chainCfg.color}22`, color: chainCfg.color }}
                >
                  {chainCfg.label}
                </span>
                {token.is_boosted && (
                  <span className="text-[9px] px-1 rounded" style={{ background: "#f5c54322", color: "#f5c543" }}>
                    BOOST
                  </span>
                )}
              </div>
              {token.name && (
                <div className="text-[10px] truncate max-w-[100px]" style={{ color: "var(--text-dim)" }}>
                  {token.name}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Score */}
        <td className="py-2 px-2">
          <ScoreCell score={token.snipe_score} band={token.band} />
        </td>

        {/* Narrative */}
        <td className="py-2 px-2 hidden md:table-cell">
          {token.narrative_category && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ color: narCfg.color, background: narCfg.bg }}
            >
              {token.narrative_category}
            </span>
          )}
        </td>

        {/* Price */}
        <td className="py-2 px-2">
          <span className="mono text-[10px]" style={{ color: "var(--text-primary)" }}>
            {fmtPrice(token.price_usd)}
          </span>
        </td>

        {/* 5m change */}
        <td className="py-2 px-2 hidden sm:table-cell">
          <span className="mono text-[10px] font-semibold" style={{ color: p5m.color }}>
            {p5m.text}
          </span>
        </td>

        {/* 1h change */}
        <td className="py-2 px-2">
          <span className="mono text-[10px] font-semibold" style={{ color: p1h.color }}>
            {p1h.text}
          </span>
        </td>

        {/* Liquidity */}
        <td className="py-2 px-2 hidden lg:table-cell">
          <span className="mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
            {fmtCompact(token.liquidity_usd)}
          </span>
        </td>

        {/* Vol 5m */}
        <td className="py-2 px-2 hidden xl:table-cell">
          <span className="mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
            {fmtCompact(token.volume_5m)}
          </span>
        </td>

        {/* Buy pressure */}
        <td className="py-2 px-2 hidden md:table-cell">
          <PressureBar buys={token.buys_5m} sells={token.sells_5m} />
        </td>

        {/* Entry */}
        <td className="py-2 px-2 hidden lg:table-cell">
          <span className="mono text-[10px]" style={{ color: "var(--blue)" }}>
            {fmtPrice(token.entry_low)}
          </span>
        </td>

        {/* SL */}
        <td className="py-2 px-2 hidden lg:table-cell">
          <span className="mono text-[10px]" style={{ color: "var(--red)" }}>
            {fmtPrice(token.stop_loss)}
          </span>
        </td>

        {/* Age */}
        <td className="py-2 pr-3">
          <span className="mono text-[10px]" style={{ color: "var(--text-dim)" }}>
            {fmtAge(token.token_age_hours)}
          </span>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <td colSpan={12} className="px-4 pb-3 pt-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Sub-scores */}
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-dim)" }}>
                  Score Breakdown
                </div>
                {[
                  { label: "Narrative", value: token.narrative_score },
                  { label: "Momentum", value: token.momentum_score },
                  { label: "Liquidity", value: token.liquidity_score },
                  { label: "Risk Adj.", value: token.risk_score },
                ].map(({ label, value }) => {
                  const v = value ?? 0;
                  const c = v >= 70 ? "var(--green)" : v >= 50 ? "var(--yellow)" : v >= 30 ? "#f97316" : "var(--red)";
                  return (
                    <div key={label} className="flex items-center gap-2 mb-1">
                      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full" style={{ width: `${v}%`, background: c }} />
                      </div>
                      <span className="mono w-7 text-right font-bold" style={{ color: c }}>
                        {v.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Trade levels */}
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-dim)" }}>
                  Trade Levels
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>Entry</span>
                    <span className="mono" style={{ color: "var(--blue)" }}>
                      {fmtPrice(token.entry_low)} – {fmtPrice(token.entry_high)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>T1</span>
                    <span className="mono" style={{ color: "var(--green)" }}>{fmtPrice(token.exit_target_1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>T2</span>
                    <span className="mono" style={{ color: "var(--green)" }}>{fmtPrice(token.exit_target_2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>T3</span>
                    <span className="mono" style={{ color: "var(--green)" }}>{fmtPrice(token.exit_target_3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>SL</span>
                    <span className="mono" style={{ color: "var(--red)" }}>{fmtPrice(token.stop_loss)}</span>
                  </div>
                </div>
              </div>

              {/* Market data */}
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-dim)" }}>
                  Market Data
                </div>
                <div className="space-y-1">
                  {[
                    { l: "Market Cap", v: fmtCompact(token.market_cap) },
                    { l: "FDV", v: fmtCompact(token.fdv) },
                    { l: "Liquidity", v: fmtCompact(token.liquidity_usd) },
                    { l: "Vol 1h", v: fmtCompact(token.volume_1h) },
                    { l: "Vol 24h", v: fmtCompact(token.volume_24h) },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex justify-between">
                      <span style={{ color: "var(--text-secondary)" }}>{l}</span>
                      <span className="mono" style={{ color: "var(--text-primary)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk & socials */}
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-dim)" }}>
                  Risk & Analysis
                </div>
                {flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {flags.map((f) => (
                      <span key={f} className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>
                        ⚠ {f.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 text-[10px]">
                  {token.has_twitter && <span style={{ color: "#1da1f2" }}>Twitter ✓</span>}
                  {token.has_telegram && <span style={{ color: "#2ca5e0" }}>Telegram ✓</span>}
                  {token.has_website && <span style={{ color: "var(--green)" }}>Web ✓</span>}
                </div>
                {token.reasoning && (
                  <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {token.reasoning}
                  </p>
                )}
                {token.dexscreener_url && (
                  <a
                    href={token.dexscreener_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-[10px]"
                    style={{ color: "var(--blue)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on DexScreener ↗
                  </a>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ChainFilter = "all" | "solana" | "ethereum" | "bsc" | "base";
type BandFilter = "all" | "Strong Buy" | "Watch" | "Risky";

export default function SniperPage() {
  const [chainFilter, setChainFilter] = useState<ChainFilter>("all");
  const [bandFilter, setBandFilter] = useState<BandFilter>("all");
  const [maxAge, setMaxAge] = useState(48);
  const [minScore, setMinScore] = useState(0);
  const [snipeOnly, setSnipeOnly] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<"score" | "age" | "liquidity" | "change1h">("score");

  // Live WebSocket data (streams all tracked tokens)
  const { data: wsTokens, status: wsStatus, lastTs } = useWsData<DexToken>("/ws/snipes");

  // Fallback polling — /snipes/tokens returns ALL DEX tokens (not just snipe_opportunity=true)
  const { data: swrTokens, mutate } = useSWR<DexToken[]>(
    ["/snipes/tokens", maxAge, minScore],
    () => api.snipes.tokens({ limit: 200 }),
    { refreshInterval: 8_000, fallbackData: [] }
  );

  const allTokens = wsTokens.length > 0 ? wsTokens : (swrTokens ?? []);

  // Track new items
  useEffect(() => {
    if (!allTokens.length) return;
    setSeenIds((prev) => {
      const next = new Set(prev);
      allTokens.forEach((t) => next.add(t.id));
      return next;
    });
  }, [allTokens]);

  // Preset match counts (computed over all tokens)
  const presetMatchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const preset of PRESETS) {
      counts[preset.id] = allTokens.filter((t) => preset.filter(t, computeMetrics(t))).length;
    }
    return counts;
  }, [allTokens]);

  // Active preset definition
  const currentPreset = activePreset ? PRESETS.find((p) => p.id === activePreset) : null;

  const filtered = useMemo(() => {
    let tokens = allTokens;

    if (activePreset && currentPreset) {
      // Preset overrides manual filters
      tokens = tokens.filter((t) => currentPreset.filter(t, computeMetrics(t)));
    } else {
      // Manual filters
      if (chainFilter !== "all") tokens = tokens.filter((t) => t.chain === chainFilter);
      if (bandFilter !== "all") tokens = tokens.filter((t) => t.band === bandFilter);
      if (minScore > 0) tokens = tokens.filter((t) => (t.snipe_score ?? 0) >= minScore);
      if (maxAge < 48) tokens = tokens.filter((t) => (t.token_age_hours ?? 999) <= maxAge);
      if (snipeOnly) tokens = tokens.filter((t) => t.sniping_opportunity);
    }

    const effectiveSortKey = currentPreset?.sortKey ?? sortBy;
    return [...tokens].sort((a, b) => {
      if (effectiveSortKey === "score") return (b.snipe_score ?? 0) - (a.snipe_score ?? 0);
      if (effectiveSortKey === "age") return (a.token_age_hours ?? 999) - (b.token_age_hours ?? 999);
      if (effectiveSortKey === "liquidity") return (b.liquidity_usd ?? 0) - (a.liquidity_usd ?? 0);
      if (effectiveSortKey === "change1h") return (b.price_change_1h ?? -999) - (a.price_change_1h ?? -999);
      return 0;
    });
  }, [allTokens, activePreset, currentPreset, chainFilter, bandFilter, minScore, maxAge, snipeOnly, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: allTokens.length,
    snipeOps: allTokens.filter((t) => t.sniping_opportunity).length,
    strongBuys: allTokens.filter((t) => t.band === "Strong Buy").length,
    avgScore: filtered.length
      ? (filtered.reduce((a, t) => a + (t.snipe_score ?? 0), 0) / filtered.length).toFixed(1)
      : "—",
    fresh: allTokens.filter((t) => (t.token_age_hours ?? 999) < 1).length,
  }), [allTokens, filtered]);

  // Ticker items
  const tickerItems = useMemo(() => (
    allTokens
      .filter((t) => t.sniping_opportunity)
      .sort((a, b) => (b.snipe_score ?? 0) - (a.snipe_score ?? 0))
      .slice(0, 20)
      .map((t) => ({
        symbol: t.symbol,
        chain: t.chain,
        score: t.snipe_score,
        price_change_1h: t.price_change_1h,
        band: t.band,
      }))
  ), [allTokens]);

  const HEADERS = [
    { key: "symbol", label: "Token" },
    { key: "score", label: "Score", sortable: true, sortKey: "score" },
    { key: "narrative", label: "Narrative", cls: "hidden md:table-cell" },
    { key: "price", label: "Price" },
    { key: "5m", label: "5m Δ", cls: "hidden sm:table-cell" },
    { key: "1h", label: "1h Δ", sortable: true, sortKey: "change1h" },
    { key: "liq", label: "Liquidity", cls: "hidden lg:table-cell", sortable: true, sortKey: "liquidity" },
    { key: "vol", label: "Vol 5m", cls: "hidden xl:table-cell" },
    { key: "bp", label: "Buy Press", cls: "hidden md:table-cell" },
    { key: "entry", label: "Entry", cls: "hidden lg:table-cell" },
    { key: "sl", label: "SL", cls: "hidden lg:table-cell" },
    { key: "age", label: "Age", sortable: true, sortKey: "age" },
  ] as const;

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 40px)" }}>
      {/* Live ticker */}
      <LiveTicker items={tickerItems} />

      <div className="px-0 pt-4 pb-2 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase"
              style={{ color: "var(--text-primary)", letterSpacing: "0.12em" }}>
              DEX Scanner
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                Real-time meme coin sniping — DexScreener + Pump.fun + GeckoTerminal
              </span>
              <span
                className="text-xs mono"
                style={{ color: wsStatus === "connected" ? "var(--green)" : "var(--yellow)" }}
              >
                {wsStatus === "connected" ? "● WS" : "◌ POLL"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              className="text-xs px-2 py-1.5 rounded"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <option value={1}>Last 1h</option>
              <option value={6}>Last 6h</option>
              <option value={24}>Last 24h</option>
              <option value={48}>Last 48h</option>
            </select>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="text-xs px-2 py-1.5 rounded"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <option value={0}>All scores</option>
              <option value={40}>≥ 40</option>
              <option value={60}>≥ 60</option>
              <option value={75}>≥ 75</option>
            </select>
            <button
              onClick={() => mutate()}
              className="text-xs px-3 py-1.5 rounded font-medium"
              style={{
                background: "rgba(68,136,255,0.15)",
                border: "1px solid rgba(68,136,255,0.3)",
                color: "var(--blue)",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Tokens Tracked", value: stats.total, color: "var(--text-primary)" },
            { label: "Snipe Ops", value: stats.snipeOps, color: "var(--purple)" },
            { label: "Strong Buys", value: stats.strongBuys, color: "var(--green)" },
            { label: "< 1h Old", value: stats.fresh, color: "var(--yellow)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded px-3 py-2"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="text-[9px] uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
                {label}
              </div>
              <div className="mono text-xl font-black mt-0.5" style={{ color }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Preset picker */}
        <FilterPresetPicker
          presets={PRESETS}
          activeId={activePreset}
          matchCounts={presetMatchCounts}
          onSelect={(id) => {
            setActivePreset(id);
            // Reset manual filters when a preset is activated
            if (id) {
              setChainFilter("all");
              setBandFilter("all");
              setMinScore(0);
              setSnipeOnly(false);
            }
          }}
        />

        {/* Filter bar */}
        <div className={`flex flex-wrap items-center gap-2 transition-opacity ${activePreset ? "opacity-40 pointer-events-none" : ""}`}>
          {/* Chain filters */}
          <div className="flex items-center gap-1">
            {(["all", "solana", "ethereum", "bsc", "base"] as ChainFilter[]).map((c) => {
              const cfg = c === "all" ? { label: "ALL", color: "var(--text-secondary)" } : CHAINS[c];
              const active = chainFilter === c;
              return (
                <button
                  key={c}
                  onClick={() => setChainFilter(c)}
                  className="text-[10px] px-2.5 py-1 rounded font-bold transition-all"
                  style={{
                    color: active ? (c === "all" ? "var(--text-primary)" : cfg.color) : "var(--text-dim)",
                    background: active ? `${cfg.color}1a` : "transparent",
                    border: `1px solid ${active ? `${cfg.color}44` : "var(--border)"}`,
                  }}
                >
                  {cfg.label}
                  {c !== "all" && allTokens.filter((t) => t.chain === c).length > 0 && (
                    <span className="ml-1 opacity-60">
                      ({allTokens.filter((t) => t.chain === c).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Band filters */}
          <div className="flex items-center gap-1 ml-2">
            {(["all", "Strong Buy", "Watch", "Risky"] as BandFilter[]).map((b) => {
              const color = b === "all" ? "var(--text-secondary)" : BAND_COLORS[b];
              const active = bandFilter === b;
              return (
                <button
                  key={b}
                  onClick={() => setBandFilter(b)}
                  className="text-[10px] px-2.5 py-1 rounded font-bold transition-all"
                  style={{
                    color: active ? color : "var(--text-dim)",
                    background: active ? `${color}1a` : "transparent",
                    border: `1px solid ${active ? `${color}44` : "var(--border)"}`,
                  }}
                >
                  {b === "all" ? "ALL BANDS" : b.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Snipe ops toggle */}
          <button
            onClick={() => setSnipeOnly((v) => !v)}
            className="text-[10px] px-2.5 py-1 rounded font-bold transition-all ml-2"
            style={{
              color: snipeOnly ? "#000" : "var(--purple)",
              background: snipeOnly ? "var(--purple)" : "rgba(168,85,247,0.12)",
              border: `1px solid rgba(168,85,247,${snipeOnly ? "0.8" : "0.3"})`,
            }}
          >
            ◈ Snipe Ops Only {stats.snipeOps > 0 && `(${stats.snipeOps})`}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>Sort:</span>
            {(["score", "age", "liquidity", "change1h"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="text-[10px] px-2 py-1 rounded"
                style={{
                  color: sortBy === s ? "var(--text-primary)" : "var(--text-dim)",
                  background: sortBy === s ? "var(--bg-card)" : "transparent",
                  border: `1px solid ${sortBy === s ? "var(--border-glow)" : "transparent"}`,
                }}
              >
                {s === "change1h" ? "1h Δ" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {HEADERS.map(({ key, label, cls, sortable, sortKey } : any) => (
                    <th
                      key={key}
                      className={`py-2 text-left text-[9px] font-semibold uppercase tracking-widest ${cls ?? ""} ${key === "symbol" ? "pl-3" : "px-2"} ${key === "age" ? "pr-3" : ""} ${sortable ? "cursor-pointer select-none hover:opacity-70" : ""}`}
                      style={{ color: sortBy === sortKey ? "var(--blue)" : "var(--text-dim)" }}
                      onClick={sortable ? () => setSortBy(sortKey) : undefined}
                    >
                      {label}{sortable && sortBy === sortKey && " ↓"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((token) => (
                  <TokenRow
                    key={`${token.chain}:${token.token_address}`}
                    token={token}
                    isNew={!seenIds.has(token.id)}
                  />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-16 text-center">
                      <div className="text-sm" style={{ color: "var(--text-dim)" }}>
                        {allTokens.length === 0
                          ? "DEX worker scanning… data will appear within 30s"
                          : activePreset
                          ? `No tokens match the ${currentPreset?.shortName} preset conditions right now`
                          : snipeOnly
                          ? `No snipe opportunities in current filters — ${allTokens.length} total tokens tracked`
                          : "No tokens match current filters"}
                      </div>
                      {allTokens.length === 0 && (
                        <div className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                          Worker sources: DexScreener · Pump.fun · GeckoTerminal
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            className="flex items-center justify-between px-3 py-2 border-t text-[10px]"
            style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
          >
            <span>
              {activePreset && currentPreset
                ? <span style={{ color: currentPreset.color }}>
                    {currentPreset.emoji} {currentPreset.name} — {filtered.length} matches
                  </span>
                : "Score = 35% narrative + 25% momentum + 25% liquidity + 15% risk adj"
              }
            </span>
            <span>
              {wsStatus === "connected"
                ? `Live WS · last ${lastTs ? lastTs.slice(11, 19) : "—"} UTC`
                : "Polling every 60s"
              }
              {" · "}{filtered.length} rows
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
