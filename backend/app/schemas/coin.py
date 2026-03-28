from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CoinBase(BaseModel):
    symbol: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    coingecko_id: Optional[str] = None
    image_url: Optional[str] = None

    price_usd: float = Field(..., ge=0)
    market_cap_usd: Optional[float] = None
    market_cap_rank: Optional[int] = None
    volume_24h_usd: Optional[float] = None
    liquidity_usd: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None

    price_change_24h: Optional[float] = None
    price_change_7d: Optional[float] = None

    ath: Optional[float] = None
    ath_change_percentage: Optional[float] = None
    atl: Optional[float] = None
    atl_change_percentage: Optional[float] = None

    circulating_supply: Optional[float] = None
    total_supply: Optional[float] = None

    holders: Optional[int] = None
    whale_concentration: Optional[float] = Field(None, ge=0, le=1)


class CoinCreate(CoinBase):
    pass


class CoinUpdate(BaseModel):
    price_usd: Optional[float] = Field(None, ge=0)
    market_cap_usd: Optional[float] = None
    market_cap_rank: Optional[int] = None
    volume_24h_usd: Optional[float] = None
    liquidity_usd: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    price_change_24h: Optional[float] = None
    price_change_7d: Optional[float] = None
    ath: Optional[float] = None
    ath_change_percentage: Optional[float] = None
    atl: Optional[float] = None
    atl_change_percentage: Optional[float] = None
    circulating_supply: Optional[float] = None
    total_supply: Optional[float] = None
    holders: Optional[int] = None
    whale_concentration: Optional[float] = Field(None, ge=0, le=1)


class CoinOut(CoinBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
