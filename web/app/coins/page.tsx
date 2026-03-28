"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Coin } from "@/types";

export const dynamic = "force-dynamic";

function fmtPrice(n: number | null | undefined): string {
 if (n == null) return "—";
 if (n < 0.000001) return `$${n.toExponential(3)}`;
 if (n < 0.01) return `$${n.toFixed(6)}`;
 if (n < 1) return `$${n.toFixed(4)}`;
 return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtLarge(n: number | null | undefined): string {
 if (n == null) return "—";
 if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
 if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
 if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
 if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
 return `$${n.toFixed(2)}`;
}

function PctChange({ value }: { value: number | null }) {
 if (value == null) return <span className="text-gray-400">—</span>;
 const pos = value >= 0;
 return (
 <span className={pos ? "text-green-600" : "text-red-600"}>
 {pos ? "+" : ""}{value.toFixed(2)}%
 </span>
 );
}

export default function CoinsPage() {
 const [search, setSearch] = useState("");
 const [debouncedSearch, setDebouncedSearch] = useState("");

 // Debounce search to avoid too many requests
 function handleSearch(value: string) {
 setSearch(value);
 clearTimeout((handleSearch as any)._t);
 (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(value), 300);
 }

 const { data: coins, isLoading, error } = useSWR<Coin[]>(
 ["/coins/", debouncedSearch],
 () => api.coins.list({ search: debouncedSearch || undefined, limit: 500 }),
 { refreshInterval: 120_000 }
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between flex-wrap gap-3">
 <div>
 <h1 className="text-2xl font-bold">Meme Coins</h1>
 <p className="text-sm text-gray-500 mt-1">
 {coins != null
 ? `${coins.length.toLocaleString()} coins tracked — sorted by market cap rank`
 : "Loading market data…"}
 </p>
 </div>
 <input
 type="text"
 value={search}
 onChange={(e) => handleSearch(e.target.value)}
 placeholder="Search by symbol or name…"
 className="border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-300"
 />
 </div>

 {isLoading && (
 <div className="text-center py-16 text-gray-400">Loading coins…</div>
 )}
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
 Failed to load coins. Is the API running? The worker may still be fetching data — check back in a minute.
 </div>
 )}
 {coins && coins.length === 0 && (
 <div className="text-center py-16 text-gray-400">
 {debouncedSearch
 ? `No coins match "${debouncedSearch}".`
 : "No coins yet — the worker is fetching market data from CoinGecko. Check back shortly."}
 </div>
 )}

 {coins && coins.length > 0 && (
 <div className="overflow-x-auto border border-gray-200 shadow-sm">
 <table className="min-w-full divide-y divide-gray-200 text-sm">
 <thead className="bg-gray-50 sticky top-0">
 <tr>
 {["#", "Coin", "Price", "24h %", "7d %", "Market Cap", "Volume 24h", "Circulating Supply", ""].map((h) => (
 <th
 key={h}
 className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
 >
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-100">
 {coins.map((c) => (
 <tr key={c.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-4 py-3 text-gray-400 text-xs">
 {c.market_cap_rank ?? "—"}
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 {c.image_url && (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={c.image_url}
 alt={c.symbol}
 width={24}
 height={24}
 className=" shrink-0"
 />
 )}
 <div>
 <div className="font-bold text-gray-900">{c.symbol}</div>
 <div className="text-xs text-gray-400">{c.name}</div>
 </div>
 </div>
 </td>
 <td className="px-4 py-3 font-mono text-gray-900">
 {fmtPrice(c.price_usd)}
 </td>
 <td className="px-4 py-3 font-mono font-semibold">
 <PctChange value={c.price_change_24h} />
 </td>
 <td className="px-4 py-3 font-mono font-semibold">
 <PctChange value={c.price_change_7d} />
 </td>
 <td className="px-4 py-3 font-mono text-gray-600">
 {fmtLarge(c.market_cap_usd)}
 </td>
 <td className="px-4 py-3 font-mono text-gray-600">
 {fmtLarge(c.volume_24h_usd)}
 </td>
 <td className="px-4 py-3 font-mono text-gray-600 text-xs">
 {c.circulating_supply != null
 ? `${(c.circulating_supply / 1e9).toFixed(2)}B ${c.symbol}`
 : "—"}
 </td>
 <td className="px-4 py-3">
 <Link
 href={`/coins/${c.symbol}`}
 className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium whitespace-nowrap"
 >
 Details →
 </Link>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 );
}
