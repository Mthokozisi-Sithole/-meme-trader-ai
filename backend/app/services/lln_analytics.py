"""
LLN Quant Engine — Analytics Service.

All heavy computation runs here and is called ONLY by the LLN worker.
API routes read pre-computed results from the database — they never call this module.

Reads from: signals, coins, dex_tokens, behavioral_signals, token_timeseries
Writes to:  signal_outcomes, pattern_performance, return_distributions,
            strategy_performance, regime_stats, simulation_results, feature_importance
"""
import json
import logging
import math
import random
from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy import delete, func, select, text, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dex_token import DexToken
from app.models.lln import (
    FeatureImportance,
    PatternPerformance,
    RegimeStat,
    ReturnDistribution,
    SignalOutcome,
    SimulationResult,
    StrategyPerformance,
)
from app.models.signal import Signal
from app.models.coin import Coin

logger = logging.getLogger(__name__)

# ── Optional scientific libraries ──────────────────────────────────────────────
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    np = None  # type: ignore
    NUMPY_AVAILABLE = False

try:
    from scipy import stats as scipy_stats
    SCIPY_AVAILABLE = True
except ImportError:
    scipy_stats = None  # type: ignore
    SCIPY_AVAILABLE = False

try:
    from sklearn.cluster import KMeans, DBSCAN
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# ── Outcome classification thresholds ─────────────────────────────────────────
WIN_THRESHOLD = 50.0       # >= +50% ROI
LOSS_THRESHOLD = -30.0     # <= -30% ROI
# Everything else = NEUTRAL


# ══════════════════════════════════════════════════════════════════════════════
# A.  SIGNAL OUTCOME MODELING
# ══════════════════════════════════════════════════════════════════════════════

async def compute_signal_outcomes(db: AsyncSession, batch_size: int = 500) -> int:
    """
    For every signal that doesn't have an outcome yet, compute lifecycle metrics
    and store a SignalOutcome record.

    Uses: current coin price vs signal entry price, plus coin price_change data.
    Returns the number of outcomes computed this cycle.
    """
    # Find signal IDs that already have outcomes
    existing_ids_result = await db.execute(
        select(SignalOutcome.signal_id)
    )
    existing_ids = {row[0] for row in existing_ids_result.all()}

    # Fetch recent signals joined with coin data
    result = await db.execute(
        select(Signal, Coin)
        .join(Coin, Signal.coin_symbol == Coin.symbol)
        .order_by(Signal.id.desc())
        .limit(batch_size * 2)
    )
    rows = result.all()

    new_outcomes = []
    for signal, coin in rows:
        if signal.id in existing_ids:
            continue
        if not coin.price_usd or not signal.entry_low or not signal.entry_high:
            continue

        entry_price = (signal.entry_low + signal.entry_high) / 2.0
        if entry_price <= 0:
            continue

        current_price = coin.price_usd
        final_roi = (current_price - entry_price) / entry_price * 100.0

        # 24h and 7d ROI come directly from coin price change fields
        roi_24h = coin.price_change_24h
        roi_7d = coin.price_change_7d

        # MFE/MAE estimation
        # Best case: coin went up by 24h change from entry
        # Worst case: coin went down by 24h change from entry
        mfe = max(final_roi, roi_24h or 0, roi_7d or 0)
        mae = min(final_roi, roi_24h or 0, roi_7d or 0)

        # Volatility proxy: abs(roi_24h) scaled down
        volatility = abs(roi_24h) / 100.0 if roi_24h is not None else None

        # Outcome classification
        if final_roi >= WIN_THRESHOLD:
            outcome = "WIN"
        elif final_roi <= LOSS_THRESHOLD:
            outcome = "LOSS"
        else:
            outcome = "NEUTRAL"

        # Look up narrative from dex_tokens (best effort)
        narrative_result = await db.execute(
            select(DexToken.narrative_category)
            .where(DexToken.symbol == signal.coin_symbol)
            .order_by(DexToken.updated_at.desc())
            .limit(1)
        )
        narrative = narrative_result.scalar_one_or_none() or "Other"

        # Liquidity from coin table
        liquidity = coin.liquidity_usd

        new_outcomes.append(SignalOutcome(
            signal_id=signal.id,
            coin_symbol=signal.coin_symbol,
            entry_price=entry_price,
            exit_target=signal.exit_target,
            stop_loss=signal.stop_loss,
            band=signal.band,
            risk_level=signal.risk_level,
            narrative_category=narrative,
            liquidity_at_signal=liquidity,
            buy_pressure_at_signal=None,  # not in signal model
            roi_24h=roi_24h,
            roi_7d=roi_7d,
            mfe=mfe,
            mae=mae,
            volatility_post_entry=volatility,
            final_roi=final_roi,
            outcome=outcome,
            computed_at=datetime.utcnow(),
        ))

        if len(new_outcomes) >= batch_size:
            break

    if new_outcomes:
        db.add_all(new_outcomes)
        await db.commit()
        logger.info(f"[LLN] Computed {len(new_outcomes)} new signal outcomes")

    return len(new_outcomes)


