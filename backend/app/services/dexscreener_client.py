"""
DexScreener API client.
Docs: https://docs.dexscreener.com/api/reference
Free tier: ~300 req/min, no auth required for most endpoints.
"""
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

BASE = "https://api.dexscreener.com"

# Chains we care about for meme coin sniping
TARGET_CHAINS = {"solana", "ethereum", "bsc", "base"}

# DEX search queries to discover new meme tokens
DISCOVERY_QUERIES = [
    "solana",
    "pump",
    "raydium",
    "meme solana",
    "ai solana",
    "dog solana",
]


async def _get(client: httpx.AsyncClient, path: str, **params: Any) -> dict | list | None:
    try:
        r = await client.get(f"{BASE}{path}", params=params, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        logger.warning(f"DexScreener {path} failed: {exc}")
        return None


async def fetch_new_pairs(max_age_hours: float = 48.0) -> list[dict]:
    """
    Discover new token pairs by searching DexScreener across multiple queries
    and filtering by pair age.
    """
    import asyncio
    from datetime import datetime, timezone

    cutoff_ms = (datetime.now(timezone.utc).timestamp() - max_age_hours * 3600) * 1000
    seen: set[str] = set()
    results: list[dict] = []

    async with httpx.AsyncClient(timeout=20) as client:
        for query in DISCOVERY_QUERIES:
            data = await _get(client, "/latest/dex/search", q=query)
            if not data or "pairs" not in data:
                continue

            for pair in data["pairs"]:
                chain = pair.get("chainId", "")
                if chain not in TARGET_CHAINS:
                    continue

                created = pair.get("pairCreatedAt")
                if created and created < cutoff_ms:
                    continue  # Too old

                addr = pair.get("baseToken", {}).get("address", "")
                key = f"{chain}:{addr}"
                if key in seen or not addr:
                    continue

                seen.add(key)
                results.append(pair)

            await asyncio.sleep(0.2)  # Rate limiting

    logger.info(f"DexScreener discovery: {len(results)} new pairs found")
    return results


async def fetch_token_pairs(token_address: str) -> list[dict]:
    """Fetch all pairs for a specific token address."""
    async with httpx.AsyncClient(timeout=15) as client:
        data = await _get(client, f"/latest/dex/tokens/{token_address}")
    if not data or "pairs" not in data:
        return []
    return data["pairs"]


async def fetch_boosted_tokens() -> list[dict]:
    """Fetch tokens that are currently boosted on DexScreener."""
    async with httpx.AsyncClient(timeout=15) as client:
        # Try v1 endpoint first, fall back gracefully
        data = await _get(client, "/token-boosts/active/v1")
        if data is None:
            data = await _get(client, "/token-boosts/top/v1")
    if not isinstance(data, list):
        return []
    return data


def parse_pair(pair: dict) -> dict:
    """
    Normalize a DexScreener pair object into a flat dict
    aligned with DexTokenCreate fields.
    """
    base = pair.get("baseToken", {})
    txns = pair.get("txns", {})
    volume = pair.get("volume", {})
    price_change = pair.get("priceChange", {})
    liquidity = pair.get("liquidity", {})
    info = pair.get("info", {})
    boosts = pair.get("boosts") or {}

    socials = {s.get("type", ""): True for s in (info.get("socials") or [])}
    has_website = bool(info.get("websites"))

    created_ms = pair.get("pairCreatedAt")
    pair_created_at = None
    token_age_hours = None
    if created_ms:
        from datetime import datetime, timezone
        pair_created_at = datetime.fromtimestamp(created_ms / 1000, tz=timezone.utc)
        token_age_hours = (datetime.now(timezone.utc) - pair_created_at).total_seconds() / 3600

    return {
        "chain": pair.get("chainId", ""),
        "token_address": base.get("address", ""),
        "pair_address": pair.get("pairAddress"),
        "symbol": base.get("symbol", "").upper(),
        "name": base.get("name"),
        "source": "dexscreener",
        "dex_id": pair.get("dexId"),
        "image_url": info.get("imageUrl"),
        "dexscreener_url": pair.get("url"),
        "has_twitter": socials.get("twitter", False),
        "has_telegram": socials.get("telegram", False),
        "has_website": has_website,
        "is_boosted": bool(boosts.get("active")),
        "price_usd": _safe_float(pair.get("priceUsd")),
        "price_native": _safe_float(pair.get("priceNative")),
        "market_cap": _safe_float(pair.get("marketCap")),
        "fdv": _safe_float(pair.get("fdv")),
        "liquidity_usd": _safe_float(liquidity.get("usd")),
        "volume_1m": _safe_float(volume.get("m1")),
        "volume_5m": _safe_float(volume.get("m5")),
        "volume_1h": _safe_float(volume.get("h1")),
        "volume_6h": _safe_float(volume.get("h6")),
        "volume_24h": _safe_float(volume.get("h24")),
        "buys_1m": _safe_int(txns.get("m1", {}).get("buys")),
        "sells_1m": _safe_int(txns.get("m1", {}).get("sells")),
        "buys_5m": _safe_int(txns.get("m5", {}).get("buys")),
        "sells_5m": _safe_int(txns.get("m5", {}).get("sells")),
        "buys_1h": _safe_int(txns.get("h1", {}).get("buys")),
        "sells_1h": _safe_int(txns.get("h1", {}).get("sells")),
        "price_change_1m": _safe_float(price_change.get("m1")),
        "price_change_5m": _safe_float(price_change.get("m5")),
        "price_change_1h": _safe_float(price_change.get("h1")),
        "price_change_24h": _safe_float(price_change.get("h24")),
        "pair_created_at": pair_created_at,
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
