"""Add dex_tokens table for DEX/Pump.fun token tracking

Revision ID: 003
Revises: 002
Create Date: 2026-03-27
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dex_tokens",
        sa.Column("id", sa.Integer, primary_key=True, index=True),

        # Identity
        sa.Column("chain", sa.String(50), nullable=False, index=True),
        sa.Column("token_address", sa.String(100), nullable=False, index=True),
        sa.Column("pair_address", sa.String(100), nullable=True),
        sa.Column("symbol", sa.String(50), nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=True),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("dex_id", sa.String(100), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("dexscreener_url", sa.String(500), nullable=True),

        # Socials
        sa.Column("has_twitter", sa.Boolean, default=False),
        sa.Column("has_telegram", sa.Boolean, default=False),
        sa.Column("has_website", sa.Boolean, default=False),
        sa.Column("is_boosted", sa.Boolean, default=False),

        # Price & market
        sa.Column("price_usd", sa.Float, nullable=True),
        sa.Column("price_native", sa.Float, nullable=True),
        sa.Column("market_cap", sa.Float, nullable=True),
        sa.Column("fdv", sa.Float, nullable=True),
        sa.Column("liquidity_usd", sa.Float, nullable=True),

        # Volume
        sa.Column("volume_1m", sa.Float, nullable=True),
        sa.Column("volume_5m", sa.Float, nullable=True),
        sa.Column("volume_1h", sa.Float, nullable=True),
        sa.Column("volume_6h", sa.Float, nullable=True),
        sa.Column("volume_24h", sa.Float, nullable=True),

        # Transactions
        sa.Column("buys_1m", sa.Integer, nullable=True),
        sa.Column("sells_1m", sa.Integer, nullable=True),
        sa.Column("buys_5m", sa.Integer, nullable=True),
        sa.Column("sells_5m", sa.Integer, nullable=True),
        sa.Column("buys_1h", sa.Integer, nullable=True),
        sa.Column("sells_1h", sa.Integer, nullable=True),

        # Price changes
        sa.Column("price_change_1m", sa.Float, nullable=True),
        sa.Column("price_change_5m", sa.Float, nullable=True),
        sa.Column("price_change_1h", sa.Float, nullable=True),
        sa.Column("price_change_24h", sa.Float, nullable=True),

        # Age
        sa.Column("pair_created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("token_age_hours", sa.Float, nullable=True),

        # Narrative
        sa.Column("narrative_category", sa.String(50), nullable=True),
        sa.Column("narrative_keywords", sa.Text, nullable=True),
        sa.Column("hype_velocity", sa.Float, nullable=True),

        # Whale
        sa.Column("whale_flags", sa.Text, nullable=True),
        sa.Column("large_tx_detected", sa.Boolean, default=False),

        # Scores
        sa.Column("snipe_score", sa.Float, nullable=True, index=True),
        sa.Column("narrative_score", sa.Float, nullable=True),
        sa.Column("momentum_score", sa.Float, nullable=True),
        sa.Column("liquidity_score", sa.Float, nullable=True),
        sa.Column("risk_score", sa.Float, nullable=True),

        # Signal
        sa.Column("band", sa.String(20), nullable=True),
        sa.Column("sniping_opportunity", sa.Boolean, default=False, index=True),
        sa.Column("entry_low", sa.Float, nullable=True),
        sa.Column("entry_high", sa.Float, nullable=True),
        sa.Column("exit_target_1", sa.Float, nullable=True),
        sa.Column("exit_target_2", sa.Float, nullable=True),
        sa.Column("exit_target_3", sa.Float, nullable=True),
        sa.Column("stop_loss", sa.Float, nullable=True),
        sa.Column("risk_level", sa.String(10), nullable=True),
        sa.Column("risk_flags", sa.Text, nullable=True),
        sa.Column("warnings", sa.Text, nullable=True),
        sa.Column("reasoning", sa.Text, nullable=True),

        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),

        sa.UniqueConstraint("chain", "token_address", name="uq_chain_token"),
    )


def downgrade() -> None:
    op.drop_table("dex_tokens")
