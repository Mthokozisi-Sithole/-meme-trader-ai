from typing import Sequence
from sqlalchemy import select, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert


class AlertRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, unread_only: bool = False, limit: int = 100) -> Sequence[Alert]:
        q = select(Alert).order_by(desc(Alert.created_at)).limit(limit)
        if unread_only:
            q = q.where(Alert.is_read == False)  # noqa: E712
        result = await self.db.execute(q)
        return result.scalars().all()

    async def get_by_coin(self, symbol: str) -> Sequence[Alert]:
        result = await self.db.execute(
            select(Alert)
            .where(Alert.coin_symbol == symbol.upper())
            .order_by(desc(Alert.created_at))
        )
        return result.scalars().all()

    async def create(self, coin_symbol: str, alert_type: str, message: str, severity: str) -> Alert:
        alert = Alert(
            coin_symbol=coin_symbol.upper(),
            alert_type=alert_type,
            message=message,
            severity=severity,
        )
        self.db.add(alert)
        await self.db.commit()
        await self.db.refresh(alert)
        return alert

    async def mark_read(self, alert_id: int) -> None:
        await self.db.execute(update(Alert).where(Alert.id == alert_id).values(is_read=True))
        await self.db.commit()
