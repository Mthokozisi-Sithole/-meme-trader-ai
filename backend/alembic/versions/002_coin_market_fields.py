"""Add rich market fields to coins

Revision ID: 002
Revises: 001
Create Date: 2026-03-27
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("coins", sa.Column("coingecko_id", sa.String(100), nullable=True))
    op.add_column("coins", sa.Column("image_url", sa.String(500), nullable=True))
    op.add_column("coins", sa.Column("market_cap_rank", sa.Integer, nullable=True))
    op.add_column("coins", sa.Column("high_24h", sa.Float, nullable=True))
    op.add_column("coins", sa.Column("low_24h", sa.Float, nullable=True))
    op.add_column("coins", sa.Column("price_change_7d", sa.Float, nullable=True))
    op.add_column("coins", sa.Column("ath", sa.Float, nullable=True))
    op.add_column("coins", sa.Column("ath_change_percentage", sa.Float, nullable=True))
    op.add_column("coins", sa.Column("atl", sa.Float, nullable=True))
    op.add_column("coins", sa.Column("atl_change_percentage", sa.Float, nullable=True))
    op.add_column("coins", sa.Column("circulating_supply", sa.Float, nullable=True))
    op.add_column("coins", sa.Column("total_supply", sa.Float, nullable=True))


def downgrade() -> None:
    for col in [
        "coingecko_id", "image_url", "market_cap_rank",
        "high_24h", "low_24h", "price_change_7d",
        "ath", "ath_change_percentage", "atl", "atl_change_percentage",
        "circulating_supply", "total_supply",
    ]:
        op.drop_column("coins", col)
