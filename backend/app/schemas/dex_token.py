from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DexTokenCreate(BaseModel):
    chain: str
    token_address: str
    pair_address: Optional[str] = None
    symbol: str
    name: Optional[str] = None
    source: str
    dex_id: Optional[str] = None
    image_url: Optional[str] = None
    dexscreener_url: Optional[str] = None

    has_twitter: bool = False
    has_telegram: bool = False
    has_website: bool = False
    is_boosted: bool = False

    price_usd: Optional[float] = None
    price_native: Optional[float] = None
    market_cap: Optional[float] = None
    fdv: Optional[float] = None
    liquidity_usd: Optional[float] = None

    volume_1m: Optional[float] = None
    volume_5m: Optional[float] = None
    volume_1h: Optional[float] = None
    volume_6h: Optional[float] = None
    volume_24h: Optional[float] = None

    buys_1m: Optional[int] = None
    sells_1m: Optional[int] = None
    buys_5m: Optional[int] = None
    sells_5m: Optional[int] = None
    buys_1h: Optional[int] = None
    sells_1h: Optional[int] = None

    price_change_1m: Optional[float] = None
    price_change_5m: Optional[float] = None
    price_change_1h: Optional[float] = None
    price_change_24h: Optional[float] = None

    pair_created_at: Optional[datetime] = None
    token_age_hours: Optional[float] = None

    narrative_category: Optional[str] = None
    narrative_keywords: Optional[str] = None
    hype_velocity: Optional[float] = None

    whale_flags: Optional[str] = None
    large_tx_detected: bool = False

    snipe_score: Optional[float] = None
    narrative_score: Optional[float] = None
    momentum_score: Optional[float] = None
    liquidity_score: Optional[float] = None
    risk_score: Optional[float] = None

    band: Optional[str] = None
    sniping_opportunity: bool = False
    entry_low: Optional[float] = None
    entry_high: Optional[float] = None
    exit_target_1: Optional[float] = None
    exit_target_2: Optional[float] = None
    exit_target_3: Optional[float] = None
    stop_loss: Optional[float] = None
    risk_level: Optional[str] = None
    risk_flags: Optional[str] = None
    warnings: Optional[str] = None
    reasoning: Optional[str] = None


class DexTokenOut(BaseModel):
    id: int
    chain: str
    token_address: str
    pair_address: Optional[str]
    symbol: str
    name: Optional[str]
    source: str
    dex_id: Optional[str]
    image_url: Optional[str]
    dexscreener_url: Optional[str]

    has_twitter: bool
    has_telegram: bool
    has_website: bool
    is_boosted: bool

    price_usd: Optional[float]
    market_cap: Optional[float]
    fdv: Optional[float]
    liquidity_usd: Optional[float]

    volume_1m: Optional[float]
    volume_5m: Optional[float]
    volume_1h: Optional[float]
    volume_24h: Optional[float]

    buys_5m: Optional[int]
    sells_5m: Optional[int]
    buys_1h: Optional[int]
    sells_1h: Optional[int]

    price_change_1m: Optional[float]
    price_change_5m: Optional[float]
    price_change_1h: Optional[float]
    price_change_24h: Optional[float]

    pair_created_at: Optional[datetime]
    token_age_hours: Optional[float]

    narrative_category: Optional[str]
    hype_velocity: Optional[float]

    whale_flags: Optional[str]
    large_tx_detected: bool

    snipe_score: Optional[float]
    narrative_score: Optional[float]
    momentum_score: Optional[float]
    liquidity_score: Optional[float]
    risk_score: Optional[float]

    band: Optional[str]
    sniping_opportunity: bool
    entry_low: Optional[float]
    entry_high: Optional[float]
    exit_target_1: Optional[float]
    exit_target_2: Optional[float]
    exit_target_3: Optional[float]
    stop_loss: Optional[float]
    risk_level: Optional[str]
    risk_flags: Optional[str]
    warnings: Optional[str]
    reasoning: Optional[str]

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SnipeOpportunity(DexTokenOut):
    """A sniping opportunity — same as DexTokenOut but guaranteed sniping_opportunity=True."""
    buy_pressure_pct: Optional[float] = None   # computed field

    @classmethod
    def from_token(cls, token: "DexTokenOut") -> "SnipeOpportunity":
        data = token.model_dump()
        buys = (token.buys_5m or 0)
        total = buys + (token.sells_5m or 0)
        data["buy_pressure_pct"] = round(buys / total * 100, 1) if total > 0 else None
        return cls(**data)
