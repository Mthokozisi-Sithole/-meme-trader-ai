"""Tests for signal generation service."""
import json
import pytest
from unittest.mock import MagicMock

from app.services.signal_service import generate_signal, SignalContext
from app.models.coin import Coin


def make_coin(**kwargs) -> Coin:
    defaults = dict(
        id=1,
        symbol="PEPE",
        name="Pepe",
        price_usd=0.000001,
        price_change_24h=15.0,
        volume_24h_usd=10_000_000,
        liquidity_usd=500_000,
        market_cap_usd=100_000_000,
        holders=50_000,
        whale_concentration=0.10,
    )
    defaults.update(kwargs)
    coin = MagicMock(spec=Coin)
    for k, v in defaults.items():
        setattr(coin, k, v)
    return coin


class TestSignalService:
    def test_returns_signal_create(self):
        coin = make_coin()
        result = generate_signal(SignalContext(coin=coin))
        assert result.coin_symbol == "PEPE"
        assert 0 <= result.score <= 100
        assert result.band in ("Strong Buy", "Watch", "Risky", "Avoid")

    def test_entry_straddles_price(self):
        price = 0.000001
        coin = make_coin(price_usd=price)
        result = generate_signal(SignalContext(coin=coin))
        assert result.entry_low < price
        assert result.entry_high > price

    def test_exit_above_entry(self):
        coin = make_coin()
        result = generate_signal(SignalContext(coin=coin))
        assert result.exit_target > result.entry_high

    def test_stop_loss_below_entry(self):
        coin = make_coin()
        result = generate_signal(SignalContext(coin=coin))
        assert result.stop_loss < result.entry_low

    def test_risk_flags_serialized_json(self):
        coin = make_coin(liquidity_usd=100, whale_concentration=0.8, price_change_24h=70.0)
        result = generate_signal(SignalContext(coin=coin))
        flags = json.loads(result.risk_flags)
        assert isinstance(flags, list)
        assert len(flags) > 0

    def test_reasoning_non_empty(self):
        coin = make_coin()
        result = generate_signal(SignalContext(coin=coin))
        assert len(result.reasoning) > 20

    def test_risk_penalizes_score(self):
        clean = make_coin(liquidity_usd=1_000_000, whale_concentration=0.05, price_change_24h=5.0)
        risky = make_coin(liquidity_usd=100, whale_concentration=0.9, price_change_24h=80.0)
        clean_result = generate_signal(SignalContext(coin=clean))
        risky_result = generate_signal(SignalContext(coin=risky))
        assert clean_result.score > risky_result.score
