"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import Link from "next/link";
import { api } from "@/lib/api";
import { SignalCard } from "@/components/SignalCard";
import type { Coin, Signal } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: { symbol: string };
}

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

function fmtSupply(n: number | null | undefined, symbol: string): string {
  if (n == null) return "—";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T ${symbol}`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B ${symbol}`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M ${symbol}`;
  return `${n.toLocaleString()} ${symbol}`;
}

function PctBadge({ value, label }: { value: number | null; label?: string }) {
  if (value == null) return <span className="text-gray-400">—</span>;
  const pos = value >= 0;
  return (
    <span className={`font-semibold ${pos ? "text-green-600" : "text-red-600"}`}>
      {label && <span className="text-gray-400 font-normal mr-1">{label}</span>}
      {pos ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  highlight?: "red" | "green" | "yellow";
}) {
  const border =
    highlight === "red"
      ? "border-red-200 bg-red-50"
      : highlight === "green"
      ? "border-green-200 bg-green-50"
      : highlight === "yellow"
      ? "border-yellow-200 bg-yellow-50"
      : "border-gray-200 bg-white";
  return (
    <div className={`border rounded-lg p-4 ${border}`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="font-semibold text-gray-900 text-sm">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function CoinPage({ params }: Props) {
  const symbol = params.symbol.toUpperCase();

  const { data: coin } = useSWR<Coin>(
    `/coins/${symbol}`,
    () => api.coins.get(symbol),
    { refreshInterval: 30_000 }
  );
  const { data: signals, isLoading } = useSWR<Signal[]>(
    `/signals/${symbol}`,
    () => api.signals.forCoin(symbol),
    { refreshInterval: 30_000 }
  );

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      await api.signals.generate(symbol);
      await globalMutate(`/signals/${symbol}`);
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate signal");
    } finally {
      setGenerating(false);
    }
  }

  const latest = signals?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {coin?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coin.image_url}
              alt={symbol}
              width={56}
              height={56}
              className="rounded-full shrink-0 mt-1"
            />
          )}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/coins" className="text-sm text-gray-400 hover:text-gray-600">
                ← Coins
              </Link>
              {coin?.market_cap_rank && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  #{coin.market_cap_rank}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mt-1">{symbol}</h1>
            {coin && <p className="text-gray-500">{coin.name}</p>}
            {coin?.coingecko_id && (
              <a
                href={`https://www.coingecko.com/en/coins/${coin.coingecko_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:underline mt-1 inline-block"
              >
                View on CoinGecko ↗
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {coin && (
            <div className="text-right">
              <div className="text-3xl font-bold">{fmtPrice(coin.price_usd)}</div>
              <div className="flex gap-3 justify-end text-sm mt-0.5">
                <PctBadge value={coin.price_change_24h} label="24h" />
                <PctBadge value={coin.price_change_7d} label="7d" />
              </div>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate Signal"}
          </button>
        </div>
      </div>

      {generateError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {generateError}
        </div>
      )}

      {/* Latest signal summary */}
      {latest && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-indigo-700">
            Latest signal:{" "}
            <strong
              className={
                latest.score >= 80
                  ? "text-green-700"
                  : latest.score >= 60
                  ? "text-yellow-700"
                  : latest.score >= 40
                  ? "text-orange-700"
                  : "text-red-700"
              }
            >
              {latest.band} ({latest.score.toFixed(1)})
            </strong>
            {" — "}Entry ${fmtPrice(latest.trade_levels.entry_low).slice(1)}–{fmtPrice(latest.trade_levels.entry_high).slice(1)}{" "}
            · Target {fmtPrice(latest.trade_levels.exit_target)}{" "}
            · SL {fmtPrice(latest.trade_levels.stop_loss)}
          </div>
          <span className="text-xs text-indigo-400">
            {new Date(latest.created_at).toLocaleString()}
          </span>
        </div>
      )}

      {/* Market data grid */}
      {coin && (
        <>
          <h2 className="text-base font-semibold text-gray-700">Market Data</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Market Cap" value={fmtLarge(coin.market_cap_usd)} />
            <StatCard label="Volume 24h" value={fmtLarge(coin.volume_24h_usd)} />
            <StatCard label="24h High" value={fmtPrice(coin.high_24h)} highlight="green" />
            <StatCard label="24h Low" value={fmtPrice(coin.low_24h)} highlight="red" />
          </div>

          {/* All-time */}
          <h2 className="text-base font-semibold text-gray-700">All-Time</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="All-Time High"
              value={fmtPrice(coin.ath)}
              sub={<PctBadge value={coin.ath_change_percentage} />}
              highlight={
                coin.ath_change_percentage != null && coin.ath_change_percentage > -20
                  ? "green"
                  : undefined
              }
            />
            <StatCard
              label="All-Time Low"
              value={fmtPrice(coin.atl)}
              sub={<PctBadge value={coin.atl_change_percentage} />}
            />
            <StatCard
              label="Circulating Supply"
              value={fmtSupply(coin.circulating_supply, symbol)}
            />
            <StatCard
              label="Total Supply"
              value={coin.total_supply ? fmtSupply(coin.total_supply, symbol) : "∞ / Unknown"}
            />
          </div>

          {/* On-chain (optional, may be null) */}
          {(coin.holders != null || coin.whale_concentration != null) && (
            <>
              <h2 className="text-base font-semibold text-gray-700">On-Chain</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {coin.holders != null && (
                  <StatCard
                    label="Holders"
                    value={coin.holders.toLocaleString()}
                    highlight={coin.holders < 500 ? "red" : undefined}
                  />
                )}
                {coin.whale_concentration != null && (
                  <StatCard
                    label="Whale Concentration"
                    value={`${(coin.whale_concentration * 100).toFixed(1)}%`}
                    highlight={coin.whale_concentration > 0.3 ? "red" : undefined}
                    sub={coin.whale_concentration > 0.3 ? "⚠ High concentration" : undefined}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Signal history */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Signal History</h2>
        {signals && signals.length > 0 && (
          <span className="text-xs text-gray-400">
            {signals.length} signal{signals.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading && <div className="text-gray-400">Loading…</div>}

      {signals && signals.length === 0 && (
        <div className="text-gray-400 py-8 text-center">
          No signals yet for {symbol}. Click &ldquo;Generate Signal&rdquo; above.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signals?.map((s) => (
          <SignalCard key={s.id} signal={s} />
        ))}
      </div>
    </div>
  );
}
