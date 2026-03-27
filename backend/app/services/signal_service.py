"""
Signal generation service.
Combines scoring + risk evaluation into a complete trade signal.
"""
import json
from dataclasses import dataclass

from app.models.coin import Coin
from app.schemas.signal import SignalCreate
from app.services.scoring import ScoreInput, compute_score, score_to_band
from app.services.risk import RiskInput, evaluate_risk, build_sl, build_exit


@dataclass
class SignalContext:
    coin: Coin
    sentiment_override: float | None = None


def generate_signal(ctx: SignalContext) -> SignalCreate:
    coin = ctx.coin

    score_input = ScoreInput(
        price_usd=coin.price_usd,
        price_change_24h=coin.price_change_24h or 0.0,
        volume_24h_usd=coin.volume_24h_usd or 0.0,
        liquidity_usd=coin.liquidity_usd or 0.0,
        market_cap_usd=coin.market_cap_usd or 0.0,
        holders=coin.holders or 0,
        whale_concentration=coin.whale_concentration or 0.0,
        sentiment_override=ctx.sentiment_override,
    )

    score_result = compute_score(score_input)

    risk_input = RiskInput(
        liquidity_usd=coin.liquidity_usd or 0.0,
        whale_concentration=coin.whale_concentration or 0.0,
        price_change_24h=coin.price_change_24h or 0.0,
        holders=coin.holders or 0,
    )
    risk_result = evaluate_risk(risk_input)

    # Apply risk penalty to score and recalculate band
    adjusted_score = max(0.0, score_result.composite - risk_result.score_penalty)
    final_band = score_to_band(adjusted_score)

    price = coin.price_usd
    entry_low = round(price * 0.99, 10)
    entry_high = round(price * 1.01, 10)
    exit_target = build_exit(price, final_band)
    stop_loss = build_sl(price, final_band, risk_result.sl_tightness)

    reasoning = _build_reasoning(
        coin=coin,
        score=adjusted_score,
        band=final_band,
        score_result=score_result,
        risk_result=risk_result,
    )

    return SignalCreate(
        coin_symbol=coin.symbol,
        score=round(adjusted_score, 2),
        sentiment_score=score_result.sentiment,
        technical_score=score_result.technical,
        liquidity_score=score_result.liquidity,
        momentum_score=score_result.momentum,
        band=final_band,
        entry_low=entry_low,
        entry_high=entry_high,
        exit_target=exit_target,
        stop_loss=stop_loss,
        risk_level=risk_result.risk_level,
        risk_flags=json.dumps(risk_result.flags),
        reasoning=reasoning,
    )


def _build_reasoning(coin: Coin, score: float, band: str, score_result, risk_result) -> str:
    parts = [
        f"{coin.symbol} scores {score:.1f}/100 → {band}.",
        f"Sentiment {score_result.sentiment:.0f} | Technical {score_result.technical:.0f} "
        f"| Liquidity {score_result.liquidity:.0f} | Momentum {score_result.momentum:.0f}.",
    ]
    if coin.price_change_24h:
        direction = "up" if coin.price_change_24h > 0 else "down"
        parts.append(f"Price {direction} {abs(coin.price_change_24h):.1f}% in 24h.")
    if coin.liquidity_usd:
        parts.append(f"Liquidity: ${coin.liquidity_usd:,.0f}.")
    if risk_result.flags:
        parts.append(f"Risk flags: {', '.join(risk_result.flags)}.")
    if risk_result.score_penalty > 0:
        parts.append(f"Score penalized by {risk_result.score_penalty:.0f} pts for risk.")
    return " ".join(parts)
