"""Integration tests for API endpoints using in-memory SQLite."""
import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_coins_empty(client: AsyncClient):
    resp = await client.get("/coins/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_coin(client: AsyncClient):
    payload = {
        "symbol": "PEPE",
        "name": "Pepe",
        "price_usd": 0.000001,
        "market_cap_usd": 100_000_000,
        "volume_24h_usd": 10_000_000,
        "liquidity_usd": 500_000,
        "holders": 50_000,
        "whale_concentration": 0.10,
        "price_change_24h": 15.0,
    }
    resp = await client.post("/coins/", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["symbol"] == "PEPE"


@pytest.mark.asyncio
async def test_create_coin_duplicate(client: AsyncClient):
    payload = {
        "symbol": "DOGE",
        "name": "Dogecoin",
        "price_usd": 0.12,
    }
    resp = await client.post("/coins/", json=payload)
    assert resp.status_code == 201
    resp2 = await client.post("/coins/", json=payload)
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_get_coin_not_found(client: AsyncClient):
    resp = await client.get("/coins/UNKNOWN")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_generate_signal(client: AsyncClient):
    # Create coin first
    payload = {
        "symbol": "SHIB",
        "name": "Shiba Inu",
        "price_usd": 0.00001,
        "market_cap_usd": 5_000_000_000,
        "volume_24h_usd": 200_000_000,
        "liquidity_usd": 1_000_000,
        "holders": 100_000,
        "whale_concentration": 0.12,
        "price_change_24h": 5.0,
    }
    create_resp = await client.post("/coins/", json=payload)
    assert create_resp.status_code == 201

    # Generate signal
    resp = await client.post("/signals/SHIB/generate")
    assert resp.status_code == 201
    data = resp.json()
    assert data["coin_symbol"] == "SHIB"
    assert "band" in data
    assert "trade_levels" in data
    assert "score_breakdown" in data
    assert data["trade_levels"]["stop_loss"] < data["trade_levels"]["entry_low"]
    assert data["trade_levels"]["exit_target"] > data["trade_levels"]["entry_high"]


@pytest.mark.asyncio
async def test_generate_signal_coin_not_found(client: AsyncClient):
    resp = await client.post("/signals/NOTACOIN/generate")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_signals_empty(client: AsyncClient):
    resp = await client.get("/signals/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_alerts_empty(client: AsyncClient):
    resp = await client.get("/alerts/")
    assert resp.status_code == 200
    assert resp.json() == []
