"""
Background worker: fetches ALL meme-token market data from CoinGecko
and regenerates signals on a schedule.
Run with: python -m app.worker.tasks
"""
import asyncio
import logging
import httpx

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.repositories.coin_repo import CoinRepository
from app.repositories.signal_repo import SignalRepository
from app.repositories.alert_repo import AlertRepository
from app.schemas.coin import CoinCreate
from app.services.signal_service import SignalContext, generate_signal
from app.services.risk import RiskInput, evaluate_risk

logger = logging.getLogger(__name__)


async def fetch_all_meme_coins() -> list[dict]:
    """
    Fetch all coins in the CoinGecko 'meme-token' category, paginating
    through up to `settings.coingecko_max_pages` pages (250 coins/page).
    """
    headers = {}
    if settings.coingecko_api_key:
        headers["x-cg-demo-api-key"] = settings.coingecko_api_key

    all_coins: list[dict] = []
    async with httpx.AsyncClient(timeout=30) as client:
        for page in range(1, settings.coingecko_max_pages + 1):
            url = (
                f"{settings.coingecko_base_url}/coins/markets"
                f"?vs_currency=usd"
                f"&category=meme-token"
                f"&order=market_cap_desc"
                f"&per_page=250"
                f"&page={page}"
                f"&sparkline=false"
                f"&price_change_percentage=24h,7d"
            )
            try:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                page_data: list[dict] = response.json()
            except Exception as exc:
                logger.error(f"CoinGecko page {page} failed: {exc}")
                break

            if not page_data:
                break

            all_coins.extend(page_data)
            logger.info(f"Fetched page {page}: {len(page_data)} coins (total so far: {len(all_coins)})")

            if len(page_data) < 250:
                # Last partial page — no more data
                break

            # Respect rate limits between pages
            await asyncio.sleep(1.5)

    return all_coins


def _map_market_to_coin(item: dict) -> CoinCreate | None:
    symbol = item.get("symbol", "").upper()
    if not symbol:
        return None

    price = item.get("current_price") or 0.0
    volume = item.get("total_volume")

    return CoinCreate(
        symbol=symbol,
        name=item.get("name", symbol),
        coingecko_id=item.get("id"),
        image_url=item.get("image"),
        price_usd=float(price),
        market_cap_usd=item.get("market_cap"),
        market_cap_rank=item.get("market_cap_rank"),
        volume_24h_usd=volume,
        # Proxy liquidity with 24h volume until a DEX liquidity source is wired in
        liquidity_usd=volume,
        high_24h=item.get("high_24h"),
        low_24h=item.get("low_24h"),
        price_change_24h=item.get("price_change_percentage_24h"),
        price_change_7d=item.get("price_change_percentage_7d_in_currency"),
        ath=item.get("ath"),
        ath_change_percentage=item.get("ath_change_percentage"),
        atl=item.get("atl"),
        atl_change_percentage=item.get("atl_change_percentage"),
        circulating_supply=item.get("circulating_supply"),
        total_supply=item.get("total_supply"),
        holders=None,
        whale_concentration=None,
    )


async def run_cycle() -> None:
    logger.info("Worker cycle starting — fetching all meme-token market data…")

    try:
        raw_data = await fetch_all_meme_coins()
    except Exception as exc:
        logger.error(f"Failed to fetch market data: {exc}")
        return

    if not raw_data:
        logger.warning("No market data returned from CoinGecko.")
        return

    logger.info(f"Processing {len(raw_data)} coins…")

    async with AsyncSessionLocal() as db:
        coin_repo = CoinRepository(db)
        signal_repo = SignalRepository(db)
        alert_repo = AlertRepository(db)

        for item in raw_data:
            coin_data = _map_market_to_coin(item)
            if not coin_data:
                continue

            # Skip coins with no price data
            if coin_data.price_usd <= 0:
                continue

            try:
                coin = await coin_repo.upsert(coin_data)

                signal_data = generate_signal(SignalContext(coin=coin))
                await signal_repo.create(signal_data)
                logger.debug(f"{coin.symbol}: {signal_data.band} ({signal_data.score:.1f})")

                risk = evaluate_risk(RiskInput(
                    liquidity_usd=coin.liquidity_usd or 0.0,
                    whale_concentration=coin.whale_concentration or 0.0,
                    price_change_24h=coin.price_change_24h or 0.0,
                    holders=coin.holders or 0,
                ))
                for flag in risk.flags:
                    await alert_repo.create(
                        coin_symbol=coin.symbol,
                        alert_type=flag,
                        message=f"{coin.symbol}: risk flag '{flag}' triggered (level={risk.risk_level})",
                        severity="warning" if risk.risk_level == "medium" else "critical",
                    )
            except Exception as exc:
                logger.error(f"Error processing {item.get('symbol', '?')}: {exc}")
                continue

    logger.info(f"Worker cycle complete — processed {len(raw_data)} coins.")


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    logger.info(
        f"Worker starting — fetching up to {settings.coingecko_max_pages * 250} meme coins, "
        f"refresh every {settings.signal_refresh_interval_seconds}s"
    )
    while True:
        await run_cycle()
        await asyncio.sleep(settings.signal_refresh_interval_seconds)


if __name__ == "__main__":
    asyncio.run(main())
