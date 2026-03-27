from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Meme Trader AI"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/memetrader"
    redis_url: str = "redis://localhost:6379/0"

    # External market data
    coingecko_api_key: str = ""
    coingecko_base_url: str = "https://api.coingecko.com/api/v3"
    # Number of pages to fetch from CoinGecko (250 coins/page)
    coingecko_max_pages: int = 4

    # Tier 1 — Core data pipelines (API keys optional, skip gracefully if absent)
    birdeye_api_key: str = ""      # birdeye.so — best Solana new pairs + whale tracking
    moralis_api_key: str = ""      # moralis.io — multi-chain gainers/trending
    bitquery_api_key: str = ""     # bitquery.io — real-time GraphQL streams, Pump.fun events

    # Tier 2 — EVM infrastructure
    alchemy_api_key: str = ""      # alchemy.com — EVM token prices + whale detection

    # Free pipelines (no key needed): GMGN, SolanaFM, GeckoTerminal, DexScreener

    # Worker
    signal_refresh_interval_seconds: int = 30  # 30s scan cycle

    # Risk thresholds
    whale_concentration_threshold: float = 0.30
    spike_threshold: float = 0.50
    min_holders: int = 500
    min_liquidity_usd: float = 50_000.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
