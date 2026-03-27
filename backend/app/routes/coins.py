from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.coin_repo import CoinRepository
from app.schemas.coin import CoinCreate, CoinUpdate, CoinOut

router = APIRouter(tags=["coins"])


@router.get("/", response_model=List[CoinOut])
async def list_coins(
    limit: int = Query(250, le=1000),
    offset: int = 0,
    search: Optional[str] = Query(None, description="Filter by symbol or name"),
    db: AsyncSession = Depends(get_db),
):
    repo = CoinRepository(db)
    return await repo.get_all(limit=limit, offset=offset, search=search)


@router.get("/{symbol}", response_model=CoinOut)
async def get_coin(symbol: str, db: AsyncSession = Depends(get_db)):
    repo = CoinRepository(db)
    coin = await repo.get_by_symbol(symbol)
    if not coin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Coin {symbol} not found")
    return coin


@router.post("/", response_model=CoinOut, status_code=status.HTTP_201_CREATED)
async def create_coin(data: CoinCreate, db: AsyncSession = Depends(get_db)):
    repo = CoinRepository(db)
    existing = await repo.get_by_symbol(data.symbol)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Coin already exists")
    return await repo.create(data)


@router.put("/{symbol}", response_model=CoinOut)
async def upsert_coin(symbol: str, data: CoinCreate, db: AsyncSession = Depends(get_db)):
    data.symbol = symbol.upper()
    repo = CoinRepository(db)
    return await repo.upsert(data)


@router.patch("/{symbol}", response_model=CoinOut)
async def update_coin(symbol: str, data: CoinUpdate, db: AsyncSession = Depends(get_db)):
    repo = CoinRepository(db)
    coin = await repo.update(symbol, data)
    if not coin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Coin {symbol} not found")
    return coin
