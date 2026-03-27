from typing import Optional, Sequence
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coin import Coin
from app.schemas.coin import CoinCreate, CoinUpdate


class CoinRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        limit: int = 250,
        offset: int = 0,
        search: Optional[str] = None,
    ) -> Sequence[Coin]:
        q = select(Coin)
        if search:
            term = f"%{search}%"
            q = q.where(
                Coin.symbol.ilike(term) | Coin.name.ilike(term)
            )
        # Order by market cap rank ascending; NULLs land last in Postgres ASC
        q = q.order_by(Coin.market_cap_rank.asc())
        result = await self.db.execute(q.offset(offset).limit(limit))
        return result.scalars().all()

    async def get_by_symbol(self, symbol: str) -> Optional[Coin]:
        result = await self.db.execute(select(Coin).where(Coin.symbol == symbol.upper()))
        return result.scalar_one_or_none()

    async def create(self, data: CoinCreate) -> Coin:
        coin = Coin(**data.model_dump())
        coin.symbol = coin.symbol.upper()
        self.db.add(coin)
        await self.db.commit()
        await self.db.refresh(coin)
        return coin

    async def upsert(self, data: CoinCreate) -> Coin:
        existing = await self.get_by_symbol(data.symbol)
        if existing:
            update_data = data.model_dump(exclude={"symbol", "name"})
            await self.db.execute(
                update(Coin).where(Coin.symbol == data.symbol.upper()).values(**update_data)
            )
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        return await self.create(data)

    async def update(self, symbol: str, data: CoinUpdate) -> Optional[Coin]:
        coin = await self.get_by_symbol(symbol)
        if not coin:
            return None
        patch = data.model_dump(exclude_none=True)
        await self.db.execute(update(Coin).where(Coin.symbol == symbol.upper()).values(**patch))
        await self.db.commit()
        await self.db.refresh(coin)
        return coin
