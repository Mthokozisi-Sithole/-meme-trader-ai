"""
DEX worker: continuously ingests tokens from DexScreener and Pump.fun,
scores them with the snipe engine, and persists results.

Runs autonomously — no user interaction required.
"""
import asyncio
import json
import logging

from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.repositories.dex_token_repo import DexTokenRepository
from app.schemas.dex_token import DexTokenCreate
from app.services.dexscreener_client import fetch_new_pairs, fetch_boosted_tokens, parse_pair
from app.services.pumpfun_client import fetch_new_coins, fetch_trending_coins, parse_coin
from app.services.geckoterm_client import fetch_all_new_pools, fetch_trending_pools
from app.services.gmgn_client import run_pipeline as gmgn_pipeline
from app.services.solanafm_client import run_pipeline as solanafm_pipeline
from app.services.birdeye_client import run_pipeline as birdeye_pipeline
from app.services.moralis_client import run_pipeline as moralis_pipeline
from app.services.bitquery_client import run_pipeline as bitquery_pipeline
from app.services.alchemy_client import run_pipeline as alchemy_pipeline
from app.services.narrative_engine import classify_narrative
from app.services.snipe_scorer import score_token

logger = logging.getLogger(__name__)

# How often to run a full cycle (seconds)
DEX_REFRESH_INTERVAL = 30


def _build_token(raw: dict) -> DexTokenCreate | None:
    """Parse raw API data, run narrative + snipe scoring, return DexTokenCreate."""
    symbol = raw.get("symbol", "").strip()
    name = raw.get("name", "").strip()
    if not symbol or not raw.get("token_address"):
        return None

    # Narrative
    narrative = classify_narrative(name, symbol)
    raw["narrative_category"] = narrative.category
    raw["narrative_keywords"] = json.dumps(narrative.keywords_found)
    raw["hype_velocity"] = narrative.hype_velocity

    try:
        token_data = DexTokenCreate(**raw)
    except Exception as exc:
        logger.debug(f"Validation error for {symbol}: {exc}")
        return None

    # Snipe scoring
    result = score_token(token_data, narrative)

    # Write scores + signal back into the object
    token_data.snipe_score = result.composite
    token_data.narrative_score = result.narrative
    token_data.momentum_score = result.momentum
    token_data.liquidity_score = result.liquidity
    token_data.risk_score = result.risk_adj
    token_data.band = result.band
    token_data.sniping_opportunity = result.sniping_opportunity
    token_data.entry_low = result.entry_low
    token_data.entry_high = result.entry_high
    token_data.exit_target_1 = result.exit_target_1
    token_data.exit_target_2 = result.exit_target_2
    token_data.exit_target_3 = result.exit_target_3
    token_data.stop_loss = result.stop_loss
    token_data.risk_level = result.risk_level
    token_data.risk_flags = json.dumps(result.risk_flags)
    token_data.warnings = json.dumps(result.warnings)
    token_data.reasoning = result.reasoning

    return token_data


async def _persist_tokens(tokens: list[DexTokenCreate]) -> int:
    """Upsert a batch of tokens into the database. Returns count saved."""
    saved = 0
    async with AsyncSessionLocal() as db:
        repo = DexTokenRepository(db)
        for t in tokens:
            try:
                await repo.upsert(t)
                saved += 1
            except Exception as exc:
                logger.error(f"DB upsert failed for {t.symbol}: {exc}")
    return saved


