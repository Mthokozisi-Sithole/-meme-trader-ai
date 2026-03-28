from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Signal(Base):
    __tablename__ = "signals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    coin_symbol: Mapped[str] = mapped_column(
        String(50), ForeignKey("coins.symbol", ondelete="CASCADE"), nullable=False, index=True
    )

    # Composite score and component scores (0-100)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=False)
    technical_score: Mapped[float] = mapped_column(Float, nullable=False)
    liquidity_score: Mapped[float] = mapped_column(Float, nullable=False)
    momentum_score: Mapped[float] = mapped_column(Float, nullable=False)

    # Band: "Strong Buy" | "Watch" | "Risky" | "Avoid"
    band: Mapped[str] = mapped_column(String(20), nullable=False)

    # Trade levels
    entry_low: Mapped[float] = mapped_column(Float, nullable=False)
    entry_high: Mapped[float] = mapped_column(Float, nullable=False)
    exit_target: Mapped[float] = mapped_column(Float, nullable=False)
    stop_loss: Mapped[float] = mapped_column(Float, nullable=False)

    # Risk
    risk_level: Mapped[str] = mapped_column(String(10), nullable=False)  # low | medium | high
    risk_flags: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array string

    reasoning: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    coin = relationship("Coin", foreign_keys=[coin_symbol], primaryjoin="Signal.coin_symbol == Coin.symbol")
