from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class TradeLevel(BaseModel):
    entry_low: float
    entry_high: float
    exit_target: float
    stop_loss: float


class ScoreBreakdown(BaseModel):
    composite: float = Field(..., ge=0, le=100)
    sentiment: float = Field(..., ge=0, le=100)
    technical: float = Field(..., ge=0, le=100)
    liquidity: float = Field(..., ge=0, le=100)
    momentum: float = Field(..., ge=0, le=100)


class SignalCreate(BaseModel):
    coin_symbol: str
    score: float
    sentiment_score: float
    technical_score: float
    liquidity_score: float
    momentum_score: float
    band: str
    entry_low: float
    entry_high: float
    exit_target: float
    stop_loss: float
    risk_level: str
    risk_flags: Optional[str] = None
    reasoning: str


class SignalOut(BaseModel):
    id: int
    coin_symbol: str
    score: float
    band: str
    score_breakdown: ScoreBreakdown
    trade_levels: TradeLevel
    risk_level: str
    risk_flags: List[str]
    reasoning: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, signal: object) -> "SignalOut":
        import json
        flags = []
        if hasattr(signal, "risk_flags") and signal.risk_flags:  # type: ignore[union-attr]
            try:
                flags = json.loads(signal.risk_flags)  # type: ignore[union-attr]
            except Exception:
                flags = [signal.risk_flags]  # type: ignore[union-attr]
        return cls(
            id=signal.id,  # type: ignore[union-attr]
            coin_symbol=signal.coin_symbol,  # type: ignore[union-attr]
            score=signal.score,  # type: ignore[union-attr]
            band=signal.band,  # type: ignore[union-attr]
            score_breakdown=ScoreBreakdown(
                composite=signal.score,  # type: ignore[union-attr]
                sentiment=signal.sentiment_score,  # type: ignore[union-attr]
                technical=signal.technical_score,  # type: ignore[union-attr]
                liquidity=signal.liquidity_score,  # type: ignore[union-attr]
                momentum=signal.momentum_score,  # type: ignore[union-attr]
            ),
            trade_levels=TradeLevel(
                entry_low=signal.entry_low,  # type: ignore[union-attr]
                entry_high=signal.entry_high,  # type: ignore[union-attr]
                exit_target=signal.exit_target,  # type: ignore[union-attr]
                stop_loss=signal.stop_loss,  # type: ignore[union-attr]
            ),
            risk_level=signal.risk_level,  # type: ignore[union-attr]
            risk_flags=flags,
            reasoning=signal.reasoning,  # type: ignore[union-attr]
            created_at=signal.created_at,  # type: ignore[union-attr]
        )