# ══════════════════════════════════════════════════════════════════════════════
# B + C + D + E.  PATTERN PERFORMANCE + DISTRIBUTION + EV + BAYESIAN
# ══════════════════════════════════════════════════════════════════════════════

async def compute_pattern_performance(db: AsyncSession) -> None:
    """
    Group signal_outcomes by band, narrative, risk_level, liquidity_tier.
    Compute win_rate, avg_roi, Sharpe, Sortino, EV, Bayesian CI.
    Also compute return distributions.
    """
    # Fetch all outcomes
    result = await db.execute(
        select(
            SignalOutcome.band,
            SignalOutcome.narrative_category,
            SignalOutcome.risk_level,
            SignalOutcome.liquidity_at_signal,
            SignalOutcome.final_roi,
            SignalOutcome.outcome,
            SignalOutcome.mfe,
            SignalOutcome.mae,
        )
        .where(SignalOutcome.final_roi.isnot(None))
        .where(SignalOutcome.outcome.isnot(None))
    )
    all_outcomes = result.all()

    if len(all_outcomes) < 5:
        logger.info("[LLN] Insufficient outcomes for pattern analysis (< 5)")
        return

    # Build groupings
    groups: dict[tuple, list] = {}

    def add_to_group(key: tuple, row) -> None:
        if key not in groups:
            groups[key] = []
        groups[key].append(row)

    for row in all_outcomes:
        # By band
        if row.band:
            add_to_group(("band", row.band), row)

        # By narrative
        if row.narrative_category:
            add_to_group(("narrative", row.narrative_category), row)

        # By risk level
        if row.risk_level:
            add_to_group(("risk_level", row.risk_level), row)

        # By liquidity tier
        if row.liquidity_at_signal is not None:
            tier = _liquidity_tier(row.liquidity_at_signal)
            add_to_group(("liquidity_tier", tier), row)

        # Global "all"
        add_to_group(("all", "all"), row)

    for (group_by, group_value), rows in groups.items():
        returns = [r.final_roi for r in rows if r.final_roi is not None]
        if len(returns) < 3:
            continue

        wins = [r for r in rows if r.outcome == "WIN"]
        losses = [r for r in rows if r.outcome == "LOSS"]
        neutrals = [r for r in rows if r.outcome == "NEUTRAL"]

        win_rate = len(wins) / len(rows)
        avg_roi = _mean(returns)
        median_roi = _median(returns)

        mfe_vals = [r.mfe for r in rows if r.mfe is not None]
        mae_vals = [r.mae for r in rows if r.mae is not None]
        avg_mfe = _mean(mfe_vals) if mfe_vals else None
        avg_mae = _mean(mae_vals) if mae_vals else None

        sharpe = _sharpe(returns)
        sortino = _sortino(returns)
        profit_factor = _profit_factor(returns)

        win_returns = [r for r in returns if r >= WIN_THRESHOLD]
        loss_returns = [r for r in returns if r <= LOSS_THRESHOLD]
        avg_win = _mean(win_returns) if win_returns else 0.0
        avg_loss = abs(_mean(loss_returns)) if loss_returns else 0.0
        ev = (win_rate * avg_win) - ((1 - win_rate) * avg_loss)

        # Bayesian: Beta distribution with uniform prior Beta(1,1)
        alpha = len(wins) + 1
        beta_param = len(losses) + len(neutrals) + 1
        bayesian_wr = alpha / (alpha + beta_param)
        ci_lower, ci_upper = _beta_ci(alpha, beta_param)
        prob_pos_ev = _prob_positive_ev(win_rate, avg_win, avg_loss)

        # Upsert into pattern_performance
        await _upsert_pattern_perf(db, group_by, group_value, {
            "sample_size": len(rows),
            "win_count": len(wins),
            "loss_count": len(losses),
            "neutral_count": len(neutrals),
            "win_rate": win_rate,
            "avg_roi": avg_roi,
            "median_roi": median_roi,
            "avg_mfe": avg_mfe,
            "avg_mae": avg_mae,
            "sharpe_ratio": sharpe,
            "sortino_ratio": sortino,
            "profit_factor": profit_factor,
            "expected_value": ev,
            "bayesian_win_rate": bayesian_wr,
            "ci_lower": ci_lower,
            "ci_upper": ci_upper,
            "probability_positive_ev": prob_pos_ev,
            "computed_at": datetime.utcnow(),
        })

        # Also compute return distribution for this group
        await _upsert_distribution(db, group_by, group_value, returns)

    await db.commit()
    logger.info(f"[LLN] Pattern performance updated for {len(groups)} groups")


