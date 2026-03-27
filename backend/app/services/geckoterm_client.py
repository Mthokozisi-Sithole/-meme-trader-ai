"""
GeckoTerminal API client — free real-time DEX pool data by CoinGecko.
Docs: https://www.geckoterminal.com/dex-api
No auth required. Rate limit: ~30 req/min free tier.
"""
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

BASE = "https://api.geckoterminal.com/api/v2"
HEADERS = {"Accept": "application/json;version=20230302"}

# Networks we track
TARGET_NETWORKS = ["solana", "eth", "bsc", "base"]
NETWORK_DISPLAY = {"solana": "SOL", "eth": "ETH", "bsc": "BSC", "base": "BASE"}

# Map GeckoTerminal network IDs → our chain names
NETWORK_MAP = {"solana": "solana", "eth": "ethereum", "bsc": "bsc", "base": "base"}


async def _get(client: httpx.AsyncClient, path: str, **params: Any) -> dict | None:
    try:
        r = await client.get(f"{BASE}{path}", params=params, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        logger.warning(f"GeckoTerminal {path} failed: {exc}")
        return None


async def fetch_trending_pools(limit: int = 20) -> list[dict]:
    """Fetch trending pools across all networks (cross-chain real-time)."""
    async with httpx.AsyncClient() as client:
        data = await _get(client, "/networks/trending_pools", include="base_token,quote_token")
    if not data or "data" not in data:
        return []
    return [_parse_pool(p) for p in data["data"][:limit] if p]


async def fetch_new_pools(network: str = "solana", limit: int = 20) -> list[dict]:
    """Fetch newly created pools for a specific network."""
    async with httpx.AsyncClient() as client:
        data = await _get(
            client,
            f"/networks/{network}/new_pools",
            include="base_token,quote_token",
        )
    if not data or "data" not in data:
        return []
    return [_parse_pool(p, network) for p in data["data"][:limit] if p]


async def fetch_all_new_pools() -> list[dict]:
    """Fetch new pools across all target networks sequentially to avoid rate limits."""
    import asyncio

    results = []
    async with httpx.AsyncClient() as client:
        for i, net in enumerate(TARGET_NETWORKS):
            if i > 0:
                await asyncio.sleep(1.5)  # ~30 req/min free tier — stay well under
            resp = await _get(client, f"/networks/{net}/new_pools", include="base_token,quote_token")
            if not resp or "data" not in resp:
                continue
            for pool in resp["data"][:10]:
                parsed = _parse_pool(pool, net)
                if parsed:
                    results.append(parsed)

    logger.info(f"GeckoTerminal new pools: {len(results)} across {len(TARGET_NETWORKS)} networks")
    return results


async def fetch_top_pools_by_network(network: str, limit: int = 10) -> list[dict]:
    """Fetch top pools by 24h volume for a network."""
    async with httpx.AsyncClient() as client:
        data = await _get(
            client,
            f"/networks/{network}/pools",
            include="base_token",
            sort="h24_volume_usd_desc",
        )
    if not data or "data" not in data:
        return []
    return [_parse_pool(p, network) for p in data["data"][:limit] if p]


async def fetch_token_price(network: str, address: str) -> dict | None:
    """Get real-time price for a specific token."""
    async with httpx.AsyncClient() as client:
        data = await _get(client, f"/simple/networks/{network}/token_price/{address}")
    if not data or "data" not in data:
        return None
    attrs = data["data"].get("attributes", {})
    prices = attrs.get("token_prices", {})
    price = prices.get(address.lower())
    return {"address": address, "network": network, "price_usd": float(price) if price else None}


def _parse_pool(pool: dict, network: str | None = None) -> dict | None:
    """Normalize a GeckoTerminal pool object."""
    try:
        attrs = pool.get("attributes", {})
        rel = pool.get("relationships", {})

        # Get chain from pool data or parameter
        chain_raw = (
            attrs.get("network", {}).get("id")
            or pool.get("id", "").split("_")[0]
            or network
            or "unknown"
        )
        chain = NETWORK_MAP.get(chain_raw, chain_raw)

        base_token_data = rel.get("base_token", {}).get("data", {})

        # Price changes
        price_change = attrs.get("price_change_percentage", {}) or {}
        volume = attrs.get("volume_usd", {}) or {}
        transactions = attrs.get("transactions", {}) or {}
        tx_5m = transactions.get("m5", {}) or {}
        tx_1h = transactions.get("h1", {}) or {}

        reserve_usd = _safe_float(attrs.get("reserve_in_usd"))
        price_usd = _safe_float(attrs.get("base_token_price_usd"))
        fdv = _safe_float(attrs.get("fully_diluted_valuation"))
        market_cap = _safe_float(attrs.get("market_cap_usd")) or fdv

        created_at = attrs.get("pool_created_at")
        token_age_hours = None
        if created_at:
            from datetime import datetime, timezone
            try:
                created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                token_age_hours = (datetime.now(timezone.utc) - created_dt).total_seconds() / 3600
            except Exception:
                pass

        # Symbol from name like "TOKEN/WSOL"
        name_raw = attrs.get("name", "")
        symbol = name_raw.split("/")[0].strip().upper() if "/" in name_raw else name_raw[:20].upper()

        buys_5m = _safe_int(tx_5m.get("buys"))
        sells_5m = _safe_int(tx_5m.get("sells"))
        buys_1h = _safe_int(tx_1h.get("buys"))
        sells_1h = _safe_int(tx_1h.get("sells"))

        total_5m = (buys_5m or 0) + (sells_5m or 0)
        buy_pressure = round((buys_5m / total_5m * 100) if total_5m > 0 and buys_5m else 0, 1)

        return {
            "source": "geckoterminal",
            "chain": chain,
            "pool_address": attrs.get("address", ""),
            "token_address": base_token_data.get("id", "").split("_")[-1] if base_token_data else "",
            "symbol": symbol,
            "name": name_raw,
            "price_usd": price_usd,
            "market_cap": market_cap,
            "fdv": fdv,
            "liquidity_usd": reserve_usd,
            "volume_5m": _safe_float(volume.get("m5")),
            "volume_1h": _safe_float(volume.get("h1")),
            "volume_6h": _safe_float(volume.get("h6")),
            "volume_24h": _safe_float(volume.get("h24")),
            "buys_5m": buys_5m,
            "sells_5m": sells_5m,
            "buys_1h": buys_1h,
            "sells_1h": sells_1h,
            "price_change_5m": _safe_float(price_change.get("m5")),
            "price_change_1h": _safe_float(price_change.get("h1")),
            "price_change_6h": _safe_float(price_change.get("h6")),
            "price_change_24h": _safe_float(price_change.get("h24")),
            "token_age_hours": token_age_hours,
            "created_at_iso": created_at,
            "buy_pressure_pct": buy_pressure,
            "dexscreener_url": None,
            "has_twitter": False,
            "has_telegram": False,
            "has_website": False,
            "is_boosted": False,
        }
    except Exception as exc:
        logger.debug(f"GeckoTerminal parse_pool error: {exc}")
        return None


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
