"""
Scoring engine for meme coin trading signals.

Score = (0.35 * sentiment) + (0.25 * technical) + (0.25 * liquidity) + (0.15 * momentum)

Bands:
  80-100 → Strong Buy
  60-79  → Watch
  40-59  → Risky
  <40    → Avoid
"""
from dataclasses import dataclass


WEIGHT_SENTIMENT = 0.35
WEIGHT_TECHNICAL = 0.25
WEIGHT_LIQUIDITY = 0.25
WEIGHT_MOMENTUM = 0.15


@dataclass
class ScoreInput:
    # Raw market metrics (normalized 0-100 internally)
    price_usd: float
    price_change_24h: float          # e.g. +15.0 = +15%
    volume_24h_usd: float
    liquidity_usd: float
    market_cap_usd: float
    holders: int
    whale_concentration: float       # 0.0-1.0
    # Optional sentiment override (0-100); if None, estimated from price action
    sentiment_override: float | None = None


@dataclass
class ScoreResult:
    composite: float
    sentiment: float
    technical: float
    liquidity: float
    momentum: float
    band: str


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _sentiment_score(price_change_24h: float, override: float | None) -> float:
    """Estimate sentiment from 24h price change if no override provided."""
    if override is not None:
        return _clamp(override)
    # Map price change to 0-100: -50% → 0, 0% → 50, +100% → 100
    raw = 50.0 + (price_change_24h * 0.5)
    return _clamp(raw)


def _technical_score(price_change_24h: float, volume_24h_usd: float, market_cap_usd: float) -> float:
    """Score based on momentum vs market-cap and volume."""
    # Volume/MarketCap ratio: healthy ratio ~0.1-0.5 scores well
    if market_cap_usd > 0:
        vol_ratio = volume_24h_usd / market_cap_usd
        vol_score = _clamp(vol_ratio * 200)  # 0.5 ratio → 100
    else:
        vol_score = 0.0

    # Trend direction: positive change gets bonus
    trend_score = 50.0 + _clamp(price_change_24h, -50, 50)
    return _clamp((vol_score + trend_score) / 2)


def _liquidity_score(liquidity_usd: float) -> float:
    """Higher liquidity = higher score. Benchmarks: $500k = 100."""
    if liquidity_usd <= 0:
        return 0.0
    # Logarithmic: $1k→~20, $50k→~60, $500k→100
    import math
    score = (math.log10(liquidity_usd) - 3) * 25  # log10(1000)=3, log10(1M)=6 → 75
    return _clamp(score)


def _momentum_score(price_change_24h: float, holders: int) -> float:
    """Momentum from price direction and holder count growth proxy."""
    # Holder count: >10k is healthy
    holder_score = _clamp(holders / 100)  # 10k → 100
    # Price momentum
    momentum = _clamp(50.0 + price_change_24h)
    return _clamp((holder_score + momentum) / 2)


def compute_score(inp: ScoreInput) -> ScoreResult:
    sentiment = _sentiment_score(inp.price_change_24h, inp.sentiment_override)
    technical = _technical_score(inp.price_change_24h, inp.volume_24h_usd, inp.market_cap_usd)
    liquidity = _liquidity_score(inp.liquidity_usd)
    momentum = _momentum_score(inp.price_change_24h, inp.holders)

    composite = (
        WEIGHT_SENTIMENT * sentiment
        + WEIGHT_TECHNICAL * technical
        + WEIGHT_LIQUIDITY * liquidity
        + WEIGHT_MOMENTUM * momentum
    )
    composite = _clamp(composite)

    band = score_to_band(composite)
    return ScoreResult(
        composite=round(composite, 2),
        sentiment=round(sentiment, 2),
        technical=round(technical, 2),
        liquidity=round(liquidity, 2),
        momentum=round(momentum, 2),
        band=band,
    )


def score_to_band(score: float) -> str:
    if score >= 80:
        return "Strong Buy"
    if score >= 60:
        return "Watch"
    if score >= 40:
        return "Risky"
    return "Avoid"