async def _upsert_pattern_perf(db: AsyncSession, group_by: str, group_value: str, data: dict) -> None:
    stmt = pg_insert(PatternPerformance).values(
        group_by=group_by,
        group_value=group_value,
        **data,
    ).on_conflict_do_update(
        constraint="uq_pattern_perf",
        set_=data,
    )
    await db.execute(stmt)


async def _upsert_distribution(db: AsyncSession, group_by: str, group_value: str, returns: list[float]) -> None:
    if len(returns) < 3:
        return

    stats = _compute_distribution_stats(returns)
    stmt = pg_insert(ReturnDistribution).values(
        group_by=group_by,
        group_value=group_value,
        **stats,
        computed_at=datetime.utcnow(),
    ).on_conflict_do_update(
        constraint="uq_return_dist",
        set_={**stats, "computed_at": datetime.utcnow()},
    )
    await db.execute(stmt)


# ══════════════════════════════════════════════════════════════════════════════
# STRATEGY PERFORMANCE
# ══════════════════════════════════════════════════════════════════════════════

STRATEGIES = [
    {
        "name": "All Signals",
        "description": "Every signal regardless of band or narrative",
        "filters": {},
    },
    {
        "name": "Strong Buy Only",
        "description": "Only Strong Buy band signals",
        "filters": {"band": "Strong Buy"},
    },
    {
        "name": "Watch + Strong Buy",
        "description": "Watch and Strong Buy bands combined",
        "filters": {"band_in": ["Strong Buy", "Watch"]},
    },
    {
        "name": "AI Narrative",
        "description": "All signals with AI narrative category",
        "filters": {"narrative": "AI"},
    },
    {
        "name": "Low Risk Only",
        "description": "Only signals with low risk level",
        "filters": {"risk_level": "low"},
    },
    {
        "name": "Strong Buy + AI",
        "description": "Strong Buy band AND AI narrative",
        "filters": {"band": "Strong Buy", "narrative": "AI"},
    },
    {
        "name": "Strong Buy + Low Risk",
        "description": "Strong Buy band AND low risk level",
        "filters": {"band": "Strong Buy", "risk_level": "low"},
    },
]


async def compute_strategy_performance(db: AsyncSession) -> None:
    """Compute aggregate metrics for each named strategy."""
    result = await db.execute(
        select(
            SignalOutcome.band,
            SignalOutcome.narrative_category,
            SignalOutcome.risk_level,
            SignalOutcome.final_roi,
            SignalOutcome.outcome,
        )
        .where(SignalOutcome.final_roi.isnot(None))
    )
    all_rows = result.all()

    if len(all_rows) < 5:
        return

    for strategy in STRATEGIES:
        rows = _apply_strategy_filter(all_rows, strategy["filters"])
        if len(rows) < 3:
            continue

        returns = [r.final_roi for r in rows]
        wins = [r for r in rows if r.outcome == "WIN"]
        losses = [r for r in rows if r.outcome == "LOSS"]
        win_rate = len(wins) / len(rows)

        avg_win = _mean([r for r in returns if r >= WIN_THRESHOLD]) if any(r >= WIN_THRESHOLD for r in returns) else 0.0
        avg_loss = abs(_mean([r for r in returns if r <= LOSS_THRESHOLD])) if any(r <= LOSS_THRESHOLD for r in returns) else 0.0
        ev = (win_rate * avg_win) - ((1 - win_rate) * avg_loss)

        sharpe = _sharpe(returns)
        sortino = _sortino(returns)
        pf = _profit_factor(returns)

        # Max drawdown from equity curve (simple sequential)
        max_dd = _max_drawdown_from_returns(returns)
        calmar = (abs(_mean(returns)) / max_dd) if max_dd and max_dd > 0 else None

        # Risk of ruin: probability that after N trades equity drops below 10% of start
        ror = _estimate_risk_of_ruin(win_rate, avg_win / 100.0 if avg_win else 0, avg_loss / 100.0 if avg_loss else 0)

        data = {
            "description": strategy["description"],
            "total_signals": len(rows),
            "win_count": len(wins),
            "loss_count": len(losses),
            "win_rate": win_rate,
            "avg_roi": _mean(returns),
            "median_roi": _median(returns),
            "best_roi": max(returns),
            "worst_roi": min(returns),
            "sharpe_ratio": sharpe,
            "sortino_ratio": sortino,
            "calmar_ratio": calmar,
            "profit_factor": pf,
            "expected_value": ev,
            "max_drawdown": max_dd,
            "risk_of_ruin": ror,
            "computed_at": datetime.utcnow(),
        }

        stmt = pg_insert(StrategyPerformance).values(
            strategy_name=strategy["name"],
            **data,
        ).on_conflict_do_update(
            index_elements=["strategy_name"],
            set_=data,
        )
        await db.execute(stmt)

    await db.commit()
    logger.info("[LLN] Strategy performance updated")


