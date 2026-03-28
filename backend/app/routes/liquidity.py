from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.liquidity_repo import LiquidityRepository
from app.schemas.liquidity_event import LiquidityEventOut

router = APIRouter(tags=["liquidity"])


@router.get("/events", response_model=List[LiquidityEventOut])
async def list_liquidity_events(
    token_address: Optional[str] = None,
    chain: Optional[str] = None,
    is_suspicious: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """
    List liquidity events with optional filters.

    Query params:
      token_address: Filter by token contract address.
      chain:         Filter by chain.
      is_suspicious: If true, return only suspicious events.
      limit:         Max results (default 50, max 500).
    """
    repo = LiquidityRepository(db)

    if token_address is not None:
        events = await repo.get_events_for_token(token_address=token_address, limit=limit)
    elif is_suspicious:
        events = await repo.get_recent_suspicious(limit=limit)
    else:
        events = await repo.get_all(limit=limit)

    # Apply additional filters post-query
    if chain is not None:
        events = [e for e in events if e.chain == chain]
    if is_suspicious is not None and not (token_address is None and is_suspicious):
        events = [e for e in events if e.is_suspicious == is_suspicious]

    return [LiquidityEventOut.model_validate(e) for e in events]


@router.get("/suspicious", response_model=List[LiquidityEventOut])
async def get_suspicious_events(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the most recent suspicious liquidity events from the last 24 hours.
    Sorted by timestamp descending.
    """
    repo = LiquidityRepository(db)
    events = await repo.get_recent_suspicious(limit=limit)
    # Filter to last 24h
    cutoff = datetime.utcnow() - timedelta(hours=24)
    recent = [e for e in events if e.timestamp >= cutoff]
    return [LiquidityEventOut.model_validate(e) for e in recent]


@router.get("/events/{token_address}", response_model=List[LiquidityEventOut])
async def get_events_for_token(
    token_address: str,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Return all liquidity events for a specific token address, newest first."""
    repo = LiquidityRepository(db)
    events = await repo.get_events_for_token(token_address=token_address, limit=limit)
    return [LiquidityEventOut.model_validate(e) for e in events]
