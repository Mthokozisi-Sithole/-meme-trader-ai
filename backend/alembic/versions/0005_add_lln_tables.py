"""Add LLN Quant Engine tables: signal_outcomes, pattern_performance,
return_distributions, strategy_performance, regime_stats,
simulation_results, feature_importance

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-31
"""
from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --------------------------------------------------------- signal_outcomes
    op.create_table(
        "signal_outcomes",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("signal_id", sa.Integer, nullable=False, unique=True, index=True),
        sa.Column("coin_symbol", sa.String(50), nullable=False, index=True),

        # Entry context
        sa.Column("entry_price", sa.Float, nullable=True),
        sa.Column("exit_target", sa.Float, nullable=True),
        sa.Column("stop_loss", sa.Float, nullable=True),
        sa.Column("band", sa.String(20), nullable=True, index=True),
        sa.Column("risk_level", sa.String(10), nullable=True, index=True),
        sa.Column("narrative_category", sa.String(50), nullable=True, index=True),

        # Market context
        sa.Column("liquidity_at_signal", sa.Float, nullable=True),
        sa.Column("buy_pressure_at_signal", sa.Float, nullable=True),

        # Time-based ROI
        sa.Column("roi_24h", sa.Float, nullable=True),
        sa.Column("roi_7d", sa.Float, nullable=True),

        # Excursion metrics
        sa.Column("mfe", sa.Float, nullable=True),
        sa.Column("mae", sa.Float, nullable=True),
        sa.Column("volatility_post_entry", sa.Float, nullable=True),

        # Final outcome
        sa.Column("final_roi", sa.Float, nullable=True, index=True),
        sa.Column("outcome", sa.String(10), nullable=True, index=True),

        sa.Column("computed_at", sa.DateTime, server_default=sa.func.now(), index=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    # ----------------------------------------------------- pattern_performance
    op.create_table(
        "pattern_performance",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("group_by", sa.String(50), nullable=False, index=True),
        sa.Column("group_value", sa.String(100), nullable=False, index=True),

        sa.Column("sample_size", sa.Integer, server_default="0"),
        sa.Column("win_count", sa.Integer, server_default="0"),
        sa.Column("loss_count", sa.Integer, server_default="0"),
        sa.Column("neutral_count", sa.Integer, server_default="0"),

        sa.Column("win_rate", sa.Float, nullable=True),
        sa.Column("avg_roi", sa.Float, nullable=True),
        sa.Column("median_roi", sa.Float, nullable=True),
        sa.Column("avg_mfe", sa.Float, nullable=True),
        sa.Column("avg_mae", sa.Float, nullable=True),

        sa.Column("sharpe_ratio", sa.Float, nullable=True),
        sa.Column("sortino_ratio", sa.Float, nullable=True),
        sa.Column("profit_factor", sa.Float, nullable=True),
        sa.Column("expected_value", sa.Float, nullable=True),

        sa.Column("bayesian_win_rate", sa.Float, nullable=True),
        sa.Column("ci_lower", sa.Float, nullable=True),
        sa.Column("ci_upper", sa.Float, nullable=True),
        sa.Column("probability_positive_ev", sa.Float, nullable=True),

        sa.Column("computed_at", sa.DateTime, server_default=sa.func.now(), index=True),

        sa.UniqueConstraint("group_by", "group_value", name="uq_pattern_perf"),
    )

    # ---------------------------------------------------- return_distributions
    op.create_table(
        "return_distributions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("group_by", sa.String(50), nullable=False, index=True),
        sa.Column("group_value", sa.String(100), nullable=False, index=True),

        sa.Column("sample_size", sa.Integer, server_default="0"),
        sa.Column("mean", sa.Float, nullable=True),
        sa.Column("median", sa.Float, nullable=True),
        sa.Column("std", sa.Float, nullable=True),
        sa.Column("variance", sa.Float, nullable=True),
        sa.Column("skewness", sa.Float, nullable=True),
        sa.Column("kurtosis", sa.Float, nullable=True),

        sa.Column("p10", sa.Float, nullable=True),
        sa.Column("p25", sa.Float, nullable=True),
        sa.Column("p50", sa.Float, nullable=True),
        sa.Column("p75", sa.Float, nullable=True),
        sa.Column("p90", sa.Float, nullable=True),

        sa.Column("has_fat_tails", sa.Boolean, server_default="false"),
        sa.Column("positive_skew", sa.Boolean, server_default="false"),
        sa.Column("asymmetric_payoff", sa.Boolean, server_default="false"),
        sa.Column("histogram_data", sa.Text, nullable=True),

        sa.Column("computed_at", sa.DateTime, server_default=sa.func.now(), index=True),

        sa.UniqueConstraint("group_by", "group_value", name="uq_return_dist"),
    )

    # --------------------------------------------------- strategy_performance
    op.create_table(
        "strategy_performance",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("strategy_name", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("description", sa.String(300), nullable=True),

        sa.Column("total_signals", sa.Integer, server_default="0"),
        sa.Column("win_count", sa.Integer, server_default="0"),
        sa.Column("loss_count", sa.Integer, server_default="0"),
        sa.Column("win_rate", sa.Float, nullable=True),

        sa.Column("avg_roi", sa.Float, nullable=True),
        sa.Column("median_roi", sa.Float, nullable=True),
        sa.Column("best_roi", sa.Float, nullable=True),
        sa.Column("worst_roi", sa.Float, nullable=True),

        sa.Column("sharpe_ratio", sa.Float, nullable=True),
        sa.Column("sortino_ratio", sa.Float, nullable=True),
        sa.Column("calmar_ratio", sa.Float, nullable=True),
        sa.Column("profit_factor", sa.Float, nullable=True),
        sa.Column("expected_value", sa.Float, nullable=True),

        sa.Column("max_drawdown", sa.Float, nullable=True),
        sa.Column("risk_of_ruin", sa.Float, nullable=True),

        sa.Column("computed_at", sa.DateTime, server_default=sa.func.now(), index=True),
    )

    # ------------------------------------------------------------ regime_stats
    op.create_table(
        "regime_stats",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("regime", sa.String(30), nullable=False, index=True),
        sa.Column("detected_at", sa.DateTime, nullable=False, index=True),
        sa.Column("is_current", sa.Boolean, server_default="false", index=True),

        sa.Column("best_band", sa.String(20), nullable=True),
        sa.Column("best_narrative", sa.String(50), nullable=True),
        sa.Column("avg_win_rate", sa.Float, nullable=True),
        sa.Column("avg_roi", sa.Float, nullable=True),

        sa.Column("avg_price_change_1h", sa.Float, nullable=True),
        sa.Column("price_change_stddev", sa.Float, nullable=True),
        sa.Column("avg_volume", sa.Float, nullable=True),
        sa.Column("avg_liquidity", sa.Float, nullable=True),
        sa.Column("avg_buy_pressure", sa.Float, nullable=True),
        sa.Column("token_count", sa.Integer, nullable=True),

        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    # ---------------------------------------------------- simulation_results
    op.create_table(
        "simulation_results",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("strategy", sa.String(100), unique=True, nullable=False, index=True),

        sa.Column("n_simulations", sa.Integer, server_default="1000"),
        sa.Column("n_trades", sa.Integer, server_default="100"),
        sa.Column("sample_size", sa.Integer, server_default="0"),

        sa.Column("equity_p10", sa.Text, nullable=True),
        sa.Column("equity_p50", sa.Text, nullable=True),
        sa.Column("equity_p90", sa.Text, nullable=True),

        sa.Column("median_final_equity", sa.Float, nullable=True),
        sa.Column("p10_final_equity", sa.Float, nullable=True),
        sa.Column("p90_final_equity", sa.Float, nullable=True),

        sa.Column("max_drawdown_median", sa.Float, nullable=True),
        sa.Column("max_drawdown_worst", sa.Float, nullable=True),

        sa.Column("survival_probability", sa.Float, nullable=True),
        sa.Column("risk_of_ruin", sa.Float, nullable=True),

        sa.Column("computed_at", sa.DateTime, server_default=sa.func.now(), index=True),
    )

    # --------------------------------------------------- feature_importance
    op.create_table(
        "feature_importance",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("feature_name", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("importance_score", sa.Float, server_default="0.0"),
        sa.Column("correlation_with_roi", sa.Float, nullable=True),
        sa.Column("rank", sa.Integer, server_default="0", index=True),
        sa.Column("direction", sa.String(10), nullable=True),
        sa.Column("computed_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("feature_importance")
    op.drop_table("simulation_results")
    op.drop_table("regime_stats")
    op.drop_table("strategy_performance")
    op.drop_table("return_distributions")
    op.drop_table("pattern_performance")
    op.drop_table("signal_outcomes")
