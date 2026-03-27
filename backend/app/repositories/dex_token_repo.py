from typing import Optional, Sequence
from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.models.dex_token import DexToken
from app.schemas.dex_token import DexTokenCreate


class DexTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        chain: Optional[str] = None,
        snipe_only: bool = False,
        min_score: Optional[float] = None,
        search: Optional[str] = None,
    ) -> Sequence[DexToken]:
        q = select(DexToken)

        if chain:
            q = q.where(DexToken.chain == chain)
        if snipe_only:
            q = q.where(DexToken.sniping_opportunity == True)  # noqa: E712
        if min_score is not None:
            q = q.where(DexToken.snipe_score >= min_score)
        if search:
            term = f"%{search}%"
            q = q.where(DexToken.symbol.ilike(term) | DexToken.name.ilike(term))

        q = q.order_by(DexToken.snipe_score.desc().nullslast())
        result = await self.db.execute(q.offset(offset).limit(limit))
        return result.scalars().all()

    async def get_by_address(self, chain: str, token_address: str) -> Optional[DexToken]:
        result = await self.db.execute(
            select(DexToken).where(
                and_(DexToken.chain == chain, DexToken.token_address == token_address)
            )
        )
        return result.scalar_one_or_none()

    async def upsert(self, data: DexTokenCreate) -> DexToken:
        """Insert or update a token record (upsert on chain + token_address)."""
        values = data.model_dump()

        stmt = (
            insert(DexToken)
            .values(**values)
            .on_conflict_do_update(
                constraint="uq_chain_token",
                set_={k: v for k, v in values.items() if k not in ("chain", "token_address")},
            )
            .returning(DexToken)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        row = result.scalar_one()
        return row

    async def get_snipe_opportunities(
        self, limit: int = 50, max_age_hours: float = 48
    ) -> Sequence[DexToken]:
        from datetime import datetime, timezone, timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)

        q = (
            select(DexToken)
            .where(DexToken.sniping_opportunity == True)  # noqa: E712
            .where(DexToken.updated_at >= cutoff)
            .order_by(DexToken.snipe_score.desc())
        )
        result = await self.db.execute(q.limit(limit))
        return result.scalars().all()
