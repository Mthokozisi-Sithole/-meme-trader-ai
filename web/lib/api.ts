import type {
  Coin, Signal, Alert, DexToken, Wallet, WalletTransaction,
  BehavioralSignal, BehavioralSummary, LiquidityEvent,
  LLNOverview, PatternPerformance, ReturnDistribution, StrategyPerformance,
  SignalOutcome, SimulationResult, RegimeStat, FeatureImportance, RiskSummary,
} from "@/types";

// All API calls go through the Next.js proxy (/api/*) so the browser
// only ever needs to reach port 3000 — no direct access to port 8000 needed.
const BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface MarketStats {
  signals: { total: number; band_counts: Record<string, number>; avg_score: number };
  dex: {
    snipe_opportunities: number;
    strong_buys: number;
    narratives: { category: string; count: number; avg_score: number }[];
    chains: { chain: string; count: number }[];
  };
  alerts: { unread: number };
  top_tokens: {
    symbol: string; chain: string; score: number | null;
    band: string | null; narrative: string | null;
    price_change_1h: number | null; liquidity_usd: number | null;
  }[];
}

export interface NarrativePerf {
  category: string;
  total: number;
  opportunities: number;
  avg_score: number;
  avg_momentum: number;
  avg_narrative: number;
}

export interface TrendingPool {
  source: string;
  chain: string;
  symbol: string;
  name: string;
  price_usd: number | null;
  market_cap: number | null;
  liquidity_usd: number | null;
  volume_1h: number | null;
  volume_24h: number | null;
  price_change_1h: number | null;
  price_change_24h: number | null;
  buy_pressure_pct: number | null;
  narrative_category?: string;
  narrative_score?: number;
  token_age_hours: number | null;
}

