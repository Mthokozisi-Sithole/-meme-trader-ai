"""
Market intelligence endpoints — real-time stats, narrative breakdowns,
trending pools from GeckoTerminal + DexScreener.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case

from app.core.database import get_db
from app.models.dex_token import DexToken
from app.models.signal import Signal
from app.models.alert import Alert
from app.services import geckoterm_client

logger = logging.getLogger(__name__)
router = APIRouter(tags=["market"])


@router.get("/stats")
async def market_stats(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Aggregated market intelligence stats for the dashboard header."""

    # Signal stats
    total_signals_q = await db.execute(select(func.count()).select_from(Signal))
    total_signals = total_signals_q.scalar() or 0

    band_counts_q = await db.execute(
        select(Signal.band, func.count().label("cnt"))
        .group_by(Signal.band)
    )
    band_counts: dict[str, int] = {row.band: row.cnt for row in band_counts_q}

    avg_score_q = await db.execute(
        select(func.avg(Signal.score))
    )
    avg_score = round(float(avg_score_q.scalar() or 0), 1)

    # DexToken narrative breakdown
    narrative_q = await db.execute(
        select(
            DexToken.narrative_category,
            func.count().label("cnt"),
            func.avg(DexToken.snipe_score).label("avg_score"),
        )
        .where(DexToken.narrative_category.isnot(None))
        .group_by(DexToken.narrative_category)
        .order_by(func.count().desc())
    )
    narratives = [
        {
            "category": row.narrative_category,
            "count": row.cnt,
            "avg_score": round(float(row.avg_score or 0), 1),
        }
        for row in narrative_q
    ]

    # Chain breakdown
    chain_q = await db.execute(
        select(DexToken.chain, func.count().label("cnt"))
        .group_by(DexToken.chain)
        .order_by(func.count().desc())
    )
    chains = [{"chain": r.chain, "count": r.cnt} for r in chain_q]

    # Unread alerts
    alerts_q = await db.execute(
        select(func.count()).select_from(Alert).where(Alert.is_read == False)  # noqa: E712
    )
    unread_alerts = alerts_q.scalar() or 0

    # Strong buys in DEX scanner
    strong_buys_q = await db.execute(
        select(func.count()).select_from(DexToken)
        .where(DexToken.band == "Strong Buy")
        .where(DexToken.sniping_opportunity == True)  # noqa: E712
    )
    dex_strong_buys = strong_buys_q.scalar() or 0

    # Scored tokens total (have a snipe_score)
    snipe_ops_q = await db.execute(
        select(func.count()).select_from(DexToken)
        .where(DexToken.snipe_score.isnot(None))
    )
    snipe_ops = snipe_ops_q.scalar() or 0

    # Top scoring tokens (all tracked, ranked by score)
    top_tokens_q = await db.execute(
        select(DexToken)
        .where(DexToken.snipe_score.isnot(None))
        .order_by(DexToken.snipe_score.desc())
        .limit(5)
    )
    top_tokens = [
        {
            "symbol": t.symbol,
            "chain": t.chain,
            "score": t.snipe_score,
            "band": t.band,
            "narrative": t.narrative_category,
            "price_change_1h": t.price_change_1h,
            "liquidity_usd": t.liquidity_usd,
        }
        for t in top_tokens_q.scalars()
    ]

    return {
        "signals": {
            "total": total_signals,
            "band_counts": band_counts,
            "avg_score": avg_score,
        },
        "dex": {
            "snipe_opportunities": snipe_ops,
            "strong_buys": dex_strong_buys,
            "narratives": narratives,
            "chains": chains,
        },
        "alerts": {"unread": unread_alerts},
        "top_tokens": top_tokens,
    }


@router.get("/trending")
async def trending_pools(
    network: str = Query("solana", description="Network: solana, eth, bsc, base"),
    limit: int = Query(20, le=50),
) -> list[dict]:
    """Live trending pools from GeckoTerminal."""
    try:
        if network == "all":
            pools = await geckoterm_client.fetch_trending_pools(limit=limit)
        else:
            pools = await geckoterm_client.fetch_top_pools_by_network(network, limit=limit)
        return [p for p in pools if p]
    except Exception as exc:
        logger.error(f"Trending pools error: {exc}")
        return []


@router.get("/new-pools")
async def new_pools(
    network: str = Query("all", description="Network or 'all'"),
    limit: int = Query(20, le=50),
) -> list[dict]:
    """Newly created pools from GeckoTerminal — real-time discovery."""
    try:
        if network == "all":
            pools = await geckoterm_client.fetch_all_new_pools()
        else:
            pools = await geckoterm_client.fetch_new_pools(network=network, limit=limit)
        # Enrich with narrative scoring
        from app.services.narrative_engine import classify_narrative, score_narrative
        from app.services.snipe_scorer import score_snipe

        enriched = []
        for p in pools:
            if not p:
                continue
            text_input = f"{p.get('symbol', '')} {p.get('name', '')}".lower()
            narrative = classify_narrative(text_input)
            p["narrative_category"] = narrative["category"]
            p["narrative_score"] = score_narrative(text_input)
            enriched.append(p)

        enriched.sort(key=lambda x: x.get("volume_1h") or 0, reverse=True)
        return enriched[:limit]
    except Exception as exc:
        logger.error(f"New pools error: {exc}")
        return []


@router.get("/score-distribution")
async def score_distribution(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """Score distribution histogram for signals."""
    buckets = [
        (0, 10), (10, 20), (20, 30), (30, 40), (40, 50),
        (50, 60), (60, 70), (70, 80), (80, 90), (90, 101),
    ]
    result = []
    for lo, hi in buckets:
        q = await db.execute(
            select(func.count()).select_from(Signal)
            .where(Signal.score >= lo)
            .where(Signal.score < hi)
        )
        result.append({"range": f"{lo}-{hi - 1}", "count": q.scalar() or 0})
    return result


@router.get("/narrative-performance")
async def narrative_performance(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """Per-narrative avg scores and opportunity counts from DEX scanner."""
    q = await db.execute(
        select(
            DexToken.narrative_category,
            func.count().label("total"),
            func.sum(
                case((DexToken.sniping_opportunity == True, 1), else_=0)  # noqa: E712
            ).label("opportunities"),
            func.avg(DexToken.snipe_score).label("avg_score"),
            func.avg(DexToken.momentum_score).label("avg_momentum"),
            func.avg(DexToken.narrative_score).label("avg_narrative"),
        )
        .where(DexToken.narrative_category.isnot(None))
        .group_by(DexToken.narrative_category)
        .order_by(func.avg(DexToken.snipe_score).desc())
    )
    return [
        {
            "category": r.narrative_category,
            "total": r.total,
            "opportunities": int(r.opportunities or 0),
            "avg_score": round(float(r.avg_score or 0), 1),
            "avg_momentum": round(float(r.avg_momentum or 0), 1),
            "avg_narrative": round(float(r.avg_narrative or 0), 1),
        }
        for r in q
    ]
