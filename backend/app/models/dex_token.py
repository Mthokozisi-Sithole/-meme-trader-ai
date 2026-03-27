from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DexToken(Base):
    __tablename__ = "dex_tokens"
    __table_args__ = (UniqueConstraint("chain", "token_address", name="uq_chain_token"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Identity
    chain: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    token_address: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    pair_address: Mapped[str] = mapped_column(String(100), nullable=True)
    symbol: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)   # dexscreener | pumpfun
    dex_id: Mapped[str] = mapped_column(String(100), nullable=True)   # raydium | pump | uniswap
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    dexscreener_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Socials
    has_twitter: Mapped[bool] = mapped_column(Boolean, default=False)
    has_telegram: Mapped[bool] = mapped_column(Boolean, default=False)
    has_website: Mapped[bool] = mapped_column(Boolean, default=False)
    is_boosted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Price & market
    price_usd: Mapped[float] = mapped_column(Float, nullable=True)
    price_native: Mapped[float] = mapped_column(Float, nullable=True)
    market_cap: Mapped[float] = mapped_column(Float, nullable=True)
    fdv: Mapped[float] = mapped_column(Float, nullable=True)
    liquidity_usd: Mapped[float] = mapped_column(Float, nullable=True)

    # Volume
    volume_1m: Mapped[float] = mapped_column(Float, nullable=True)
    volume_5m: Mapped[float] = mapped_column(Float, nullable=True)
    volume_1h: Mapped[float] = mapped_column(Float, nullable=True)
    volume_6h: Mapped[float] = mapped_column(Float, nullable=True)
    volume_24h: Mapped[float] = mapped_column(Float, nullable=True)

    # Transactions (buy/sell counts)
    buys_1m: Mapped[int] = mapped_column(Integer, nullable=True)
    sells_1m: Mapped[int] = mapped_column(Integer, nullable=True)
    buys_5m: Mapped[int] = mapped_column(Integer, nullable=True)
    sells_5m: Mapped[int] = mapped_column(Integer, nullable=True)
    buys_1h: Mapped[int] = mapped_column(Integer, nullable=True)
    sells_1h: Mapped[int] = mapped_column(Integer, nullable=True)

    # Price changes (%)
    price_change_1m: Mapped[float] = mapped_column(Float, nullable=True)
    price_change_5m: Mapped[float] = mapped_column(Float, nullable=True)
    price_change_1h: Mapped[float] = mapped_column(Float, nullable=True)
    price_change_24h: Mapped[float] = mapped_column(Float, nullable=True)

    # Age
    pair_created_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    token_age_hours: Mapped[float] = mapped_column(Float, nullable=True)

    # Narrative
    narrative_category: Mapped[str] = mapped_column(String(50), nullable=True)
    narrative_keywords: Mapped[str] = mapped_column(Text, nullable=True)  # JSON list
    hype_velocity: Mapped[float] = mapped_column(Float, nullable=True)    # 0-100

    # Whale activity
    whale_flags: Mapped[str] = mapped_column(Text, nullable=True)  # JSON list
    large_tx_detected: Mapped[bool] = mapped_column(Boolean, default=False)

    # Scores
    snipe_score: Mapped[float] = mapped_column(Float, nullable=True)
    narrative_score: Mapped[float] = mapped_column(Float, nullable=True)
    momentum_score: Mapped[float] = mapped_column(Float, nullable=True)
    liquidity_score: Mapped[float] = mapped_column(Float, nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=True)

    # Signal
    band: Mapped[str] = mapped_column(String(20), nullable=True)          # Strong Buy | Watch | Risky | Avoid
    sniping_opportunity: Mapped[bool] = mapped_column(Boolean, default=False)
    entry_low: Mapped[float] = mapped_column(Float, nullable=True)
    entry_high: Mapped[float] = mapped_column(Float, nullable=True)
    exit_target_1: Mapped[float] = mapped_column(Float, nullable=True)
    exit_target_2: Mapped[float] = mapped_column(Float, nullable=True)
    exit_target_3: Mapped[float] = mapped_column(Float, nullable=True)
    stop_loss: Mapped[float] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(10), nullable=True)    # low | medium | high | extreme
    risk_flags: Mapped[str] = mapped_column(Text, nullable=True)           # JSON list
    warnings: Mapped[str] = mapped_column(Text, nullable=True)             # JSON list
    reasoning: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
