"""
Moralis API client — multi-chain token + wallet analytics.
Docs: https://docs.moralis.io/web3-data-api/evm/reference
Requires: MORALIS_API_KEY env var (free tier: 40k CUs/day at moralis.io)

Provides:
- ERC20 token gainers/losers (ETH, BSC, Base, Polygon)
- Trending tokens by chain
- Token price + metadata
- Wallet token holdings
"""
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

BASE = "https://deep-index.moralis.io/api/v2.2"

# Moralis chain identifiers
CHAIN_IDS = {
    "ethereum": "eth",
    "bsc": "bsc",
    "base": "base",
    "polygon": "polygon",
    "arbitrum": "arbitrum",
    "solana": "solana",
}

# Reverse map: Moralis → our chain names
CHAIN_REVERSE = {v: k for k, v in CHAIN_IDS.items()}


def _headers(api_key: str) -> dict:
    return {"X-API-Key": api_key, "accept": "application/json"}


async def _get(
    client: httpx.AsyncClient, path: str, api_key: str, **params: Any
) -> dict | list | None:
    try:
        r = await client.get(
            f"{BASE}{path}",
            headers=_headers(api_key),
            params={k: v for k, v in params.items() if v is not None},
            timeout=15,
        )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as exc:
        logger.warning(f"Moralis {path} HTTP {exc.response.status_code}: {exc.response.text[:200]}")
        return None
    except Exception as exc:
        logger.warning(f"Moralis {path} failed: {exc}")
        return None


async def fetch_token_gainers(api_key: str, chain: str = "eth", limit: int = 20) -> list[dict]:
    """
    Fetch top token gainers in the last 24h for a given chain.
    """
    moralis_chain = CHAIN_IDS.get(chain, chain)
    async with httpx.AsyncClient(timeout=20) as client:
        data = await _get(client, "/erc20/gainers", api_key, chain=moralis_chain, limit=limit)
    if not data:
        return []
    items = data if isinstance(data, list) else data.get("result", [])
    return [_parse_token(item, chain) for item in items if item.get("tokenAddress")]


async def fetch_trending_tokens(api_key: str, chain: str = "eth", limit: int = 20) -> list[dict]:
    """
    Fetch trending ERC20 tokens by on-chain activity.
    """
    moralis_chain = CHAIN_IDS.get(chain, chain)
    async with httpx.AsyncClient(timeout=20) as client:
        data = await _get(client, "/tokens/trending", api_key, chain=moralis_chain, limit=limit)
    if not data:
        return []
    items = data if isinstance(data, list) else data.get("result", [])
    return [_parse_token(item, chain) for item in items if item.get("tokenAddress")]


async def fetch_token_price(
    api_key: str, address: str, chain: str = "eth"
) -> dict | None:
    """
    Fetch real-time price for a specific token.
    """
    moralis_chain = CHAIN_IDS.get(chain, chain)
    async with httpx.AsyncClient(timeout=15) as client:
        data = await _get(
            client,
            f"/erc20/{address}/price",
            api_key,
            chain=moralis_chain,
            include_percent_change=True,
        )
    if not data:
        return None
    return {
        "address": address,
        "chain": chain,
        "price_usd": _safe_float(data.get("usdPrice")),
        "price_change_24h": _safe_float(data.get("24hrPercentChange")),
        "token_name": data.get("tokenName"),
        "token_symbol": data.get("tokenSymbol"),
        "exchange_name": data.get("exchangeName"),
        "liquidity_usd": _safe_float(data.get("pairTotalLiquidityUsd")),
    }


async def run_pipeline(api_key: str, chains: list[str] | None = None) -> list[dict]:
    """
    Run the full Moralis pipeline across multiple chains.
    Fetches gainers + trending tokens, deduplicates by address.
    """
    if not api_key:
        logger.debug("Moralis: MORALIS_API_KEY not set — skipping")
        return []

    import asyncio

    target_chains = chains or ["ethereum", "bsc", "base"]
    results: list[dict] = []
    seen: set[str] = set()

    for chain in target_chains:
        gainers, trending = await asyncio.gather(
            fetch_token_gainers(api_key, chain=chain, limit=20),
            fetch_trending_tokens(api_key, chain=chain, limit=20),
            return_exceptions=True,
        )
        for batch in [gainers, trending]:
            if isinstance(batch, Exception) or not isinstance(batch, list):
                continue
            for item in batch:
                addr = item.get("token_address", "")
                key = f"{chain}:{addr}"
                if addr and key not in seen:
                    seen.add(key)
                    results.append(item)
        await asyncio.sleep(0.5)  # Stay under rate limit across chains

    logger.info(f"Moralis pipeline: {len(results)} tokens across {target_chains}")
    return results


def _parse_token(item: dict, chain: str) -> dict:
    """Normalize a Moralis token dict to DexTokenCreate-compatible format."""
    address = item.get("tokenAddress") or item.get("address") or ""
    symbol = (item.get("tokenSymbol") or item.get("symbol") or "").strip().upper()
    name = item.get("tokenName") or item.get("name") or symbol

    price = _safe_float(item.get("usdPrice")) or _safe_float(item.get("price"))
    mc = _safe_float(item.get("marketCap")) or _safe_float(item.get("fullyDilutedValuation"))
    liquidity = _safe_float(item.get("liquidityUsd")) or _safe_float(item.get("pairTotalLiquidityUsd"))
    v24h = _safe_float(item.get("volume24h")) or _safe_float(item.get("totalVolume24h"))

    pc24h = _safe_float(item.get("pricePercentChange24h")) or _safe_float(item.get("priceChange24h"))

    return {
        "source": "moralis",
        "chain": chain,
        "token_address": address,
        "pair_address": item.get("pairAddress"),
        "symbol": symbol,
        "name": name,
        "dex_id": item.get("exchangeName", "moralis"),
        "image_url": item.get("thumbnail") or item.get("logo"),
        "dexscreener_url": None,
        "has_twitter": False,
        "has_telegram": False,
        "has_website": bool(item.get("website")),
        "is_boosted": False,
        "price_usd": price,
        "price_native": None,
        "market_cap": mc,
        "fdv": mc,
        "liquidity_usd": liquidity,
        "volume_24h": v24h,
        "volume_1h": None,
        "volume_5m": None,
        "volume_6h": None,
        "volume_1m": None,
        "buys_5m": None,
        "sells_5m": None,
        "buys_1h": None,
        "sells_1h": None,
        "price_change_24h": pc24h,
        "price_change_1h": _safe_float(item.get("priceChange1h")),
        "price_change_5m": None,
        "price_change_1m": None,
        "token_age_hours": None,
    }


def _safe_float(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None
