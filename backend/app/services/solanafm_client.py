"""
SolanaFM API client — on-chain Solana token data.
Docs: https://docs.solana.fm/
Public API — no auth required for basic endpoints.

Provides:
- Token metadata (decimals, supply, mint authority)
- Token account activity
- Transfer history
- New token mints (on-chain detection)
"""
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

BASE = "https://api.solana.fm/v0"


async def _get(client: httpx.AsyncClient, path: str, **params: Any) -> dict | None:
    try:
        r = await client.get(
            f"{BASE}{path}",
            params={k: v for k, v in params.items() if v is not None},
            headers={
                "Accept": "application/json",
                "User-Agent": "MemeTraderAI/1.0",
            },
            timeout=15,
        )
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        logger.warning(f"SolanaFM {path} failed: {exc}")
        return None


async def fetch_token_info(address: str) -> dict | None:
    """
    Fetch on-chain token metadata for a Solana token.
    Returns supply, decimals, mint authority, freeze authority.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        data = await _get(client, f"/tokens/{address}")
    if not data:
        return None

    token = data.get("tokenList") or data.get("data") or data
    if not isinstance(token, dict):
        return None

    return {
        "address": address,
        "symbol": (token.get("symbol") or "").upper(),
        "name": token.get("name"),
        "decimals": token.get("decimals"),
        "total_supply": _safe_float(token.get("supply")),
        "mint_authority": token.get("mintAuthority"),
        "freeze_authority": token.get("freezeAuthority"),
        "logo": token.get("logo"),
        "website": token.get("website"),
        "twitter": token.get("twitter"),
        "has_mint_auth": bool(token.get("mintAuthority")),
        "has_freeze_auth": bool(token.get("freezeAuthority")),
        # Risk signal: if mint authority exists, supply can be inflated
        "rug_risk_mint": bool(token.get("mintAuthority")),
    }


async def fetch_token_transfers(address: str, limit: int = 20) -> list[dict]:
    """
    Fetch recent transfer events for a token — detects whale movements.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        data = await _get(
            client,
            f"/tokens/{address}/transfers",
            utcFrom=0,
            limit=limit,
            order="desc",
        )
    if not data:
        return []
    return data.get("result", {}).get("data", []) or []


async def enrich_token(address: str) -> dict:
    """
    Enrich a known token address with SolanaFM on-chain data.
    Returns security/risk fields that supplement existing token data.
    """
    info = await fetch_token_info(address)
    if not info:
        return {}

    risk_flags = []
    if info.get("rug_risk_mint"):
        risk_flags.append("mint_authority_active")
    if info.get("has_freeze_auth"):
        risk_flags.append("freeze_authority_active")

    return {
        "solanafm_symbol": info.get("symbol"),
        "solanafm_name": info.get("name"),
        "has_website": bool(info.get("website")),
        "has_twitter": bool(info.get("twitter")),
        "solanafm_risk_flags": risk_flags,
        "rug_risk_mint": info.get("rug_risk_mint", False),
        "rug_risk_freeze": info.get("has_freeze_auth", False),
    }


async def fetch_new_mints(limit: int = 30) -> list[dict]:
    """
    Fetch recently minted Solana tokens via SolanaFM.
    These are raw on-chain mint events — very early alpha.
    """
    async with httpx.AsyncClient(timeout=20) as client:
        # Use the account activities endpoint which is more stable
        data = await _get(
            client,
            "/accounts/transfers",
            inflow=True,
            order="desc",
            limit=limit,
        )

    if not data:
        return []

    items = (
        data.get("result", {}).get("data", [])
        or data.get("data", [])
        or (data if isinstance(data, list) else [])
    )

    results = []
    for item in items:
        if not isinstance(item, dict):
            continue
        address = item.get("mint") or item.get("address") or item.get("tokenAddress")
        symbol = (item.get("symbol") or "").strip().upper()
        if not address or not symbol:
            continue

        mint_time = item.get("mintTime") or item.get("createdAt")
        token_age_hours = None
        if mint_time:
            from datetime import datetime, timezone
            try:
                if isinstance(mint_time, (int, float)):
                    created = datetime.fromtimestamp(mint_time, tz=timezone.utc)
                else:
                    created = datetime.fromisoformat(str(mint_time).replace("Z", "+00:00"))
                token_age_hours = (datetime.now(timezone.utc) - created).total_seconds() / 3600
            except Exception:
                pass

        results.append({
            "source": "solanafm",
            "chain": "solana",
            "token_address": address,
            "pair_address": None,
            "symbol": symbol,
            "name": item.get("name") or symbol,
            "dex_id": "solanafm",
            "image_url": item.get("logo"),
            "dexscreener_url": None,
            "has_twitter": bool(item.get("twitter")),
            "has_telegram": bool(item.get("telegram")),
            "has_website": bool(item.get("website")),
            "is_boosted": False,
            "price_usd": None,
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
            "token_age_hours": token_age_hours,
        })

    logger.info(f"SolanaFM: {len(results)} new mints")
    return results


async def run_pipeline() -> list[dict]:
    """
    Run full SolanaFM pipeline. No API key required.
    SolanaFM is used primarily for token enrichment (security checks),
    not bulk discovery — so this returns [] and enrichment is done per-token.
    """
    results = await fetch_new_mints(limit=30)
    logger.info(f"SolanaFM pipeline: {len(results)} tokens")
    return results


def _safe_float(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None