export const api = {
  coins: {
    list: (params?: { search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.limit != null) q.set("limit", String(params.limit));
      if (params?.offset != null) q.set("offset", String(params.offset));
      const qs = q.toString();
      return apiFetch<Coin[]>(`/coins${qs ? `?${qs}` : ""}`);
    },
    get: (symbol: string) => apiFetch<Coin>(`/coins/${symbol}`),
  },
  signals: {
    list: (limit = 50) => apiFetch<Signal[]>(`/signals?limit=${limit}`),
    forCoin: (symbol: string) => apiFetch<Signal[]>(`/signals/${symbol}`),
    generate: (symbol: string) =>
      apiFetch<Signal>(`/signals/${symbol}/generate`, { method: "POST" }),
  },
  snipes: {
    list: (params?: { limit?: number; max_age_hours?: number }) => {
      const q = new URLSearchParams();
      if (params?.limit != null) q.set("limit", String(params.limit));
      if (params?.max_age_hours != null) q.set("max_age_hours", String(params.max_age_hours));
      const qs = q.toString();
      return apiFetch<DexToken[]>(`/snipes${qs ? `?${qs}` : ""}`);
    },
    tokens: (params?: { chain?: string; snipe_only?: boolean; min_score?: number; search?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.chain) q.set("chain", params.chain);
      if (params?.snipe_only) q.set("snipe_only", "true");
      if (params?.min_score != null) q.set("min_score", String(params.min_score));
      if (params?.search) q.set("search", params.search);
      if (params?.limit != null) q.set("limit", String(params.limit));
      const qs = q.toString();
      return apiFetch<DexToken[]>(`/snipes/tokens${qs ? `?${qs}` : ""}`);
    },
  },
  alerts: {
    list: (unreadOnly = false) =>
      apiFetch<Alert[]>(`/alerts?unread_only=${unreadOnly}`),
    markRead: (id: number) =>
      apiFetch<void>(`/alerts/${id}/read`, { method: "PATCH" }),
  },
  market: {
    stats: () => apiFetch<MarketStats>("/market/stats"),
    trending: (network = "solana", limit = 20) =>
      apiFetch<TrendingPool[]>(`/market/trending?network=${network}&limit=${limit}`),
    newPools: (network = "all", limit = 20) =>
      apiFetch<TrendingPool[]>(`/market/new-pools?network=${network}&limit=${limit}`),
    scoreDistribution: () =>
      apiFetch<{ range: string; count: number }[]>("/market/score-distribution"),
    narrativePerformance: () =>
      apiFetch<NarrativePerf[]>("/market/narrative-performance"),
  },
  wallets: {
    list: (params?: { chain?: string; wallet_type?: string; flagged?: boolean; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.chain) q.set("chain", params.chain);
      if (params?.wallet_type) q.set("wallet_type", params.wallet_type);
      if (params?.flagged != null) q.set("flagged", String(params.flagged));
      if (params?.limit != null) q.set("limit", String(params.limit));
      const qs = q.toString();
      return apiFetch<Wallet[]>(`/wallets${qs ? `?${qs}` : ""}`);
    },
    get: (address: string) => apiFetch<Wallet>(`/wallets/${address}`),
    transactions: (address: string) => apiFetch<WalletTransaction[]>(`/wallets/${address}/transactions`),
  },
  behavioral: {
    signals: (params?: { token_address?: string; chain?: string; pattern_type?: string; severity?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.token_address) q.set("token_address", params.token_address);
      if (params?.chain) q.set("chain", params.chain);
      if (params?.pattern_type) q.set("pattern_type", params.pattern_type);
      if (params?.severity) q.set("severity", params.severity);
      if (params?.limit != null) q.set("limit", String(params.limit));
      const qs = q.toString();
      return apiFetch<BehavioralSignal[]>(`/behavioral/signals${qs ? `?${qs}` : ""}`);
    },
    tokenSignals: (tokenAddress: string) => apiFetch<BehavioralSignal[]>(`/behavioral/signals/${tokenAddress}`),
    summary: () => apiFetch<BehavioralSummary>("/behavioral/summary"),
    analyze: (tokenAddress: string, chain: string) =>
      apiFetch<BehavioralSignal[]>(`/behavioral/analyze/${tokenAddress}?chain=${chain}`, { method: "POST" }),
  },
  liquidity: {
    events: (params?: { token_address?: string; chain?: string; is_suspicious?: boolean; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.token_address) q.set("token_address", params.token_address);
      if (params?.chain) q.set("chain", params.chain);
      if (params?.is_suspicious != null) q.set("is_suspicious", String(params.is_suspicious));
      if (params?.limit != null) q.set("limit", String(params.limit));
      const qs = q.toString();
      return apiFetch<LiquidityEvent[]>(`/liquidity/events${qs ? `?${qs}` : ""}`);
    },
    suspicious: () => apiFetch<LiquidityEvent[]>("/liquidity/suspicious"),
    tokenEvents: (tokenAddress: string) => apiFetch<LiquidityEvent[]>(`/liquidity/events/${tokenAddress}`),
  },
  lln: {
    overview: () => apiFetch<LLNOverview>("/analytics/overview"),
    patterns: (params?: { group_by?: string; min_sample?: number }) => {
      const q = new URLSearchParams();
      if (params?.group_by) q.set("group_by", params.group_by);
      if (params?.min_sample != null) q.set("min_sample", String(params.min_sample));
      const qs = q.toString();
      return apiFetch<PatternPerformance[]>(`/analytics/patterns${qs ? `?${qs}` : ""}`);
    },
    strategies: () => apiFetch<StrategyPerformance[]>("/analytics/strategies"),
    outcomes: (params?: { limit?: number; outcome?: string; band?: string; narrative?: string }) => {
      const q = new URLSearchParams();
      if (params?.limit != null) q.set("limit", String(params.limit));
      if (params?.outcome) q.set("outcome", params.outcome);
      if (params?.band) q.set("band", params.band);
      if (params?.narrative) q.set("narrative", params.narrative);
      const qs = q.toString();
      return apiFetch<SignalOutcome[]>(`/analytics/outcomes${qs ? `?${qs}` : ""}`);
    },
    distributions: (group_by?: string) => {
      const qs = group_by ? `?group_by=${group_by}` : "";
      return apiFetch<ReturnDistribution[]>(`/analytics/distributions${qs}`);
    },
    risk: () => apiFetch<RiskSummary>("/analytics/risk"),
    simulations: () => apiFetch<SimulationResult[]>("/analytics/simulations"),
    regimes: () => apiFetch<RegimeStat[]>("/analytics/regimes"),
    features: () => apiFetch<FeatureImportance[]>("/analytics/features"),
  },
};
