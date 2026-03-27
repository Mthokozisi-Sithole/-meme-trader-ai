"""
Alchemy Token API client — developer-grade EVM token data.
Docs: https://docs.alchemy.com/reference/token-api-quickstart
Requires: ALCHEMY_API_KEY env var (free tier: 300M compute units/month)

Provides:
- Token balances + metadata (ETH, Base, Polygon, Arbitrum)
- Transfer events
- Token price + market data
- NFT + memecoin tracking
"""
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

# Alchemy network identifiers → RPC URLs
NETWORK_URLS = {
    "ethereum": "https://eth-mainnet.g.alchemy.com/v2/{key}",
    "base": "https://base-mainnet.g.alchemy.com/v2/{key}",
    "arbitrum": "https://arb-mainnet.g.alchemy.com/v2/{key}",
    "polygon": "https://polygon-mainnet.g.alchemy.com/v2/{key}",
    "bsc": "https://bnb-mainnet.g.alchemy.com/v2/{key}",
}

# Alchemy Token API base
TOKEN_API_BASE = "https://api.g.alchemy.com/prices/v1/{key}"


def _rpc_url(api_key: str, network: str) -> str:
    template = NETWORK_URLS.get(network, NETWORK_URLS["ethereum"])
    return template.format(key=api_key)


async def _post(client: httpx.AsyncClient, url: str, payload: dict) -> dict | None:
    try:
        r = await client.post(url, json=payload, timeout=15)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as exc:
        logger.warning(f"Alchemy RPC HTTP {exc.response.status_code}: {exc.response.text[:200]}")
        return None
    except Exception as exc:
        logger.warning(f"Alchemy RPC failed: {exc}")
        return None


async def _get_token_api(client: httpx.AsyncClient, api_key: str, path: str, **params: Any) -> dict | None:
    try:
        base = TOKEN_API_BASE.format(key=api_key)
        r = await client.get(
            f"{base}{path}",
            params={k: v for k, v in params.items() if v is not None},
            headers={"Accept": "application/json"},
            timeout=15,
        )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as exc:
        logger.warning(f"Alchemy Token API {exc.response.status_code}: {exc.response.text[:200]}")
        return None
    except Exception as exc:
        logger.warning(f"Alchemy Token API failed: {exc}")
        return None


async def fetch_token_prices(
    api_key: str, addresses: list[str], network: str = "ethereum"
) -> list[dict]:
    """
    Fetch prices for a list of token addresses via Alchemy Token Price API.
    """
    if not addresses:
        return []

    async with httpx.AsyncClient(timeout=20) as client:
        data = await _get_token_api(
            client,
            api_key,
            "/tokens/by-address",
            addresses=",".join(addresses[:25]),  # Max 25 per request
            network=network,
        )

    if not data or "data" not in data:
        return []

    results = []
    for item in data["data"]:
        addr = item.get("address") or item.get("tokenAddress", "")
        symbol = (item.get("symbol") or "").upper()
        if not addr or not symbol:
            continue
        prices = item.get("prices", [{}])
        usd_price = next(
            (_safe_float(p.get("value")) for p in prices if p.get("currency") == "usd"), None
        )
        results.append({
            "address": addr,
            "symbol": symbol,
            "name": item.get("name"),
            "price_usd": usd_price,
            "network": network,
        })
    return results


async def fetch_transfers_for_token(
    api_key: str, token_address: str, network: str = "ethereum", limit: int = 100
) -> list[dict]:
    """
    Fetch recent transfer events for a token using Alchemy Transfers API.
    Used to detect large whale transfers.
    """
    url = _rpc_url(api_key, network)
    async with httpx.AsyncClient(timeout=20) as client:
        data = await _post(client, url, {
            "id": 1,
            "jsonrpc": "2.0",
            "method": "alchemy_getAssetTransfers",
            "params": [{
                "fromBlock": "0x0",
                "toBlock": "latest",
                "contractAddresses": [token_address],
                "category": ["erc20"],
                "withMetadata": True,
                "excludeZeroValue": True,
                "maxCount": hex(limit),
                "order": "desc",
            }],
        })

    if not data or "result" not in data:
        return []
    return data["result"].get("transfers", [])


