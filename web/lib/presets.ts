import type { DexToken } from "@/types";

// ── Computed helper metrics not stored in DB ──────────────────────────────────

export interface TokenMetrics {
  fdvLiqRatio: number | null;
  buyPressure5m: number | null;   // 0-100
  buyPressure1h: number | null;
  volAccel: number | null;        // volume_5m vs (volume_1h/12) — >1 means accelerating
  avgTxSize5m: number | null;     // volume_5m / (buys_5m + sells_5m)
  sellDominance: boolean;         // sells > buys in 5m
  isPumpFun: boolean;
  isGecko: boolean;
}

export function computeMetrics(t: DexToken): TokenMetrics {
  const buys5 = t.buys_5m ?? 0;
  const sells5 = t.sells_5m ?? 0;
  const total5 = buys5 + sells5;
  const buys1h = t.buys_1h ?? 0;
  const sells1h = t.sells_1h ?? 0;
  const total1h = buys1h + sells1h;

  const fdvLiqRatio =
    t.fdv && t.liquidity_usd && t.liquidity_usd > 0
      ? t.fdv / t.liquidity_usd
      : null;

  const buyPressure5m = total5 > 0 ? (buys5 / total5) * 100 : null;
  const buyPressure1h = total1h > 0 ? (buys1h / total1h) * 100 : null;

  const avgVol1m = t.volume_1h ? t.volume_1h / 12 : null; // proxy for avg 5m volume
  const volAccel =
    t.volume_5m != null && avgVol1m != null && avgVol1m > 0
      ? t.volume_5m / avgVol1m
      : null;

  const avgTxSize5m =
    t.volume_5m != null && total5 > 0 ? t.volume_5m / total5 : null;

  return {
    fdvLiqRatio,
    buyPressure5m,
    buyPressure1h,
    volAccel,
    avgTxSize5m,
    sellDominance: total5 > 0 && sells5 > buys5,
    isPumpFun: t.source === "pumpfun",
    isGecko: t.source === "geckoterminal",
  };
}

// ── Preset definition ─────────────────────────────────────────────────────────

export interface FilterPreset {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  intent: string;
  insight: string;
  color: string;        // CSS color for accent
  bgGlow: string;       // rgba for glow
  type: "buy" | "avoid" | "warning";
  filter: (t: DexToken, m: TokenMetrics) => boolean;
  sortKey: "score" | "age" | "liquidity" | "change1h";
}

// ── 10 Presets ────────────────────────────────────────────────────────────────

