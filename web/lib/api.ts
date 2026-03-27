import type { Coin, Signal, Alert, DexToken } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
      return apiFetch<Coin[]>(`/coins/${qs ? `?${qs}` : ""}`);
    },
    get: (symbol: string) => apiFetch<Coin>(`/coins/${symbol}`),
  },
  signals: {
    list: (limit = 50) => apiFetch<Signal[]>(`/signals/?limit=${limit}`),
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
      return apiFetch<DexToken[]>(`/snipes/${qs ? `?${qs}` : ""}`);
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
      apiFetch<Alert[]>(`/alerts/?unread_only=${unreadOnly}`),
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
};