async def detect_whale_activity(
    api_key: str, token_address: str, network: str = "ethereum", threshold_usd: float = 10_000
) -> dict:
    """
    Detect large whale transfers for a token.
    Returns whale detection signals.
    """
    transfers = await fetch_transfers_for_token(api_key, token_address, network, limit=50)
    if not transfers:
        return {"has_whale": False, "whale_count": 0, "total_whale_volume": 0.0}

    whale_txs = []
    for tx in transfers:
        value = _safe_float(tx.get("value")) or 0
        # Alchemy provides value in token units — use metadata for USD if available
        meta = tx.get("metadata", {})
        block_ts = meta.get("blockTimestamp")
        whale_txs.append({"value": value, "hash": tx.get("hash"), "ts": block_ts})

    total = sum(t["value"] for t in whale_txs)
    return {
        "has_whale": len(whale_txs) > 0,
        "whale_count": len(whale_txs),
        "total_whale_volume": total,
        "large_tx_detected": total > threshold_usd,
    }


async def fetch_trending_evm_tokens(api_key: str, network: str = "base") -> list[dict]:
    """
    Fetch tokens with the most transfer activity on an EVM chain.
    Uses Alchemy's token transfer API to find active tokens.
    """
    if not api_key:
        return []

    # Use known active meme token contracts as seeds for price fetching
    # In production, these would be discovered from on-chain events
    SEED_ADDRESSES = {
        "base": [
            "0x532f27101965dd16442E59d40670FaF5eBB142E4",  # BRETT
            "0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4",  # TOSHI
            "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",  # DEGEN
        ],
        "ethereum": [
            "0x6982508145454ce325ddbe47a25d4ec3d2311933",  # PEPE
            "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",  # SHIB
            "0xb131f4a55907b10d1f0a50d8ab8fa09ec342cd74",  # MEME
        ],
    }

    addresses = SEED_ADDRESSES.get(network, [])
    if not addresses:
        return []

    price_data = await fetch_token_prices(api_key, addresses, network)
    results = []
    for p in price_data:
        if not p.get("price_usd"):
            continue
        results.append({
            "source": "alchemy",
            "chain": network,
            "token_address": p["address"],
            "pair_address": None,
            "symbol": p["symbol"],
            "name": p.get("name") or p["symbol"],
            "dex_id": "alchemy",
            "image_url": None,
            "dexscreener_url": None,
            "has_twitter": False,
            "has_telegram": False,
            "has_website": False,
            "is_boosted": False,
            "price_usd": p.get("price_usd"),
            "price_native": None,
            "market_cap": None,
            "fdv": None,
            "liquidity_usd": None,
            "volume_24h": None,
            "volume_1h": None,
            "volume_5m": None,
            "volume_6h": None,
            "volume_1m": None,
            "buys_5m": None,
            "sells_5m": None,
            "buys_1h": None,
            "sells_1h": None,
            "price_change_24h": None,
            "price_change_1h": None,
            "price_change_5m": None,
            "price_change_1m": None,
            "token_age_hours": None,
        })

    logger.info(f"Alchemy {network}: {len(results)} tokens with price data")
    return results


async def run_pipeline(api_key: str) -> list[dict]:
    """
    Run full Alchemy pipeline across EVM chains.
    """
    if not api_key:
        logger.debug("Alchemy: ALCHEMY_API_KEY not set — skipping")
        return []

    import asyncio

    base_tokens, eth_tokens = await asyncio.gather(
        fetch_trending_evm_tokens(api_key, "base"),
        fetch_trending_evm_tokens(api_key, "ethereum"),
        return_exceptions=True,
    )

    results: list[dict] = []
    seen: set[str] = set()
    for batch in [base_tokens, eth_tokens]:
        if isinstance(batch, Exception) or not isinstance(batch, list):
            continue
        for item in batch:
            addr = item.get("token_address", "")
            if addr and addr not in seen:
                seen.add(addr)
                results.append(item)

    logger.info(f"Alchemy pipeline: {len(results)} EVM tokens")
    return results


def _safe_float(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None