def _apply_strategy_filter(rows, filters: dict) -> list:
    out = []
    for r in rows:
        if "band" in filters and r.band != filters["band"]:
            continue
        if "band_in" in filters and r.band not in filters["band_in"]:
            continue
        if "narrative" in filters and r.narrative_category != filters["narrative"]:
            continue
        if "risk_level" in filters and r.risk_level != filters["risk_level"]:
            continue
        out.append(r)
    return out


# ══════════════════════════════════════════════════════════════════════════════
# F.  MONTE CARLO SIMULATION
# ══════════════════════════════════════════════════════════════════════════════

async def run_monte_carlo_simulations(db: AsyncSession) -> None:
    """Run Monte Carlo for each named strategy using its historical return distribution."""
    result = await db.execute(
        select(
            SignalOutcome.band,
            SignalOutcome.narrative_category,
            SignalOutcome.risk_level,
            SignalOutcome.final_roi,
        )
        .where(SignalOutcome.final_roi.isnot(None))
    )
    all_rows = result.all()

    strategies_to_simulate = [
        ("all_signals", [r.final_roi for r in all_rows]),
        ("strong_buy", [r.final_roi for r in all_rows if r.band == "Strong Buy"]),
        ("watch_strong_buy", [r.final_roi for r in all_rows if r.band in ("Strong Buy", "Watch")]),
        ("ai_narrative", [r.final_roi for r in all_rows if r.narrative_category == "AI"]),
        ("low_risk", [r.final_roi for r in all_rows if r.risk_level == "low"]),
    ]

    for strategy_key, returns in strategies_to_simulate:
        if len(returns) < 10:
            continue

        sim = _monte_carlo(returns, n_simulations=1000, n_trades=100)

        data = {
            "n_simulations": sim["n_simulations"],
            "n_trades": sim["n_trades"],
            "sample_size": len(returns),
            "equity_p10": json.dumps([round(v, 2) for v in sim["equity_p10"]]),
            "equity_p50": json.dumps([round(v, 2) for v in sim["equity_p50"]]),
            "equity_p90": json.dumps([round(v, 2) for v in sim["equity_p90"]]),
            "median_final_equity": sim["median_final"],
            "p10_final_equity": sim["p10_final"],
            "p90_final_equity": sim["p90_final"],
            "max_drawdown_median": sim["max_drawdown_median"],
            "max_drawdown_worst": sim["max_drawdown_worst"],
            "survival_probability": sim["survival_probability"],
            "risk_of_ruin": sim["risk_of_ruin"],
            "computed_at": datetime.utcnow(),
        }

        stmt = pg_insert(SimulationResult).values(
            strategy=strategy_key,
            **data,
        ).on_conflict_do_update(
            index_elements=["strategy"],
            set_=data,
        )
        await db.execute(stmt)

    await db.commit()
    logger.info("[LLN] Monte Carlo simulations complete")


def _monte_carlo(
    returns: list[float],
    n_simulations: int = 1000,
    n_trades: int = 100,
    initial_equity: float = 10_000.0,
    risk_per_trade: float = 0.02,
) -> dict:
    """
    Simulate N equity curves by sampling trade returns with replacement.
    Returns subsampled equity curves at P10/P50/P90 and key stats.
    """
    if NUMPY_AVAILABLE:
        return _monte_carlo_numpy(returns, n_simulations, n_trades, initial_equity, risk_per_trade)
    return _monte_carlo_pure(returns, n_simulations, n_trades, initial_equity, risk_per_trade)


