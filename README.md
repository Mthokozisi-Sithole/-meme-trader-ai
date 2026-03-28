# MemeTrader AI — Intelligence Terminal

> Real-time meme coin trading signals, DEX scanner, and market intelligence platform.

A full-stack, production-ready system that combines CoinGecko fundamental analysis, DexScreener/Pump.fun sniping, narrative classification, and multi-source on-chain data into actionable trading signals with entry/exit/stop-loss levels and risk management.

> **Not financial advice.** This is a research and analytics tool. Meme coins are extremely high risk. Always DYOR.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Services](#services)
- [Backend API](#backend-api)
- [Scoring Logic](#scoring-logic)
- [Risk Management](#risk-management)
- [Narrative Engine](#narrative-engine)
- [External Data Sources](#external-data-sources)
- [Database Models](#database-models)
- [Frontend Pages](#frontend-pages)
- [Frontend Components](#frontend-components)
- [WebSocket Streams](#websocket-streams)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Architecture Overview

```
Browser (port 3000)
    │
    └── Next.js Web (proxy: /api/* → api:8000)
            │
            ├── FastAPI API (port 8000)
            │       ├── /coins     — CoinGecko coin data
            │       ├── /signals   — Trading signals
            │       ├── /alerts    — Risk alerts
            │       ├── /snipes    — DEX sniping opportunities
            │       ├── /market    — Market intelligence
            │       └── /ws        — WebSocket streams
            │
            ├── Worker (Signal Generation)
            │       └── CoinGecko → Score → Signal → Alert
            │
            └── DEX Worker (Sniping)
                    └── 9 Data Sources → Dedupe → Score → Upsert

Infrastructure: PostgreSQL 16 + Redis 7
```

**Stack:** FastAPI · SQLAlchemy (async) · Alembic · Next.js 14 · React · TypeScript · Tailwind CSS · Docker Compose

---

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd meme-trader-ai

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — add API keys (optional but recommended for more data)

# 3. Start all services
docker compose up --build

# 4. Open the dashboard
open http://localhost:3000
```

The system is fully operational without any API keys — Tier 1 and Tier 2 data sources are free. Add keys to `.env` to unlock additional data pipelines.

---

## Services

| Service | Port | Role |
|---|---|---|
| `postgres` | 5432 | Primary data store (PostgreSQL 16) |
| `redis` | 6379 | Cache / message broker (Redis 7) |
| `api` | 8000 | FastAPI REST + WebSocket backend |
| `worker` | — | CoinGecko signal generation loop (every 30s) |
| `dex-worker` | — | DEX token discovery + scoring loop (every 30s) |
| `web` | 3000 | Next.js frontend (browser only needs port 3000) |

---

## Backend API

Base URL: `http://localhost:3000/api` (proxied through Next.js) or `http://localhost:8000` (direct)

### Health

| Method | Route | Description |
|---|---|---|
| GET | `/health` | DB connectivity check — returns `{status, db}` |

### Coins

| Method | Route | Description |
|---|---|---|
| GET | `/coins` | List all coins — query: `search`, `limit` (max 1000), `offset` |
| GET | `/coins/{symbol}` | Single coin by symbol |
| POST | `/coins` | Create coin (409 if exists) |
| PUT | `/coins/{symbol}` | Upsert coin (full replace) |
| PATCH | `/coins/{symbol}` | Partial update |

### Signals

| Method | Route | Description |
|---|---|---|
| GET | `/signals` | Latest signals — query: `limit` (default 50) |
| GET | `/signals/{symbol}` | Signals for a specific coin |
| POST | `/signals/{symbol}/generate` | Generate and persist a new signal on-demand |

### Alerts

| Method | Route | Description |
|---|---|---|
| GET | `/alerts` | All alerts — query: `unread_only` (bool), `limit` (default 100) |
| GET | `/alerts/coin/{symbol}` | All alerts for a coin |
| PATCH | `/alerts/{id}/read` | Mark a single alert as read |

### Snipes / DEX Tokens

| Method | Route | Description |
|---|---|---|
| GET | `/snipes` | Ranked snipe opportunities (score desc, age ≤48h, limit ≤200) |
| GET | `/snipes/tokens` | All DEX tokens — query: `chain`, `snipe_only`, `min_score`, `search`, `limit` (max 500) |

### Market Intelligence

| Method | Route | Description |
|---|---|---|
| GET | `/market/stats` | Aggregated dashboard stats (signals, dex, alerts, top_tokens) |
| GET | `/market/trending` | Live trending pools — query: `network`, `limit` (max 50) |
| GET | `/market/new-pools` | Newly created pools cross-chain — query: `network`, `limit` (max 50) |
| GET | `/market/score-distribution` | Signal score histogram (10-point buckets 0-100) |
| GET | `/market/narrative-performance` | Per-narrative category analytics |

---

## Scoring Logic

### Signal Score (CoinGecko Coins)

```
Score = (0.35 × sentiment) + (0.25 × technical) + (0.25 × liquidity) + (0.15 × momentum)
```

After risk evaluation: `adjusted_score = max(0, composite − risk_penalty)`

| Sub-score | How it is calculated |
|---|---|
| Sentiment | `50 + (price_change_24h × 0.5)`, clamped 0-100 |
| Technical | Volume/market-cap ratio + trend direction averaged |
| Liquidity | Log scale: `(log10(liquidity_usd) − 3) × 25` — $1k ≈ 20, $50k ≈ 60, $500k = 100 |
| Momentum | Volume momentum vs 24h baseline |

**Bands:**

| Range | Band |
|---|---|
| 80–100 | Strong Buy |
| 60–79 | Watch |
| 40–59 | Risky |
| < 40 | Avoid |

### Snipe Score (DEX Tokens)

```
Score = (0.35 × narrative) + (0.25 × momentum) + (0.25 × liquidity) + (0.15 × risk_adj)
```

| Sub-score | How it is calculated |
|---|---|
| Narrative | Keyword classification score + hype heat bonus (0-100) |
| Momentum | Buy pressure 5m (0-35 pts) + volume acceleration (0-35 pts) + price momentum 5m (0-30 pts) |
| Liquidity | Stepped tiers: <$1k=8, <$5k=20, <$10k=35, <$50k=55, <$100k=70, <$500k=85, ≥$500k=100 |
| Risk Adj. | Base 55 ± age bonus/penalty ± liquidity safety ± social presence ± suspicious pattern penalties |

**Sniping Opportunity Gate** — ALL of the following must be true:

- Composite score ≥ 60
- Liquidity ≥ $4,000
- Token age ≤ 48 hours
- Risk level is not `extreme`
- No `sell_only_pressure` flag
- No `extreme_volume_to_liquidity` flag
- Buy pressure ≥ 52% (when data is available)

**Trade Levels by Band:**

| Band | Exit Targets | Stop-Loss |
|---|---|---|
| Strong Buy | +30% / +60% / +150% | −12% |
| Watch | +20% / +40% / +100% | −18% |
| Risky | +12% / +25% / +60% | −25% |
| Avoid | +5% / +12% / +30% | −35% |

---

## Risk Management

### Risk Flags (Signal Worker — CoinGecko Coins)

| Flag | Trigger | Score Penalty | SL Multiplier |
|---|---|---|---|
| `low_liquidity` | liquidity < $50,000 | −15 pts | 1.5× tighter |
| `whale_concentration` | concentration > 30% | −10 pts | 1.3× tighter |
| `sudden_spike` | price change 24h > 50% | −10 pts | 1.4× tighter |
| `low_holders` | holders < 500 | −5 pts | — |

Risk levels: 0 flags = `low` · 1-2 flags = `medium` · 3+ flags = `high`

Stop-loss formula: `base_pct / sl_tightness` where base is 8% (Strong Buy), 6% (Watch), 4% (Risky), 3% (Avoid)

### Risk Flags (DEX/Snipe Worker)

| Flag | Trigger |
|---|---|
| `low_liquidity` | Liquidity < $3,000 |
| `ultra_new_token` | Token age < 15 minutes |
| `suspicious_price_spike` | 1m price change > 200% |
| `sell_only_pressure` | buys_5m = 0 and sells_5m > 5 |
| `extreme_volume_to_liquidity` | vol_24h / liquidity > 50 |
| `no_social_presence` | No twitter, telegram, or website |

---

## Narrative Engine

Classifies each token into one of 9 narrative categories using keyword matching against symbol + name (case-insensitive):

| Category | Hype Heat | Example Keywords |
|---|---|---|
| AI | +28 pts | ai, gpt, agent, llm, neural, claude, openai, robot, agi, skynet |
| Political | +22 pts | trump, maga, biden, kamala, potus, vote, election, freedom |
| Celebrity | +20 pts | elon, musk, taylor, swift, kanye, grimes, saylor, vitalik |
| Cult | +18 pts | pepe, chad, sigma, wojak, gigachad, degen, wagmi, ngmi, based |
| Animal | +14 pts | doge, shib, inu, dog, cat, frog, bear, bull, ape, gorilla |
| Space | +12 pts | moon, rocket, mars, cosmos, alien, nasa, galaxy, stellar |
| Gaming | +10 pts | game, rpg, warrior, dragon, guild, raid, nft, metaverse, pixel |
| Food | +8 pts | pizza, burger, taco, donut, sushi, ramen, bacon, cookie |
| Finance | +6 pts | defi, yield, stake, dao, vault, swap, treasury, bank |

Hype velocity (0-100) is derived from narrative heat + keyword match density + token age + buy pressure signals.

---

## External Data Sources

The platform uses a tiered architecture and is fully operational with zero API keys.

### Tier 0 — Core (Always Active)

| Source | Env Key | Data |
|---|---|---|
| CoinGecko | `COINGECKO_API_KEY` (optional) | Up to 1,000 meme coins per cycle — price, market cap, volume, ATH/ATL, supply |

### Tier 1 — Free DEX Data (Always Active)

| Source | Key | Data |
|---|---|---|
| DexScreener | None | New pairs + boosted tokens — Solana, ETH, BSC, Base |
| Pump.fun | None | New and trending Solana token launches |
| GeckoTerminal | None | Cross-chain trending and new pools |

### Tier 2 — Free On-Chain Pipelines (Always Active)

| Source | Key | Data |
|---|---|---|
| GMGN.ai | None | Smart money signals, Solana hot tokens by swap activity |
| SolanaFM | None | On-chain Solana token metadata, transfers, mint authority |

### Tier 3 — Optional Keyed Pipelines (Graceful Fallback if No Key)

| Source | Env Key | Data |
|---|---|---|
| Birdeye | `BIRDEYE_API_KEY` | Best-in-class Solana/multi-chain DEX data, whale tracking |
| Moralis | `MORALIS_API_KEY` | EVM multi-chain gainers, trending tokens, wallet analytics (ETH, BSC, Base, Polygon, Arbitrum, Solana) |
| Bitquery | `BITQUERY_API_KEY` | Real-time GraphQL streams, Pump.fun events, dev wallet detection |
| Alchemy | `ALCHEMY_API_KEY` | EVM token prices, transfers, balances (ETH, Base, Polygon, BSC, Arbitrum) |

---

## Database Models

### `coins`

| Column | Type | Description |
|---|---|---|
| symbol | VARCHAR(50) PK | Ticker (e.g. DOGE) |
| name | TEXT | Full name |
| price_usd | FLOAT | Current price |
| market_cap_usd | FLOAT | Market capitalisation |
| market_cap_rank | INT | CoinGecko rank |
| volume_24h_usd | FLOAT | 24h trading volume |
| price_change_24h | FLOAT | 24h % change |
| price_change_7d | FLOAT | 7d % change |
| circulating_supply | FLOAT | Circulating supply |
| holders | INT | Token holder count |
| whale_concentration | FLOAT | Top holder concentration (0.0-1.0) |
| ath / atl | FLOAT | All-time high / all-time low |

### `signals`

| Column | Type | Description |
|---|---|---|
| coin_symbol | VARCHAR(50) FK | Reference to coins |
| score | FLOAT | Composite score (0-100) |
| sentiment_score | FLOAT | Sentiment sub-score |
| technical_score | FLOAT | Technical sub-score |
| liquidity_score | FLOAT | Liquidity sub-score |
| momentum_score | FLOAT | Momentum sub-score |
| band | TEXT | Strong Buy / Watch / Risky / Avoid |
| entry_low / entry_high | FLOAT | Entry price range |
| exit_target | FLOAT | Exit price target |
| stop_loss | FLOAT | Stop-loss level |
| risk_level | TEXT | low / medium / high |
| risk_flags | JSON | Array of triggered flags |
| reasoning | TEXT | Human-readable explanation |

### `alerts`

| Column | Type | Description |
|---|---|---|
| coin_symbol | VARCHAR(50) FK | Reference to coins |
| alert_type | TEXT | whale_concentration / low_liquidity / spike / low_holders |
| message | TEXT | Alert description |
| severity | TEXT | info / warning / critical |
| is_read | BOOL | Read state |

### `dex_tokens`

| Column | Type | Description |
|---|---|---|
| chain | TEXT | solana / ethereum / bsc / base |
| token_address | TEXT | On-chain address (unique with chain) |
| symbol / name | TEXT | Token identifiers |
| source | TEXT | dexscreener / pumpfun / geckoterminal / etc. |
| price_usd | FLOAT | Current price |
| liquidity_usd | FLOAT | Pool liquidity |
| market_cap / fdv | FLOAT | Market cap / fully diluted value |
| volume_1m/5m/1h/6h/24h | FLOAT | Volume by timeframe |
| buys_1m/5m/1h / sells_1m/5m/1h | INT | Transaction counts by timeframe |
| price_change_1m/5m/1h/24h | FLOAT | % price changes by timeframe |
| token_age_hours | FLOAT | Age since pair creation |
| narrative_category | TEXT | AI / Political / Cult / Animal / Space / Celebrity / Gaming / Food / Finance |
| hype_velocity | FLOAT | Narrative hype score (0-100) |
| snipe_score | FLOAT | Composite snipe score (0-100) |
| narrative_score | FLOAT | Narrative sub-score |
| momentum_score | FLOAT | Momentum sub-score |
| liquidity_score | FLOAT | Liquidity sub-score |
| risk_score | FLOAT | Risk adjustment sub-score |
| band | TEXT | Strong Buy / Watch / Risky / Avoid |
| sniping_opportunity | BOOL | Passed all 7 sniping gate criteria |
| entry_low / entry_high | FLOAT | Entry price range |
| exit_target_1 / 2 / 3 | FLOAT | Three tiered exit targets |
| stop_loss | FLOAT | Stop-loss level |
| risk_level | TEXT | low / medium / high / extreme |
| risk_flags / warnings | JSON | Triggered flags + warning messages |
| reasoning | TEXT | Trade rationale |
| has_twitter / telegram / website | BOOL | Social presence indicators |
| is_boosted | BOOL | DexScreener boost active |
| large_tx_detected | BOOL | Whale transaction detected |

---

## Frontend Pages

### `/` — Intelligence Terminal
- Real-time stat tiles: signal count by band, avg score
- DEX metrics: snipe opportunity count, strong buy count
- Narrative breakdown + chain distribution
- Top 5 scoring tokens table
- Narrative Heatmap — category performance grid with color intensity
- WebSocket-driven — all data refreshes every 5 seconds without page reload

### `/sniper` — DEX Scanner
- Live table of all tracked DEX tokens sorted by snipe score
- Filter by chain (SOL / ETH / BSC / BASE), band, min score, token age window
- One-click Analytics Presets: Extreme Potential, Safe Snipers, High Hype, Fresh Pairs, Strong Momentum
- Expandable row detail: score breakdown bars, full trade levels (Entry / T1 / T2 / T3 / SL), market data, risk flags, social links, DexScreener link
- Buy pressure bar (5m window with visual percentage)
- Live scrolling ticker strip (WebSocket-fed, top opportunities)
- WebSocket primary data source, SWR polling fallback

### `/analytics` — Market Analytics
- SVG-based charts (no external charting library):
  - Score distribution histogram (10 buckets across 0-100)
  - Narrative category breakdown: total tokens, opportunities, avg scores, momentum
  - Band distribution (Strong Buy / Watch / Risky / Avoid)
  - Chain distribution (Solana / ETH / BSC / Base)
- Narrative performance table
- Trending pools and new pools tables

### `/tokens` — DEX Tokens
- Full DEX token list with search, chain filter, and snipe-only toggle
- Responsive table: score, band, price, price changes, volume, liquidity, buy pressure, narrative badge

### `/coins` — Meme Coins
- CoinGecko-sourced coin list (up to 1,000 coins)
- Search by symbol or name
- Price, 24h %, 7d %, market cap, volume, circulating supply
- Links to individual coin detail pages

### `/alerts` — Risk Alerts
- Severity-coded alert list (info / warning / critical)
- Mark individual alerts read or mark all read at once
- Unread count badge shown in the navigation bar

### `/coins/[symbol]` — Coin Detail
- Signal history for individual coin
- Risk breakdown and score context

---

## Frontend Components

| Component | Description |
|---|---|
| `Nav` | Sticky nav bar — hamburger menu on mobile, desktop links, live UTC clock, unread alert badge |
| `LiveTicker` | Auto-scrolling ticker strip of top sniping opportunities (WebSocket-fed) |
| `NarrativeHeatmap` | Color-intensity grid showing performance per narrative category |
| `FilterPresetPicker` | One-click preset filter buttons with live match counts per preset |
| `ScoreRing` | Circular SVG score indicator (0-100) with band-appropriate color |
| `ScoreBar` | Linear progress bar for score sub-components |
| `AlertsList` | Severity-styled alert list with dismiss actions |
| `SignalTable` | Reusable table component for signal display |
| `SignalCard` | Signal card with composite + sub-score breakdown |
| `RiskBadge` | Color-coded risk level indicator (low / medium / high / extreme) |

---

## WebSocket Streams

All streams follow the same pattern: **snapshot on connect**, then **full updates every 5 seconds**.

### `/ws/signals`
```json
{ "type": "snapshot", "ts": "2025-01-01T00:00:00Z", "data": [...] }
{ "type": "update",   "ts": "2025-01-01T00:00:05Z", "data": [...] }
```

### `/ws/snipes`
```json
{ "type": "snapshot", "ts": "...", "data": [...], "count": 142 }
{ "type": "update",   "ts": "...", "data": [...], "count": 145 }
```

### `/ws/ticker`
Lightweight stream — top 20 tokens only, minimal payload:
```json
{ "type": "ticker", "ts": "...", "items": [{ "symbol", "chain", "score", "price_change_1h", "band" }] }
```

The WebSocket URL is derived from `window.location.hostname` at runtime so it works from any host without requiring build-time environment variables.

---

## Configuration

All thresholds are tunable in `backend/app/core/config.py` (pydantic-settings, reads from `.env`):

| Setting | Default | Description |
|---|---|---|
| `min_liquidity_usd` | 50,000 | Risk flag threshold for low liquidity |
| `whale_concentration_threshold` | 0.30 | Whale flag trigger (30%) |
| `spike_threshold` | 0.50 | Sudden spike flag trigger (50% price change) |
| `min_holders` | 500 | Low holders flag trigger |
| `coingecko_max_pages` | 4 | Pages to fetch per cycle (250/page = 1,000 coins) |
| `signal_refresh_interval_seconds` | 30 | Worker cycle interval |

---

## Environment Variables

```env
# Required
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/memetrader
REDIS_URL=redis://redis:6379/0

# Optional — higher CoinGecko rate limits
COINGECKO_API_KEY=

# Optional — Tier 3 data pipelines (platform works without these)
BIRDEYE_API_KEY=
MORALIS_API_KEY=
BITQUERY_API_KEY=
ALCHEMY_API_KEY=

# Tuning
SIGNAL_REFRESH_INTERVAL_SECONDS=30
COINGECKO_MAX_PAGES=4
DEBUG=false
```

---

## Project Structure

```
meme-trader-ai/
├── backend/
│   ├── app/
│   │   ├── core/              # Config, database session
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── repositories/      # Database access layer
│   │   ├── services/
│   │   │   ├── scoring.py         # Composite score formula
│   │   │   ├── risk.py            # Risk flags + stop-loss calculation
│   │   │   ├── signal_service.py  # Full signal generation pipeline
│   │   │   ├── snipe_scorer.py    # DEX token composite scoring
│   │   │   └── narrative_engine.py # Category keyword classification
│   │   ├── routes/            # FastAPI routers (coins, signals, alerts, snipes, market, ws, health)
│   │   ├── worker/
│   │   │   ├── tasks.py           # CoinGecko signal generation loop
│   │   │   ├── dex_tasks.py       # DEX token discovery loop
│   │   │   └── pipelines/         # Per-source data pipeline modules
│   │   └── main.py            # FastAPI app + CORS middleware
│   ├── alembic/               # Database migrations
│   └── Dockerfile
├── web/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx               # Terminal dashboard
│   │   ├── sniper/page.tsx        # DEX Scanner
│   │   ├── analytics/page.tsx     # Analytics charts
│   │   ├── tokens/page.tsx        # DEX Tokens list
│   │   ├── coins/page.tsx         # CoinGecko coins
│   │   └── alerts/page.tsx        # Risk alerts
│   ├── components/            # Reusable React components
│   ├── lib/                   # API client, WebSocket hook, filter presets
│   ├── types/                 # TypeScript type definitions
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## License

MIT
