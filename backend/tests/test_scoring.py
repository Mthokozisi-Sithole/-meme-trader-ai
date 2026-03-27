"""Tests for the scoring engine and risk manager."""
import pytest
from app.services.scoring import ScoreInput, compute_score, score_to_band, _clamp
from app.services.risk import RiskInput, evaluate_risk, build_sl, build_exit


class TestScoreEngine:
    def _base_input(self, **kwargs) -> ScoreInput:
        base = dict(
            price_usd=0.000001,
            price_change_24h=10.0,
            volume_24h_usd=5_000_000,
            liquidity_usd=500_000,
            market_cap_usd=50_000_000,
            holders=10_000,
            whale_concentration=0.15,
        )
        base.update(kwargs)
        return ScoreInput(**base)

    def test_score_range(self):
        result = compute_score(self._base_input())
        assert 0 <= result.composite <= 100

    def test_component_weights_sum_to_one(self):
        from app.services.scoring import WEIGHT_SENTIMENT, WEIGHT_TECHNICAL, WEIGHT_LIQUIDITY, WEIGHT_MOMENTUM
        total = WEIGHT_SENTIMENT + WEIGHT_TECHNICAL + WEIGHT_LIQUIDITY + WEIGHT_MOMENTUM
        assert abs(total - 1.0) < 1e-9

    def test_sentiment_override(self):
        high = compute_score(self._base_input(sentiment_override=100))
        low = compute_score(self._base_input(sentiment_override=0))
        assert high.composite > low.composite

    def test_high_liquidity_better_score(self):
        low_liq = compute_score(self._base_input(liquidity_usd=1_000))
        high_liq = compute_score(self._base_input(liquidity_usd=10_000_000))
        assert high_liq.composite > low_liq.composite

    def test_band_strong_buy(self):
        assert score_to_band(85) == "Strong Buy"

    def test_band_watch(self):
        assert score_to_band(70) == "Watch"

    def test_band_risky(self):
        assert score_to_band(50) == "Risky"

    def test_band_avoid(self):
        assert score_to_band(30) == "Avoid"

    def test_band_boundaries(self):
        assert score_to_band(80) == "Strong Buy"
        assert score_to_band(79) == "Watch"
        assert score_to_band(60) == "Watch"
        assert score_to_band(59) == "Risky"
        assert score_to_band(40) == "Risky"
        assert score_to_band(39) == "Avoid"

    def test_clamp(self):
        assert _clamp(150) == 100
        assert _clamp(-10) == 0
        assert _clamp(50) == 50


class TestRiskManager:
    def _base_input(self, **kwargs) -> RiskInput:
        base = dict(
            liquidity_usd=500_000,
            whale_concentration=0.1,
            price_change_24h=5.0,
            holders=2_000,
        )
        base.update(kwargs)
        return RiskInput(**base)

    def test_no_flags_clean(self):
        result = evaluate_risk(self._base_input())
        assert result.flags == []
        assert result.risk_level == "low"

    def test_low_liquidity_flag(self):
        result = evaluate_risk(self._base_input(liquidity_usd=1_000))
        assert "low_liquidity" in result.flags

    def test_whale_concentration_flag(self):
        result = evaluate_risk(self._base_input(whale_concentration=0.5))
        assert any("whale_concentration" in f for f in result.flags)

    def test_spike_flag(self):
        result = evaluate_risk(self._base_input(price_change_24h=60.0))
        assert "sudden_spike" in result.flags

    def test_low_holders_flag(self):
        result = evaluate_risk(self._base_input(holders=100))
        assert "low_holders" in result.flags

    def test_multiple_flags_high_risk(self):
        result = evaluate_risk(self._base_input(
            liquidity_usd=1_000,
            whale_concentration=0.5,
            price_change_24h=60.0,
            holders=50,
        ))
        assert result.risk_level == "high"
        assert result.score_penalty > 0

    def test_sl_below_price(self):
        sl = build_sl(price=1.0, band="Strong Buy", sl_tightness=1.0)
        assert sl < 1.0

    def test_sl_tighter_with_higher_tightness(self):
        normal = build_sl(1.0, "Watch", 1.0)
        tight = build_sl(1.0, "Watch", 2.0)
        assert tight > normal  # tighter = closer to price = higher value

    def test_exit_above_price(self):
        exit_price = build_exit(price=1.0, band="Strong Buy")
        assert exit_price > 1.0

    def test_exit_scales_with_band(self):
        strong = build_exit(1.0, "Strong Buy")
        avoid = build_exit(1.0, "Avoid")
        assert strong > avoid