def _monte_carlo_numpy(returns, n_sims, n_trades, initial_equity, risk_per_trade) -> dict:
    arr = np.array(returns) / 100.0
    all_finals = []
    all_drawdowns = []
    all_curves = []

    for _ in range(n_sims):
        samples = np.random.choice(arr, size=n_trades, replace=True)
        equity = initial_equity
        curve = [equity]
        peak = equity
        max_dd = 0.0

        for r in samples:
            equity = max(0.0, equity + equity * risk_per_trade * r)
            curve.append(equity)
            if equity > peak:
                peak = equity
            if peak > 0:
                dd = (peak - equity) / peak * 100.0
                max_dd = max(max_dd, dd)

        all_finals.append(equity)
        all_drawdowns.append(max_dd)
        all_curves.append(curve)

    all_finals_arr = np.array(all_finals)
    all_dd_arr = np.array(all_drawdowns)
    sorted_curves = sorted(all_curves, key=lambda c: c[-1])
    n = len(sorted_curves)

    def subsample(curve: list, pts: int = 50) -> list:
        if len(curve) <= pts:
            return curve
        step = len(curve) / pts
        return [curve[int(i * step)] for i in range(pts)]

    survived = sum(1 for e in all_finals if e > 0)

    return {
        "n_simulations": n_sims,
        "n_trades": n_trades,
        "equity_p10": subsample(sorted_curves[int(n * 0.10)]),
        "equity_p50": subsample(sorted_curves[int(n * 0.50)]),
        "equity_p90": subsample(sorted_curves[int(n * 0.90)]),
        "median_final": float(np.median(all_finals_arr)),
        "p10_final": float(np.percentile(all_finals_arr, 10)),
        "p90_final": float(np.percentile(all_finals_arr, 90)),
        "max_drawdown_median": float(np.median(all_dd_arr)),
        "max_drawdown_worst": float(np.percentile(all_dd_arr, 90)),
        "survival_probability": survived / n_sims,
        "risk_of_ruin": 1.0 - survived / n_sims,
    }


def _monte_carlo_pure(returns, n_sims, n_trades, initial_equity, risk_per_trade) -> dict:
    """Pure Python fallback (no numpy)."""
    scaled = [r / 100.0 for r in returns]
    all_finals = []
    all_drawdowns = []
    all_curves = []

    for _ in range(n_sims):
        samples = [random.choice(scaled) for _ in range(n_trades)]
        equity = initial_equity
        curve = [equity]
        peak = equity
        max_dd = 0.0

        for r in samples:
            equity = max(0.0, equity + equity * risk_per_trade * r)
            curve.append(equity)
            if equity > peak:
                peak = equity
            if peak > 0:
                dd = (peak - equity) / peak * 100.0
                max_dd = max(max_dd, dd)

        all_finals.append(equity)
        all_drawdowns.append(max_dd)
        all_curves.append(curve)

    all_finals.sort()
    n = len(all_finals)
    sorted_curves = sorted(all_curves, key=lambda c: c[-1])

    def sub(curve, pts=50):
        if len(curve) <= pts:
            return curve
        step = len(curve) / pts
        return [curve[int(i * step)] for i in range(pts)]

    survived = sum(1 for e in all_finals if e > 0)
    all_dd_sorted = sorted(all_drawdowns)

    return {
        "n_simulations": n_sims,
        "n_trades": n_trades,
        "equity_p10": sub(sorted_curves[int(n * 0.10)]),
        "equity_p50": sub(sorted_curves[int(n * 0.50)]),
        "equity_p90": sub(sorted_curves[int(n * 0.90)]),
        "median_final": _median(all_finals),
        "p10_final": all_finals[int(n * 0.10)],
        "p90_final": all_finals[int(n * 0.90)],
        "max_drawdown_median": _median(all_dd_sorted),
        "max_drawdown_worst": all_dd_sorted[int(n * 0.90)] if n > 10 else max(all_dd_sorted),
        "survival_probability": survived / n_sims,
        "risk_of_ruin": 1.0 - survived / n_sims,
    }


# ══════════════════════════════════════════════════════════════════════════════
# H.  REGIME DETECTION
# ══════════════════════════════════════════════════════════════════════════════

