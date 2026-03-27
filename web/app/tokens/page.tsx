"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { DexToken } from "@/types";

export const dynamic = "force-dynamic";

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 0.000001) return `$${n.toExponential(3)}`;
  if (n < 0.001) return `$${n.toFixed(7)}`;
  if (n < 1) return `$${n.toFixed(5)}`;
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

function PctCell({ v }: { v: number | null }) {
  if (v == null) return <span className="text-gray-500">—</span>;
  return (
    <span className={`font-mono font-semibold ${v >= 0 ? "text-green-500" : "text-red-500"}`}>
      {v >= 0 ? "+" : ""}{v.toFixed(1)}%
    </span>
  );
}

const BAND_DOT: Record<string, string> = {
  "Strong Buy": "bg-green-500",
  Watch: "bg-yellow-500",
  Risky: "bg-orange-500",
  Avoid: "bg-red-500",
};

const CHAIN_LABELS: Record<string, string> = {
  solana: "SOL",
  ethereum: "ETH",
  bsc: "BSC",
  base: "BASE",
};

const NARRATIVE_BADGE: Record<string, string> = {
  AI: "bg-blue-900/50 text-blue-300",
  Political: "bg-red-900/50 text-red-300",
  Cult: "bg-purple-900/50 text-purple-300",
  Animal: "bg-yellow-900/50 text-yellow-300",
  Space: "bg-indigo-900/50 text-indigo-300",
  Celebrity: "bg-pink-900/50 text-pink-300",
  Gaming: "bg-teal-900/50 text-teal-300",
};

export default function TokensPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [chain, setChain] = useState("");
  const [snipeOnly, setSnipeOnly] = useState(false);

  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(val), 300);
  }

  const { data: tokens, isLoading, error } = useSWR<DexToken[]>(
    ["/snipes/tokens", debouncedSearch, chain, snipeOnly],
    () =>
      api.snipes.tokens({
        search: debouncedSearch || undefined,
        chain: chain || undefined,
        snipe_only: snipeOnly || undefined,
        limit: 200,
      }),
    { refreshInterval: 60_000 }
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">DEX Tokens</h1>
            <p className="text-sm text-gray-400 mt-1">
              {tokens != null ? `${tokens.length} tokens tracked` : "Loading…"}
              {" — "} DexScreener + Pump.fun
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search symbol or name…"
            className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="">All Chains</option>
            <option value="solana">Solana</option>
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="base">Base</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={snipeOnly}
              onChange={(e) => setSnipeOnly(e.target.checked)}
              className="accent-indigo-500"
            />
            Snipe opportunities only
          </label>
        </div>

        {isLoading && (
          <div className="text-center py-16 text-gray-500">Loading tokens…</div>
        )}
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4 text-sm">
            Failed to load. Is the API running?
          </div>
        )}
        {tokens && tokens.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            No tokens yet — the DEX worker is on its first scan. Check back in ~90s.
          </div>
        )}

        {tokens && tokens.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-gray-900">
                <tr>
                  {["Token", "Chain", "Score", "Band", "Price", "5m%", "1h%", "Vol 5m", "Liquidity", "MCap", "Age", "Buy Press", "Narrative", "Snipe"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-950">
                {tokens.map((t) => {
                  const buys = t.buys_5m ?? 0;
                  const sells = t.sells_5m ?? 0;
                  const total = buys + sells;
                  const bp = t.buy_pressure_pct ?? (total > 0 ? Math.round((buys / total) * 100) : null);
                  const dot = BAND_DOT[t.band ?? ""] ?? "bg-gray-600";

                  return (
                    <tr
                      key={`${t.chain}:${t.token_address}`}
                      className="hover:bg-gray-900 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {t.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.image_url} alt={t.symbol} width={20} height={20} className="rounded-full shrink-0" />
                          ) : (
                            <div className="w-5 h-5 bg-gray-700 rounded-full shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-white">{t.symbol}</div>
                            {t.name && <div className="text-xs text-gray-500 truncate max-w-[100px]">{t.name}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400">
                        {CHAIN_LABELS[t.chain] ?? t.chain.toUpperCase()}
                        <div className="text-gray-600">{t.dex_id}</div>
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-white">
                        {t.snipe_score?.toFixed(1) ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${dot}`} />
                          <span className="text-xs text-gray-300">{t.band ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-200">{fmtPrice(t.price_usd)}</td>
                      <td className="px-3 py-2"><PctCell v={t.price_change_5m} /></td>
                      <td className="px-3 py-2"><PctCell v={t.price_change_1h} /></td>
                      <td className="px-3 py-2 font-mono text-gray-400">{fmtCompact(t.volume_5m)}</td>
                      <td className="px-3 py-2 font-mono text-gray-400">{fmtCompact(t.liquidity_usd)}</td>
                      <td className="px-3 py-2 font-mono text-gray-400">{fmtCompact(t.market_cap)}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{fmtAge(t.token_age_hours)}</td>
                      <td className="px-3 py-2">
                        {bp != null ? (
                          <span className={`text-xs font-semibold ${bp >= 60 ? "text-green-400" : bp >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                            {bp}%
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {t.narrative_category && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${NARRATIVE_BADGE[t.narrative_category] ?? "bg-gray-800 text-gray-400"}`}>
                            {t.narrative_category}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {t.sniping_opportunity ? (
                          <span className="text-xs bg-green-900/50 text-green-300 border border-green-700 px-2 py-0.5 rounded font-bold">
                            YES
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
