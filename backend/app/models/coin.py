from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Coin(Base):
    __tablename__ = "coins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    coingecko_id: Mapped[str] = mapped_column(String(100), nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Price & market
    price_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    market_cap_usd: Mapped[float] = mapped_column(Float, nullable=True)
    market_cap_rank: Mapped[int] = mapped_column(Integer, nullable=True)
    volume_24h_usd: Mapped[float] = mapped_column(Float, nullable=True)
    liquidity_usd: Mapped[float] = mapped_column(Float, nullable=True)
    high_24h: Mapped[float] = mapped_column(Float, nullable=True)
    low_24h: Mapped[float] = mapped_column(Float, nullable=True)

    # Price changes
    price_change_24h: Mapped[float] = mapped_column(Float, nullable=True)
    price_change_7d: Mapped[float] = mapped_column(Float, nullable=True)

    # All-time
    ath: Mapped[float] = mapped_column(Float, nullable=True)
    ath_change_percentage: Mapped[float] = mapped_column(Float, nullable=True)
    atl: Mapped[float] = mapped_column(Float, nullable=True)
    atl_change_percentage: Mapped[float] = mapped_column(Float, nullable=True)

    # Supply
    circulating_supply: Mapped[float] = mapped_column(Float, nullable=True)
    total_supply: Mapped[float] = mapped_column(Float, nullable=True)

    # On-chain (not from CoinGecko — filled by other sources or manual)
    holders: Mapped[int] = mapped_column(Integer, nullable=True)
    whale_concentration: Mapped[float] = mapped_column(Float, nullable=True)  # 0.0-1.0

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