async def run_dex_cycle() -> None:
    logger.info("DEX worker cycle starting…")

    # ── Gather raw data from all sources ──────────────────────────────────
    # ── Tier 1: DexScreener + Pump.fun (different domains, fire concurrently) ──
    dex_pairs, boosted, pf_new, pf_trending = await asyncio.gather(
        fetch_new_pairs(max_age_hours=48),
        fetch_boosted_tokens(),
        fetch_new_coins(limit=50),
        fetch_trending_coins(limit=50),
        return_exceptions=True,
    )

    # ── Tier 2: Free pipelines — no API keys needed ────────────────────────
    # GeckoTerminal: sequential to respect 30 req/min free limit
    gt_new = await fetch_all_new_pools()
    await asyncio.sleep(2)
    gt_trending = await fetch_trending_pools(limit=20)

    # GMGN: smart money / Solana hot tokens (free, public)
    gmgn_tokens = await gmgn_pipeline()

    # SolanaFM: on-chain new mints (free, public)
    solanafm_tokens = await solanafm_pipeline()

    # ── Tier 3: Keyed pipelines — skip gracefully if no key configured ──────
    birdeye_tokens, moralis_tokens, bitquery_tokens, alchemy_tokens = await asyncio.gather(
        birdeye_pipeline(settings.birdeye_api_key),
        moralis_pipeline(settings.moralis_api_key),
        bitquery_pipeline(settings.bitquery_api_key),
        alchemy_pipeline(settings.alchemy_api_key),
        return_exceptions=True,
    )

    raw_items: list[dict] = []

    # DexScreener pairs
    if isinstance(dex_pairs, list):
        for pair in dex_pairs:
            raw_items.append(parse_pair(pair))

    # Boosted tokens — fetch their pair data for detail
    if isinstance(boosted, list):
        import httpx
        from app.services.dexscreener_client import fetch_token_pairs, parse_pair as _pp
        async with httpx.AsyncClient(timeout=15):
            for boost in boosted[:20]:  # Cap boosted to avoid rate limit
                addr = boost.get("tokenAddress")
                chain = boost.get("chainId", "")
                if addr:
                    pairs = await fetch_token_pairs(addr)
                    for p in pairs[:1]:    # Best pair per token
                        parsed = _pp(p)
                        parsed["is_boosted"] = True
                        raw_items.append(parsed)
                    await asyncio.sleep(0.3)

    # Pump.fun new coins
    if isinstance(pf_new, list):
        for coin in pf_new:
            raw_items.append(parse_coin(coin))

    # Pump.fun trending
    if isinstance(pf_trending, list):
        seen_mints = {r.get("token_address") for r in raw_items}
        for coin in pf_trending:
            parsed = parse_coin(coin)
            if parsed.get("token_address") not in seen_mints:
                raw_items.append(parsed)

    # GeckoTerminal new pools (cross-chain real-time)
    if isinstance(gt_new, list):
        seen_addrs = {r.get("token_address") for r in raw_items}
        for pool in gt_new:
            if pool and pool.get("token_address") not in seen_addrs and pool.get("token_address"):
                # Map to DexTokenCreate-compatible dict
                raw_items.append({
                    **pool,
                    "pair_address": pool.get("pool_address"),
                    "dex_id": "geckoterminal",
                })
                seen_addrs.add(pool.get("token_address"))

    # GeckoTerminal trending
    if isinstance(gt_trending, list):
        seen_addrs = {r.get("token_address") for r in raw_items}
        for pool in gt_trending:
            if pool and pool.get("token_address") not in seen_addrs and pool.get("token_address"):
                raw_items.append({
                    **pool,
                    "pair_address": pool.get("pool_address"),
                    "dex_id": "geckoterminal",
                })

    # ── Merge free new pipelines ───────────────────────────────────────────
    def _merge_batch(batch: list[dict] | Exception) -> None:
        if isinstance(batch, Exception) or not isinstance(batch, list):
            return
        seen_addrs = {r.get("token_address") for r in raw_items}
        for item in batch:
            addr = item.get("token_address", "")
            if addr and addr not in seen_addrs:
                seen_addrs.add(addr)
                raw_items.append(item)

    _merge_batch(gmgn_tokens)
    _merge_batch(solanafm_tokens)
    _merge_batch(birdeye_tokens if isinstance(birdeye_tokens, list) else [])
    _merge_batch(moralis_tokens if isinstance(moralis_tokens, list) else [])
    _merge_batch(bitquery_tokens if isinstance(bitquery_tokens, list) else [])
    _merge_batch(alchemy_tokens if isinstance(alchemy_tokens, list) else [])

    sources = "DEX+PumpFun+GeckoTerm+GMGN+SolanaFM"
    if settings.birdeye_api_key:
        sources += "+Birdeye"
    if settings.moralis_api_key:
        sources += "+Moralis"
    if settings.bitquery_api_key:
        sources += "+Bitquery"
    if settings.alchemy_api_key:
        sources += "+Alchemy"

    logger.info(f"Raw tokens collected: {len(raw_items)} ({sources})")

    # ── Score and filter ───────────────────────────────────────────────────
    scored: list[DexTokenCreate] = []
    snipes = 0
    for raw in raw_items:
        t = _build_token(raw)
        if t:
            scored.append(t)
            if t.sniping_opportunity:
                snipes += 1

    # ── Persist ────────────────────────────────────────────────────────────
    saved = await _persist_tokens(scored)

    logger.info(
        f"DEX cycle complete — {saved}/{len(scored)} saved, "
        f"{snipes} snipe opportunities identified."
    )


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    logger.info(f"DEX worker starting — refresh every {DEX_REFRESH_INTERVAL}s")
    while True:
        try:
            await run_dex_cycle()
        except Exception as exc:
            logger.error(f"DEX cycle crashed: {exc}", exc_info=True)
        await asyncio.sleep(DEX_REFRESH_INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
