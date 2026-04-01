"""
LLN Quant Engine — SQLAlchemy models.
New tables only — existing tables are never modified.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Float, Integer, String, Text,
    UniqueConstraint, func
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SignalOutcome(Base):
    """Full lifecycle outcome for every processed signal."""
    __tablename__ = "signal_outcomes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    signal_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    coin_symbol: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Entry context (snapshotted from signal at compute time)
    entry_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exit_target: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stop_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    band: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, index=True)
    narrative_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

    # Market context at signal time
    liquidity_at_signal: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    buy_pressure_at_signal: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Time-based ROI estimates (derived from price change data)
    roi_24h: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    roi_7d: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Excursion metrics
    mfe: Mapped[Optional[float]] = mapped_column(Float, nullable=True)   # max favorable excursion %
    mae: Mapped[Optional[float]] = mapped_column(Float, nullable=True)   # max adverse excursion %
    volatility_post_entry: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Final outcome
    final_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True, index=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, index=True)
    # WIN (>= +50%) | NEUTRAL (-10% to +50%) | LOSS (<= -30%)

    computed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class PatternPerformance(Base):
    """Aggregated win/loss statistics grouped by pattern type + value."""
    __tablename__ = "pattern_performance"
    __table_args__ = (
        UniqueConstraint("group_by", "group_value", name="uq_pattern_perf"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Grouping dimension
    group_by: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # band | narrative | risk_level | liquidity_tier | buy_pressure_tier

    group_value: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # e.g. "Strong Buy" | "AI" | "high" | "whale" | "low"

    sample_size: Mapped[int] = mapped_column(Integer, default=0)
    win_count: Mapped[int] = mapped_column(Integer, default=0)
    loss_count: Mapped[int] = mapped_column(Integer, default=0)
    neutral_count: Mapped[int] = mapped_column(Integer, default=0)

    win_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    median_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_mfe: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_mae: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Risk-adjusted metrics
    sharpe_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sortino_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    profit_factor: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    expected_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Bayesian confidence interval
    bayesian_win_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ci_lower: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ci_upper: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    probability_positive_ev: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    computed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)


class ReturnDistribution(Base):
    """Full statistical distribution of returns per group."""
    __tablename__ = "return_distributions"
    __table_args__ = (
        UniqueConstraint("group_by", "group_value", name="uq_return_dist"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    group_by: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    group_value: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    sample_size: Mapped[int] = mapped_column(Integer, default=0)

    # Moments
    mean: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    median: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    std: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    variance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    skewness: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    kurtosis: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Percentiles
    p10: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p25: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p50: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p75: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p90: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Tail & structure flags
    has_fat_tails: Mapped[bool] = mapped_column(Boolean, default=False)
    positive_skew: Mapped[bool] = mapped_column(Boolean, default=False)
    asymmetric_payoff: Mapped[bool] = mapped_column(Boolean, default=False)

    # JSON array: [{lower, upper, count}, ...] — 20 buckets
    histogram_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    computed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)


class StrategyPerformance(Base):
    """Overall performance of named strategies (filter combos)."""
    __tablename__ = "strategy_performance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    strategy_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    total_signals: Mapped[int] = mapped_column(Integer, default=0)
    win_count: Mapped[int] = mapped_column(Integer, default=0)
    loss_count: Mapped[int] = mapped_column(Integer, default=0)
    win_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    avg_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    median_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    best_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    worst_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    sharpe_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sortino_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    calmar_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    profit_factor: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    expected_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    max_drawdown: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_of_ruin: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    computed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)


class RegimeStat(Base):
    """Market regime snapshots with per-regime pattern performance."""
    __tablename__ = "regime_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # trending | volatile | low_liquidity | ranging
    regime: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Pattern performance in this regime
    best_band: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    best_narrative: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    avg_win_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Regime market characteristics
    avg_price_change_1h: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    price_change_stddev: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_volume: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_liquidity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_buy_pressure: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class SimulationResult(Base):
    """Monte Carlo simulation results per strategy."""
    __tablename__ = "simulation_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    strategy: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    n_simulations: Mapped[int] = mapped_column(Integer, default=1000)
    n_trades: Mapped[int] = mapped_column(Integer, default=100)
    sample_size: Mapped[int] = mapped_column(Integer, default=0)

    # Subsampled equity curves (JSON arrays of floats, 50 points each)
    equity_p10: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    equity_p50: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    equity_p90: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Final equity distribution (starting from $10,000)
    median_final_equity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p10_final_equity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p90_final_equity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    max_drawdown_median: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_drawdown_worst: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    survival_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_of_ruin: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    computed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)


class FeatureImportance(Base):
    """Ranked feature importance with ROI correlation."""
    __tablename__ = "feature_importance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    feature_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    importance_score: Mapped[float] = mapped_column(Float, default=0.0)
    correlation_with_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rank: Mapped[int] = mapped_column(Integer, default=0, index=True)
    direction: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    # positive | negative

    computed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
