from typing import Optional, Sequence
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.signal import Signal
from app.schemas.signal import SignalCreate


class SignalRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest(self, limit: int = 50) -> Sequence[Signal]:
        result = await self.db.execute(
            select(Signal).order_by(desc(Signal.created_at)).limit(limit)
        )
        return result.scalars().all()

    async def get_by_coin(self, symbol: str, limit: int = 20) -> Sequence[Signal]:
        result = await self.db.execute(
            select(Signal)
            .where(Signal.coin_symbol == symbol.upper())
            .order_by(desc(Signal.created_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def get_latest_for_coin(self, symbol: str) -> Optional[Signal]:
        result = await self.db.execute(
            select(Signal)
            .where(Signal.coin_symbol == symbol.upper())
            .order_by(desc(Signal.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, data: SignalCreate) -> Signal:
        signal = Signal(**data.model_dump())
        signal.coin_symbol = signal.coin_symbol.upper()
        self.db.add(signal)
        await self.db.commit()
        await self.db.refresh(signal)
        return signal
