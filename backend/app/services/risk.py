"""
Risk management module.

Flags:
- Low liquidity           → score penalty + warning
- Whale concentration >30% → score penalty + warning
- Sudden spike >50%        → score penalty + warning
- Low holders              → score penalty + warning

Effects:
- Downgrade composite score
- Emit risk_flags list
- Tighten stop-loss multiplier
"""
from dataclasses import dataclass, field
from app.core.config import settings


@dataclass
class RiskInput:
    liquidity_usd: float
    whale_concentration: float   # 0.0-1.0
    price_change_24h: float      # percent
    holders: int


@dataclass
class RiskResult:
    flags: list[str] = field(default_factory=list)
    score_penalty: float = 0.0
    sl_tightness: float = 1.0       # multiplier: >1 means tighter (smaller) SL buffer
    risk_level: str = "low"         # low | medium | high


def evaluate_risk(inp: RiskInput) -> RiskResult:
    result = RiskResult()

    if inp.liquidity_usd < settings.min_liquidity_usd:
        result.flags.append("low_liquidity")
        result.score_penalty += 15.0
        result.sl_tightness = max(result.sl_tightness, 1.5)

    if inp.whale_concentration > settings.whale_concentration_threshold:
        pct = round(inp.whale_concentration * 100, 1)
        result.flags.append(f"whale_concentration_{pct}pct")
        result.score_penalty += 10.0
        result.sl_tightness = max(result.sl_tightness, 1.3)

    if abs(inp.price_change_24h) > settings.spike_threshold * 100:
        result.flags.append("sudden_spike")
        result.score_penalty += 10.0
        result.sl_tightness = max(result.sl_tightness, 1.4)

    if inp.holders < settings.min_holders:
        result.flags.append("low_holders")
        result.score_penalty += 5.0

    flag_count = len(result.flags)
    if flag_count == 0:
        result.risk_level = "low"
    elif flag_count <= 2:
        result.risk_level = "medium"
    else:
        result.risk_level = "high"

    return result


def build_sl(price: float, band: str, sl_tightness: float) -> float:
    """
    Stop-loss as percentage below entry.
    Tighter SL when risk flags present.
    """
    base_pct = {
        "Strong Buy": 0.08,
        "Watch": 0.06,
        "Risky": 0.04,
        "Avoid": 0.03,
    }.get(band, 0.05)

    # Tightness multiplier reduces SL buffer (closer to price = tighter)
    adjusted_pct = base_pct / sl_tightness
    return round(price * (1 - adjusted_pct), 10)


def build_exit(price: float, band: str) -> float:
    """Target exit as percentage above entry."""
    target_pct = {
        "Strong Buy": 0.30,
        "Watch": 0.20,
        "Risky": 0.10,
        "Avoid": 0.05,
    }.get(band, 0.15)
    return round(price * (1 + target_pct), 10)