async def detect_and_store_regime(db: AsyncSession) -> None:
    """Detect current market regime from DEX token stats and store it."""
    result = await db.execute(
        select(
            func.avg(DexToken.price_change_1h).label("avg_change"),
            func.count(DexToken.id).label("token_count"),
            func.avg(DexToken.volume_1h).label("avg_vol"),
            func.avg(DexToken.liquidity_usd).label("avg_liq"),
            func.avg(DexToken.buy_pressure_pct).label("avg_pressure"),
        )
        .where(DexToken.price_change_1h.isnot(None))
    )
    row = result.one_or_none()
    if not row or not row.token_count:
        return

    avg_change = row.avg_change or 0.0
    avg_vol = row.avg_vol or 0.0
    avg_liq = row.avg_liq or 0.0
    avg_pressure = row.avg_pressure or 50.0
    token_count = row.token_count or 0

    # Compute stddev of price changes for volatility estimate
    stddev_result = await db.execute(
        select(func.stddev(DexToken.price_change_1h))
        .where(DexToken.price_change_1h.isnot(None))
    )
    price_stddev = stddev_result.scalar_one_or_none() or 0.0

    # Regime classification logic
    if avg_change > 5.0 and avg_pressure > 60.0:
        regime = "trending"
    elif price_stddev > 25.0:
        regime = "volatile"
    elif avg_liq < 5000.0:
        regime = "low_liquidity"
    else:
        regime = "ranging"

    now = datetime.utcnow()

    # Get best performing band in current regime from pattern_performance
    best_band_result = await db.execute(
        select(PatternPerformance.group_value)
        .where(PatternPerformance.group_by == "band")
        .where(PatternPerformance.sample_size >= 5)
        .order_by(PatternPerformance.expected_value.desc().nullslast())
        .limit(1)
    )
    best_band = best_band_result.scalar_one_or_none()

    best_narrative_result = await db.execute(
        select(PatternPerformance.group_value)
        .where(PatternPerformance.group_by == "narrative")
        .where(PatternPerformance.sample_size >= 5)
        .order_by(PatternPerformance.expected_value.desc().nullslast())
        .limit(1)
    )
    best_narrative = best_narrative_result.scalar_one_or_none()

    # Mark previous current as not current
    await db.execute(
        update(RegimeStat)
        .where(RegimeStat.is_current == True)  # noqa: E712
        .values(is_current=False)
    )

    db.add(RegimeStat(
        regime=regime,
        detected_at=now,
        is_current=True,
        best_band=best_band,
        best_narrative=best_narrative,
        avg_price_change_1h=avg_change,
        price_change_stddev=price_stddev,
        avg_volume=avg_vol,
        avg_liquidity=avg_liq,
        avg_buy_pressure=avg_pressure,
        token_count=token_count,
    ))
    await db.commit()
    logger.info(f"[LLN] Regime detected: {regime}")


# ══════════════════════════════════════════════════════════════════════════════
# I.  FEATURE IMPORTANCE + CORRELATION
# ══════════════════════════════════════════════════════════════════════════════

async def compute_feature_importance(db: AsyncSession) -> None:
    """
    Compute Pearson correlation of each signal sub-score with final ROI.
    Rank features by absolute correlation magnitude.
    """
    result = await db.execute(
        select(
            SignalOutcome.final_roi,
            Signal.score,
            Signal.sentiment_score,
            Signal.technical_score,
            Signal.liquidity_score,
            Signal.momentum_score,
        )
        .join(Signal, SignalOutcome.signal_id == Signal.id)
        .where(SignalOutcome.final_roi.isnot(None))
        .limit(2000)
    )
    rows = result.all()

    if len(rows) < 10:
        logger.info("[LLN] Insufficient data for feature importance (< 10)")
        return

    rois = [r.final_roi for r in rows]

    feature_vectors = {
        "composite_score": [r.score for r in rows],
        "sentiment_score": [r.sentiment_score for r in rows],
        "technical_score": [r.technical_score for r in rows],
        "liquidity_score": [r.liquidity_score for r in rows],
        "momentum_score": [r.momentum_score for r in rows],
    }

    importance_list = []
    for feat_name, values in feature_vectors.items():
        corr = _pearson_correlation(values, rois)
        importance_list.append({
            "feature_name": feat_name,
            "importance_score": abs(corr) if corr is not None else 0.0,
            "correlation_with_roi": corr,
            "direction": "positive" if (corr or 0) > 0 else "negative",
        })

    # Also add band-based binary features
    band_to_num = {"Strong Buy": 4, "Watch": 3, "Risky": 2, "Avoid": 1}
    band_result = await db.execute(
        select(SignalOutcome.band, SignalOutcome.final_roi)
        .where(SignalOutcome.final_roi.isnot(None))
        .where(SignalOutcome.band.isnot(None))
    )
    band_rows = band_result.all()
    if len(band_rows) >= 10:
        band_nums = [band_to_num.get(r.band, 0) for r in band_rows]
        band_rois = [r.final_roi for r in band_rows]
        band_corr = _pearson_correlation(band_nums, band_rois)
        importance_list.append({
            "feature_name": "band_rank",
            "importance_score": abs(band_corr) if band_corr is not None else 0.0,
            "correlation_with_roi": band_corr,
            "direction": "positive" if (band_corr or 0) > 0 else "negative",
        })

    # Rank by importance
    importance_list.sort(key=lambda x: x["importance_score"], reverse=True)
    for rank, item in enumerate(importance_list, 1):
        item["rank"] = rank

    # Upsert
    for item in importance_list:
        data = {**item, "computed_at": datetime.utcnow()}
        stmt = pg_insert(FeatureImportance).values(**data).on_conflict_do_update(
            index_elements=["feature_name"],
            set_=data,
        )
        await db.execute(stmt)

    await db.commit()
    logger.info(f"[LLN] Feature importance updated: {len(importance_list)} features")


