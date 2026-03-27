"""
WebSocket endpoints for real-time streaming of signals and snipes.
Clients receive JSON push events whenever data updates.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.database import get_db
from app.repositories.signal_repo import SignalRepository
from app.repositories.dex_token_repo import DexTokenRepository
from app.schemas.signal import SignalOut
from app.schemas.dex_token import DexTokenOut

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


class ConnectionManager:
    def __init__(self):
        self._connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self._connections.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self._connections:
            self._connections.remove(ws)


signals_manager = ConnectionManager()
snipes_manager = ConnectionManager()


async def _db_signals(limit: int = 50) -> list[dict]:
    async for db in get_db():
        try:
            repo = SignalRepository(db)
            signals = await repo.get_latest(limit=limit)
            return [SignalOut.from_orm_model(s).model_dump() for s in signals]
        except Exception as exc:
            logger.error(f"WS db_signals error: {exc}")
            return []


async def _db_snipes(limit: int = 200) -> list[dict]:
    async for db in get_db():
        try:
            repo = DexTokenRepository(db)
            # Stream ALL tracked tokens so the UI always has data.
            # sniping_opportunity flag is preserved for highlighting.
            tokens = await repo.get_all(limit=limit)
            return [DexTokenOut.model_validate(t).model_dump() for t in tokens]
        except Exception as exc:
            logger.error(f"WS db_snipes error: {exc}")
            return []


@router.websocket("/ws/signals")
async def ws_signals(websocket: WebSocket):
    """Stream live trading signals. Snapshot on connect, then updates every 15s."""
    await signals_manager.connect(websocket)
    try:
        data = await _db_signals()
        await websocket.send_text(json.dumps(
            {"type": "snapshot", "ts": datetime.now(timezone.utc).isoformat(), "data": data},
            default=str,
        ))

        while True:
            await asyncio.sleep(5)
            data = await _db_signals()
            await websocket.send_text(json.dumps(
                {"type": "update", "ts": datetime.now(timezone.utc).isoformat(), "data": data},
                default=str,
            ))
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.debug(f"WS signals stream error: {exc}")
    finally:
        signals_manager.disconnect(websocket)


@router.websocket("/ws/snipes")
async def ws_snipes(websocket: WebSocket):
    """Stream live DEX snipe opportunities. Snapshot on connect, then updates every 10s."""
    await snipes_manager.connect(websocket)
    try:
        data = await _db_snipes()
        await websocket.send_text(json.dumps(
            {"type": "snapshot", "ts": datetime.now(timezone.utc).isoformat(), "data": data},
            default=str,
        ))

        while True:
            await asyncio.sleep(5)
            data = await _db_snipes()
            await websocket.send_text(json.dumps(
                {"type": "update", "ts": datetime.now(timezone.utc).isoformat(), "data": data, "count": len(data)},
                default=str,
            ))
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.debug(f"WS snipes stream error: {exc}")
    finally:
        snipes_manager.disconnect(websocket)


@router.websocket("/ws/ticker")
async def ws_ticker(websocket: WebSocket):
    """Lightweight ticker: top 10 scoring tokens every 5 seconds."""
    await websocket.accept()
    try:
        while True:
            async for db in get_db():
                try:
                    repo = DexTokenRepository(db)
                    tokens = await repo.get_all(limit=20)
                    items = [
                        {
                            "symbol": t.symbol,
                            "chain": t.chain,
                            "score": t.snipe_score,
                            "price_change_1h": t.price_change_1h,
                            "band": t.band,
                        }
                        for t in tokens
                    ]
                    await websocket.send_text(json.dumps(
                        {"type": "ticker", "ts": datetime.now(timezone.utc).isoformat(), "items": items},
                        default=str,
                    ))
                except Exception as exc:
                    logger.debug(f"WS ticker db error: {exc}")
                break
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
