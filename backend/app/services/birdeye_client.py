"""
Birdeye API client — best-in-class Solana/multi-chain DEX data.
Docs: https://docs.birdeye.so/reference/get_defi-tokenlist
Requires: BIRDEYE_API_KEY env var (free tier available at birdeye.so)
"""
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

BASE = "https://public-api.birdeye.so"

# Supported chains and their Birdeye chain identifiers
CHAIN_MAP = {
    "solana": "solana",
    "ethereum": "ethereum",
    "bsc": "bsc",
    "base": "base",
    "arbitrum": "arbitrum",
}


def _headers(api_key: str, chain: str = "solana") -> dict:
    return {
        "X-API-KEY": api_key,
        "x-chain": chain,
        "accept": "application/json",
    }


async def _get(
    client: httpx.AsyncClient, path: str, api_key: str, chain: str = "solana", **params: Any
) -> dict | None:
    try:
        r = await client.get(
            f"{BASE}{path}",
            headers=_headers(api_key, chain),
            params=params,
            timeout=15,
        )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as exc:
        logger.warning(f"Birdeye {path} HTTP {exc.response.status_code}: {exc.response.text[:200]}")
        return None
    except Exception as exc:
        logger.warning(f"Birdeye {path} failed: {exc}")
        return None


async def fetch_new_listings(api_key: str, limit: int = 50) -> list[dict]:
    """
    Fetch newly listed tokens on Solana (replaces Pump.fun pipeline).
    Returns tokens sorted by listing time descending.
    """
    async with httpx.AsyncClient(timeout=20) as client:
        data = await _get(
            client,
            "/defi/v2/tokens/new_listing",
            api_key,
            chain="solana",
            limit=limit,
            meme_platform_hardcoded="pump_fun",
        )
    if not data or not data.get("success"):
        return []
    items = data.get("data", {}).get("items", []) or []
    return [_parse_token(item, "solana") for item in items if item.get("address")]


async def fetch_trending_tokens(api_key: str, chain: str = "solana", limit: int = 50) -> list[dict]:
    """
    Fetch trending tokens by 24h volume change on a given chain.
    """
    async with httpx.AsyncClient(timeout=20) as client:
        data = await _get(
            client,
            "/defi/tokenlist",
            api_key,
            chain=chain,
            sort_by="v24hChangePercent",
            sort_type="desc",
            offset=0,
            limit=limit,
            min_liquidity=1000,
        )
    if not data or not data.get("success"):
        return []
    items = data.get("data", {}).get("tokens", []) or []
    return [_parse_token(item, chain) for item in items if item.get("address")]


async def fetch_token_overview(api_key: str, address: str, chain: str = "solana") -> dict | None:
    """
    Fetch full token overview including holders, price, liquidity.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        data = await _get(client, f"/defi/token_overview", api_key, chain=chain, address=address)
    if not data or not data.get("success"):
        return None
    item = data.get("data", {})
    return _parse_token(item, chain) if item else None


async def fetch_token_security(api_key: str, address: str, chain: str = "solana") -> dict | None:
    """
    Fetch token security info: top 10 holders, creator, mint authority.
    Returns dict with security fields for risk scoring.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        data = await _get(client, "/defi/token_security", api_key, chain=chain, address=address)
    if not data or not data.get("success"):
        return None
    sec = data.get("data", {})
    if not sec:
        return None

    top10_pct = _safe_float(sec.get("top10HolderPercent"))
    creator_pct = _safe_float(sec.get("creatorPercent"))
    return {
        "address": address,
        "chain": chain,
        "top10_holder_pct": top10_pct,
        "creator_pct": creator_pct,
        "is_mint_enabled": sec.get("mintEnabled", False),
        "is_freeze_enabled": sec.get("freezeEnabled", False),
        "total_supply": _safe_float(sec.get("totalSupply")),
        "whale_concentration": top10_pct or 0.0,
        "has_large_holder": (top10_pct or 0) > 30,
    }


async def run_pipeline(api_key: str) -> list[dict]:
    """
    Run the full Birdeye pipeline: new listings + trending Solana tokens.
    """
    if not api_key:
        logger.debug("Birdeye: BIRDEYE_API_KEY not set — skipping")
        return []

    import asyncio

    new_listings, trending = await asyncio.gather(
        fetch_new_listings(api_key, limit=50),
        fetch_trending_tokens(api_key, chain="solana", limit=30),
        return_exceptions=True,
    )

    results: list[dict] = []
    seen: set[str] = set()

    for batch in [new_listings, trending]:
        if isinstance(batch, Exception) or not isinstance(batch, list):
            continue
        for item in batch:
            addr = item.get("token_address", "")
            if addr and addr not in seen:
                seen.add(addr)
                results.append(item)

    logger.info(f"Birdeye pipeline: {len(results)} Solana tokens")
    return results


def _parse_token(item: dict, chain: str) -> dict:
    """Normalize a Birdeye token dict to DexTokenCreate-compatible format."""
    address = item.get("address", "")
    symbol = (item.get("symbol") or "").strip().upper()
    name = item.get("name") or symbol

    liquidity = _safe_float(item.get("liquidity")) or _safe_float(item.get("realLiquidity"))
    mc = _safe_float(item.get("mc")) or _safe_float(item.get("marketCap"))
    fdv = _safe_float(item.get("fdv")) or mc

    price = _safe_float(item.get("price")) or _safe_float(item.get("priceUsd"))
    v24h = _safe_float(item.get("v24hUSD")) or _safe_float(item.get("v24h"))
    v1h = _safe_float(item.get("v1hUSD"))

    pc24h = _safe_float(item.get("v24hChangePercent")) or _safe_float(item.get("priceChange24h"))
    pc1h = _safe_float(item.get("priceChange1h"))

    # Infer age from listing time if available
    token_age_hours = None
    list_time = item.get("listingTime") or item.get("createdAt")
    if list_time:
        from datetime import datetime, timezone
        try:
            if isinstance(list_time, (int, float)):
                created = datetime.fromtimestamp(list_time, tz=timezone.utc)
            else:
                created = datetime.fromisoformat(str(list_time).replace("Z", "+00:00"))
            token_age_hours = (datetime.now(timezone.utc) - created).total_seconds() / 3600
        except Exception:
            pass

    return {
        "source": "birdeye",
        "chain": CHAIN_MAP.get(chain, chain),
        "token_address": address,
        "pair_address": None,
        "symbol": symbol,
        "name": name,
        "dex_id": "birdeye",
        "image_url": item.get("logoURI"),
        "dexscreener_url": None,
        "has_twitter": bool(item.get("twitter")),
        "has_telegram": bool(item.get("telegram")),
        "has_website": bool(item.get("website")),
        "is_boosted": False,
        "price_usd": price,
        "price_native": None,
        "market_cap": mc,
        "fdv": fdv,
        "liquidity_usd": liquidity,
        "volume_1h": v1h,
        "volume_24h": v24h,
        "volume_5m": None,
        "volume_6h": None,
        "volume_1m": None,
        "buys_5m": None,
        "sells_5m": None,
        "buys_1h": _safe_int(item.get("buy1h")),
        "sells_1h": _safe_int(item.get("sell1h")),
        "price_change_24h": pc24h,
        "price_change_1h": pc1h,
        "price_change_5m": None,
        "price_change_1m": None,
        "token_age_hours": token_age_hours,
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
