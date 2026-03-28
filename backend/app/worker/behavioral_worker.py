"""
Behavioral analysis worker — continuously runs pattern detection on active tokens
and persists behavioral signals to the database.

Cycle:
  1. Fetch distinct (token_address, chain) from token_timeseries (tokens with recent data)
  2. For each token, run behavioral_engine.analyze_token()
  3. Sleep for BEHAVIORAL_REFRESH_INTERVAL seconds, repeat

Also persists OHLCV snapshots from dex_tokens into token_timeseries for backtesting.
"""
import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy import text

from app.core.database import AsyncSessionLocal
from app.services.behavioral_engine import analyze_token
from app.repositories.timeseries_repo import TimeseriesRepository
from app.repositories.dex_token_repo import DexTokenRepository
from app.schemas.token_timeseries import TimeseriesCreate

logger = logging.getLogger(__name__)

# How often to run behavioral analysis (seconds)
BEHAVIORAL_REFRESH_INTERVAL = 60

# How many tokens to analyze per cycle (to avoid overload)
MAX_TOKENS_PER_CYCLE = 50


async def _snapshot_dex_tokens(db) -> int:
    """
    Snapshot current dex_token prices into token_timeseries for OHLCV history.
    Called each cycle before behavioral analysis so the engine has fresh candles.
    """
    repo = DexTokenRepository(db)
    ts_repo = TimeseriesRepository(db)

    # Fetch top tokens by snipe_score
    tokens = await repo.get_all(limit=MAX_TOKENS_PER_CYCLE, snipe_only=False)
    now = datetime.utcnow().replace(second=0, microsecond=0)  # minute-level bucket

    saved = 0
    for t in tokens:
        if not t.price_usd:
            continue
        try:
            # Derive buy pressure from 5m buy/sell counts if available
            buys = t.buys_5m or 0
            sells = t.sells_5m or 0
            total = buys + sells
            bp = round((buys / total) * 100) if total > 0 else None

            entry = TimeseriesCreate(
                token_address=t.token_address,
                chain=t.chain,
                token_symbol=t.symbol,
                timestamp=now,
                price_open=t.price_usd,
                price_high=t.price_usd,
                price_low=t.price_usd,
                price_close=t.price_usd,
                volume_usd=t.volume_5m,
                buy_pressure_pct=bp,
                liquidity_usd=t.liquidity_usd,
                market_cap=t.market_cap,
                buys=t.buys_5m,
                sells=t.sells_5m,
                snipe_score=t.snipe_score,
            )
            await ts_repo.upsert(entry)
            saved += 1
        except Exception as exc:
            logger.debug(f"Timeseries snapshot error for {t.symbol}: {exc}")

    return saved


async def _get_active_tokens(db) -> list[tuple[str, str, str | None]]:
    """
    Return (token_address, chain, symbol) for tokens with timeseries data
    in the last 2 hours.
    """
    cutoff = datetime.utcnow() - timedelta(hours=2)
    result = await db.execute(
        text(
            """
            SELECT DISTINCT ON (token_address, chain)
                token_address, chain, token_symbol
            FROM token_timeseries
            WHERE timestamp >= :cutoff
            ORDER BY token_address, chain, timestamp DESC
            LIMIT :limit
            """
        ),
        {"cutoff": cutoff, "limit": MAX_TOKENS_PER_CYCLE},
    )
    return [(row[0], row[1], row[2]) for row in result.fetchall()]


async def run_behavioral_cycle() -> None:
    """Run one full behavioral analysis cycle."""
    async with AsyncSessionLocal() as db:
        # 1. Snapshot current token prices into timeseries
        snapped = await _snapshot_dex_tokens(db)
        logger.info(f"[behavioral] Snapshotted {snapped} tokens into timeseries")

        # 2. Get active tokens with enough data
        tokens = await _get_active_tokens(db)
        logger.info(f"[behavioral] Analyzing {len(tokens)} tokens")

        signals_total = 0
        for token_address, chain, symbol in tokens:
            try:
                signals = await analyze_token(db, token_address, chain, symbol)
                signals_total += len(signals)
            except Exception as exc:
                logger.warning(f"[behavioral] Error analyzing {symbol} ({token_address}): {exc}")

        logger.info(f"[behavioral] Cycle complete — {signals_total} active signals across {len(tokens)} tokens")


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    logger.info("[behavioral-worker] Starting behavioral analysis worker")

    while True:
        try:
            await run_behavioral_cycle()
        except Exception as exc:
            logger.error(f"[behavioral-worker] Cycle error: {exc}", exc_info=True)

        logger.info(f"[behavioral-worker] Sleeping {BEHAVIORAL_REFRESH_INTERVAL}s…")
        await asyncio.sleep(BEHAVIORAL_REFRESH_INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