export const PRESETS: FilterPreset[] = [
  {
    id: "stealth_launch",
    name: "STEALTH LAUNCH SNIPER",
    shortName: "Stealth",
    emoji: "⚡",
    intent: "Be first 1–5 wallets in",
    insight: "You're not buying charts — you're buying behavior acceleration",
    color: "#00d97e",
    bgGlow: "rgba(0,217,126,0.12)",
    type: "buy",
    sortKey: "age",
    filter(t, m) {
      const ageOk = t.token_age_hours != null && t.token_age_hours < (10 / 60);
      const liqOk =
        t.liquidity_usd != null &&
        t.liquidity_usd >= 2_000 &&
        t.liquidity_usd <= 15_000;
      const mcapOk = t.market_cap == null || t.market_cap < 80_000;
      const volAccelOk = m.volAccel != null && m.volAccel >= 1.5;
      const buysOk = (t.buys_5m ?? 0) >= 50;
      const sellsLow = (t.sells_5m ?? 0) < (t.buys_5m ?? 0) * 0.4;
      const fdvOk = m.fdvLiqRatio == null || m.fdvLiqRatio < 15;
      const notExtreme = t.risk_level !== "extreme";
      return ageOk && liqOk && mcapOk && buysOk && sellsLow && fdvOk && notExtreme && volAccelOk;
    },
  },

  {
    id: "liquidity_trap",
    name: "LIQUIDITY TRAP DETECTOR",
    shortName: "Trap Detect",
    emoji: "🧨",
    intent: "Avoid rugs before they happen",
    insight: "Catches exit liquidity setups before the dump",
    color: "#ff4466",
    bgGlow: "rgba(255,68,102,0.12)",
    type: "avoid",
    sortKey: "liquidity",
    filter(t, m) {
      const liqLow = t.liquidity_usd != null && t.liquidity_usd < 20_000;
      const fdvHigh = t.fdv != null && t.fdv > 2_000_000;
      const ratioHigh = m.fdvLiqRatio != null && m.fdvLiqRatio > 50;
      const sellShift = m.sellDominance;
      const highRisk = t.risk_level === "high" || t.risk_level === "extreme";
      return liqLow && fdvHigh && (ratioHigh || sellShift || highRisk);
    },
  },

  {
    id: "organic_momentum",
    name: "ORGANIC MOMENTUM ENGINE",
    shortName: "Organic",
    emoji: "🚀",
    intent: "Real growth, not fake pumps",
    insight: "This is where smart money accumulates quietly",
    color: "#4488ff",
    bgGlow: "rgba(68,136,255,0.12)",
    type: "buy",
    sortKey: "change1h",
    filter(t, m) {
      const liqOk =
        t.liquidity_usd != null &&
        t.liquidity_usd >= 30_000 &&
        t.liquidity_usd <= 150_000;
      const mcapOk =
        t.market_cap != null &&
        t.market_cap >= 200_000 &&
        t.market_cap <= 2_000_000;
      const p5mOk =
        t.price_change_5m != null &&
        t.price_change_5m >= 0 &&
        t.price_change_5m <= 8;
      const p1hOk = t.price_change_1h != null && t.price_change_1h > 0;
      const buyDom = m.buyPressure5m != null && m.buyPressure5m >= 60;
      const volRising = m.volAccel != null && m.volAccel >= 1.0;
      return liqOk && mcapOk && p5mOk && p1hOk && buyDom && volRising;
    },
  },

  {
    id: "pre_breakout",
    name: "PRE-BREAKOUT COMPRESSION",
    shortName: "Pre-Breakout",
    emoji: "🔥",
    intent: "Before the violent move",
    insight: "Pressure building → explosion coming",
    color: "#f97316",
    bgGlow: "rgba(249,115,22,0.12)",
    type: "buy",
    sortKey: "age",
    filter(t, m) {
      const ageOk =
        t.token_age_hours != null &&
        t.token_age_hours >= 1 &&
        t.token_age_hours <= 6;
      const flatPrice =
        t.price_change_1h != null &&
        t.price_change_1h >= -4 &&
        t.price_change_1h <= 6;
      const volBuilding = m.volAccel != null && m.volAccel >= 0.8 && m.volAccel <= 3;
      const buysPicking = (t.buys_5m ?? 0) > 10 && m.buyPressure5m != null && m.buyPressure5m >= 52;
      const liqOk = t.liquidity_usd != null && t.liquidity_usd >= 5_000;
      return ageOk && flatPrice && volBuilding && buysPicking && liqOk;
    },
  },

  {
    id: "smart_money",
    name: "SMART MONEY FOOTPRINT",
    shortName: "Smart Money",
    emoji: "🧠",
    intent: "Follow whales without seeing wallets",
    insight: "Whales don't chase — they position early quietly",
    color: "#a855f7",
    bgGlow: "rgba(168,85,247,0.12)",
    type: "buy",
    sortKey: "liquidity",
    filter(t, m) {
      const largeTx = t.large_tx_detected;
      const highVol = m.avgTxSize5m != null && m.avgTxSize5m >= 500;
      const liqOk = t.liquidity_usd != null && t.liquidity_usd >= 50_000;
      const mcapOk =
        t.market_cap != null &&
        t.market_cap >= 300_000 &&
        t.market_cap <= 3_000_000;
      const smooth =
        t.price_change_5m != null &&
        Math.abs(t.price_change_5m) < 15 &&
        t.price_change_1h != null &&
        Math.abs(t.price_change_1h) < 40;
      const notBot = (t.buys_5m ?? 0) < 500;
      return (largeTx || highVol) && liqOk && mcapOk && smooth && notBot;
    },
  },

  {
    id: "fomo_ignition",
    name: "FOMO IGNITION SCANNER",
    shortName: "FOMO",
    emoji: "⚔️",
    intent: "Catch hype right before retail floods",
    insight: "Enter right before TikTok/Twitter finds it",
    color: "#ec4899",
    bgGlow: "rgba(236,72,153,0.12)",
    type: "buy",
    sortKey: "change1h",
    filter(t, m) {
      const volSpike = m.volAccel != null && m.volAccel >= 3;
      const buyExplosion = m.buyPressure5m != null && m.buyPressure5m >= 65;
      const priceOk =
        t.price_change_5m != null &&
        t.price_change_5m >= 15 &&
        t.price_change_5m <= 60;
      const liqHolding =
        t.liquidity_usd != null && t.liquidity_usd >= 10_000;
      const notAlreadyMooned =
        t.price_change_24h == null || t.price_change_24h < 200;
      return volSpike && buyExplosion && priceOk && liqHolding && notAlreadyMooned;
    },
  },

  {
    id: "revival_play",
    name: "REVIVAL PLAY",
    shortName: "Revival",
    emoji: "🧬",
    intent: "Second wave tokens — dead → alive",
    insight: "Dead coins with liquidity = resurrection candidates",
    color: "#22d3ee",
    bgGlow: "rgba(34,211,238,0.12)",
    type: "buy",
    sortKey: "change1h",
    filter(t, m) {
      const alreadyDumped =
        t.price_change_24h != null &&
        t.price_change_24h <= -40 &&
        t.price_change_24h >= -90;
      const volReturning = m.volAccel != null && m.volAccel >= 1.5;
      const liqIntact = t.liquidity_usd != null && t.liquidity_usd >= 8_000;
      const buyReturning = m.buyPressure5m != null && m.buyPressure5m >= 55;
      const noMassExit = t.risk_level !== "extreme";
      return alreadyDumped && volReturning && liqIntact && buyReturning && noMassExit;
    },
  },

  {
    id: "safe_trend",
    name: "SAFE TREND RIDER",
    shortName: "Safe Trend",
    emoji: "🛡️",
    intent: "Low stress, consistent gains",
    insight: "This is where you don't get rugged every hour",
    color: "#00d97e",
    bgGlow: "rgba(0,217,126,0.08)",
    type: "buy",
    sortKey: "score",
    filter(t, m) {
      const liqOk = t.liquidity_usd != null && t.liquidity_usd >= 100_000;
      const mcapOk =
        t.market_cap != null &&
        t.market_cap >= 1_000_000 &&
        t.market_cap <= 10_000_000;
      const uptrend =
        t.price_change_1h != null && t.price_change_1h > 0 &&
        t.price_change_24h != null && t.price_change_24h > 0;
      const lowRisk = t.risk_level === "low" || t.risk_level === "medium";
      const buyDom = m.buyPressure1h != null && m.buyPressure1h >= 55;
      return liqOk && mcapOk && uptrend && lowRisk && buyDom;
    },
  },

  {
    id: "dev_exit",
    name: "DEV EXIT SIGNAL",
    shortName: "Dev Exit",
    emoji: "🧨",
    intent: "Get out BEFORE the crash",
    insight: "Chart looks 'fine'… but insiders are leaving",
    color: "#f5c543",
    bgGlow: "rgba(245,197,67,0.12)",
    type: "warning",
    sortKey: "liquidity",
    filter(t, m) {
      const highVol = t.volume_5m != null && t.volume_5m > 5_000;
      const priceFlatDespiteBuys =
        t.price_change_5m != null &&
        t.price_change_5m >= -2 &&
        t.price_change_5m <= 4 &&
        (t.buys_5m ?? 0) > 20;
      const sellIncreasing =
        m.buyPressure5m != null && m.buyPressure5m <= 55;
      let flags: string[] = [];
      try { flags = t.risk_flags ? JSON.parse(t.risk_flags) : []; } catch { flags = []; }
      const hasLiqFlag = flags.some((f) =>
        f.includes("liquidity") || f.includes("whale")
      );
      const largeTxSell = t.large_tx_detected && m.sellDominance;
      return highVol && priceFlatDespiteBuys && (sellIncreasing || hasLiqFlag || largeTxSell);
    },
  },

  {
    id: "algo_bait",
    name: "ALGO BAIT DETECTOR",
    shortName: "Algo Bait",
    emoji: "🧠",
    intent: "Avoid fake bot-driven pumps",
    insight: "Bots create illusion of demand",
    color: "#64748b",
    bgGlow: "rgba(100,116,139,0.12)",
    type: "avoid",
    sortKey: "score",
    filter(t, m) {
      const highTxLowSize =
        (t.buys_5m ?? 0) + (t.sells_5m ?? 0) > 200 &&
        m.avgTxSize5m != null &&
        m.avgTxSize5m < 50;
      const erraticPrice =
        t.price_change_1m != null && Math.abs(t.price_change_1m) > 10 &&
        t.price_change_5m != null && Math.abs(t.price_change_5m) < 3;
      const balanced =
        m.buyPressure5m != null &&
        m.buyPressure5m >= 45 &&
        m.buyPressure5m <= 55;
      const spiky =
        t.volume_5m != null &&
        t.volume_1h != null &&
        t.volume_1h > 0 &&
        t.volume_5m / (t.volume_1h / 12) > 5;
      return (highTxLowSize || erraticPrice) && (balanced || spiky);
    },
  },

  {
    id: "god_mode",
    name: "GOD MODE FILTER STACK",
    shortName: "God Mode",
    emoji: "👑",
    intent: "ONLY elite setups",
    insight: "The intersection of every signal pointing green",
    color: "#f5c543",
    bgGlow: "rgba(245,197,67,0.18)",
    type: "buy",
    sortKey: "score",
    filter(t, m) {
      const liqOk =
        t.liquidity_usd != null &&
        t.liquidity_usd >= 20_000 &&
        t.liquidity_usd <= 120_000;
      const fdvOk = m.fdvLiqRatio == null || m.fdvLiqRatio < 20;
      const buy2x = m.buyPressure5m != null && m.buyPressure5m >= 66;
      const volRising = m.volAccel != null && m.volAccel >= 1.5;
      const notMooned =
        t.price_change_24h == null || t.price_change_24h < 200;
      const notHighRisk =
        t.risk_level !== "extreme" && t.risk_level !== "high";
      const posP1h = t.price_change_1h != null && t.price_change_1h > 0;
      return liqOk && fdvOk && buy2x && volRising && notMooned && notHighRisk && posP1h;
    },
  },
];
