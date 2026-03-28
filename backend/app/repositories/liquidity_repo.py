from datetime import datetime
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.models.liquidity_event import LiquidityEvent
from app.schemas.liquidity_event import LiquidityEventCreate


class LiquidityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add_event(self, data: LiquidityEventCreate) -> LiquidityEvent:
        """Insert a new liquidity event record."""
        values = data.model_dump()
        # Strip timezone info from datetime fields — DB column is TIMESTAMP WITHOUT TIME ZONE
        for key, val in values.items():
            if isinstance(val, datetime) and val.tzinfo is not None:
                values[key] = val.replace(tzinfo=None)

        stmt = (
            insert(LiquidityEvent)
            .values(**values)
            .returning(LiquidityEvent)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.scalar_one()

    async def get_all(self, limit: int = 50) -> Sequence[LiquidityEvent]:
        q = (
            select(LiquidityEvent)
            .order_by(LiquidityEvent.timestamp.desc())
            .limit(limit)
        )
        result = await self.db.execute(q)
        return result.scalars().all()

    async def get_events_for_token(
        self, token_address: str, limit: int = 50
    ) -> Sequence[LiquidityEvent]:
        q = (
            select(LiquidityEvent)
            .where(LiquidityEvent.token_address == token_address)
            .order_by(LiquidityEvent.timestamp.desc())
            .limit(limit)
        )
        result = await self.db.execute(q)
        return result.scalars().all()

    async def get_recent_suspicious(self, limit: int = 20) -> Sequence[LiquidityEvent]:
        q = (
            select(LiquidityEvent)
            .where(LiquidityEvent.is_suspicious == True)  # noqa: E712
            .order_by(LiquidityEvent.timestamp.desc())
            .limit(limit)
        )
        result = await self.db.execute(q)
        return result.scalars().all()
