from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.coin_repo import CoinRepository
from app.repositories.signal_repo import SignalRepository
from app.schemas.signal import SignalOut
from app.services.signal_service import SignalContext, generate_signal

router = APIRouter(tags=["signals"])


@router.get("/", response_model=List[SignalOut])
async def list_signals(limit: int = 50, db: AsyncSession = Depends(get_db)):
    repo = SignalRepository(db)
    signals = await repo.get_latest(limit=limit)
    return [SignalOut.from_orm_model(s) for s in signals]


@router.get("/{symbol}", response_model=List[SignalOut])
async def get_signals_for_coin(symbol: str, limit: int = 20, db: AsyncSession = Depends(get_db)):
    repo = SignalRepository(db)
    signals = await repo.get_by_coin(symbol, limit=limit)
    return [SignalOut.from_orm_model(s) for s in signals]


@router.post("/{symbol}/generate", response_model=SignalOut, status_code=status.HTTP_201_CREATED)
async def generate_signal_for_coin(symbol: str, db: AsyncSession = Depends(get_db)):
    """Generate and persist a new signal for the given coin."""
    coin_repo = CoinRepository(db)
    coin = await coin_repo.get_by_symbol(symbol)
    if not coin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Coin {symbol} not found")

    signal_data = generate_signal(SignalContext(coin=coin))
    signal_repo = SignalRepository(db)
    saved = await signal_repo.create(signal_data)
    return SignalOut.from_orm_model(saved)
