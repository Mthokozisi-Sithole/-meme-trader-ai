from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import health, coins, signals, alerts, snipes, market, ws
from app.routes import wallets, behavioral, liquidity
from app.routes import analytics_lln


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    description="Meme coin trading intelligence — CoinGecko signals + DexScreener/Pump.fun sniping.",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(coins.router, prefix="/coins")
app.include_router(signals.router, prefix="/signals")
app.include_router(alerts.router, prefix="/alerts")
app.include_router(snipes.router, prefix="/snipes")
app.include_router(market.router, prefix="/market")
app.include_router(ws.router)
app.include_router(wallets.router, prefix="/wallets")
app.include_router(behavioral.router, prefix="/behavioral")
app.include_router(liquidity.router, prefix="/liquidity")
app.include_router(analytics_lln.router)
