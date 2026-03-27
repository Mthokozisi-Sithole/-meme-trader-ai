"""
Snipe scoring engine.

Score = (0.35 × narrative) + (0.25 × momentum) + (0.25 × liquidity) + (0.15 × risk_adj)

Each sub-score is 0-100.  Risk_adj is inverted risk: higher = safer.
"""
import json
import math
from dataclasses import dataclass
from typing import Optional

from app.schemas.dex_token import DexTokenCreate
from app.services.narrative_engine import NarrativeResult


@dataclass
class SnipeScore:
    composite: float
    narrative: float
    momentum: float
    liquidity: float
    risk_adj: float

    band: str
    risk_level: str
    sniping_opportunity: bool

    risk_flags: list[str]
    warnings: list[str]
    reasoning: str

    entry_low: Optional[float]
    entry_high: Optional[float]
    exit_target_1: Optional[float]
    exit_target_2: Optional[float]
    exit_target_3: Optional[float]
    stop_loss: Optional[float]

    buy_pressure_pct: Optional[float]


# ── Sub-scorers ────────────────────────────────────────────────────────────────

def _score_momentum(t: DexTokenCreate) -> float:
    score = 0.0

    # 1. Buy pressure in 5m window (0-35 pts)
    buys5 = t.buys_5m or 0
    sells5 = t.sells_5m or 0
    total5 = buys5 + sells5
    if total5 > 0:
        bp = buys5 / total5
        score += bp * 35

    # 2. Volume acceleration: 5m vs expected from 1h (0-35 pts)
    vol5 = t.volume_5m or 0
    vol1h = t.volume_1h or 0
    if vol1h > 0 and vol5 > 0:
        expected_5m = vol1h / 12        # what 5m volume would be if linear
        ratio = vol5 / expected_5m
        score += min(35.0, 20.0 * math.log1p(ratio))
    elif vol5 > 500:
        score += 15.0                   # some activity, no 1h baseline yet

    # 3. Price momentum 5m (0-30 pts, penalty for negative)
    chg5 = t.price_change_5m or 0
    if chg5 > 0:
        score += min(30.0, chg5 * 1.5)
    elif chg5 < -10:
        score += max(-20.0, chg5 * 0.5)

    return max(0.0, min(100.0, score))


def _score_liquidity(t: DexTokenCreate) -> float:
    liq = t.liquidity_usd or 0
    if liq <= 0:
        return 0.0
    if liq < 1_000:
        return 8.0
    if liq < 5_000:
        return 20.0
    if liq < 10_000:
        return 35.0
    if liq < 50_000:
        return 55.0
    if liq < 100_000:
        return 70.0
    if liq < 500_000:
        return 85.0
    return 100.0


def _score_risk(t: DexTokenCreate, flags: list[str]) -> float:
    """
    Risk adjustment score 0-100. Higher = less risky = better for sniping.
    """
    score = 55.0

    # Token age: very new is riskier
    age = t.token_age_hours or 0
    if age < 0.5:
        score -= 15
    elif age < 2:
        score += 0
    elif age < 12:
        score += 10
    elif age < 48:
        score += 18
    else:
        score += 25

    # Liquidity safety
    liq = t.liquidity_usd or 0
    if liq < 3_000:
        score -= 30
    elif liq < 8_000:
        score -= 15
    elif liq > 50_000:
        score += 10

    # Social presence = legitimacy signal
    if t.has_twitter:
        score += 5
    if t.has_telegram:
        score += 5
    if t.has_website:
        score += 3

    # Suspicious patterns
    for f in flags:
        score -= 18

    # Extreme 1m price spike (potential rug/manipulation)
    chg1m = abs(t.price_change_1m or 0)
    if chg1m > 200:
        score -= 25
    elif chg1m > 100:
        score -= 12

    return max(0.0, min(100.0, score))


