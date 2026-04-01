"""Pydantic schemas for LLN Quant Engine API responses."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class LLNOverview(BaseModel):
    total_signals_analyzed: int
    global_win_rate: Optional[float]
    global_ev: Optional[float]
    sample_size: int
    best_band: Optional[str]
    best_narrative: Optional[str]
    current_regime: Optional[str]
    global_sharpe: Optional[float]
    global_profit_factor: Optional[float]
    win_count: int
    loss_count: int
    neutral_count: int
    last_computed: Optional[datetime]


class PatternPerformanceOut(BaseModel):
    group_by: str
    group_value: str
    sample_size: int
    win_count: int
    loss_count: int
    neutral_count: int
    win_rate: Optional[float]
    avg_roi: Optional[float]
    median_roi: Optional[float]
    avg_mfe: Optional[float]
    avg_mae: Optional[float]
    sharpe_ratio: Optional[float]
    sortino_ratio: Optional[float]
    profit_factor: Optional[float]
    expected_value: Optional[float]
    bayesian_win_rate: Optional[float]
    ci_lower: Optional[float]
    ci_upper: Optional[float]
    probability_positive_ev: Optional[float]
    computed_at: Optional[datetime]


class ReturnDistributionOut(BaseModel):
    group_by: str
    group_value: str
    sample_size: int
    mean: Optional[float]
    median: Optional[float]
    std: Optional[float]
    variance: Optional[float]
    skewness: Optional[float]
    kurtosis: Optional[float]
    p10: Optional[float]
    p25: Optional[float]
    p50: Optional[float]
    p75: Optional[float]
    p90: Optional[float]
    has_fat_tails: bool
    positive_skew: bool
    asymmetric_payoff: bool
    histogram_data: Optional[Any]   # parsed JSON list
    computed_at: Optional[datetime]


class StrategyPerformanceOut(BaseModel):
    strategy_name: str
    description: Optional[str]
    total_signals: int
    win_count: int
    loss_count: int
    win_rate: Optional[float]
    avg_roi: Optional[float]
    median_roi: Optional[float]
    best_roi: Optional[float]
    worst_roi: Optional[float]
    sharpe_ratio: Optional[float]
    sortino_ratio: Optional[float]
    calmar_ratio: Optional[float]
    profit_factor: Optional[float]
    expected_value: Optional[float]
    max_drawdown: Optional[float]
    risk_of_ruin: Optional[float]
    computed_at: Optional[datetime]


class SignalOutcomeOut(BaseModel):
    signal_id: int
    coin_symbol: str
    entry_price: Optional[float]
    exit_target: Optional[float]
    stop_loss: Optional[float]
    band: Optional[str]
    risk_level: Optional[str]
    narrative_category: Optional[str]
    roi_24h: Optional[float]
    roi_7d: Optional[float]
    mfe: Optional[float]
    mae: Optional[float]
    final_roi: Optional[float]
    outcome: Optional[str]
    computed_at: Optional[datetime]


class SimulationResultOut(BaseModel):
    strategy: str
    n_simulations: int
    n_trades: int
    sample_size: int
    equity_p10: Optional[list[float]]
    equity_p50: Optional[list[float]]
    equity_p90: Optional[list[float]]
    median_final_equity: Optional[float]
    p10_final_equity: Optional[float]
    p90_final_equity: Optional[float]
    max_drawdown_median: Optional[float]
    max_drawdown_worst: Optional[float]
    survival_probability: Optional[float]
    risk_of_ruin: Optional[float]
    computed_at: Optional[datetime]


class RegimeStatOut(BaseModel):
    regime: str
    detected_at: datetime
    is_current: bool
    best_band: Optional[str]
    best_narrative: Optional[str]
    avg_win_rate: Optional[float]
    avg_roi: Optional[float]
    avg_price_change_1h: Optional[float]
    price_change_stddev: Optional[float]
    avg_volume: Optional[float]
    avg_liquidity: Optional[float]
    avg_buy_pressure: Optional[float]
    token_count: Optional[int]


class FeatureImportanceOut(BaseModel):
    feature_name: str
    importance_score: float
    correlation_with_roi: Optional[float]
    rank: int
    direction: Optional[str]
    computed_at: Optional[datetime]


class RiskSummaryOut(BaseModel):
    """Aggregated risk metrics across all strategies."""
    strategies: list[StrategyPerformanceOut]
    simulations: list[SimulationResultOut]
    global_risk_of_ruin: Optional[float]
    global_max_drawdown: Optional[float]
    global_survival_probability: Optional[float]