# ══════════════════════════════════════════════════════════════════════════════
# PURE MATH HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _mean(values: list[float]) -> Optional[float]:
    if not values:
        return None
    return sum(values) / len(values)


def _median(values: list[float]) -> Optional[float]:
    if not values:
        return None
    s = sorted(values)
    n = len(s)
    mid = n // 2
    return (s[mid - 1] + s[mid]) / 2.0 if n % 2 == 0 else float(s[mid])


def _std(values: list[float]) -> Optional[float]:
    if len(values) < 2:
        return None
    m = _mean(values)
    variance = sum((v - m) ** 2 for v in values) / (len(values) - 1)
    return math.sqrt(variance)


def _sharpe(returns: list[float], risk_free: float = 0.0) -> Optional[float]:
    if len(returns) < 3:
        return None
    m = _mean(returns) or 0.0
    s = _std(returns)
    if not s or s == 0:
        return None
    return (m - risk_free) / s


def _sortino(returns: list[float], risk_free: float = 0.0) -> Optional[float]:
    if len(returns) < 3:
        return None
    m = _mean(returns) or 0.0
    neg = [r for r in returns if r < 0]
    if not neg:
        return None
    downside_std = _std(neg)
    if not downside_std or downside_std == 0:
        return None
    return (m - risk_free) / downside_std


def _profit_factor(returns: list[float]) -> Optional[float]:
    gains = sum(r for r in returns if r > 0)
    losses = abs(sum(r for r in returns if r < 0))
    if losses == 0:
        return None
    return gains / losses


def _beta_ci(alpha: float, beta_param: float, confidence: float = 0.95) -> tuple[float, float]:
    """95% Bayesian credible interval for a Beta distribution."""
    if SCIPY_AVAILABLE:
        lo, hi = scipy_stats.beta.interval(confidence, alpha, beta_param)
        return float(lo), float(hi)
    # Approximation using normal approximation to Beta
    p = alpha / (alpha + beta_param)
    z = 1.96  # 95% CI
    n = alpha + beta_param
    margin = z * math.sqrt(p * (1 - p) / n)
    return max(0.0, p - margin), min(1.0, p + margin)


def _prob_positive_ev(win_rate: float, avg_win: float, avg_loss: float) -> float:
    """Probability that EV > 0 given win_rate and payoffs (simplified)."""
    if avg_win <= 0 or avg_loss <= 0:
        return 0.0
    # Breakeven win rate: wr_be = avg_loss / (avg_win + avg_loss)
    wr_be = avg_loss / (avg_win + avg_loss)
    # Distance from breakeven as probability estimate
    if win_rate >= wr_be:
        # Scale: 0.5 at breakeven → 1.0 at win_rate=1.0
        excess = (win_rate - wr_be) / (1.0 - wr_be) if wr_be < 1.0 else 1.0
        return 0.5 + 0.5 * excess
    else:
        deficit = (wr_be - win_rate) / wr_be if wr_be > 0 else 1.0
        return max(0.0, 0.5 - 0.5 * deficit)


def _max_drawdown_from_returns(returns: list[float]) -> Optional[float]:
    if not returns:
        return None
    equity = 10_000.0
    peak = equity
    max_dd = 0.0
    for r in returns:
        equity = max(0.0, equity * (1 + r / 100.0))
        if equity > peak:
            peak = equity
        if peak > 0:
            dd = (peak - equity) / peak * 100.0
            max_dd = max(max_dd, dd)
    return max_dd


