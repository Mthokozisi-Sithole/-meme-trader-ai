from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.alert_repo import AlertRepository
from app.schemas.alert import AlertOut

router = APIRouter(tags=["alerts"])


@router.get("/", response_model=List[AlertOut])
async def list_alerts(
    unread_only: bool = False,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    repo = AlertRepository(db)
    return await repo.get_all(unread_only=unread_only, limit=limit)


@router.get("/coin/{symbol}", response_model=List[AlertOut])
async def get_coin_alerts(symbol: str, db: AsyncSession = Depends(get_db)):
    repo = AlertRepository(db)
    return await repo.get_by_coin(symbol)


@router.patch("/{alert_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_alert_read(alert_id: int, db: AsyncSession = Depends(get_db)):
    repo = AlertRepository(db)
    await repo.mark_read(alert_id)