def _detect_risk_flags(t: DexTokenCreate) -> list[str]:
    flags: list[str] = []
    liq = t.liquidity_usd or 0

    if liq < 3_000:
        flags.append("low_liquidity")
    if liq > 0 and (t.volume_24h or 0) / liq > 50:
        flags.append("extreme_volume_to_liquidity")  # honeypot signal
    if abs(t.price_change_1m or 0) > 200:
        flags.append("suspicious_price_spike")
    if (t.buys_5m or 0) == 0 and (t.sells_5m or 0) > 5:
        flags.append("sell_only_pressure")

    age = t.token_age_hours or 999
    if age < 0.25:
        flags.append("ultra_new_token")

    if not t.has_twitter and not t.has_telegram and not t.has_website:
        flags.append("no_social_presence")

    return flags


def _compute_warnings(t: DexTokenCreate, flags: list[str], score: float) -> list[str]:
    warnings: list[str] = []

    if "low_liquidity" in flags:
        warnings.append(f"Low liquidity (${(t.liquidity_usd or 0):,.0f}) — slippage risk")
    if "suspicious_price_spike" in flags:
        warnings.append("Abnormal 1m price spike — possible manipulation or bot activity")
    if "extreme_volume_to_liquidity" in flags:
        warnings.append("Volume/liquidity ratio extreme — honeypot risk elevated")
    if "no_social_presence" in flags:
        warnings.append("No verified socials — anonymous team, higher exit scam risk")
    if "ultra_new_token" in flags:
        warnings.append("Token < 15 min old — maximum uncertainty, position size accordingly")
    if "sell_only_pressure" in flags:
        warnings.append("Sell-only activity — possible stealth dump")
    if score < 40:
        warnings.append("Low composite score — avoid or use minimal position")

    return warnings


def _compute_band(score: float) -> str:
    if score >= 78:
        return "Strong Buy"
    if score >= 60:
        return "Watch"
    if score >= 42:
        return "Risky"
    return "Avoid"


def _compute_risk_level(flags: list[str], liq: float, age: float) -> str:
    critical = {"low_liquidity", "suspicious_price_spike", "honeypot_risk",
                "extreme_volume_to_liquidity", "sell_only_pressure"}
    n_critical = len([f for f in flags if f in critical])

    if n_critical >= 2 or liq < 3_000:
        return "extreme"
    if n_critical == 1 or age < 1 or liq < 8_000:
        return "high"
    if flags or age < 6:
        return "medium"
    return "low"


def _compute_trade_levels(
    price: float, band: str, risk_level: str
) -> dict[str, Optional[float]]:
    if not price or price <= 0:
        return {k: None for k in
                ["entry_low", "entry_high", "exit_target_1", "exit_target_2",
                 "exit_target_3", "stop_loss"]}

    spread = {"low": 0.02, "medium": 0.03, "high": 0.05, "extreme": 0.07}
    sl_pct = {"low": 0.12, "medium": 0.18, "high": 0.25, "extreme": 0.35}
    exit_pcts = {
        "Strong Buy": [0.30, 0.60, 1.50],
        "Watch":      [0.20, 0.40, 1.00],
        "Risky":      [0.12, 0.25, 0.60],
        "Avoid":      [0.05, 0.12, 0.30],
    }

    sp = spread.get(risk_level, 0.04)
    sl = sl_pct.get(risk_level, 0.20)
    e1, e2, e3 = exit_pcts.get(band, exit_pcts["Watch"])

    return {
        "entry_low": price * (1 - sp),
        "entry_high": price * (1 + sp),
        "exit_target_1": price * (1 + e1),
        "exit_target_2": price * (1 + e2),
        "exit_target_3": price * (1 + e3),
        "stop_loss": price * (1 - sl),
    }


