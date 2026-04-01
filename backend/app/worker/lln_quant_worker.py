"""
LLN Quant Engine — Background Worker.

Runs every 60 seconds. Calls the analytics service to compute outcomes and metrics.
Reads from existing tables only. Writes only to LLN analytics tables.

Run with: python -m app.worker.lln_quant_worker
"""
import asyncio
import logging

from app.core.database import AsyncSessionLocal
from app.services.lln_analytics import (
    compute_feature_importance,
    compute_pattern_performance,
    compute_signal_outcomes,
    compute_strategy_performance,
    detect_and_store_regime,
    run_monte_carlo_simulations,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(name)s  %(message)s",
)
logger = logging.getLogger("lln_worker")

CYCLE_SECONDS = 60


async def run_cycle() -> None:
    async with AsyncSessionLocal() as db:
        try:
            logger.info("[LLN] ── Cycle start ─────────────────────────────")

            # A. Compute outcomes for new signals
            n = await compute_signal_outcomes(db)
            logger.info(f"[LLN] Signal outcomes: {n} new")

            # B+C+D+E. Pattern performance, distributions, EV, Bayesian
            await compute_pattern_performance(db)

            # Strategy-level aggregates
            await compute_strategy_performance(db)

            # F. Monte Carlo simulations
            await run_monte_carlo_simulations(db)

            # H. Regime detection
            await detect_and_store_regime(db)

            # I. Feature importance
            await compute_feature_importance(db)

            logger.info("[LLN] ── Cycle complete ──────────────────────────")

        except Exception as exc:
            logger.exception(f"[LLN] Cycle error: {exc}")


async def main() -> None:
    logger.info("[LLN] LLN Quant Engine worker starting...")
    while True:
        await run_cycle()
        logger.info(f"[LLN] Sleeping {CYCLE_SECONDS}s until next cycle")
        await asyncio.sleep(CYCLE_SECONDS)


if __name__ == "__main__":
    asyncio.run(main())
