"""
Bitquery API client — real-time blockchain streaming via GraphQL.
Docs: https://docs.bitquery.io/docs/start/getting-started/
Requires: BITQUERY_API_KEY env var (free tier at bitquery.io)

Provides:
- New token creation events (Solana, ETH, BSC)
- Real-time trade streams
- Dev wallet detection
- Pump.fun token launches (replaces broken pump.fun API)
"""
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

REST_BASE = "https://graphql.bitquery.io"
STREAMING_BASE = "https://streaming.bitquery.io/graphql"

# GraphQL query: new Solana tokens created in last N minutes via Pump.fun
_PUMPFUN_NEW_TOKENS_QUERY = """
{
  Solana {
    Instructions(
      where: {
        Instruction: {Program: {Method: {is: "create"}, Address: {is: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"}}}
        Transaction: {Result: {Success: true}}
      }
      limit: {count: 50}
      orderBy: {descending: Block_Time}
    ) {
      Block { Time }
      Instruction {
        Accounts {
          Address
          IsWritable
        }
        Program {
          Address
          Name
          Method
        }
        Data
      }
      Transaction { Signature }
    }
  }
}
"""

# GraphQL query: top Solana DEX trades last 5 minutes
_SOLANA_TOP_TRADES_QUERY = """
{
  Solana {
    DEXTrades(
      where: {
        Trade: {Side: {Currency: {Symbol: {not: ""}}}}
        Transaction: {Result: {Success: true}}
        Block: {Time: {since: "%s"}}
      }
      limit: {count: 50}
      orderBy: {descending: Trade_Amount}
    ) {
      Block { Time }
      Trade {
        Currency { Symbol Name MintAddress }
        Side { Currency { Symbol } }
        Amount
        Price
        PriceInUSD
        Dex { ProgramAddress ProtocolName }
      }
      Transaction { Signature }
    }
  }
}
"""

# GraphQL query: new EVM tokens (ETH/BSC)
_EVM_NEW_TOKENS_QUERY = """
{
  EVM(network: %s) {
    TokenSupplyUpdates(
      where: {
        ChainId: {is: "%s"}
        Block: {Time: {since: "%s"}}
      }
      limit: {count: 30}
      orderBy: {descending: Block_Time}
    ) {
      Block { Time Number }
      Token { SmartContract Symbol Name Decimals }
      Transaction { Hash From }
    }
  }
}
"""


async def _query(api_key: str, query: str, base: str = REST_BASE) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                base,
                json={"query": query},
                headers={
                    "X-API-KEY": api_key,
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            data = r.json()
            if "errors" in data:
                logger.warning(f"Bitquery GraphQL errors: {data['errors'][:1]}")
                return None
            return data.get("data")
    except httpx.HTTPStatusError as exc:
        logger.warning(f"Bitquery HTTP {exc.response.status_code}: {exc.response.text[:200]}")
        return None
    except Exception as exc:
        logger.warning(f"Bitquery query failed: {exc}")
        return None


async def fetch_pumpfun_new_tokens(api_key: str) -> list[dict]:
    """
    Fetch newly created Pump.fun tokens directly from Solana blockchain.
    This replaces the broken pump.fun REST API.
    """
    data = await _query(api_key, _PUMPFUN_NEW_TOKENS_QUERY)
    if not data:
        return []

    results = []
    instructions = data.get("Solana", {}).get("Instructions", [])
    for ix in instructions:
        accounts = ix.get("Instruction", {}).get("Accounts", [])
        # Account[0] is usually the mint address in Pump.fun create instruction
        mint_addr = next(
            (a["Address"] for a in accounts[:3] if a.get("IsWritable")), None
        )
        if not mint_addr:
            continue

        block_time = ix.get("Block", {}).get("Time")
        token_age_hours = None
        if block_time:
            from datetime import datetime, timezone
            try:
                created = datetime.fromisoformat(block_time.replace("Z", "+00:00"))
                token_age_hours = (datetime.now(timezone.utc) - created).total_seconds() / 3600
            except Exception:
                pass

        results.append({
            "source": "bitquery_pumpfun",
            "chain": "solana",
            "token_address": mint_addr,
            "pair_address": None,
            "symbol": f"PUMP{mint_addr[:4].upper()}",
            "name": f"New Pump.fun Token",
            "dex_id": "pump_fun",
            "image_url": None,
            "dexscreener_url": None,
            "has_twitter": False,
            "has_telegram": False,
            "has_website": False,
            "is_boosted": False,
            "price_usd": None,
            "price_native": None,
            "market_cap": None,
            "fdv": None,
            "liquidity_usd": None,
            "volume_24h": None,
            "volume_1h": None,
            "volume_5m": None,
            "volume_1m": None,
            "volume_6h": None,
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
    logger.info(f"Bitquery Pump.fun: {len(results)} new token creation events")
    return results


async def fetch_solana_top_trades(api_key: str) -> list[dict]:
    """
    Fetch top Solana DEX trades in the last 5 minutes — finds momentum tokens.
    """
    from datetime import datetime, timezone, timedelta
    since = (datetime.now(timezone.utc) - timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    query = _SOLANA_TOP_TRADES_QUERY % since

    data = await _query(api_key, query)
    if not data:
        return []

    results = []
    seen: set[str] = set()
    trades = data.get("Solana", {}).get("DEXTrades", [])

    for trade in trades:
        t = trade.get("Trade", {})
        currency = t.get("Currency", {})
        mint = currency.get("MintAddress", "")
        symbol = currency.get("Symbol", "").upper()

        if not mint or not symbol or mint in seen:
            continue
        seen.add(mint)

        price_usd = _safe_float(t.get("PriceInUSD"))
        dex = t.get("Dex", {}).get("ProtocolName", "solana_dex")

        results.append({
            "source": "bitquery",
            "chain": "solana",
            "token_address": mint,
            "pair_address": None,
            "symbol": symbol,
            "name": currency.get("Name") or symbol,
            "dex_id": dex,
            "image_url": None,
            "dexscreener_url": None,
            "has_twitter": False,
            "has_telegram": False,
            "has_website": False,
            "is_boosted": False,
            "price_usd": price_usd,
            "price_native": _safe_float(t.get("Price")),
            "market_cap": None,
            "fdv": None,
            "liquidity_usd": None,
            "volume_5m": _safe_float(t.get("Amount")),
            "volume_1h": None,
            "volume_6h": None,
            "volume_24h": None,
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

    logger.info(f"Bitquery Solana trades: {len(results)} active tokens")
    return results


async def run_pipeline(api_key: str) -> list[dict]:
    """
    Run full Bitquery pipeline: Pump.fun new tokens + top Solana trades.
    """
    if not api_key:
        logger.debug("Bitquery: BITQUERY_API_KEY not set — skipping")
        return []

    import asyncio

    pf_tokens, sol_trades = await asyncio.gather(
        fetch_pumpfun_new_tokens(api_key),
        fetch_solana_top_trades(api_key),
        return_exceptions=True,
    )

    results: list[dict] = []
    seen: set[str] = set()

    for batch in [pf_tokens, sol_trades]:
        if isinstance(batch, Exception) or not isinstance(batch, list):
            continue
        for item in batch:
            addr = item.get("token_address", "")
            if addr and addr not in seen:
                seen.add(addr)
                results.append(item)

    logger.info(f"Bitquery pipeline: {len(results)} tokens total")
    return results


def _safe_float(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None
