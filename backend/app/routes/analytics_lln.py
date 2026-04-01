"""
LLN Quant Engine — REST API routes.

All endpoints serve pre-computed data only.
Heavy computation happens in the lln_quant_worker — never in these handlers.
"""
import json
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.lln import (
    FeatureImportance,
    PatternPerformance,
    RegimeStat,
    ReturnDistribution,
    SignalOutcome,
    SimulationResult,
    StrategyPerformance,
)
from app.schemas.lln import (
    FeatureImportanceOut,
    LLNOverview,
    PatternPerformanceOut,
    RegimeStatOut,
    ReturnDistributionOut,
    RiskSummaryOut,
    SignalOutcomeOut,
    SimulationResultOut,
    StrategyPerformanceOut,
)

router = APIRouter(tags=["lln"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _parse_json_field(value: Optional[str]) -> Optional[list]:
    if value is None:
        return None
    try:
        return json.loads(value)
    except Exception:
        return None


def _sim_to_out(row: SimulationResult) -> SimulationResultOut:
    return SimulationResultOut(
        strategy=row.strategy,
        n_simulations=row.n_simulations,
        n_trades=row.n_trades,
        sample_size=row.sample_size,
        equity_p10=_parse_json_field(row.equity_p10),
        equity_p50=_parse_json_field(row.equity_p50),
        equity_p90=_parse_json_field(row.equity_p90),
        median_final_equity=row.median_final_equity,
        p10_final_equity=row.p10_final_equity,
        p90_final_equity=row.p90_final_equity,
        max_drawdown_median=row.max_drawdown_median,
        max_drawdown_worst=row.max_drawdown_worst,
        survival_probability=row.survival_probability,
        risk_of_ruin=row.risk_of_ruin,
        computed_at=row.computed_at,
    )


# ── GET /analytics/overview ────────────────────────────────────────────────────

@router.get("/analytics/overview", response_model=LLNOverview)
async def get_overview(db: AsyncSession = Depends(get_db)):
    """
    Global statistics for the LLN terminal dashboard.
    Reads from pattern_performance (group_by=all), regime_stats (is_current).
    """
    # Global aggregate
    global_result = await db.execute(
        select(PatternPerformance)
        .where(PatternPerformance.group_by == "all")
        .where(PatternPerformance.group_value == "all")
    )
    global_perf = global_result.scalar_one_or_none()

    # Best band
    best_band_result = await db.execute(
        select(PatternPerformance.group_value)
        .where(PatternPerformance.group_by == "band")
        .where(PatternPerformance.sample_size >= 5)
        .order_by(PatternPerformance.expected_value.desc().nullslast())
        .limit(1)
    )
    best_band = best_band_result.scalar_one_or_none()

    # Best narrative
    best_narrative_result = await db.execute(
        select(PatternPerformance.group_value)
        .where(PatternPerformance.group_by == "narrative")
        .where(PatternPerformance.sample_size >= 5)
        .order_by(PatternPerformance.expected_value.desc().nullslast())
        .limit(1)
    )
    best_narrative = best_narrative_result.scalar_one_or_none()

    # Current regime
    regime_result = await db.execute(
        select(RegimeStat.regime)
        .where(RegimeStat.is_current == True)  # noqa: E712
        .order_by(desc(RegimeStat.detected_at))
        .limit(1)
    )
    current_regime = regime_result.scalar_one_or_none()

    if global_perf:
        return LLNOverview(
            total_signals_analyzed=global_perf.sample_size,
            global_win_rate=global_perf.win_rate,
            global_ev=global_perf.expected_value,
            sample_size=global_perf.sample_size,
            best_band=best_band,
            best_narrative=best_narrative,
            current_regime=current_regime,
            global_sharpe=global_perf.sharpe_ratio,
            global_profit_factor=global_perf.profit_factor,
            win_count=global_perf.win_count,
            loss_count=global_perf.loss_count,
            neutral_count=global_perf.neutral_count,
            last_computed=global_perf.computed_at,
        )

    # No data yet — return zeros
    return LLNOverview(
        total_signals_analyzed=0,
        global_win_rate=None,
        global_ev=None,
        sample_size=0,
        best_band=None,
        best_narrative=None,
        current_regime=current_regime,
        global_sharpe=None,
        global_profit_factor=None,
        win_count=0,
        loss_count=0,
        neutral_count=0,
        last_computed=None,
    )


# ── GET /analytics/patterns ────────────────────────────────────────────────────

@router.get("/analytics/patterns", response_model=list[PatternPerformanceOut])
async def get_patterns(
    group_by: Optional[str] = Query(None, description="Filter by grouping: band|narrative|risk_level|liquidity_tier"),
    min_sample: int = Query(3, description="Minimum sample size to include"),
    db: AsyncSession = Depends(get_db),
):
    """Pattern performance grouped by band, narrative, risk level, or liquidity tier."""
    q = (
        select(PatternPerformance)
        .where(PatternPerformance.sample_size >= min_sample)
        .where(PatternPerformance.group_by != "all")
        .order_by(
            PatternPerformance.group_by,
            PatternPerformance.expected_value.desc().nullslast(),
        )
    )
    if group_by:
        q = q.where(PatternPerformance.group_by == group_by)

    result = await db.execute(q)
    rows = result.scalars().all()
    return [PatternPerformanceOut.model_validate(r, from_attributes=True) for r in rows]


# ── GET /analytics/strategies ──────────────────────────────────────────────────

@router.get("/analytics/strategies", response_model=list[StrategyPerformanceOut])
async def get_strategies(db: AsyncSession = Depends(get_db)):
    """All named strategy performance records, ordered by expected value."""
    result = await db.execute(
        select(StrategyPerformance)
        .order_by(StrategyPerformance.expected_value.desc().nullslast())
    )
    rows = result.scalars().all()
    return [StrategyPerformanceOut.model_validate(r, from_attributes=True) for r in rows]


# ── GET /analytics/outcomes ────────────────────────────────────────────────────

@router.get("/analytics/outcomes", response_model=list[SignalOutcomeOut])
async def get_outcomes(
    limit: int = Query(100, le=500),
    outcome: Optional[str] = Query(None, description="WIN | NEUTRAL | LOSS"),
    band: Optional[str] = Query(None),
    narrative: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Recent signal outcomes with ROI, classification, and entry/exit levels."""
    q = (
        select(SignalOutcome)
        .order_by(desc(SignalOutcome.computed_at))
        .limit(limit)
    )
    if outcome:
        q = q.where(SignalOutcome.outcome == outcome.upper())
    if band:
        q = q.where(SignalOutcome.band == band)
    if narrative:
        q = q.where(SignalOutcome.narrative_category == narrative)

    result = await db.execute(q)
    rows = result.scalars().all()
    return [SignalOutcomeOut.model_validate(r, from_attributes=True) for r in rows]


# ── GET /analytics/distributions ──────────────────────────────────────────────

@router.get("/analytics/distributions", response_model=list[ReturnDistributionOut])
async def get_distributions(
    group_by: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Statistical return distributions per group — histogram, moments, tail analysis."""
    q = select(ReturnDistribution).order_by(
        ReturnDistribution.group_by,
        ReturnDistribution.sample_size.desc(),
    )
    if group_by:
        q = q.where(ReturnDistribution.group_by == group_by)

    result = await db.execute(q)
    rows = result.scalars().all()

    out = []
    for r in rows:
        d = ReturnDistributionOut.model_validate(r, from_attributes=True)
        # Parse histogram JSON
        d.histogram_data = _parse_json_field(r.histogram_data)
        out.append(d)
    return out


# ── GET /analytics/risk ────────────────────────────────────────────────────────

@router.get("/analytics/risk", response_model=RiskSummaryOut)
async def get_risk(db: AsyncSession = Depends(get_db)):
    """Risk summary: strategy risk metrics + Monte Carlo simulation results."""
    strat_result = await db.execute(
        select(StrategyPerformance).order_by(
            StrategyPerformance.expected_value.desc().nullslast()
        )
    )
    strategies = strat_result.scalars().all()

    sim_result = await db.execute(select(SimulationResult))
    simulations = sim_result.scalars().all()

    # Global aggregates
    all_sims = [s for s in simulations if s.strategy == "all_signals"]
    global_sim = all_sims[0] if all_sims else None
    global_strat = next(
        (s for s in strategies if s.strategy_name == "All Signals"), None
    )

    return RiskSummaryOut(
        strategies=[StrategyPerformanceOut.model_validate(s, from_attributes=True) for s in strategies],
        simulations=[_sim_to_out(s) for s in simulations],
        global_risk_of_ruin=global_sim.risk_of_ruin if global_sim else None,
        global_max_drawdown=global_strat.max_drawdown if global_strat else None,
        global_survival_probability=global_sim.survival_probability if global_sim else None,
    )


# ── GET /analytics/simulations ────────────────────────────────────────────────

@router.get("/analytics/simulations", response_model=list[SimulationResultOut])
async def get_simulations(db: AsyncSession = Depends(get_db)):
    """Monte Carlo simulation results per strategy."""
    result = await db.execute(
        select(SimulationResult).order_by(
            SimulationResult.survival_probability.desc().nullslast()
        )
    )
    rows = result.scalars().all()
    return [_sim_to_out(r) for r in rows]


# ── GET /analytics/regimes ────────────────────────────────────────────────────

@router.get("/analytics/regimes", response_model=list[RegimeStatOut])
async def get_regimes(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Market regime history — current regime first."""
    result = await db.execute(
        select(RegimeStat)
        .order_by(RegimeStat.is_current.desc(), desc(RegimeStat.detected_at))
        .limit(limit)
    )
    rows = result.scalars().all()
    return [RegimeStatOut.model_validate(r, from_attributes=True) for r in rows]


# ── GET /analytics/features ───────────────────────────────────────────────────

@router.get("/analytics/features", response_model=list[FeatureImportanceOut])
async def get_features(db: AsyncSession = Depends(get_db)):
    """Feature importance ranking with ROI correlation."""
    result = await db.execute(
        select(FeatureImportance).order_by(FeatureImportance.rank)
    )
    rows = result.scalars().all()
    return [FeatureImportanceOut.model_validate(r, from_attributes=True) for r in rows]
