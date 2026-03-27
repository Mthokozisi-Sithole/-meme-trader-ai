"""Initial schema: coins, signals, alerts

Revision ID: 001
Revises:
Create Date: 2026-03-27
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "coins",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("symbol", sa.String(20), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("price_usd", sa.Float, nullable=False, server_default="0"),
        sa.Column("market_cap_usd", sa.Float, nullable=True),
        sa.Column("volume_24h_usd", sa.Float, nullable=True),
        sa.Column("liquidity_usd", sa.Float, nullable=True),
        sa.Column("holders", sa.Integer, nullable=True),
        sa.Column("whale_concentration", sa.Float, nullable=True),
        sa.Column("price_change_24h", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        "signals",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("coin_symbol", sa.String(20), sa.ForeignKey("coins.symbol", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("score", sa.Float, nullable=False),
        sa.Column("sentiment_score", sa.Float, nullable=False),
        sa.Column("technical_score", sa.Float, nullable=False),
        sa.Column("liquidity_score", sa.Float, nullable=False),
        sa.Column("momentum_score", sa.Float, nullable=False),
        sa.Column("band", sa.String(20), nullable=False),
        sa.Column("entry_low", sa.Float, nullable=False),
        sa.Column("entry_high", sa.Float, nullable=False),
        sa.Column("exit_target", sa.Float, nullable=False),
        sa.Column("stop_loss", sa.Float, nullable=False),
        sa.Column("risk_level", sa.String(10), nullable=False),
        sa.Column("risk_flags", sa.Text, nullable=True),
        sa.Column("reasoning", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), index=True),
    )

    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("coin_symbol", sa.String(20), sa.ForeignKey("coins.symbol", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("alert_type", sa.String(50), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("severity", sa.String(10), nullable=False),
        sa.Column("is_read", sa.Boolean, default=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), index=True),
    )


def downgrade() -> None:
    op.drop_table("alerts")
    op.drop_table("signals")
    op.drop_table("coins")
