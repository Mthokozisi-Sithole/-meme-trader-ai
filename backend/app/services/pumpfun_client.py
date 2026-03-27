"""
Pump.fun API client (unofficial public API).
Fetches newly created and trending tokens on pump.fun (Solana).
"""
import logging
from datetime import datetime, timezone
from typing import Any
import httpx

logger = logging.getLogger(__name__)

BASE = "https://frontend-api.pump.fun"


async def fetch_new_coins(limit: int = 50) -> list[dict]:
    """Fetch the most recently created coins on Pump.fun."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{BASE}/coins",
                params={
                    "offset": 0,
                    "limit": limit,
                    "sort": "created_timestamp",
                    "order": "DESC",
                    "includeNsfw": "false",
                },
            )
            r.raise_for_status()
            data = r.json()
    except Exception as exc:
        logger.warning(f"Pump.fun new coins fetch failed: {exc}")
        return []

    if not isinstance(data, list):
        return []

    logger.info(f"Pump.fun: fetched {len(data)} new coins")
    return data


async def fetch_trending_coins(limit: int = 50) -> list[dict]:
    """Fetch coins with most recent trade activity (hot/trending)."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{BASE}/coins",
                params={
                    "offset": 0,
                    "limit": limit,
                    "sort": "last_trade_timestamp",
                    "order": "DESC",
                    "includeNsfw": "false",
                },
            )
            r.raise_for_status()
            data = r.json()
    except Exception as exc:
        logger.warning(f"Pump.fun trending fetch failed: {exc}")
        return []

    if not isinstance(data, list):
        return []

    return data


def parse_coin(coin: dict) -> dict:
    """
    Normalize a Pump.fun coin object into DexTokenCreate-compatible fields.

    Pump.fun tokens live on Solana with a fixed 1B supply (6 decimals).
    Before graduating (migrating to Raydium), liquidity is the bonding curve.
    """
    created_ts = coin.get("created_timestamp")
    pair_created_at = None
    token_age_hours = None
    if created_ts:
        pair_created_at = datetime.fromtimestamp(created_ts / 1000, tz=timezone.utc)
        token_age_hours = (datetime.now(timezone.utc) - pair_created_at).total_seconds() / 3600

    usd_mcap = _safe_float(coin.get("usd_market_cap")) or 0.0
    total_supply = 1_000_000_000.0  # Pump.fun standard

    # Approximate price from market cap
    price_usd = usd_mcap / total_supply if usd_mcap > 0 else None

    # Approximate liquidity from virtual SOL reserves
    # virtual_sol_reserves is in lamports (1 SOL = 1e9 lamports)
    # We don't have live SOL price here — proxy as 30% of market cap
    sol_reserves = _safe_float(coin.get("virtual_sol_reserves"))
    liquidity_usd = (sol_reserves / 1e9 * 150) if sol_reserves else (usd_mcap * 0.30)

    return {
        "chain": "solana",
        "token_address": coin.get("mint", ""),
        "pair_address": coin.get("bonding_curve"),
        "symbol": (coin.get("symbol") or "").upper(),
        "name": coin.get("name"),
        "source": "pumpfun",
        "dex_id": "pump",
        "image_url": coin.get("image_uri"),
        "dexscreener_url": f"https://dexscreener.com/solana/{coin.get('mint', '')}",
        "has_twitter": bool(coin.get("twitter")),
        "has_telegram": bool(coin.get("telegram")),
        "has_website": bool(coin.get("website")),
        "is_boosted": False,
        "price_usd": price_usd,
        "price_native": None,
        "market_cap": usd_mcap,
        "fdv": usd_mcap,
        "liquidity_usd": liquidity_usd,
        # Pump.fun API doesn't expose granular volume/txn data in the listing endpoint
        "volume_1m": None,
        "volume_5m": None,
        "volume_1h": None,
        "volume_6h": None,
        "volume_24h": None,
        "buys_1m": None,
        "sells_1m": None,
        "buys_5m": None,
        "sells_5m": None,
        "buys_1h": None,
        "sells_1h": None,
        "price_change_1m": None,
        "price_change_5m": None,
        "price_change_1h": None,
        "price_change_24h": None,
        "pair_created_at": pair_created_at,
        "token_age_hours": token_age_hours,
    }


def _safe_float(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None