def _estimate_risk_of_ruin(win_rate: float, avg_win_pct: float, avg_loss_pct: float, n_trades: int = 100) -> float:
    """Quick Kelly-based risk of ruin estimate."""
    if avg_loss_pct <= 0 or avg_win_pct <= 0:
        return 0.5
    r = avg_win_pct / avg_loss_pct  # win/loss ratio
    # q = 1 - win_rate
    q = 1.0 - win_rate
    if win_rate <= 0 or r <= 0:
        return 1.0
    # (q/p)^(capital/avg_loss) approximation
    ratio = q / win_rate
    if ratio >= 1.0:
        return min(1.0, ratio ** 10)  # High risk
    return max(0.0, ratio ** (n_trades * avg_loss_pct))


def _pearson_correlation(x: list[float], y: list[float]) -> Optional[float]:
    if len(x) != len(y) or len(x) < 3:
        return None
    if SCIPY_AVAILABLE:
        try:
            corr, _ = scipy_stats.pearsonr(x, y)
            return float(corr) if not math.isnan(corr) else None
        except Exception:
            pass
    # Pure Python fallback
    n = len(x)
    mx = sum(x) / n
    my = sum(y) / n
    cov = sum((xi - mx) * (yi - my) for xi, yi in zip(x, y)) / n
    sx = math.sqrt(sum((xi - mx) ** 2 for xi in x) / n)
    sy = math.sqrt(sum((yi - my) ** 2 for yi in y) / n)
    if sx == 0 or sy == 0:
        return None
    return cov / (sx * sy)


def _compute_distribution_stats(returns: list[float]) -> dict:
    """Full statistical distribution for a list of returns."""
    if not returns:
        return {"sample_size": 0}

    n = len(returns)
    s = sorted(returns)

    def percentile(p: float) -> float:
        idx = (n - 1) * p
        lo = int(idx)
        hi = min(lo + 1, n - 1)
        return s[lo] + (s[hi] - s[lo]) * (idx - lo)

    mean_val = _mean(returns) or 0.0
    median_val = _median(returns) or 0.0
    std_val = _std(returns) or 0.0
    variance = std_val ** 2

    # Skewness and kurtosis
    if SCIPY_AVAILABLE and n >= 3:
        skew = float(scipy_stats.skew(returns))
        kurt = float(scipy_stats.kurtosis(returns))
    elif n >= 3:
        m3 = sum((r - mean_val) ** 3 for r in returns) / n
        m4 = sum((r - mean_val) ** 4 for r in returns) / n
        skew = m3 / (std_val ** 3) if std_val > 0 else 0.0
        kurt = (m4 / (std_val ** 4)) - 3.0 if std_val > 0 else 0.0
    else:
        skew = 0.0
        kurt = 0.0

    # Build histogram (20 buckets)
    hist = _build_histogram(returns, n_buckets=20)

    return {
        "sample_size": n,
        "mean": mean_val,
        "median": median_val,
        "std": std_val,
        "variance": variance,
        "skewness": skew,
        "kurtosis": kurt,
        "p10": percentile(0.10),
        "p25": percentile(0.25),
        "p50": percentile(0.50),
        "p75": percentile(0.75),
        "p90": percentile(0.90),
        "has_fat_tails": abs(kurt) > 3.0,
        "positive_skew": skew > 0.5,
        "asymmetric_payoff": abs(skew) > 1.0,
        "histogram_data": json.dumps(hist),
    }


def _build_histogram(returns: list[float], n_buckets: int = 20) -> list[dict]:
    if not returns:
        return []
    mn, mx = min(returns), max(returns)
    if mx == mn:
        return [{"lower": mn, "upper": mx, "count": len(returns)}]
    bucket_size = (mx - mn) / n_buckets
    buckets = []
    for i in range(n_buckets):
        lo = mn + i * bucket_size
        hi = lo + bucket_size
        count = sum(1 for r in returns if lo <= r < hi)
        if i == n_buckets - 1:
            count += sum(1 for r in returns if r == mx)
        buckets.append({"lower": round(lo, 2), "upper": round(hi, 2), "count": count})
    return buckets


def _liquidity_tier(liquidity_usd: float) -> str:
    if liquidity_usd < 10_000:
        return "micro (<$10k)"
    elif liquidity_usd < 100_000:
        return "small ($10k-$100k)"
    elif liquidity_usd < 1_000_000:
        return "medium ($100k-$1M)"
    else:
        return "large (>$1M)"
