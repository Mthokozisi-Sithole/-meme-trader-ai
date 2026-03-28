from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.dex_token_repo import DexTokenRepository
from app.schemas.dex_token import DexTokenOut, SnipeOpportunity

router = APIRouter(tags=["snipes"])


@router.get("", response_model=List[SnipeOpportunity])
async def list_snipe_opportunities(
    limit: int = Query(50, le=200),
    max_age_hours: float = Query(48, description="Only show snipes younger than N hours"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns active sniping opportunities ranked by composite score (highest first).
    Only tokens updated within the last worker cycle are included.
    """
    repo = DexTokenRepository(db)
    tokens = await repo.get_snipe_opportunities(limit=limit, max_age_hours=max_age_hours)
    return [SnipeOpportunity.from_token(DexTokenOut.model_validate(t)) for t in tokens]


@router.get("/tokens", response_model=List[DexTokenOut])
async def list_dex_tokens(
    limit: int = Query(100, le=500),
    offset: int = 0,
    chain: Optional[str] = None,
    snipe_only: bool = False,
    min_score: Optional[float] = Query(None, ge=0, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """All tracked DEX tokens with optional filters."""
    repo = DexTokenRepository(db)
    tokens = await repo.get_all(
        limit=limit,
        offset=offset,
        chain=chain,
        snipe_only=snipe_only,
        min_score=min_score,
        search=search,
    )
    return [DexTokenOut.model_validate(t) for t in tokens]
