"""
GMGN.ai client — smart money & whale tracking for Solana.
Public API — no auth required.
Docs: https://gmgn.ai (unofficial public endpoints)

Provides:
- Top Solana tokens ranked by swap activity
- Smart money wallet signals
- Hot tokens with real buy pressure
"""
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

BASE = "https://gmgn.ai/defi/quotation/v1"

# Timeframes GMGN supports
TIMEFRAMES = ["5m", "1h", "6h", "24h"]


async def _get(client: httpx.AsyncClient, path: str, **params: Any) -> dict | None:
    try:
        r = await client.get(
            f"{BASE}{path}",
            params=params,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; MemeTraderAI/1.0)",
                "Accept": "application/json",
                "Referer": "https://gmgn.ai/",
            },
            timeout=15,
        )
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        logger.warning(f"GMGN {path} failed: {exc}")
        return None


async def fetch_hot_tokens(timeframe: str = "1h", limit: int = 50) -> list[dict]:
    """
    Fetch hot Solana tokens ranked by swap count in the given timeframe.
    timeframe: "5m", "1h", "6h", "24h"
    """
    tf = timeframe if timeframe in TIMEFRAMES else "1h"
    async with httpx.AsyncClient(timeout=20) as client:
        data = await _get(
            client,
            f"/rank/sol/swaps/{tf}",
            orderby="swaps",
            direction="desc",
            limit=limit,
        )

    if not data or data.get("code") != 0:
        return []

    items = data.get("data", {}).get("rank", []) or []
    return [_parse_token(item, tf) for item in items if item.get("address")]


async def fetch_new_tokens(limit: int = 50) -> list[dict]:
    """
    Fetch newly created Solana tokens from GMGN.
    """
    async with httpx.AsyncClient(timeout=20) as client:
        data = await _get(
            client,
            "/rank/sol/swaps/1h",
            limit=limit,
            orderby="open_timestamp",
            direction="desc",
        )

    if not data or data.get("code") != 0:
        return []

    items = data.get("data", {}).get("rank", []) or []
    return [_parse_token(item, "new") for item in items if item.get("address")]


async def fetch_smart_money_tokens(limit: int = 30) -> list[dict]:
    """
    Fetch tokens that smart money wallets are currently buying.
    """
    async with httpx.AsyncClient(timeout=20) as client:
        data = await _get(
            client,
            "/rank/sol/swaps/1h",
            orderby="buys",
            direction="desc",
            limit=limit,
            filters=["not_honeypot", "pump"],
        )

    if not data or data.get("code") != 0:
        return []

    items = data.get("data", {}).get("rank", []) or []
    return [_parse_token(item, "1h") for item in items if item.get("address")]


async def run_pipeline() -> list[dict]:
    """
    Run full GMGN pipeline: hot tokens (1h + 5m) + new tokens.
    No API key required.
    """
    import asyncio

    hot_1h, hot_5m, new_tokens = await asyncio.gather(
        fetch_hot_tokens(timeframe="1h", limit=50),
        fetch_hot_tokens(timeframe="5m", limit=30),
        fetch_new_tokens(limit=30),
        return_exceptions=True,
    )

    results: list[dict] = []
    seen: set[str] = set()

    for batch in [hot_5m, hot_1h, new_tokens]:  # 5m first = freshest alpha
        if isinstance(batch, Exception) or not isinstance(batch, list):
            continue
        for item in batch:
            addr = item.get("token_address", "")
            if addr and addr not in seen:
                seen.add(addr)
                results.append(item)

    logger.info(f"GMGN pipeline: {len(results)} Solana hot tokens")
    return results


def _parse_token(item: dict, timeframe: str) -> dict:
    """Normalize GMGN token data to DexTokenCreate-compatible format."""
    address = item.get("address", "")
    symbol = (item.get("symbol") or "").strip().upper()
    name = item.get("name") or symbol

    price = _safe_float(item.get("price")) or _safe_float(item.get("price_usd"))
    mc = _safe_float(item.get("market_cap")) or _safe_float(item.get("usd_market_cap"))
    liquidity = _safe_float(item.get("liquidity"))
    v24h = _safe_float(item.get("volume_24h"))
    v1h = _safe_float(item.get("volume_1h"))
    v5m = _safe_float(item.get("volume_5m"))

    buys_1h = _safe_int(item.get("buys_1h")) or _safe_int(item.get("buys"))
    sells_1h = _safe_int(item.get("sells_1h")) or _safe_int(item.get("sells"))
    buys_5m = _safe_int(item.get("buys_5m"))
    sells_5m = _safe_int(item.get("sells_5m"))

    pc1h = _safe_float(item.get("price_change_percent1h"))
    pc5m = _safe_float(item.get("price_change_percent5m"))
    pc24h = _safe_float(item.get("price_change_percent24h"))

    # Token age
    open_ts = item.get("open_timestamp")
    token_age_hours = None
    if open_ts:
        from datetime import datetime, timezone
        try:
            created = datetime.fromtimestamp(float(open_ts), tz=timezone.utc)
            token_age_hours = (datetime.now(timezone.utc) - created).total_seconds() / 3600
        except Exception:
            pass

    # Whale/smart money flags from GMGN
    is_smart_money = bool(item.get("smart_buy_24h")) or bool(item.get("sniper_count"))
    has_large_tx = is_smart_money or (buys_1h or 0) > 100

    return {
        "source": "gmgn",
        "chain": "solana",
        "token_address": address,
        "pair_address": item.get("pool_address"),
        "symbol": symbol,
        "name": name,
        "dex_id": item.get("dex", "gmgn"),
        "image_url": item.get("logo"),
        "dexscreener_url": None,
        "has_twitter": bool(item.get("twitter")),
        "has_telegram": bool(item.get("telegram")),
        "has_website": bool(item.get("website")),
        "is_boosted": False,
        "price_usd": price,
        "price_native": None,
        "market_cap": mc,
        "fdv": mc,
        "liquidity_usd": liquidity,
        "volume_24h": v24h,
        "volume_1h": v1h,
        "volume_5m": v5m,
        "volume_6h": None,
        "volume_1m": None,
        "buys_5m": buys_5m,
        "sells_5m": sells_5m,
        "buys_1h": buys_1h,
        "sells_1h": sells_1h,
        "price_change_24h": pc24h,
        "price_change_1h": pc1h,
        "price_change_5m": pc5m,
        "price_change_1m": None,
        "token_age_hours": token_age_hours,
        # Extra GMGN signals passed through for scoring
        "large_tx_detected": has_large_tx,
    }


def _safe_float(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def _safe_int(v: Any) -> int | None:
    try:
        return int(v) if v is not None else None
    except (TypeError, ValueError):
        return None
