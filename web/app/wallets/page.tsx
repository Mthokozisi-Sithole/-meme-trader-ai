"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Wallet } from "@/types";

export const dynamic = "force-dynamic";

const WALLET_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  smart_money: { bg: "rgba(0,217,126,0.15)", color: "var(--green)" },
  dev: { bg: "rgba(68,136,255,0.15)", color: "var(--blue)" },
  bot: { bg: "rgba(255,152,0,0.15)", color: "#ff9800" },
  whale: { bg: "rgba(168,85,247,0.15)", color: "var(--purple)" },
  sniper: { bg: "rgba(255,235,59,0.15)", color: "var(--yellow)" },
  dumper: { bg: "rgba(255,68,102,0.15)", color: "var(--red)" },
  retail: { bg: "rgba(150,150,150,0.15)", color: "var(--text-secondary)" },
  unknown: { bg: "rgba(100,100,100,0.1)", color: "var(--text-dim)" },
};

function fmtAddress(address: string): string {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

function fmtPnl(n: number | null | undefined): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  let str: string;
  if (abs >= 1e6) str = `$${(abs / 1e6).toFixed(2)}M`;
  else if (abs >= 1e3) str = `$${(abs / 1e3).toFixed(1)}K`;
  else str = `$${abs.toFixed(0)}`;
  return n < 0 ? `-${str}` : `+${str}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function QualityBar({ score }: { score: number }) {
  const color = score > 70 ? "var(--green)" : score > 40 ? "var(--yellow)" : "var(--red)";
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 shrink-0"
        style={{
          width: "60px",
          background: "var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.min(100, score)}%`,
            background: color,
          }}
        />
      </div>
      <span className="text-xs mono font-semibold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function WalletTypeBadge({ type }: { type: Wallet["wallet_type"] }) {
  const style = WALLET_TYPE_COLORS[type] ?? WALLET_TYPE_COLORS.unknown;
  return (
    <span
      className="text-[11px] font-semibold px-1.5 py-0.5 uppercase"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}33` }}
    >
      {type.replace("_", " ")}
    </span>
  );
}

export default function WalletsPage() {
  const [chain, setChain] = useState("");
  const [walletType, setWalletType] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const { data: wallets, isLoading, error } = useSWR<Wallet[]>(
    ["/wallets", chain, walletType, flaggedOnly],
    () =>
      api.wallets.list({
        chain: chain || undefined,
        wallet_type: walletType || undefined,
        flagged: flaggedOnly || undefined,
        limit: 100,
      }),
    { refreshInterval: 30_000 }
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Wallet Intelligence
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
            {wallets != null ? `${wallets.length} wallets tracked` : "Loading…"}
            {" — "} on-chain behavior analysis
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="text-sm px-3 py-2 focus:outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <option value="">All Chains</option>
          <option value="solana">Solana</option>
          <option value="ethereum">Ethereum</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
        </select>
        <select
          value={walletType}
          onChange={(e) => setWalletType(e.target.value)}
          className="text-sm px-3 py-2 focus:outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <option value="">All Types</option>
          <option value="smart_money">Smart Money</option>
          <option value="dev">Dev</option>
          <option value="bot">Bot</option>
          <option value="whale">Whale</option>
          <option value="sniper">Sniper</option>
          <option value="dumper">Dumper</option>
          <option value="retail">Retail</option>
          <option value="unknown">Unknown</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
            className="accent-indigo-500"
          />
          Flagged only
        </label>
      </div>

      {isLoading && (
        <div className="text-center py-16 text-sm" style={{ color: "var(--text-dim)" }}>
          Loading wallets…
        </div>
      )}
      {error && (
        <div className="p-4 text-sm border" style={{ background: "rgba(255,68,102,0.08)", borderColor: "rgba(255,68,102,0.3)", color: "var(--red)" }}>
          Failed to load. Is the API running?
        </div>
      )}
      {wallets && wallets.length === 0 && (
        <div className="py-12 px-4 border text-center space-y-2" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            No wallet data yet
          </p>
          <p className="text-xs max-w-md mx-auto" style={{ color: "var(--text-dim)" }}>
            Wallet intelligence requires on-chain transaction indexing. Configure a{" "}
            <span style={{ color: "var(--blue)" }}>BIRDEYE_API_KEY</span> in your environment to enable
            wallet-level tracking (smart money, dev wallets, snipers) for Solana tokens.
          </p>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
            Behavioral signals and liquidity monitoring are already active without an API key.
          </p>
        </div>
      )}

      {wallets && wallets.length > 0 && (
        <div className="overflow-x-auto border" style={{ borderColor: "var(--border)" }}>
          <table className="min-w-full divide-y text-sm" style={{ borderColor: "var(--border)" }}>
            <thead style={{ background: "var(--bg-card)" }}>
              <tr>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-dim)" }}>Address</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden sm:table-cell" style={{ color: "var(--text-dim)" }}>Chain</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-dim)" }}>Type</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-dim)" }}>Quality</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden md:table-cell" style={{ color: "var(--text-dim)" }}>Win Rate</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden sm:table-cell" style={{ color: "var(--text-dim)" }}>Txns</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden md:table-cell" style={{ color: "var(--text-dim)" }}>Rug Exits</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--text-dim)" }}>Early Buys</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--text-dim)" }}>PnL</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap hidden xl:table-cell" style={{ color: "var(--text-dim)" }}>Last Active</th>
              </tr>
            </thead>
            <tbody style={{ background: "var(--bg-base)" }}>
              {wallets.map((w) => (
                <tr
                  key={`${w.chain}:${w.address}`}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <div
                          className="mono text-xs font-medium"
                          style={{ color: w.flagged ? "var(--red)" : "var(--text-primary)" }}
                        >
                          {fmtAddress(w.address)}
                          {w.flagged && (
                            <span className="ml-1.5 text-[10px] font-bold" style={{ color: "var(--red)" }}>
                              ⚑
                            </span>
                          )}
                        </div>
                        {w.label && (
                          <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>
                            {w.label}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                    {w.chain.toUpperCase()}
                  </td>
                  <td className="px-3 py-2">
                    <WalletTypeBadge type={w.wallet_type} />
                  </td>
                  <td className="px-3 py-2">
                    <QualityBar score={w.quality_score} />
                  </td>
                  <td className="px-3 py-2 text-xs mono hidden md:table-cell">
                    {w.win_rate != null ? (
                      <span style={{ color: w.win_rate >= 0.5 ? "var(--green)" : "var(--red)" }}>
                        {(w.win_rate * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-dim)" }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs mono hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                    {w.total_txns.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs mono hidden md:table-cell">
                    <span style={{ color: w.rug_exits > 0 ? "var(--red)" : "var(--text-dim)" }}>
                      {w.rug_exits}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs mono hidden lg:table-cell">
                    <span style={{ color: w.times_early_buyer > 0 ? "var(--green)" : "var(--text-dim)" }}>
                      {w.times_early_buyer}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs mono hidden lg:table-cell">
                    {w.total_realized_pnl_usd != null ? (
                      <span
                        style={{
                          color: w.total_realized_pnl_usd >= 0 ? "var(--green)" : "var(--red)",
                          fontWeight: 600,
                        }}
                      >
                        {fmtPnl(w.total_realized_pnl_usd)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-dim)" }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs hidden xl:table-cell" style={{ color: "var(--text-dim)" }}>
                    {fmtTime(w.last_active)}
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