def _generate_reasoning(
    t: DexTokenCreate,
    narrative_cat: str,
    narrative_score: float,
    momentum: float,
    liquidity: float,
    risk_adj: float,
    composite: float,
    flags: list[str],
    is_snipe: bool,
    buy_pressure_pct: Optional[float],
) -> str:
    parts: list[str] = []

    if is_snipe:
        parts.append(f"🚨 SNIPE OPPORTUNITY — {t.symbol} qualifies for early entry.")

    parts.append(f"[{narrative_cat}] narrative on {t.chain.upper()} via {t.dex_id or t.source}.")

    age = t.token_age_hours
    if age is not None:
        if age < 1:
            parts.append(f"Token age: {age*60:.0f}m — ultra-early stage.")
        else:
            parts.append(f"Token age: {age:.1f}h.")

    if buy_pressure_pct is not None:
        parts.append(f"Buy pressure: {buy_pressure_pct:.0f}% (5m window).")

    if t.volume_5m:
        parts.append(f"5m vol: ${t.volume_5m:,.0f}.")
    if t.volume_1h:
        parts.append(f"1h vol: ${t.volume_1h:,.0f}.")

    if t.liquidity_usd:
        parts.append(f"Liquidity: ${t.liquidity_usd:,.0f}.")

    if t.price_change_5m is not None:
        sign = "+" if t.price_change_5m >= 0 else ""
        parts.append(f"5m Δ: {sign}{t.price_change_5m:.1f}%.")

    parts.append(
        f"Scores → Narrative:{narrative_score:.0f} "
        f"Momentum:{momentum:.0f} "
        f"Liquidity:{liquidity:.0f} "
        f"Risk:{risk_adj:.0f} | "
        f"Composite:{composite:.1f}/100."
    )

    if t.is_boosted:
        parts.append("Token is actively boosted on DexScreener.")
    if t.has_twitter or t.has_telegram:
        parts.append("Has community socials.")

    if flags:
        parts.append(f"Flags: {', '.join(flags)}.")

    return " ".join(parts)


# ── Main entry point ───────────────────────────────────────────────────────────

def score_token(t: DexTokenCreate, narrative: NarrativeResult) -> SnipeScore:
    """
    Compute full sniping score for a token.
    Returns a SnipeScore with all signal fields populated.
    """
    # Sub-scores
    ns = narrative.score
    ms = _score_momentum(t)
    ls = _score_liquidity(t)

    flags = _detect_risk_flags(t)
    rs = _score_risk(t, flags)

    # Weighted composite
    composite = (0.35 * ns) + (0.25 * ms) + (0.25 * ls) + (0.15 * rs)
    composite = round(min(100.0, max(0.0, composite)), 2)

    band = _compute_band(composite)
    liq = t.liquidity_usd or 0
    age = t.token_age_hours or 0
    risk_level = _compute_risk_level(flags, liq, age)

    # Buy pressure
    buys5 = t.buys_5m or 0
    total5 = buys5 + (t.sells_5m or 0)
    bp_pct = round(buys5 / total5 * 100, 1) if total5 > 0 else None

    # Sniping opportunity gate
    snipe = (
        composite >= 60
        and liq >= 4_000
        and age <= 48
        and risk_level not in ("extreme",)
        and "sell_only_pressure" not in flags
        and "extreme_volume_to_liquidity" not in flags
        and (bp_pct is None or bp_pct >= 52)
    )

    warnings = _compute_warnings(t, flags, composite)
    levels = _compute_trade_levels(t.price_usd or 0, band, risk_level)

    reasoning = _generate_reasoning(
        t, narrative.category, ns, ms, ls, rs, composite,
        flags, snipe, bp_pct
    )

    return SnipeScore(
        composite=composite,
        narrative=round(ns, 1),
        momentum=round(ms, 1),
        liquidity=round(ls, 1),
        risk_adj=round(rs, 1),
        band=band,
        risk_level=risk_level,
        sniping_opportunity=snipe,
        risk_flags=flags,
        warnings=warnings,
        reasoning=reasoning,
        buy_pressure_pct=bp_pct,
        **levels,
    )
