export type Band = "Strong Buy" | "Watch" | "Risky" | "Avoid";
export type RiskLevel = "low" | "medium" | "high";

export interface Coin {
  id: number;
  symbol: string;
  name: string;
  coingecko_id: string | null;
  image_url: string | null;

  price_usd: number;
  market_cap_usd: number | null;
  market_cap_rank: number | null;
  volume_24h_usd: number | null;
  liquidity_usd: number | null;
  high_24h: number | null;
  low_24h: number | null;

  price_change_24h: number | null;
  price_change_7d: number | null;

  ath: number | null;
  ath_change_percentage: number | null;
  atl: number | null;
  atl_change_percentage: number | null;

  circulating_supply: number | null;
  total_supply: number | null;

  holders: number | null;
  whale_concentration: number | null;

  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  composite: number;
  sentiment: number;
  technical: number;
  liquidity: number;
  momentum: number;
}

export interface TradeLevels {
  entry_low: number;
  entry_high: number;
  exit_target: number;
  stop_loss: number;
}

export interface Signal {
  id: number;
  coin_symbol: string;
  score: number;
  band: Band;
  score_breakdown: ScoreBreakdown;
  trade_levels: TradeLevels;
  risk_level: RiskLevel;
  risk_flags: string[];
  reasoning: string;
  created_at: string;
}

export interface DexToken {
  id: number;
  chain: string;
  token_address: string;
  pair_address: string | null;
  symbol: string;
  name: string | null;
  source: string;
  dex_id: string | null;
  image_url: string | null;
  dexscreener_url: string | null;

  has_twitter: boolean;
  has_telegram: boolean;
  has_website: boolean;
  is_boosted: boolean;

  price_usd: number | null;
  market_cap: number | null;
  fdv: number | null;
  liquidity_usd: number | null;

  volume_1m: number | null;
  volume_5m: number | null;
  volume_1h: number | null;
  volume_24h: number | null;

  buys_5m: number | null;
  sells_5m: number | null;
  buys_1h: number | null;
  sells_1h: number | null;

  price_change_1m: number | null;
  price_change_5m: number | null;
  price_change_1h: number | null;
  price_change_24h: number | null;

  pair_created_at: string | null;
  token_age_hours: number | null;

  narrative_category: string | null;
  hype_velocity: number | null;

  whale_flags: string | null;
  large_tx_detected: boolean;

  snipe_score: number | null;
  narrative_score: number | null;
  momentum_score: number | null;
  liquidity_score: number | null;
  risk_score: number | null;

  band: string | null;
  sniping_opportunity: boolean;
  entry_low: number | null;
  entry_high: number | null;
  exit_target_1: number | null;
  exit_target_2: number | null;
  exit_target_3: number | null;
  stop_loss: number | null;
  risk_level: string | null;
  risk_flags: string | null;
  warnings: string | null;
  reasoning: string | null;

  buy_pressure_pct?: number | null;

  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  coin_symbol: string;
  alert_type: string;
  message: string;
  severity: "info" | "warning" | "critical";
  is_read: boolean;
  created_at: string;
}
