<div align="center">

# ⚡ MemeTrader AI — Intelligence Terminal

### Real-time meme coin trading signals · DEX scanner · Behavioral intelligence · LLN Quant Engine · Market analytics

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Helm-326CE5?style=flat-square&logo=kubernetes&logoColor=white)](https://helm.sh)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-GHCR-2088FF?style=flat-square&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

A full-stack, production-ready system that combines CoinGecko fundamental analysis, DexScreener/Pump.fun sniping, narrative classification, behavioral pattern detection, wallet intelligence, and multi-source on-chain data from **10 different providers** into actionable trading signals with precise entry/exit/stop-loss levels, risk management, and a live dark-terminal dashboard. A **Law of Large Numbers (LLN) Quant Engine** runs as a sidecar worker — computing Monte Carlo simulations, Bayesian win-rate estimates, Expected Value, Sharpe/Sortino ratios, and regime detection over accumulated signal outcomes. Deployable via Docker Compose or Kubernetes/Helm.

</div>

> [!WARNING]
> **Not financial advice.** This is a research and analytics tool. Meme coins are extremely high risk. Trading based on signals from any tool, including this one, can result in total loss of capital. Always do your own research (DYOR).

---

## 🧠 What Is This?

MemeTrader AI is a platform built for people who want to track and analyse meme coin opportunities in real time. It works like this:

1. **Three background workers run continuously.** One fetches data from CoinGecko (up to 1,000 coins), the second scans DexScreener, Pump.fun, GeckoTerminal, and up to 7 other sources for newly launched DEX tokens, and the third detects behavioral patterns and tracks liquidity changes in real time.
2. **Every token gets scored** using a multi-factor algorithm that considers narrative strength, price momentum, liquidity depth, and risk-adjusted safety.
3. **Signals are generated** — each one includes a band (Strong Buy / Watch / Risky / Avoid), a composite score (0-100), entry price range, three exit targets, a stop-loss level, and a plain-English reasoning text.
4. **Risk flags are raised automatically** when dangerous conditions are detected — whale concentration, low liquidity, sudden price spikes, sell-only pressure, suspicious volume, etc.
5. **Behavioral patterns are detected** — accumulation, pre-breakout, fake breakout, liquidity traps, wash trading, momentum ignition, and more are classified and stored as active signals.
6. **Wallet intelligence** classifies addresses into smart money, dev, bot, whale, sniper, dumper, and retail categories with a quality score.
7. **Liquidity events are tracked** — every significant liquidity change (>5%) is recorded and assessed for rug-pull risk.
8. **Everything streams live to a web dashboard** via WebSocket. No page refresh needed.
9. **The LLN Quant Engine runs in the background** — every 60 seconds it analyses accumulated signal outcomes, computes Expected Value, Sharpe/Sortino ratios, Monte Carlo survival probabilities, Bayesian confidence intervals, regime detection, and feature importance. Results surface in the **/lln** section of the dashboard.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Docker Services](#docker-services)
- [Background Workers](#background-workers)
- [Backend API — All Endpoints](#backend-api--all-endpoints)
- [LLN Quant Engine — Analytics API](#lln-quant-engine--analytics-api)
- [Scoring Logic — How Signals Are Calculated](#scoring-logic--how-signals-are-calculated)
- [Risk Management — Flags, Penalties, Stop-Loss](#risk-management--flags-penalties-stop-loss)
- [Narrative Engine — Category Classification](#narrative-engine--category-classification)
- [Snipe Scorer — DEX Token Scoring](#snipe-scorer--dex-token-scoring)
- [Signal Service — Trade Level Generation](#signal-service--trade-level-generation)
- [External Data Sources](#external-data-sources)
- [Database Models — Full Schema](#database-models--full-schema)
- [WebSocket Streams](#websocket-streams)
- [Frontend Pages](#frontend-pages)
- [Frontend Components](#frontend-components)
- [Configuration — All Tunable Settings](#configuration--all-tunable-settings)
- [Environment Variables](#environment-variables)
- [Rate Limiting Awareness](#rate-limiting-awareness)
- [Kubernetes & Helm Deployment](#kubernetes--helm-deployment)
- [CI/CD — GitHub Actions](#cicd--github-actions)
- [Project Structure](#project-structure)
- [License](#-license)

---

## ✨ Highlights

| | Feature | Detail |
|---|---|---|
| 📡 | **10 Data Sources** | CoinGecko, DexScreener, Pump.fun, GeckoTerminal, GMGN, SolanaFM, Birdeye, Moralis, Bitquery, Alchemy |
| ⚡ | **Live WebSocket Streams** | 3 real-time streams — signals, DEX snipes, ticker — snapshot on connect + 5s updates |
| 🧠 | **Narrative Intelligence** | 9-category keyword classifier (AI · Political · Cult · Animal · Space · Celebrity · Gaming · Food · Finance) |
| 📊 | **Multi-Factor Scoring** | Composite algorithm: sentiment + technical + liquidity + momentum, all 0–100 |
| 🛡️ | **Automatic Risk Flags** | 10 risk conditions detected — penalties applied, stop-loss tightened, alerts raised |
| 🎯 | **7-Gate Snipe Filter** | Only the best DEX opportunities surface — all 7 criteria must pass simultaneously |
| 🔁 | **30-Second Cycles** | Both workers scan and score continuously — data is never more than 30 seconds stale |
| 📱 | **Fully Responsive UI** | Works on desktop, tablet, and mobile — hamburger nav, progressive column hiding |
| 🐳 | **One-Command Deploy** | `docker compose up --build` — 7 containers, zero manual setup |
| ☸️ | **Kubernetes / Helm** | Full Helm chart for K8s deployment — Deployments, StatefulSets, Services, Secrets, ConfigMaps |
| 🔄 | **CI/CD Pipeline** | GitHub Actions workflow builds and pushes images to GHCR on every push to main |
| 🔑 | **Zero-Key Operation** | Fully functional with no API keys — Tier 1 & 2 sources are always free |
| 🧬 | **Behavioral Intelligence** | 9 on-chain pattern types detected: accumulation, wash trading, rug pattern, momentum ignition, and more |
| 👛 | **Wallet Classification** | Classifies wallets into 8 types (smart money, dev, whale, bot, sniper…) with a 0-100 quality score |
| 💧 | **Liquidity Tracking** | Real-time liquidity event detection — flags rug patterns, dev removals, and LP lock changes |
| 📐 | **LLN Quant Engine** | Law of Large Numbers sidecar — Monte Carlo simulations, Bayesian win-rate, EV, Sharpe, Sortino, regime detection, feature importance |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER  (Windows / Mac / Mobile — only needs port 3000)       │
└─────────────────────────┬───────────────────────────────────────┘
                          │  HTTP/WebSocket to :3000
┌─────────────────────────▼───────────────────────────────────────┐
│  NEXT.JS WEB  (port 3000)                                       │
│  Serves React UI + proxies /api/* → http://api:8000/*           │
│  Browser never talks directly to port 8000                      │
└──────┬────────────────────────────────────────────┬────────────┘
       │  Internal proxy (server-side)              │  WebSocket
┌──────▼──────────────────────────────────────────┐│
│  FASTAPI API  (port 8000)                       ││
│                                                 ││
│  REST Routes:                                   ││
│    GET/POST/PUT/PATCH  /coins                   ││
│    GET/POST            /signals                 ││
│    GET/PATCH           /alerts                  ││
│    GET                 /snipes, /snipes/tokens  ││
│    GET                 /market/stats            ││
│    GET                 /market/trending         ││
│    GET                 /market/new-pools        ││
│    GET                 /market/score-dist..     ││
│    GET                 /market/narrative-perf.. ││
│    GET/POST            /wallets, /wallets/{addr}││
│    GET/POST            /behavioral/signals      ││
│    GET/POST            /behavioral/analyze      ││
│    GET                 /liquidity/events        ││
│    GET                 /analytics/overview      ││
│    GET                 /analytics/patterns      ││
│    GET                 /analytics/strategies    ││
│    GET                 /analytics/outcomes      ││
│    GET                 /analytics/distributions ││
│    GET                 /analytics/risk          ││
│    GET                 /analytics/simulations   ││
│    GET                 /analytics/regimes       ││
│    GET                 /analytics/features      ││
│    GET                 /health                  ││
│                                                 ││
│  WebSocket Endpoints:                           ││
│    WS /ws/signals   — live signal stream   ◄────┘│
│    WS /ws/snipes    — live DEX token stream◄─────┘
│    WS /ws/ticker    — lightweight ticker        │
└──────┬────────────────────────────────────────────┘
       │  SQLAlchemy async (asyncpg)
┌──────▼──────────────────────────────────────────┐
│  POSTGRESQL 16  (port 5432)                     │
│  Tables: coins · signals · alerts · dex_tokens  │
│    wallets · wallet_transactions                 │
│    behavioral_signals · liquidity_events         │
│    holder_snapshots · token_timeseries           │
│  LLN Tables (migration 0005):                   │
│    signal_outcomes · pattern_performance         │
│    return_distributions · strategy_performance   │
│    regime_stats · simulation_results             │
│    feature_importance                            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  REDIS 7  (port 6379)                           │
│  Cache / message broker                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  WORKER  (background process)                   │
│  Every 30s:                                     │
│    1. Fetch 1,000 meme coins from CoinGecko     │
│    2. Upsert coin records                       │
│    3. Generate signal (score + band + levels)   │
│    4. Check risk flags → create alerts          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  DEX WORKER  (background process)               │
│  Every 30s:                                     │
│    1. Collect tokens from 10 data sources       │
│       (concurrent where possible)               │
│    2. Deduplicate by chain + token_address      │
│    3. Classify narrative category               │
│    4. Compute snipe score + trade levels        │
│    5. Mark sniping_opportunity = true/false     │
│    6. Upsert all tokens to dex_tokens table     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  BEHAVIORAL WORKER  (background process)        │
│  Every 60s:                                     │
│    1. Detect liquidity changes (>5%) vs last    │
│       snapshot → create LiquidityEvent records  │
│    2. Snapshot OHLCV timeseries for all active  │
│       tokens into token_timeseries table        │
│    3. Detect behavioral patterns from candles   │
│       (accumulation, wash trading, breakout…)   │
│    4. Persist new BehavioralSignal records      │
│    5. Deactivate stale signals                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  LLN QUANT WORKER  (background process)         │
│  Every 60s (sidecar — reads existing tables,    │
│  writes only to new analytics tables):          │
│    1. Compute signal outcomes (ROI, MFE, MAE,   │
│       WIN/NEUTRAL/LOSS classification)          │
│    2. Compute pattern performance by band /     │
│       narrative / risk / liquidity tier         │
│    3. Compute strategy performance (7 combos)   │
│    4. Run Monte Carlo simulations (1000 sims)   │
│    5. Detect & store current market regime      │
│    6. Compute feature importance (Pearson r)    │
└─────────────────────────────────────────────────┘
```

**Backend stack:** Python 3.11 · FastAPI · SQLAlchemy 2.x (async) · Alembic · asyncpg · aiohttp · Pydantic v2 · Redis

**Frontend stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · SWR · WebSocket

**Infrastructure:** Docker Compose · PostgreSQL 16 · Redis 7 · Node 20 Alpine · Python 3.11 Slim

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Mthokozisi-Sithole/-meme-trader-ai.git
cd meme-trader-ai

# 2. Create your environment file
cp .env.example .env

# 3. (Optional) Add API keys to .env for more data
#    The platform works without any keys — Tier 1 & 2 are free
#    See "Environment Variables" section below

# 4. Build and start all 8 containers
docker compose up --build

# 5. Wait ~60 seconds for the workers to complete their first scan

# 6. Open the dashboard
open http://localhost:3000
```

> **What happens on first start:**
> - `postgres` and `redis` start and pass their health checks
> - `api` runs `alembic upgrade head` to create all tables (including the 6 intelligence tables + 7 LLN analytics tables from migration `0005`), then starts uvicorn
> - `worker` starts fetching CoinGecko data immediately
> - `dex-worker` starts scanning DexScreener, Pump.fun, GeckoTerminal, etc.
> - `behavioral-worker` starts detecting patterns and liquidity changes every 60 seconds
> - `lln-worker` starts its 60-second analytics cycle — outcomes, patterns, Monte Carlo, regime detection, feature importance
> - `web` builds the Next.js app and serves it on port 3000
> - After ~30-60 seconds, the dashboard will show live data. The `/lln` section populates once ≥10 signal outcomes have been recorded.

---

## 🐳 Docker Services

Eight containers run together, orchestrated by Docker Compose:

### 🐘 `postgres` — PostgreSQL 16 Alpine
- **Port:** 5432
- **Database:** `memetrader`
- **User/Password:** `postgres / postgres` (change in production)
- **Volume:** `postgres_data` — persists data across restarts
- **Healthcheck:** `pg_isready -U postgres` every 5 seconds
- All other services that need the database wait for this healthcheck before starting

### 🔴 `redis` — Redis 7 Alpine
- **Port:** 6379
- **Purpose:** Cache layer and message broker for inter-service communication
- **Healthcheck:** `redis-cli ping` every 5 seconds
- Used by the API and workers for caching and pub/sub

### ⚡ `api` — FastAPI Backend
- **Port:** 8000
- **Build context:** `./backend`
- **Startup command:** `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Runs database migrations automatically on every startup
- Hot-reload enabled in development (via `--reload`)
- Depends on: `postgres` (healthy) + `redis` (healthy)
- Volume-mounted: `./backend:/app` (code changes reflect without rebuild in dev)

### 🔁 `worker` — Signal Generation Worker
- **No exposed port** — background process only
- **Build context:** `./backend` (same image as `api`)
- **Command:** `python -m app.worker.tasks`
- **Cycle frequency:** Every 30 seconds (configurable via `SIGNAL_REFRESH_INTERVAL_SECONDS`)
- Fetches CoinGecko meme coins → generates signals → checks risk → raises alerts
- Depends on: `postgres` (healthy)
- Volume-mounted: `./backend:/app`

### 🕵️ `dex-worker` — DEX Token Sniping Worker
- **No exposed port** — background process only
- **Build context:** `./backend` (same image as `api`)
- **Command:** `python -m app.worker.dex_tasks`
- **Cycle frequency:** Every 30 seconds
- Collects from 10 data sources → deduplicates → scores → upserts
- Depends on: `postgres` (healthy)
- Volume-mounted: `./backend:/app`
- Accepts all optional API keys as environment variables

### 🧬 `behavioral-worker` — Behavioral Intelligence Worker
- **No exposed port** — background process only
- **Build context:** `./backend` (same image as `api`)
- **Command:** `python -m app.worker.behavioral_worker`
- **Cycle frequency:** Every 60 seconds
- Detects liquidity changes → snapshots OHLCV timeseries → detects behavioral patterns → persists signals
- Depends on: `postgres` (healthy)
- Volume-mounted: `./backend:/app`
- Restart policy: `restart: always`

### 📐 `lln-worker` — LLN Quant Engine Worker
- **No exposed port** — background process only
- **Build context:** `./backend` (same image as `api`)
- **Command:** `python -m app.worker.lln_quant_worker`
- **Cycle frequency:** Every 60 seconds
- Reads from existing tables (`signals`, `coins`, `dex_tokens`) — writes only to new analytics tables
- Computes: signal outcomes (ROI/MFE/MAE/WIN/LOSS), pattern performance, strategy performance, Monte Carlo simulations, regime detection, feature importance
- Requires ≥10 recorded signal outcomes before most analytics become meaningful
- Depends on: `postgres` (healthy)
- Volume-mounted: `./backend:/app`
- Restart policy: `restart: always`

### 🌐 `web` — Next.js Frontend
- **Port:** 3000
- **Build context:** `./web`
- **Startup:** `node server.js` (standalone Next.js output)
- **Key env var:** `INTERNAL_API_URL=http://api:8000` — used server-side to proxy API calls
- The browser only ever talks to port 3000. All `/api/*` requests are rewritten to `http://api:8000/*` by Next.js server-side rewrites defined in `next.config.js`
- Depends on: `api`

> **Note:** All 8 containers are configured with `restart: always` (Docker Compose) — they automatically recover from crashes or system reboots.

---

## ⚙️ Background Workers

### 🔁 Worker 1 — Signal Generation (`backend/app/worker/tasks.py`)

**Purpose:** Keep the `coins` and `signals` tables up to date with the latest CoinGecko data and freshly generated trading signals.

**Cycle (every 30 seconds):**

```
1. fetch_all_meme_coins()
   └── GET https://api.coingecko.com/api/v3/coins/markets
       ?category=meme-token&vs_currency=usd&per_page=250&page=N
       └── Paginate across up to 4 pages (1,000 coins max)
       └── 3 second delay between pages (respects free tier rate limit)

2. For each coin returned:
   └── Map API response → CoinCreate schema
       - symbol truncated to 50 chars (prevents DB overflow)
       - All price/volume/market data extracted
   └── Upsert into `coins` table (create or update)

3. Generate signal for each coin:
   └── scoring.compute_score(coin) → ScoreResult
   └── risk.evaluate_risk(coin) → RiskResult
   └── signal_service.generate_signal(context) → SignalCreate
   └── INSERT into `signals` table

4. Check risk flags:
   └── For each triggered flag → INSERT into `alerts` table
       with appropriate severity level

5. Log: "Cycle complete: N coins processed"
6. Sleep 30 seconds → repeat
```

**Functions exposed:**
- `fetch_all_meme_coins()` — Async paginated CoinGecko fetch
- `_map_market_to_coin(item)` — Transforms raw API JSON to CoinCreate
- `run_cycle(db_session)` — One full fetch-score-persist cycle
- `main()` — Entry point, infinite loop with error handling

---

### 🕵️ Worker 2 — DEX Token Sniping (`backend/app/worker/dex_tasks.py`)

**Purpose:** Continuously discover new DEX token launches across multiple blockchains, score them for sniping potential, and surface the best opportunities.

**Cycle (every 30 seconds):**

```
1. Concurrent data collection (asyncio.gather):
   ├── DexScreener: fetch new pairs (max age 48h)
   ├── DexScreener: fetch boosted/promoted tokens
   ├── Pump.fun: fetch newest coins
   └── Pump.fun: fetch trending coins

2. Sequential free pipelines:
   ├── GeckoTerminal: new pools (all networks)
   ├── GeckoTerminal: trending pools (all networks)
   ├── GMGN.ai: smart money hot tokens pipeline
   └── SolanaFM: on-chain Solana mint pipeline

3. Optional keyed pipelines (skip gracefully if no key):
   ├── Birdeye: run_pipeline(api_key)       — if BIRDEYE_API_KEY set
   ├── Moralis: run_pipeline(api_key)       — if MORALIS_API_KEY set
   ├── Bitquery: run_pipeline(api_key)      — if BITQUERY_API_KEY set
   └── Alchemy: run_pipeline(api_key)       — if ALCHEMY_API_KEY set

4. Deduplication:
   └── Merge all results by (chain, token_address)
   └── Source that first discovered the token is preserved

5. For each unique token:
   ├── narrative_engine.classify(symbol, name) → NarrativeResult
   │   └── Category + hype_velocity + narrative_score
   ├── snipe_scorer.score(token_data) → SnipeScoreResult
   │   └── snipe_score + narrative + momentum + liquidity + risk sub-scores
   │   └── trade levels: entry_low/high, exit_target_1/2/3, stop_loss
   │   └── risk_flags[], warnings[], reasoning text
   └── Check sniping_opportunity gate (7 criteria — see Scoring section)

6. Batch upsert all tokens into `dex_tokens` table
   └── ON CONFLICT (chain, token_address) → UPDATE all columns

7. Log: "DEX cycle complete: N tokens upserted"
8. Sleep 30 seconds → repeat
```

**Functions exposed:**
- `run_dex_cycle(db_session)` — Full orchestration cycle
- `_build_token(raw_data, narrative, score_result)` — Assembles DexTokenCreate schema
- `_persist_tokens(db, tokens[])` — Batch upsert via repository layer
- `main()` — Entry point with error handling + sleep loop

---

### 🧬 Worker 3 — Behavioral Intelligence (`backend/app/worker/behavioral_worker.py`)

**Purpose:** Detect on-chain behavioral patterns, track liquidity changes, and maintain a timeseries snapshot database for active tokens.

**Cycle (every 60 seconds):**

```
1. _detect_liquidity_changes(db)
   └── For each active token with a prior timeseries snapshot:
       └── Compare DexToken.liquidity_usd vs last token_timeseries record
       └── If change > 5% → INSERT into liquidity_events table
           with change_pct, event_type (add/remove/drain/rug_pattern)
           and risk assessment (rug_pattern=critical, dev_remove=high…)

2. _snapshot_dex_tokens(db)
   └── For each active token:
       └── INSERT into token_timeseries:
           price_usd, liquidity_usd, volume_5m, buy_pressure_pct,
           buys_5m, sells_5m, price_change_5m

3. For each active token (batched):
   └── TimeseriesRepository.get_history(token_address, limit=100) → candles
   └── detect_patterns(candles) → list[PatternResult]
       Patterns: accumulation · pre_breakout · fake_breakout ·
       liquidity_trap · momentum_ignition · volume_anomaly ·
       wash_trading · breakdown · consolidation
   └── Deactivate old signals for this token
   └── BehavioralSignalRepository.create() each new PatternResult

4. Log: "Behavioral cycle complete: N patterns detected"
5. Sleep 60 seconds → repeat
```

**Functions exposed:**
- `_detect_liquidity_changes(db)` — Compares liquidity snapshots, creates events
- `_snapshot_dex_tokens(db)` — Saves OHLCV timeseries rows
- `_get_active_tokens(db)` — Raw SQL DISTINCT ON query for one row per token
- `main()` — Entry point with error handling + sleep loop

---

### 📐 Worker 4 — LLN Quant Engine (`backend/app/worker/lln_quant_worker.py`)

**Purpose:** Apply the Law of Large Numbers to accumulated signal outcomes — computing statistical convergence metrics, Monte Carlo risk simulations, Bayesian win-rate estimates, and market regime detection. Runs as a zero-coupling sidecar: reads from existing tables, writes only to new analytics tables.

**Cycle (every 60 seconds):**

```
1. compute_signal_outcomes(db)
   └── Find signals that don't yet have an outcome record
   └── Join Signal → Coin (current price data)
   └── entry_price = (entry_low + entry_high) / 2
   └── final_roi = (current_price - entry_price) / entry_price × 100
   └── Classify: WIN (≥+50%) · NEUTRAL (-30% to +50%) · LOSS (≤-30%)
   └── Compute MFE proxy (price_change_7d) and MAE proxy (low_24h delta)
   └── Bulk INSERT into signal_outcomes (ON CONFLICT DO UPDATE)

2. compute_pattern_performance(db)
   └── Group all outcomes by: band · narrative · risk_level · liquidity_tier · "all"
   └── Per group: win_rate, avg_roi, median_roi, Sharpe, Sortino, Profit Factor, EV
   └── Bayesian: Beta(wins+1, losses+1) → 95% credible interval · P(EV>0)
   └── Build return distribution: mean/std/skew/kurtosis/P10-P90/histogram
   └── Upsert into pattern_performance + return_distributions

3. compute_strategy_performance(db)
   └── Apply 7 pre-defined filter combos to all outcomes:
       All Signals · Strong Buy Only · Watch+Strong Buy ·
       AI Narrative · Low Risk · Strong Buy+AI · Strong Buy+Low Risk
   └── Full risk-adjusted metrics per strategy (Calmar, RoR, max drawdown)
   └── Upsert into strategy_performance

4. run_monte_carlo_simulations(db)
   └── 5 outcome subsets: all_signals · strong_buy · watch_strong_buy ·
       ai_narrative · low_risk
   └── For each: 1,000 simulations × 100 trades
       - Sample returns with replacement (numpy vectorized or pure Python)
       - Track equity curve from $10,000 starting capital (2% risk/trade)
       - Compute: P10/P50/P90 equity curves (50-point subsampled)
         median_final, max_drawdown_median/worst, survival_probability, risk_of_ruin
   └── Upsert into simulation_results

5. detect_and_store_regime(db)
   └── Query DexToken: avg price_change_1h, stddev, avg liquidity, avg buy_pressure
   └── Classify:
       trending      → avg_change >5% AND buy_pressure >60%
       volatile      → price_change stddev >25%
       low_liquidity → avg_liquidity <$5,000
       ranging       → no dominant condition
   └── Mark previous is_current=False → INSERT new RegimeStat (is_current=True)

6. compute_feature_importance(db)
   └── JOIN signal_outcomes → signals → sub-score fields
   └── Pearson r of each feature vs final_roi:
       composite_score · sentiment_score · technical_score ·
       liquidity_score · momentum_score · band_rank
   └── Rank by |r|, store direction (positive/negative)
   └── Upsert into feature_importance
```

**Scientific libraries:** numpy (primary) · scipy (Bayesian CI, distribution stats) · scikit-learn (optional clustering). All have pure-Python fallbacks — the worker runs correctly even if these packages are unavailable.

**Functions exposed:**
- `compute_signal_outcomes(db)` — ROI calculation + WIN/NEUTRAL/LOSS classification
- `compute_pattern_performance(db)` — Grouped statistical metrics + return distributions
- `compute_strategy_performance(db)` — Pre-defined strategy filter evaluation
- `run_monte_carlo_simulations(db)` — Equity curve simulation across 5 strategies
- `detect_and_store_regime(db)` — Market regime classification from live DexToken data
- `compute_feature_importance(db)` — Pearson correlation ranking of signal sub-scores
- `run_cycle(db)` — One full analytics cycle (calls all 6 functions above)
- `main()` — Entry point with 60-second sleep loop and error handling

---

## 🔌 Backend API — All Endpoints

**Base URLs:**
- Via Next.js proxy (browser-safe): `http://localhost:3000/api`
- Direct (server-to-server or curl): `http://localhost:8000`

All endpoints return JSON. Error responses include `{detail: "message"}`.

---

### 🏥 Health Check

#### `GET /health`
Checks database connectivity. Use this to verify the API is running and connected.

**Response:**
```json
{
  "status": "ok",
  "db": "ok"
}
```
If the database is unreachable: `"db": "error"`

---

### 🪙 Coins

Tracks up to 1,000 meme coins sourced from CoinGecko. Updated every 30 seconds by the worker.

#### `GET /coins`
List all tracked coins. Supports search, pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Filter by symbol or name (case-insensitive contains) |
| `limit` | int | 100 | Max results to return (hard cap: 1000) |
| `offset` | int | 0 | Pagination offset |

**Response:** Array of Coin objects (see Database Models)

#### `GET /coins/{symbol}`
Get a single coin by its ticker symbol (e.g. `DOGE`, `PEPE`, `SHIB`).

**Response:** Single Coin object or 404 if not found.

#### `POST /coins`
Create a new coin record. Returns 409 if a coin with that symbol already exists.

**Body:** CoinCreate schema (symbol required, all other fields optional)

#### `PUT /coins/{symbol}`
Full upsert — creates the coin if it doesn't exist, completely replaces it if it does.

#### `PATCH /coins/{symbol}`
Partial update — only updates the fields provided in the request body. Other fields are left unchanged.

---

### 📡 Signals

Trading signals generated for each coin. Each signal includes a score, band, trade levels, and reasoning.

#### `GET /signals`
Returns the most recent signals across all coins, sorted by creation time descending.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 50 | Number of signals to return |

**Response example:**
```json
[
  {
    "id": 1,
    "coin_symbol": "PEPE",
    "score": 73.4,
    "sentiment_score": 78.0,
    "technical_score": 69.5,
    "liquidity_score": 71.2,
    "momentum_score": 65.0,
    "band": "Watch",
    "entry_low": 0.000008,
    "entry_high": 0.0000082,
    "exit_target": 0.0000094,
    "stop_loss": 0.0000074,
    "risk_level": "low",
    "risk_flags": [],
    "reasoning": "PEPE shows moderate momentum with healthy liquidity...",
    "created_at": "2025-03-28T14:30:00Z"
  }
]
```

#### `GET /signals/{symbol}`
Returns all signals for a specific coin symbol, most recent first. Default limit: 20.

#### `POST /signals/{symbol}/generate`
Triggers an on-demand signal generation for a coin. Fetches the latest coin data, runs the full scoring pipeline, persists the result, and returns it immediately. Useful for refreshing a signal without waiting for the next worker cycle.

**Response:** The newly created Signal object.

---

### 🚨 Alerts

Risk alerts are automatically generated by the worker whenever a risk flag is triggered for a coin.

#### `GET /alerts`
Returns all alerts, most recent first.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `unread_only` | bool | false | Return only unread (not dismissed) alerts |
| `limit` | int | 100 | Number of alerts to return |

**Response example:**
```json
[
  {
    "id": 42,
    "coin_symbol": "WOJAK",
    "alert_type": "low_liquidity",
    "message": "WOJAK has very low liquidity ($12,400). High slippage risk.",
    "severity": "warning",
    "is_read": false,
    "created_at": "2025-03-28T14:15:00Z"
  }
]
```

**Alert types:** `whale_concentration` · `low_liquidity` · `sudden_spike` · `low_holders`

**Severity levels:** `info` (informational) · `warning` (caution advised) · `critical` (significant risk detected)

#### `GET /alerts/coin/{symbol}`
Returns all alerts that have been raised for a specific coin.

#### `PATCH /alerts/{id}/read`
Marks a single alert as read (dismissed). Sets `is_read = true`.

---

### 🎯 Snipes / DEX Tokens

DEX token data collected and scored by the DEX worker. This is the sniping intelligence layer.

#### `GET /snipes`
Returns a ranked list of the best sniping opportunities — tokens that have passed all 7 sniping gate criteria. Sorted by snipe_score descending.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 50 | Number of results (hard cap: 200) |
| `max_age_hours` | float | 48 | Only include tokens newer than this many hours |

**Note:** This endpoint returns ONLY tokens where `sniping_opportunity = true`. For all tokens use `/snipes/tokens`.

#### `GET /snipes/tokens`
Returns all tracked DEX tokens with comprehensive filtering options. This is the full database of every token the DEX worker has discovered.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `chain` | string | — | Filter by blockchain: `solana`, `ethereum`, `bsc`, `base` |
| `snipe_only` | bool | false | Only tokens where `sniping_opportunity = true` |
| `min_score` | float | 0 | Minimum composite snipe_score (0-100) |
| `search` | string | — | Search by symbol or name |
| `limit` | int | 100 | Number of results (hard cap: 500) |
| `offset` | int | 0 | Pagination offset |

---

### 📊 Market Intelligence

Aggregated analytics and real-time market data endpoints used by the dashboard.

#### `GET /market/stats`
Returns a comprehensive summary of the current market state. This is the primary endpoint for the dashboard's stat tiles.

**Response:**
```json
{
  "signals": {
    "total": 842,
    "band_counts": {
      "Strong Buy": 47,
      "Watch": 213,
      "Risky": 381,
      "Avoid": 201
    },
    "avg_score": 52.3
  },
  "dex": {
    "snipe_opportunities": 12,
    "strong_buys": 8,
    "narratives": [
      { "category": "AI", "count": 43, "avg_score": 71.2 },
      { "category": "Animal", "count": 89, "avg_score": 58.4 }
    ],
    "chains": [
      { "chain": "solana", "count": 312 },
      { "chain": "ethereum", "count": 88 }
    ]
  },
  "alerts": {
    "unread": 7
  },
  "top_tokens": [
    {
      "symbol": "AIDOG",
      "chain": "solana",
      "score": 84.1,
      "band": "Strong Buy",
      "narrative": "AI",
      "price_change_1h": 12.4,
      "liquidity_usd": 142000
    }
  ]
}
```

#### `GET /market/trending`
Returns live trending liquidity pools from GeckoTerminal. Data is fetched in real time (not cached).

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `network` | string | `solana` | Network to query: `solana`, `eth`, `bsc`, `base`, `all` |
| `limit` | int | 20 | Number of pools to return (max 50) |

#### `GET /market/new-pools`
Returns the most recently created liquidity pools, enriched with narrative scoring and hype velocity. These are the freshest opportunities — tokens that just launched.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `network` | string | `all` | Network filter (`all`, `solana`, `eth`, `bsc`, `base`) |
| `limit` | int | 20 | Number of pools (max 50) |

#### `GET /market/score-distribution`
Returns the distribution of signal scores across all coins as a histogram. Useful for understanding how the overall market is scoring right now.

**Response:**
```json
[
  { "range": "0-10",  "count": 12 },
  { "range": "10-20", "count": 34 },
  { "range": "20-30", "count": 67 },
  { "range": "30-40", "count": 89 },
  { "range": "40-50", "count": 142 },
  { "range": "50-60", "count": 213 },
  { "range": "60-70", "count": 158 },
  { "range": "70-80", "count": 87 },
  { "range": "80-90", "count": 32 },
  { "range": "90-100", "count": 8 }
]
```

#### `GET /market/narrative-performance`
Returns per-narrative category analytics — how each thematic group is performing in the current market.

**Response:**
```json
[
  {
    "category": "AI",
    "total": 43,
    "opportunities": 11,
    "avg_score": 71.2,
    "avg_momentum": 68.4,
    "avg_narrative": 79.0
  }
]
```

---

### 👛 Wallets

Wallet tracking and classification. Requires `BIRDEYE_API_KEY` for wallet-level transaction data. Classification endpoints work without a key using provided metrics.

#### `GET /wallets`
Returns all tracked wallets, sorted by quality score descending.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 50 | Number of wallets to return |
| `wallet_type` | string | — | Filter by type: `smart_money`, `dev`, `bot`, `whale`, `sniper`, `dumper`, `retail`, `unknown` |

#### `GET /wallets/{address}`
Get a single wallet by its on-chain address.

**Response:** Wallet object with type, quality score, and classification metadata.

#### `GET /wallets/{address}/transactions`
Returns recent transactions for a wallet address.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 50 | Number of transactions |

#### `POST /wallets/{address}/classify`
Trigger on-demand wallet classification. Accepts a `WalletMetrics` body and returns a `ClassificationResult` with wallet type, quality score (0-100), and reasoning.

**Body:**
```json
{
  "win_rate": 0.65,
  "avg_hold_time_hours": 4.2,
  "total_trades": 120,
  "rug_exposure_count": 1,
  "early_entry_rate": 0.45,
  "bot_pattern_score": 0.1
}
```

**Response:**
```json
{
  "wallet_type": "smart_money",
  "quality_score": 78,
  "reasoning": "High win rate, early entry rate above 40%, low rug exposure."
}
```

---

### 🧬 Behavioral Signals

Behavioral patterns detected by the behavioral worker from OHLCV timeseries data.

#### `GET /behavioral/signals`
Returns all active behavioral signals across all tokens.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 50 | Number of signals |
| `pattern_type` | string | — | Filter by: `accumulation`, `pre_breakout`, `fake_breakout`, `liquidity_trap`, `momentum_ignition`, `volume_anomaly`, `wash_trading`, `breakdown`, `consolidation` |
| `severity` | string | — | Filter by severity: `low`, `medium`, `high`, `critical` |

**Response example:**
```json
[
  {
    "id": 1,
    "token_address": "So11111...",
    "pattern_type": "accumulation",
    "severity": "high",
    "confidence": 82.5,
    "description": "Steady buy accumulation with rising volume across 20 candles",
    "is_active": true,
    "created_at": "2026-03-31T10:00:00Z"
  }
]
```

#### `GET /behavioral/signals/{token_address}`
Returns all active behavioral signals for a specific token address.

#### `POST /behavioral/analyze/{token_address}`
Triggers on-demand behavioral analysis for a token. Fetches 100 candles from the timeseries, runs pattern detection, and persists new signals. Returns the list of active signals.

#### `GET /behavioral/summary`
Returns an aggregate summary of all active behavioral signals.

**Response:**
```json
{
  "total_active": 142,
  "by_pattern": { "accumulation": 34, "wash_trading": 12, "pre_breakout": 8 },
  "by_severity": { "low": 51, "medium": 60, "high": 24, "critical": 7 }
}
```

---

### 💧 Liquidity Events

Liquidity change events detected by the behavioral worker. Every change >5% in pool liquidity creates an event.

#### `GET /liquidity/events`
Returns liquidity events. Defaults to all events; use `suspicious_only=true` for high-risk events.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 50 | Number of events |
| `suspicious_only` | bool | false | Only return `high` or `critical` risk events |

**Response example:**
```json
[
  {
    "id": 7,
    "token_address": "7xKXtg...",
    "event_type": "rug_pattern",
    "liquidity_before": 285000,
    "liquidity_after": 4200,
    "change_pct": -98.5,
    "risk_level": "critical",
    "risk_score": 95,
    "timestamp": "2026-03-31T09:45:00Z"
  }
]
```

**Event types:** `add` · `remove` · `drain` · `rug_pattern`

**Risk levels:** `low` · `medium` · `high` · `critical`

#### `GET /liquidity/suspicious`
Shorthand for high and critical risk events only.

#### `GET /liquidity/events/{token_address}`
Returns all liquidity events for a specific token address, most recent first.

---

## 📐 LLN Quant Engine — Analytics API

All LLN endpoints serve **pre-computed data only** — no heavy computation in the request path. The `lln-worker` populates the analytics tables every 60 seconds.

**Base path:** `/analytics`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/overview` | Global stats: total outcomes, global win rate, global EV, Sharpe, best band/narrative, current regime |
| GET | `/analytics/patterns` | Pattern performance grouped by `band`, `narrative`, `risk_level`, or `liquidity_tier` — with win rate, EV, CI, Bayesian WR, P(EV>0) |
| GET | `/analytics/strategies` | Pre-defined strategy filter combinations with full risk-adjusted metrics |
| GET | `/analytics/outcomes` | Recent signal outcomes — entry price, ROI, MFE, MAE, WIN/NEUTRAL/LOSS classification |
| GET | `/analytics/distributions` | Return distribution stats per group — mean, median, std, skew, kurtosis, P10-P90, histogram buckets |
| GET | `/analytics/risk` | Risk summary: global risk-of-ruin, max drawdown, survival probability across all strategies |
| GET | `/analytics/simulations` | Monte Carlo simulation results — P10/P50/P90 equity curves, drawdown scenarios, survival probability |
| GET | `/analytics/regimes` | Market regime history — trending/volatile/low_liquidity/ranging with performance per regime |
| GET | `/analytics/features` | Feature importance ranking — Pearson correlation of signal sub-scores with final ROI |

### Query Parameters

#### `GET /analytics/patterns`
| Param | Default | Description |
|---|---|---|
| `group_by` | `band` | Grouping dimension: `band` / `narrative` / `risk_level` / `liquidity_tier` |
| `min_sample` | `3` | Minimum number of outcomes required for a group to appear |

#### `GET /analytics/outcomes`
| Param | Default | Description |
|---|---|---|
| `limit` | `100` | Maximum rows returned |
| `outcome` | _(all)_ | Filter by outcome: `WIN` / `NEUTRAL` / `LOSS` |
| `band` | _(all)_ | Filter by signal band |
| `narrative` | _(all)_ | Filter by narrative category |

#### `GET /analytics/distributions`
| Param | Default | Description |
|---|---|---|
| `group_by` | `band` | Grouping dimension — same options as `/analytics/patterns` |

#### `GET /analytics/regimes`
| Param | Default | Description |
|---|---|---|
| `limit` | `20` | Number of recent regime snapshots to return |

### Response Notes

- All endpoints return `[]` or a sensible empty object when no data is available yet — never a 500 error
- The `histogram_data` field in distribution responses is a JSON array of `{lower, upper, count}` bucket objects
- Equity curve fields (`equity_p10`, `equity_p50`, `equity_p90`) in simulation responses are arrays of 50 equity values sampled at regular intervals
- The `current` regime is identified by `is_current: true` in the regimes response

---

## 📊 Scoring Logic — How Signals Are Calculated

### 🔢 Signal Score (CoinGecko Coins)

Every coin tracked from CoinGecko gets a composite score calculated by `backend/app/services/scoring.py`:

```
Composite Score = (0.35 × sentiment_score)
                + (0.25 × technical_score)
                + (0.25 × liquidity_score)
                + (0.15 × momentum_score)
```

After the composite is calculated, the risk penalty is applied:
```
adjusted_score = max(0, composite_score − risk_penalty)
```

The adjusted score is what gets stored and displayed.

#### Sentiment Score (0-100)
Derived from 24-hour price movement. Positive price action = higher sentiment.

```
sentiment = 50 + (price_change_24h × 0.5)
sentiment = clamp(sentiment, 0, 100)
```

Examples:
- +30% 24h change → sentiment = 50 + 15 = **65**
- 0% change → sentiment = **50**
- -40% change → sentiment = 50 - 20 = **30**
- +100% change → sentiment = **100** (clamped)

#### Technical Score (0-100)
Based on volume-to-market-cap ratio and price trend direction.

```
vol_ratio = volume_24h / market_cap
vol_score = min(vol_ratio / 0.5, 1.0) × 100   # peaks at 0.5 ratio
trend_score = 75 if price_change_24h > 0 else 35
technical = (vol_score + trend_score) / 2
```

A healthy volume ratio of 0.5 (volume = 50% of market cap) scores 100. Coins with low volume relative to cap score lower.

#### Liquidity Score (0-100)
Uses a logarithmic scale so the score grows meaningfully across the $1k-$1M range:

```
liquidity_score = (log10(liquidity_usd) − 3) × 25
```

Reference values:
| Liquidity | Score |
|---|---|
| $1,000 | ~0 |
| $3,000 | ~12 |
| $10,000 | ~25 |
| $50,000 | ~42 |
| $100,000 | ~50 |
| $500,000 | ~67 |
| $1,000,000 | ~75 |
| $10,000,000+ | ~100 (clamped) |

#### Momentum Score (0-100)
Volume momentum — how strongly trading activity is growing relative to the 24-hour baseline.

---

### 🎨 Signal Bands

After the risk-adjusted score is calculated, it maps to a band:

| Score Range | Band | Color | Meaning |
|---|---|---|---|
| 80–100 | **Strong Buy** | Green | High conviction — all factors aligned positively |
| 60–79 | **Watch** | Yellow | Moderate opportunity — monitor closely |
| 40–59 | **Risky** | Orange | Below-average quality — significant caution required |
| < 40 | **Avoid** | Red | Poor fundamentals or high risk — do not trade |

---

## 🛡️ Risk Management — Flags, Penalties, Stop-Loss

### ⚠️ How Risk Works

Risk evaluation happens in `backend/app/services/risk.py` and runs on every coin after scoring. It can:
1. **Reduce the composite score** (risk penalty points subtracted)
2. **Tighten the stop-loss** (moves it closer to entry to limit downside)
3. **Create an alert** (notifies the user via the Alerts page)
4. **Downgrade the band** (a coin might drop from Watch to Risky after risk adjustment)

### 🚩 Risk Flags — Signal Worker (CoinGecko Coins)

These flags apply to coins sourced from CoinGecko:

| Flag | Trigger Condition | Score Penalty | SL Tightness Multiplier | Severity |
|---|---|---|---|---|
| `low_liquidity` | `liquidity_usd < $50,000` | −15 pts | 1.5× | warning |
| `whale_concentration_X%` | `whale_concentration > 0.30` (30%) | −10 pts | 1.3× | warning |
| `sudden_spike` | `abs(price_change_24h) > 50%` | −10 pts | 1.4× | warning |
| `low_holders` | `holders < 500` | −5 pts | — | info |

**Risk level determination:**
- 0 flags triggered → `low`
- 1-2 flags triggered → `medium`
- 3 or more flags triggered → `high`

### 📉 Stop-Loss Calculation

```
base_pct = {
    "Strong Buy": 8%,
    "Watch": 6%,
    "Risky": 4%,
    "Avoid": 3%
}

sl_pct = base_pct / sl_tightness_multiplier

stop_loss = entry_price × (1 − sl_pct)
```

Example: A "Watch" coin with `low_liquidity` flag triggered:
- base_pct = 6%
- sl_tightness = 1.5× (from low_liquidity)
- sl_pct = 6% / 1.5 = **4%**
- If entry is $0.001 → stop_loss = $0.001 × 0.96 = **$0.00096**

The stop-loss tightens automatically for riskier coins, reducing the maximum loss on bad trades.

### 🚩 Risk Flags — DEX Worker (On-Chain / DEX Tokens)

These additional flags apply to tokens discovered via DexScreener, Pump.fun, etc.:

| Flag | Trigger Condition | Effect |
|---|---|---|
| `low_liquidity` | Pool liquidity < $3,000 | −30 pts to risk sub-score |
| `ultra_new_token` | Token age < 15 minutes | −15 pts to risk sub-score |
| `suspicious_price_spike` | 1-minute price change > 200% | −25 pts to risk sub-score; blocks sniping gate |
| `sell_only_pressure` | buys_5m = 0 AND sells_5m > 5 | Blocks sniping gate |
| `extreme_volume_to_liquidity` | vol_24h / liquidity > 50 | Blocks sniping gate |
| `no_social_presence` | No twitter AND no telegram AND no website | −5 pts to risk sub-score |

---

## 🎭 Narrative Engine — Category Classification

The narrative engine (`backend/app/services/narrative_engine.py`) classifies every token into a thematic category based on keyword matching. This is important because meme coin pumps are almost always narrative-driven — "AI coins" pump together, "political coins" pump during election cycles, etc.

### 🔍 How Classification Works

1. The token's `symbol` and `name` are lowercased and combined into a search string
2. Each category's keyword list is checked against this string
3. The category with the most keyword matches wins
4. If no keywords match → category = `Other`
5. The matched keywords are stored in `narrative_keywords` (JSON array)

### 📝 Categories and Full Keyword Lists

| Category | Hype Heat Bonus | Full Keyword List |
|---|---|---|
| **AI** | +28 pts | ai, gpt, agent, neural, llm, gemini, claude, robot, bot, ml, deep, brain, agi, compute, matrix, skynet, jarvis, hal, openai, vertex, copilot, sentient |
| **Political** | +22 pts | trump, maga, biden, kamala, harris, potus, president, america, usa, vote, republican, democrat, election, congress, senate, woke, patriot, freedom, liberty |
| **Celebrity** | +20 pts | elon, musk, taylor, swift, trump, kanye, ye, hawk, tuah, grimes, saylor, vitalik, sbf |
| **Cult** | +18 pts | pepe, chad, sigma, wojak, gigachad, kek, honk, clown, based, redpill, npc, boomer, zoomer, yolo, ngmi, wagmi, degen, ape, fren, gm, vibes |
| **Animal** | +14 pts | doge, shib, inu, dog, puppy, woof, bone, cat, kitty, meow, nyan, kitten, frog, toad, bear, bull, panda, wolf, fox, bunny, rabbit, hamster, monkey, gorilla, snake, horse |
| **Space** | +12 pts | moon, rocket, mars, cosmos, space, alien, ufo, nasa, starship, galaxy, nebula, orbit, saturn, jupiter, astro, stellar, solar, cosmic |
| **Gaming** | +10 pts | game, rpg, quest, warrior, dragon, knight, guild, raid, dungeon, sword, shield, epic, loot, nft, metaverse, pixel, arcade, gamer |
| **Food** | +8 pts | pizza, burger, taco, donut, cookie, cake, sushi, ramen, bacon, cheese, sandwich, nugget, fries |
| **Finance** | +6 pts | defi, yield, stake, earn, vault, safe, dao, treasury, fund, bank, credit, loan, swap |
| **Other** | 0 pts | No keyword matches |

### 🔥 Hype Velocity (0-100)

Beyond just classifying the category, the engine also calculates a `hype_velocity` score — a measure of how "hot" this narrative is in the current market cycle:

```
hype_velocity = (
    narrative_heat_bonus              # from table above
  + keyword_match_density_bonus       # more keywords matched = higher
  + age_bonus                         # very new tokens get +boost if narrative is strong
  + buy_pressure_bonus                # high buy % adds to velocity
) normalized to 0-100
```

Hype velocity feeds into the momentum component of the snipe score and directly influences which opportunities surface first.

---

## 🎯 Snipe Scorer — DEX Token Scoring

DEX tokens are scored by `backend/app/services/snipe_scorer.py`, which uses a different formula than the CoinGecko signal scorer because DEX data has different available metrics (buy/sell counts, 5-minute windows, on-chain age, social presence).

### 🔢 Snipe Score Formula

```
Snipe Score = (0.35 × narrative_score)
            + (0.25 × momentum_score)
            + (0.25 × liquidity_score)
            + (0.15 × risk_adj_score)
```

#### Narrative Score (0-100)
Derived from the narrative engine output:
```
narrative_score = (category_base_score × 0.6) + (hype_velocity × 0.4)
```
- Category base score: AI=85, Political=78, Celebrity=72, Cult=68, Animal=60, Space=55, Gaming=50, Food=45, Finance=40, Other=20
- Plus hype heat bonus from keyword match count

#### Momentum Score (0-100)
Three components, each contributing up to a third of the total:

```
# Component 1: Buy pressure in the last 5 minutes (0-35 pts)
total_5m = buys_5m + sells_5m
if total_5m > 0:
    buy_pct = buys_5m / total_5m
    buy_pressure_pts = buy_pct × 35   # 100% buys = 35 pts

# Component 2: Volume acceleration (0-35 pts)
vol_accel = volume_5m / (volume_1h / 12)  # compare 5m to hourly average
accel_pts = min(log2(vol_accel + 1) × 10, 35)

# Component 3: Price momentum 5m (0-30 pts)
if price_change_5m > 0:
    price_pts = min(price_change_5m × 1.5, 30)
elif price_change_5m < 0:
    price_pts = max(price_change_5m × 1.5, -20)  # negative capped at -20

momentum_score = buy_pressure_pts + accel_pts + price_pts
```

#### Liquidity Score (0-100)
Stepped tiers (different scale than CoinGecko scorer — adjusted for DEX micro-cap reality):

| Pool Liquidity | Score |
|---|---|
| < $1,000 | 8 |
| $1,000 – $4,999 | 20 |
| $5,000 – $9,999 | 35 |
| $10,000 – $49,999 | 55 |
| $50,000 – $99,999 | 70 |
| $100,000 – $499,999 | 85 |
| ≥ $500,000 | 100 |

#### Risk Adjustment Score (0-100)
Higher = safer. Starts at 55 and adjusts based on multiple factors:

```
base = 55

# Token age adjustment
if age < 15 min:    base -= 15   # ultra new = dangerous
if age 15-30 min:   base -= 5
if age 30min-2h:    base += 0    # no change
if age 2-12h:       base += 10   # starting to prove itself
if age 12-48h:      base += 18   # established recent launch
if age > 48h:       base += 25   # proven survival

# Liquidity safety adjustment
if liquidity < $3k:    base -= 30
if liquidity < $8k:    base -= 15
if liquidity > $50k:   base += 10

# Social presence bonus
if has_twitter:   base += 5
if has_telegram:  base += 5
if has_website:   base += 3

# Suspicious patterns
if suspicious_price_spike (1m > 200%):   base -= 25
if volume_spike (1m > 100%):             base -= 12
for each risk_flag:                      base -= 18
```

### 🚪 Sniping Opportunity Gate

For a token to be marked `sniping_opportunity = true`, ALL of the following must pass:

| Criterion | Condition |
|---|---|
| Minimum score | `snipe_score ≥ 60` |
| Minimum liquidity | `liquidity_usd ≥ $4,000` |
| Maximum age | `token_age_hours ≤ 48` |
| Risk level | `risk_level ≠ "extreme"` |
| No sell pressure | `"sell_only_pressure"` not in risk_flags |
| No extreme vol/liq | `"extreme_volume_to_liquidity"` not in risk_flags |
| Buy pressure | `buy_pressure_pct ≥ 52%` (if 5m data available) |

If all 7 pass → `sniping_opportunity = true` and the token surfaces in `/snipes`.

---

## 📈 Signal Service — Trade Level Generation

`backend/app/services/signal_service.py` is the orchestration layer that combines the scorer, risk evaluator, and trade level calculator into a complete signal.

### 🔄 Full Signal Generation Flow

```
1. Build SignalContext from coin data

2. Call scoring.compute_score(context) → ScoreResult
   └── Returns: sentiment, technical, liquidity, momentum, composite

3. Call risk.evaluate_risk(context) → RiskResult
   └── Returns: flags[], risk_level, penalty, sl_tightness

4. Apply risk adjustment:
   adjusted_score = max(0, composite - penalty)

5. Map adjusted_score → band
   80+ → Strong Buy
   60+ → Watch
   40+ → Risky
   else → Avoid

6. Calculate trade levels:
   entry_low  = price × 0.99   (1% below current)
   entry_high = price × 1.01   (1% above current)

   exit_target = price × (1 + exit_pct) where:
     Strong Buy → exit_pct = 0.30 (+30%)
     Watch      → exit_pct = 0.20 (+20%)
     Risky      → exit_pct = 0.12 (+12%)
     Avoid      → exit_pct = 0.05 (+5%)

   stop_loss = entry × (1 - (base_sl / sl_tightness)) where:
     Strong Buy base = 8%
     Watch base      = 6%
     Risky base      = 4%
     Avoid base      = 3%

7. Build reasoning text (plain English):
   "PEPE scored 73.4 (Watch band). Sentiment: 78.0 driven by +56% 24h
    momentum. Technical: 69.5 with strong vol/mcap ratio. Liquidity: 71.2
    ($2.1M pool depth). Risk: low — no flags triggered. Entry: $0.0000080-
    $0.0000082. Target: $0.0000096 (+20%). SL: $0.0000075 (-6%)."

8. Return SignalCreate schema → persist to `signals` table
```

---

## 🌐 External Data Sources

MemeTrader AI uses a tiered data architecture. The platform works fully with zero API keys — Tier 1 and Tier 2 are always active and free.

### 🥇 Tier 0 — Core Fundamental Data

#### CoinGecko
- **Website:** coingecko.com
- **Env key:** `COINGECKO_API_KEY` (optional — free tier works without it)
- **Rate limit (free):** ~30 requests/minute
- **Rate limit (paid):** Higher limits with API key
- **Endpoints used:**
  - `GET /api/v3/coins/markets?category=meme-token&vs_currency=usd&per_page=250&page=N`
- **Data collected:** symbol, name, price, market_cap, market_cap_rank, volume_24h, price_change_24h, price_change_7d, circulating_supply, total_supply, ATH, ATL, image_url
- **Pagination:** Up to 4 pages × 250 coins = 1,000 coins per cycle
- **Worker delay:** 3 seconds between pages to avoid rate limit errors
- **Update frequency:** Every 30 seconds

---

### 🥈 Tier 1 — Free DEX Data (Always Active)

#### DexScreener
- **Website:** dexscreener.com
- **Env key:** None required
- **Rate limit:** ~300 requests/minute
- **Endpoints used:**
  - `/latest/dex/search?q={keyword}` — discovery searches across Solana, ETH, BSC, Base
  - `/dex/tokens/{address}` — per-token pair details
  - `/token-boosts/latest/v1` — currently boosted/promoted tokens
- **Data collected:** pair address, token address, chain, DEX ID, price, liquidity, volume (1m/5m/1h/6h/24h), price changes, buy/sell counts, pair age, social links, DexScreener URL
- **Filters applied:** max age 48 hours, minimum liquidity $500
- **Worker delay:** 0.2 seconds between requests

#### Pump.fun
- **Website:** pump.fun
- **Env key:** None required (unofficial public API)
- **Endpoints used:**
  - `GET /coins?sort=created_timestamp&order=DESC&limit=50` — newest coins
  - `GET /coins?sort=last_trade_timestamp&order=DESC&limit=50` — trending coins
- **Data collected:** token address, symbol, name, description, market cap, price, created_timestamp, twitter, telegram, website, image_url
- **Chain:** Solana only
- **Filter:** NSFW tokens excluded

#### GeckoTerminal
- **Website:** geckoterminal.com
- **Env key:** None required
- **Rate limit:** ~30 requests/minute
- **Endpoints used:**
  - `GET /api/public/networks/trending_pools` — trending pools (all networks)
  - `GET /api/public/networks/{network}/new_pools` — newest pools per network
  - `GET /api/public/networks/{network}/top_pools` — top pools per network
- **Networks queried:** solana, eth, bsc, base
- **Worker delay:** 2 seconds between network requests
- **Data collected:** pool address, base token, price, liquidity, volume, price changes, pair age

---

### 🥉 Tier 2 — Free On-Chain Pipelines (Always Active)

#### GMGN.ai
- **Website:** gmgn.ai
- **Env key:** None required (public endpoints)
- **Pipeline:** `backend/app/worker/pipelines/gmgn_pipeline.py`
- **Data focus:** Smart money wallets, Solana hot tokens ranked by swap activity
- **Data collected:** token addresses + metadata + swap volume from wallets flagged as smart money

#### SolanaFM
- **Website:** solana.fm
- **Env key:** None required
- **Pipeline:** `backend/app/worker/pipelines/solanafm_pipeline.py`
- **Endpoints used:**
  - `GET /v0/tokens/{address}` — token metadata (decimals, supply, mint authority)
  - `GET /v0/tokens/{address}/accounts` — token account activity
  - `GET /v0/tokens/{address}/transfers` — recent transfer history
- **Data focus:** On-chain Solana token detection and metadata enrichment
- **Data collected:** token metadata, mint authority status (renounced vs active), holder activity

---

### 🔐 Tier 3 — Optional Keyed Pipelines (Graceful Fallback)

If an API key is not set, the pipeline is skipped silently. The platform continues running with the other sources.

#### Birdeye
- **Website:** birdeye.so
- **Env key:** `BIRDEYE_API_KEY`
- **Free tier:** Available — limited requests/day
- **Pipeline:** `backend/app/worker/pipelines/birdeye_pipeline.py`
- **Supported chains:** Solana, Ethereum, BSC, Base, Arbitrum
- **Data collected:** Token lists sorted by volume, price, liquidity; whale wallet tracking; historical OHLCV data; token security metadata
- **Unique value:** Best-in-class Solana DEX data with wallet-level analytics

#### Moralis
- **Website:** moralis.io
- **Env key:** `MORALIS_API_KEY`
- **Free tier:** 40,000 compute units/day
- **Pipeline:** `backend/app/worker/pipelines/moralis_pipeline.py`
- **Supported chains:** Ethereum, BSC, Base, Polygon, Arbitrum, Solana
- **Endpoints used:** ERC20 token gainers, trending tokens, token price, token metadata
- **Data collected:** Multi-chain token lists with performance metrics, wallet transfer data, token metadata

#### Bitquery
- **Website:** bitquery.io
- **Env key:** `BITQUERY_API_KEY`
- **Free tier:** Available
- **Pipeline:** `backend/app/worker/pipelines/bitquery_pipeline.py`
- **Protocol:** GraphQL streaming API
- **Data collected:**
  - Real-time new token creation events (Solana, ETH, BSC)
  - Real-time trade streams with wallet attribution
  - Dev wallet detection (flags if deployer is also a large holder)
  - Pump.fun token launch tracking via on-chain program events
- **Unique value:** Most real-time data source — detects tokens within seconds of creation

#### Alchemy
- **Website:** alchemy.com
- **Env key:** `ALCHEMY_API_KEY`
- **Free tier:** 300,000,000 compute units/month
- **Pipeline:** `backend/app/worker/pipelines/alchemy_pipeline.py`
- **Supported chains:** Ethereum, Base, Polygon, Arbitrum, BSC
- **Endpoints used:** Token balances, token metadata, transfer events, token price by contract
- **Data collected:** EVM token prices, transfer history, holder balances, contract metadata
- **Unique value:** Developer-grade EVM infrastructure — most reliable for Ethereum/Base data

---

## 🗄️ Database Models — Full Schema

The platform uses PostgreSQL 16 with SQLAlchemy 2.x async ORM. All migrations are managed by Alembic and run automatically on startup.

### 🪙 `coins` Table

Stores all meme coins fetched from CoinGecko. Updated every 30 seconds.

| Column | SQLAlchemy Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, autoincrement | Internal ID |
| `symbol` | String(50) | Unique, Not Null, Indexed | Ticker symbol e.g. `DOGE` |
| `name` | Text | | Full coin name e.g. `Dogecoin` |
| `coingecko_id` | Text | | CoinGecko slug e.g. `dogecoin` |
| `image_url` | Text | | URL to coin logo image |
| `price_usd` | Float | | Current price in USD |
| `market_cap_usd` | Float | | Total market capitalisation in USD |
| `market_cap_rank` | Integer | | CoinGecko market cap ranking |
| `volume_24h_usd` | Float | | 24-hour trading volume in USD |
| `liquidity_usd` | Float | | Available liquidity in USD |
| `high_24h` | Float | | 24-hour high price |
| `low_24h` | Float | | 24-hour low price |
| `price_change_24h` | Float | | % price change in last 24 hours |
| `price_change_7d` | Float | | % price change in last 7 days |
| `ath` | Float | | All-time high price |
| `ath_change_percentage` | Float | | % below all-time high |
| `atl` | Float | | All-time low price |
| `atl_change_percentage` | Float | | % above all-time low |
| `circulating_supply` | Float | | Coins currently in circulation |
| `total_supply` | Float | | Total coins that will ever exist |
| `holders` | Integer | | Number of unique wallet holders |
| `whale_concentration` | Float | | Top wallet concentration (0.0-1.0) |
| `created_at` | DateTime | | Record creation timestamp |
| `updated_at` | DateTime | | Last update timestamp |

### 📡 `signals` Table

Each signal is a point-in-time trading recommendation for a coin. A new signal is generated every 30 seconds per coin.

| Column | SQLAlchemy Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, autoincrement | Internal ID |
| `coin_symbol` | String(50) | FK → coins.symbol (CASCADE), Indexed | The coin this signal is for |
| `score` | Float | | Risk-adjusted composite score (0-100) |
| `sentiment_score` | Float | | Sentiment sub-score (0-100) |
| `technical_score` | Float | | Technical sub-score (0-100) |
| `liquidity_score` | Float | | Liquidity sub-score (0-100) |
| `momentum_score` | Float | | Momentum sub-score (0-100) |
| `band` | Text | | Strong Buy / Watch / Risky / Avoid |
| `entry_low` | Float | | Lower bound of entry price range |
| `entry_high` | Float | | Upper bound of entry price range |
| `exit_target` | Float | | Recommended exit/take-profit price |
| `stop_loss` | Float | | Stop-loss price level |
| `risk_level` | Text | | low / medium / high |
| `risk_flags` | Text (JSON) | | JSON array of triggered flag names |
| `reasoning` | Text | | Human-readable signal explanation |
| `created_at` | DateTime | | When this signal was generated |

### 🚨 `alerts` Table

Risk alerts are created automatically when the worker detects dangerous conditions.

| Column | SQLAlchemy Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, autoincrement | Internal ID |
| `coin_symbol` | String(50) | FK → coins.symbol (CASCADE), Indexed | The coin that triggered the alert |
| `alert_type` | Text | | `whale_concentration` / `low_liquidity` / `sudden_spike` / `low_holders` |
| `message` | Text | | Human-readable alert message |
| `severity` | Text | | `info` / `warning` / `critical` |
| `is_read` | Boolean | Default false | Whether the alert has been dismissed |
| `created_at` | DateTime | | When the alert was raised |

### 🎯 `dex_tokens` Table

The largest and most complex table. Stores every DEX token discovered by the DEX worker with full market data, scoring, and trade levels.

<details>
<summary><strong>Identity and Source columns</strong></summary>

**Identity and Source:**

| Column | Type | Description |
|---|---|---|
| `id` | Integer PK | Internal ID |
| `chain` | Text | `solana` / `ethereum` / `bsc` / `base` |
| `token_address` | Text | On-chain contract/mint address |
| `pair_address` | Text | DEX liquidity pool pair address |
| `symbol` | Text | Token ticker symbol |
| `name` | Text | Token full name |
| `source` | Text | Which pipeline found it: `dexscreener` / `pumpfun` / `geckoterminal` / `birdeye` / `moralis` / `bitquery` / `gmgn` / `solanafm` / `alchemy` |
| `dex_id` | Text | Which DEX it trades on: `raydium` / `pump` / `uniswap` / `pancakeswap` / etc. |
| `image_url` | Text | Token logo URL |
| `dexscreener_url` | Text | Direct link to DexScreener pair page |

</details>

<details>
<summary><strong>Social, Market, Volume and Trading columns</strong></summary>

**Social and Metadata:**

| Column | Type | Description |
|---|---|---|
| `has_twitter` | Boolean | Twitter/X account exists |
| `has_telegram` | Boolean | Telegram group exists |
| `has_website` | Boolean | Website exists |
| `is_boosted` | Boolean | Token is currently DexScreener-boosted/promoted |

**Market Data:**

| Column | Type | Description |
|---|---|---|
| `price_usd` | Float | Current price in USD |
| `price_native` | Float | Price in native chain token (SOL/ETH/BNB) |
| `market_cap` | Float | Circulating market capitalisation |
| `fdv` | Float | Fully diluted valuation |
| `liquidity_usd` | Float | Total pool liquidity in USD |

**Volume by Timeframe:**

| Column | Type | Description |
|---|---|---|
| `volume_1m` | Float | Volume last 1 minute (USD) |
| `volume_5m` | Float | Volume last 5 minutes (USD) |
| `volume_1h` | Float | Volume last 1 hour (USD) |
| `volume_6h` | Float | Volume last 6 hours (USD) |
| `volume_24h` | Float | Volume last 24 hours (USD) |

**Transaction Counts:**

| Column | Type | Description |
|---|---|---|
| `buys_1m` | Integer | Buy transactions in last 1 minute |
| `sells_1m` | Integer | Sell transactions in last 1 minute |
| `buys_5m` | Integer | Buy transactions in last 5 minutes |
| `sells_5m` | Integer | Sell transactions in last 5 minutes |
| `buys_1h` | Integer | Buy transactions in last 1 hour |
| `sells_1h` | Integer | Sell transactions in last 1 hour |

**Price Changes:**

| Column | Type | Description |
|---|---|---|
| `price_change_1m` | Float | % price change last 1 minute |
| `price_change_5m` | Float | % price change last 5 minutes |
| `price_change_1h` | Float | % price change last 1 hour |
| `price_change_24h` | Float | % price change last 24 hours |

**Age and Timing:**

| Column | Type | Description |
|---|---|---|
| `pair_created_at` | DateTime (no tz) | When the DEX pair was created (UTC, tz-stripped before insert) |
| `token_age_hours` | Float | Computed age in hours from pair_created_at |

**Narrative Data:**

| Column | Type | Description |
|---|---|---|
| `narrative_category` | Text | AI / Political / Cult / Animal / Space / Celebrity / Gaming / Food / Finance / Other |
| `narrative_keywords` | Text (JSON) | JSON array of matched keywords |
| `hype_velocity` | Float | Narrative hype momentum score (0-100) |

**Whale and On-Chain:**

| Column | Type | Description |
|---|---|---|
| `whale_flags` | Text (JSON) | JSON array of whale activity flags |
| `large_tx_detected` | Boolean | A large transaction was detected in recent history |
| `buy_pressure_pct` | Float | Percentage of 5m transactions that were buys |

</details>

<details>
<summary><strong>Score, Signal and Trade Level columns</strong></summary>

**Scores (all 0-100):**

| Column | Type | Description |
|---|---|---|
| `snipe_score` | Float | Final composite snipe score |
| `narrative_score` | Float | Narrative sub-score |
| `momentum_score` | Float | Momentum sub-score |
| `liquidity_score` | Float | Liquidity sub-score |
| `risk_score` | Float | Risk adjustment sub-score |

**Band and Signal:**

| Column | Type | Description |
|---|---|---|
| `band` | Text | Strong Buy / Watch / Risky / Avoid |
| `sniping_opportunity` | Boolean | True if all 7 sniping gate criteria passed |
| `risk_level` | Text | low / medium / high / extreme |
| `risk_flags` | Text (JSON) | JSON array of triggered risk flag names |
| `warnings` | Text (JSON) | JSON array of human-readable warning messages |
| `reasoning` | Text | Plain-English rationale for the score and trade levels |

**Trade Levels:**

| Column | Type | Description |
|---|---|---|
| `entry_low` | Float | Lower bound of entry price range |
| `entry_high` | Float | Upper bound of entry price range |
| `exit_target_1` | Float | First (conservative) exit target price |
| `exit_target_2` | Float | Second (moderate) exit target price |
| `exit_target_3` | Float | Third (aggressive) exit target price |
| `stop_loss` | Float | Stop-loss price (exit if price falls to here) |

**Timestamps:**

| Column | Type | Description |
|---|---|---|
| `created_at` | DateTime | When this record was first created |
| `updated_at` | DateTime | Last time this record was updated |

</details>

**Unique constraint:** `(chain, token_address)` — one row per token per chain. Workers use `INSERT ... ON CONFLICT DO UPDATE`.

### 🕐 `token_timeseries` Table

OHLCV snapshots for every active DEX token. Written every 60 seconds by the behavioral worker.

| Column | SQLAlchemy Type | Description |
|---|---|---|
| `id` | Integer PK | Internal ID |
| `token_address` | Text | On-chain token address |
| `timestamp` | DateTime | Snapshot timestamp (UTC) |
| `price_usd` | Float | Price at snapshot time |
| `liquidity_usd` | Float | Pool liquidity at snapshot time |
| `volume_5m` | Float | 5-minute volume in USD |
| `buy_pressure_pct` | Float | Buy % of 5-minute transactions (0-100) |
| `buys_5m` | Integer | Buy transaction count (5m) |
| `sells_5m` | Integer | Sell transaction count (5m) |
| `price_change_5m` | Float | % price change in last 5 minutes |

### 🧬 `behavioral_signals` Table

Active on-chain behavioral pattern signals detected by the behavioral worker.

| Column | SQLAlchemy Type | Description |
|---|---|---|
| `id` | Integer PK | Internal ID |
| `token_address` | Text | Token this signal applies to |
| `pattern_type` | Text | One of 9 pattern types (see below) |
| `severity` | Text | `low` / `medium` / `high` / `critical` |
| `confidence` | Float | Confidence score 0-100 |
| `description` | Text | Human-readable pattern explanation |
| `is_active` | Boolean | Whether this signal is still valid |
| `created_at` | DateTime | When the pattern was first detected |
| `updated_at` | DateTime | Last update timestamp |

**Pattern types:** `accumulation` · `pre_breakout` · `fake_breakout` · `liquidity_trap` · `momentum_ignition` · `volume_anomaly` · `wash_trading` · `breakdown` · `consolidation`

### 💧 `liquidity_events` Table

Records every significant liquidity change (>5%) detected for a DEX token.

| Column | SQLAlchemy Type | Description |
|---|---|---|
| `id` | Integer PK | Internal ID |
| `token_address` | Text | Token address |
| `event_type` | Text | `add` / `remove` / `drain` / `rug_pattern` |
| `liquidity_before` | Float | Pool liquidity before the change (USD) |
| `liquidity_after` | Float | Pool liquidity after the change (USD) |
| `change_pct` | Float | Percentage change (negative = removal) |
| `risk_level` | Text | `low` / `medium` / `high` / `critical` |
| `risk_score` | Float | Risk score 0-100 (100 = certain rug) |
| `timestamp` | DateTime | When the change was detected |

### 👛 `wallets` Table

Classified wallet profiles tracked by the platform.

| Column | SQLAlchemy Type | Description |
|---|---|---|
| `id` | Integer PK | Internal ID |
| `address` | Text | On-chain wallet address (unique) |
| `wallet_type` | Text | `smart_money` / `dev` / `bot` / `whale` / `sniper` / `dumper` / `retail` / `unknown` |
| `quality_score` | Float | Wallet quality score 0-100 |
| `win_rate` | Float | Historical win rate 0-1 |
| `avg_hold_time_hours` | Float | Average position hold time in hours |
| `total_trades` | Integer | Total trade count |
| `rug_exposure_count` | Integer | Number of rug pulls this wallet was in |
| `early_entry_rate` | Float | Rate of early-entry trades (0-1) |
| `created_at` | DateTime | When first tracked |
| `updated_at` | DateTime | Last classification update |

### 📋 `wallet_transactions` Table

Individual transactions for tracked wallets.

| Column | SQLAlchemy Type | Description |
|---|---|---|
| `id` | Integer PK | Internal ID |
| `wallet_address` | Text | FK → wallets.address |
| `token_address` | Text | Token traded |
| `tx_hash` | Text | On-chain transaction signature/hash |
| `tx_type` | Text | `buy` / `sell` |
| `amount_usd` | Float | Transaction value in USD |
| `timestamp` | DateTime | Transaction timestamp |

### 📸 `holder_snapshots` Table

Point-in-time holder count and distribution snapshots.

| Column | SQLAlchemy Type | Description |
|---|---|---|
| `id` | Integer PK | Internal ID |
| `token_address` | Text | Token address |
| `holder_count` | Integer | Total unique holder count |
| `top10_pct` | Float | % of supply held by top 10 wallets |
| `timestamp` | DateTime | Snapshot timestamp |

### 📐 LLN Analytics Tables (migration `0005`)

Seven new tables created by Alembic migration `0005`. All are written exclusively by `lln-worker`. Existing tables are never modified.

#### `signal_outcomes` Table

| Column | Type | Description |
|---|---|---|
| `id` | Integer PK | Internal ID |
| `signal_id` | Integer (Unique) | FK → signals.id — one outcome per signal |
| `coin_symbol` | Text | Coin symbol at signal generation time |
| `entry_price` | Float | Avg of signal entry_low and entry_high |
| `exit_target` | Float | Signal exit target |
| `stop_loss` | Float | Signal stop-loss |
| `band` | Text | Signal band at generation time |
| `risk_level` | Text | Signal risk level |
| `narrative_category` | Text | Narrative at generation time (from dex_tokens) |
| `liquidity_at_signal` | Float | Liquidity USD at signal time |
| `buy_pressure_at_signal` | Float | Buy pressure % at signal time |
| `roi_24h` | Float | ROI proxy using price_change_24h |
| `roi_7d` | Float | ROI proxy using price_change_7d |
| `mfe` | Float | Max Favorable Excursion (best gain reached) |
| `mae` | Float | Max Adverse Excursion (worst loss reached) |
| `final_roi` | Float | Final computed ROI % |
| `outcome` | Text | `WIN` / `NEUTRAL` / `LOSS` |
| `computed_at` | DateTime | When outcome was computed |

#### `pattern_performance` Table

Unique on `(group_by, group_value)`. Groups: `band`, `narrative`, `risk_level`, `liquidity_tier`, `all`.

| Column | Type | Description |
|---|---|---|
| `group_by` | Text | Grouping dimension |
| `group_value` | Text | Group value (e.g. `Strong Buy`, `AI`) |
| `sample_size` | Integer | Number of outcomes in this group |
| `win_count` / `loss_count` / `neutral_count` | Integer | Outcome counts |
| `win_rate` | Float | Proportion of WIN outcomes |
| `avg_roi` / `median_roi` | Float | Mean and median ROI |
| `avg_mfe` / `avg_mae` | Float | Mean max favorable / adverse excursion |
| `sharpe_ratio` / `sortino_ratio` | Float | Risk-adjusted return ratios |
| `profit_factor` | Float | Gross profit / gross loss |
| `expected_value` | Float | EV = (win_rate × avg_win) - ((1-win_rate) × avg_loss) |
| `bayesian_win_rate` | Float | Beta posterior mean |
| `ci_lower` / `ci_upper` | Float | 95% Bayesian credible interval |
| `probability_positive_ev` | Float | P(EV > 0) |

#### `return_distributions` Table

Unique on `(group_by, group_value)`. Full return distribution stats per group.

| Column | Type | Description |
|---|---|---|
| `mean` / `median` / `std` / `variance` | Float | Central tendency and spread |
| `skewness` / `kurtosis` | Float | Distribution shape |
| `p10` / `p25` / `p50` / `p75` / `p90` | Float | Percentile values |
| `has_fat_tails` | Boolean | Kurtosis > 3 |
| `positive_skew` | Boolean | Skewness > 0 (more upside outliers) |
| `asymmetric_payoff` | Boolean | abs(avg_win) significantly > abs(avg_loss) |
| `histogram_data` | JSON Text | Array of `{lower, upper, count}` buckets |

#### `strategy_performance` Table

One row per strategy name (unique). 7 pre-defined strategies evaluated.

| Column | Type | Description |
|---|---|---|
| `strategy_name` | Text (Unique) | Strategy identifier |
| `description` | Text | Human-readable description |
| `total_signals` | Integer | Sample size |
| `win_rate` / `avg_roi` / `median_roi` | Float | Core return metrics |
| `best_roi` / `worst_roi` | Float | Best and worst single outcome |
| `sharpe_ratio` / `sortino_ratio` / `calmar_ratio` | Float | Risk-adjusted ratios |
| `profit_factor` / `expected_value` | Float | Profitability metrics |
| `max_drawdown` | Float | Maximum drawdown % |
| `risk_of_ruin` | Float | Probability of losing all capital |

#### `regime_stats` Table

One row per detection cycle. Current regime identified by `is_current=true`.

| Column | Type | Description |
|---|---|---|
| `regime` | Text | `trending` / `volatile` / `low_liquidity` / `ranging` |
| `detected_at` | DateTime | When this regime was detected |
| `is_current` | Boolean | Whether this is the active regime |
| `best_band` / `best_narrative` | Text | Best performing signal category in this regime |
| `avg_win_rate` / `avg_roi` | Float | Signal performance during this regime |
| `avg_price_change_1h` / `price_change_stddev` | Float | Market conditions at detection |
| `avg_liquidity` / `avg_buy_pressure` | Float | Liquidity and momentum conditions |
| `token_count` | Integer | Number of tokens observed |

#### `simulation_results` Table

One row per strategy (unique). Monte Carlo output.

| Column | Type | Description |
|---|---|---|
| `strategy` | Text (Unique) | Strategy key (e.g. `all_signals`, `strong_buy`) |
| `n_simulations` | Integer | Number of simulations run (default: 1000) |
| `n_trades` | Integer | Trades per simulation (default: 100) |
| `equity_p10` / `equity_p50` / `equity_p90` | JSON Text | 50-point equity curve arrays |
| `median_final_equity` | Float | Median ending capital across all sims |
| `p10_final_equity` / `p90_final_equity` | Float | Worst/best 10% final equity |
| `max_drawdown_median` / `max_drawdown_worst` | Float | Median and P90 max drawdown % |
| `survival_probability` | Float | % of sims ending with equity > $0 |
| `risk_of_ruin` | Float | % of sims ending with equity ≤ $0 |

#### `feature_importance` Table

One row per feature name (unique).

| Column | Type | Description |
|---|---|---|
| `feature_name` | Text (Unique) | Feature key (e.g. `sentiment_score`) |
| `importance_score` | Float | abs(Pearson r) — absolute predictive strength |
| `correlation_with_roi` | Float | Signed Pearson r with final_roi |
| `rank` | Integer | Rank by importance (1 = most predictive) |
| `direction` | Text | `positive` / `negative` |

---

## ⚡ WebSocket Streams

The platform provides three real-time WebSocket endpoints. All follow the same pattern:

1. **On connect:** Immediately sends a `snapshot` message with current data (so the UI doesn't wait for the next cycle)
2. **Every 5 seconds:** Sends an `update` message with the latest data

WebSocket URL is derived at runtime from `window.location.hostname` — no build-time config needed:
```typescript
// web/lib/ws.ts
const WS_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_WS_URL ?? `ws://${window.location.hostname}:8000`)
  : "ws://localhost:8000";
```

### 📡 `WS /ws/signals`

Streams all trading signals. Used by the Terminal dashboard for live signal updates.

**Connection:** `ws://localhost:8000/ws/signals`

**On connect — snapshot:**
```json
{
  "type": "snapshot",
  "ts": "2025-03-28T14:30:00.000Z",
  "data": [
    {
      "id": 1,
      "coin_symbol": "PEPE",
      "score": 73.4,
      "band": "Watch",
      "entry_low": 0.000008,
      "entry_high": 0.0000082,
      "exit_target": 0.0000096,
      "stop_loss": 0.0000075,
      "risk_level": "low",
      "risk_flags": [],
      "reasoning": "...",
      "created_at": "2025-03-28T14:29:55Z"
    }
  ]
}
```

**Every 5 seconds — update:**
```json
{
  "type": "update",
  "ts": "2025-03-28T14:30:05.000Z",
  "data": [ ... ]
}
```

### 🎯 `WS /ws/snipes`

Streams all tracked DEX tokens. Used by the Sniper page and Terminal dashboard.

**Connection:** `ws://localhost:8000/ws/snipes`

**On connect — snapshot:**
```json
{
  "type": "snapshot",
  "ts": "2025-03-28T14:30:00.000Z",
  "count": 312,
  "data": [
    {
      "id": 87,
      "chain": "solana",
      "symbol": "AIDOG",
      "snipe_score": 84.1,
      "band": "Strong Buy",
      "sniping_opportunity": true,
      "narrative_category": "AI",
      "price_usd": 0.0000042,
      "liquidity_usd": 142000,
      "price_change_1h": 12.4,
      "buy_pressure_pct": 71.3,
      "entry_low": 0.0000041,
      "entry_high": 0.0000043,
      "exit_target_1": 0.0000055,
      "exit_target_2": 0.0000067,
      "exit_target_3": 0.00000105,
      "stop_loss": 0.0000037,
      ...
    }
  ]
}
```

**Every 5 seconds — update:**
```json
{
  "type": "update",
  "ts": "...",
  "count": 315,
  "data": [ ... ]
}
```

### 📺 `WS /ws/ticker`

Lightweight stream. Sends only the top 20 tokens with minimal fields. Used for the scrolling ticker strip at the top of the Sniper page — minimal bandwidth.

**Connection:** `ws://localhost:8000/ws/ticker`

**Every 5 seconds:**
```json
{
  "type": "ticker",
  "ts": "2025-03-28T14:30:05.000Z",
  "items": [
    {
      "symbol": "AIDOG",
      "chain": "solana",
      "score": 84.1,
      "price_change_1h": 12.4,
      "band": "Strong Buy"
    },
    {
      "symbol": "TRUMPCAT",
      "chain": "solana",
      "score": 79.3,
      "price_change_1h": 8.7,
      "band": "Watch"
    }
  ]
}
```

**Implementation detail:** Connection managers maintain a set of active WebSocket clients. When a client disconnects (tab closed, network drop), it is removed from the set. All data is queried fresh from the database on each 5-second cycle — no caching.

---

## 🖥️ Frontend Pages

The frontend is a Next.js 14 App Router application. All pages are React Server Components with client-side interactivity via `"use client"` directive where needed. The app uses SWR for HTTP polling and custom WebSocket hooks for live data.

### `/` — Intelligence Terminal (Main Dashboard)

The primary view. Designed to show everything you need at a glance.

**What's on this page:**
- **Stat tiles row:** Total signals tracked · Signals by band (Strong Buy count, Watch count, etc.) · Average composite score · DEX snipe opportunity count · Strong buy count on DEX · Unread alert count
- **Top 5 Tokens table:** The five highest-scoring DEX tokens right now — symbol, chain, score, band, narrative, 1h price change, liquidity
- **Narrative Heatmap:** A color-intensity grid showing all 9 narrative categories. Each cell shows the category name, avg score, and number of sniping opportunities. More opportunities = brighter color
- **Signal table:** Recent CoinGecko signals with coin, score, band, entry/exit/SL, risk level
- **Live updates:** All data is WebSocket-driven. Signals refresh every 5s, snipes every 5s. No page reload needed.
- **Color coding:** Strong Buy = green · Watch = yellow · Risky = orange · Avoid = red — consistent across all views

### `/sniper` — DEX Scanner

The most feature-rich page. Real-time sniping intelligence.

**What's on this page:**
- **Live Ticker Strip** (top): Scrolling banner of top sniping opportunities — symbol, chain, score, 1h change. Pauses on hover.
- **Header stats row** (2×4 grid on mobile, 4 tiles on desktop): Total tokens tracked · Snipe opportunities · Strong buys · Tokens under 1 hour old
- **Analytics Presets:** One-click filter presets, each with a live count badge showing how many tokens currently match:
  - **Extreme Potential** — highest scores, fresh tokens, AI/Political narrative
  - **Safe Snipers** — strong scores with good liquidity and social presence
  - **High Hype** — narrative-heavy tokens with strong buy pressure
  - **Fresh Pairs** — tokens created in the last hour
  - **Strong Momentum** — high buy pressure + positive price acceleration
- **Manual filters** (disabled when a preset is active):
  - Chain selector: ALL / SOL / ETH / BSC / BASE (with token count per chain)
  - Band filter: ALL / Strong Buy / Watch / Risky
  - Min score slider: All / ≥40 / ≥60 / ≥75
  - Age window: Last 1h / 6h / 24h / 48h
  - Snipe-only toggle
  - Sort by: Score / Age / Liquidity / 1h Change
  - Refresh button
- **Token table columns** (responsive — less shown on smaller screens):
  - Token (symbol + chain badge + boost indicator)
  - Score (circular ring + number, colored by band)
  - Narrative badge (colored by category)
  - Price
  - 5m % change (hidden on mobile)
  - 1h % change
  - Liquidity (hidden on small screens)
  - Vol 5m (hidden on extra small screens)
  - Buy pressure bar (5m window, green/yellow/red by %)
  - Entry price (hidden on small screens)
  - Stop-loss (hidden on small screens)
  - Age
- **Expandable row detail** (click any row to expand):
  - Score breakdown: 4 sub-score bars (Narrative / Momentum / Liquidity / Risk Adj.)
  - Trade levels table: Entry low/high · T1 · T2 · T3 · Stop-Loss
  - Market data: Market cap · FDV · Liquidity · Vol 1h · Vol 24h
  - Risk & Analysis: Risk flags (orange badges) · Social presence (Twitter/Telegram/Website) · Reasoning text · DexScreener link
- **Data source:** WebSocket primary (live stream), SWR polling fallback (every 8s if WS disconnects)

### `/analytics` — Market Analytics

Pure data visualisation. No trading actions — just charts.

**What's on this page:**
- **Score Distribution Histogram:** SVG bar chart showing how many tokens fall in each 10-point score bucket (0-10, 10-20, ..., 90-100). Shows where the overall market is positioned.
- **Narrative Category Charts:**
  - Horizontal bar chart: token count per narrative
  - Opportunity count per narrative
  - Average score per narrative (colored by category)
  - Average momentum per narrative
  - Average narrative score per narrative
- **Band Distribution Donut:** Proportion of Strong Buy / Watch / Risky / Avoid across all tokens
- **Chain Distribution:** Token count breakdown by Solana / ETH / BSC / Base
- **Narrative Performance Table:** Sortable table with columns: Category · Total Tokens · Opportunities · Avg Score · Avg Momentum · Avg Narrative Score. Color-coded rows per category.
- **Trending Pools Table:** Live data from GeckoTerminal — pool name, chain, price, 1h/24h change, volume, liquidity, age
- **New Pools Table:** Most recently launched pools — same columns as trending
- All charts are hand-drawn SVG (no Chart.js, Recharts, or D3 dependency)
- SWR polling every 60 seconds

### `/tokens` — DEX Tokens

A full searchable/filterable table of every DEX token in the database.

**What's on this page:**
- Search input (debounced 300ms): searches symbol and name
- Chain dropdown filter: All / Solana / Ethereum / BSC / Base
- Snipe-only checkbox: shows only sniping_opportunity=true tokens
- Count display: "N tokens tracked — DexScreener + Pump.fun"
- Responsive table with progressive column hiding:
  - Always visible: Token (symbol + name + image), Score, Price, 1h%, Snipe badge
  - Hidden on mobile (`sm`): Chain, 5m%
  - Hidden on small (`md`): Band, Liquidity, Buy Pressure %
  - Hidden on medium (`lg`): Vol 5m, MCap, Narrative badge
  - Hidden on large (`xl`): Age
- Hover row highlight, DexScreener snipe badge (green YES / dim dash)
- SWR refresh every 60 seconds

### `/coins` — Meme Coins

The full CoinGecko coin database.

**What's on this page:**
- Page title with coin count
- Search input (debounced 300ms): searches symbol or name
- Responsive table:
  - Always: Rank, Coin (logo + symbol + name), Price, 24h %
  - Hidden on mobile (`sm`): 7d %
  - Hidden on small (`md`): Market Cap
  - Hidden on medium (`lg`): Volume 24h
  - Hidden on large (`xl`): Circulating Supply
  - Always: Details → link button
- Hover highlight (CSS var themed — dark terminal style)
- SWR refresh every 120 seconds (data changes slowly)
- "Details →" links to `/coins/[symbol]` coin detail page

### `/alerts` — Risk Alerts

The notification centre for risk events detected by the worker.

**What's on this page:**
- Page title with unread count
- "Mark all read" button (appears when unread > 0)
- "Refresh" button
- Alert list — each alert shows:
  - Coin symbol (bold)
  - Severity badge (INFO / WARNING / CRITICAL — color coded: blue/yellow/red)
  - Alert message text
  - "Dismiss" button (marks as read, item dims to 45% opacity)
- Empty state: "No alerts."
- Loading state while fetching
- SWR refresh every 15 seconds
- All unread alerts also show a count badge on the Alerts nav link

### `/coins/[symbol]` — Coin Detail

Individual coin deep-dive page.

**What's on this page:**
- Full coin stats (price, market cap, volume, ATH/ATL, supply, holders)
- Signal history for this specific coin (all past signals, newest first)
- Risk breakdown: which flags have been triggered historically
- Score trends over time

### `/wallets` — Wallet Intelligence

Tracked wallet profiles and classifications.

**What's on this page:**
- Table of all tracked wallets: address, wallet type badge, quality score, win rate, total trades, hold time
- Quality score colored by tier: green ≥70, yellow ≥50, orange ≥30, red <30
- Wallet type badges color-coded: smart_money=green, dev=blue, whale=purple, bot=orange, sniper=yellow, dumper=red, retail=grey
- Empty state with informational message: explains that `BIRDEYE_API_KEY` is required for wallet-level tracking, with guidance on how to enable it
- SWR refresh every 60 seconds

> **Note:** Wallet data populates when `BIRDEYE_API_KEY` is configured. Without it, the page shows an informative empty state rather than an error.

### `/behavioral` — Behavioral Patterns

Active on-chain behavioral pattern signals detected by the behavioral worker.

**What's on this page:**
- **Summary stats row:** Total active signals · Signals by severity (Critical, High, Medium, Low counts)
- **Pattern filter tabs:** All / Accumulation / Pre-Breakout / Fake Breakout / Liquidity Trap / Momentum Ignition / Wash Trading / Breakdown / Consolidation
- **Signal table columns:** Token address · Pattern type badge · Severity badge (color-coded) · Confidence % bar · Description · Detected time
- **Severity color coding:** critical=red · high=orange · medium=yellow · low=blue
- SWR refresh every 30 seconds

### `/liquidity` — Liquidity Events

Real-time liquidity change monitoring.

**What's on this page:**
- **Filter tabs:** All Events / Suspicious Only (high + critical risk)
- **Event table columns:** Token address · Event type · Liquidity Before → After · Change % (green=add, red=remove) · Risk Level badge · Dev Wallet indicator · Status · Time
- **Risk level color coding:** critical=bright red · high=orange · medium=yellow · low=green
- Rug patterns highlighted with a distinct critical badge
- SWR refresh every 15 seconds
- Empty state: "No events found — liquidity events are generated automatically once DEX tokens have been tracked for at least one cycle."

### `/lln` — LLN Terminal

Top-level Law of Large Numbers intelligence dashboard. Sub-navigation bar links to all 7 LLN sub-pages.

**What's on this page:**
- **Stat tiles (6):** Total signals analysed · Global win rate · Global EV · Current regime · Global Sharpe · Profit factor
- **Outcome Donut:** SVG donut chart showing WIN / NEUTRAL / LOSS proportions across all outcomes
- **Band performance bars:** Win rate and EV bar per signal band (Strong Buy / Watch / Risky)
- **Equity curve:** SVG line chart with P10 / P50 / P90 shaded equity paths from `all_signals` Monte Carlo simulation
- **Risk metrics panel:** Global risk-of-ruin · survival probability · max drawdown (median and worst)
- **LLN principle banner:** Explains the statistical convergence methodology
- SWR polling every 30 seconds (overview) and 60 seconds (simulations, patterns)
- Empty state: informative message when fewer than 10 outcomes have been recorded

### `/lln/patterns` — Pattern Intelligence

Statistical signal performance grouped by configurable dimension.

**What's on this page:**
- **Group-by tabs:** Signal Band · Narrative · Risk Level · Liquidity Tier
- **Sortable table columns:** Group · Win Rate (with 95% CI) · EV · Avg ROI · Sharpe · Profit Factor · Confidence badge P(EV>0)
- **Expandable rows:** Click any row to reveal — Avg MFE · Avg MAE · Median ROI · Sortino · Bayesian WR · Win/Loss/Neutral counts · ROI histogram SVG (green bars = positive returns, red = negative, dashed zero line)
- Green = positive EV, red = negative EV — consistent color coding
- SWR polling every 30 seconds

### `/lln/strategies` — Strategy Performance

Pre-defined filter combination performance evaluation.

**What's on this page:**
- **Strategy cards** — one per strategy (7 strategies): All Signals · Strong Buy Only · Watch+Strong Buy · AI Narrative · Low Risk Only · Strong Buy+AI · Strong Buy+Low Risk
- Each card shows: EV badge (green/red), sample size, win/loss/neutral bar, 8-metric grid (Win Rate · Avg ROI · Median ROI · Sharpe · Sortino · Profit Factor · Max Drawdown · Risk of Ruin), Calmar ratio footer
- Cards sorted by descending EV
- "Best strategy" banner shows top EV strategy name
- SWR polling every 30 seconds

### `/lln/outcomes` — Signal Outcomes

Recent resolved signal outcomes with entry vs current price comparison.

**What's on this page:**
- **Summary stats row:** Total shown · WIN count · NEUTRAL count · Avg ROI
- **Filter tabs:** All / WIN / NEUTRAL / LOSS
- **Table columns:** Coin (symbol + narrative) · Band badge · Entry price · Exit target · Stop-loss · ROI (colored +/-) · MFE/MAE excursion bar SVG · Result badge (WIN/NEUTRAL/LOSS)
- **ExcursionBar:** Mini inline SVG showing green (MFE) and red (MAE) bars proportional to max favorable/adverse excursion
- SWR polling every 30 seconds

### `/lln/risk` — Risk Lab

Monte Carlo simulation results and drawdown scenario analysis.

**What's on this page:**
- **Global risk banner (4 tiles):** Global Survival P · Risk of Ruin · Max DD (Median) · Max DD (Worst 10%)
- **Simulation cards** — one per strategy subset (5 cards): runs, trade count, equity curve SVG, Median Final equity · Survival P · Risk of Ruin · Max DD (P90), P10/P50/P90 final equity row
- **EquityCurve SVG:** Shaded band between P10 and P90 paths with P50 median line. Green if median final ≥ $10,000, red otherwise. Dashed baseline at $10,000 starting capital.
- **Methodology note:** Starting equity · risk per trade · sampling method · percentile definitions · survival definition
- Requires ≥10 signal outcomes — shows informative empty state otherwise

### `/lln/regimes` — Regime Analysis

Market state detection history and per-regime signal performance.

**What's on this page:**
- **Current regime banner:** Large colored banner showing active regime (Trending=green · Volatile=red · Low Liquidity=yellow · Ranging=blue) with win rate
- **Regime timeline SVG:** Horizontal colored band showing the last 20 regime snapshots oldest→newest
- **Regime distribution:** Horizontal bar chart — how often each regime has been detected
- **Regime cards:** One per detection snapshot — market conditions (avg 1h change, volatility, liquidity, buy pressure), signal performance (win rate, avg ROI, best band/narrative), token count, detection timestamp
- Current regime card is highlighted with colored border
- SWR polling every 60 seconds

### `/lln/features` — Feature Analysis

Predictive importance ranking of signal sub-scores against ROI outcomes.

**What's on this page:**
- **Summary tiles:** Top feature name · Positive signals count · Negative signals count
- **Importance bars** — one per feature: horizontal bar (importance = |r|), centered correlation bar (positive right of center in green, negative left in red), direction badge (↑ Positive / ↓ Negative), rank badge
- **Correlation heatmap SVG:** Matrix of approximate cross-correlations between features, colored green (positive) to red (negative)
- **Interpretation guide:** Explains what positive/negative correlation means and how importance = |Pearson r|
- Features ranked by descending |r| with final ROI
- SWR polling every 30 seconds

---

## 🧩 Frontend Components

Components live in `web/components/` and are reusable across pages.

### `Nav` — Navigation Bar
- **Sticky:** Stays at the top of the page while scrolling (z-index 50)
- **Logo:** MEMETRADER.AI with gradient square icon
- **Live indicator:** Green pulsing dot with "LIVE" text
- **Desktop links:** Horizontal nav links. Active link has blue underline + background highlight.
- **Mobile hamburger:** Shown on screens < 768px (md breakpoint). Animated 3-bar → X when open. Opens a full dropdown menu with all links, active highlighting, and live clock.
- **Alert badge:** Red circle with unread count on the Alerts link. Updates every 10 seconds via SWR.
- **Live clock:** UTC time (HH:MM:SS UTC), updates every second. Hidden on mobile to save space.

### `LiveTicker`
- Auto-scrolling horizontal strip at the top of the Sniper page
- Shows top sniping opportunities: symbol, chain badge, score, 1h% change, band color
- CSS animation (`tickerScroll` keyframe) — continuous left scroll at constant speed
- **Pauses on hover** (`animation-play-state: paused`)
- Duplicates the item list to create seamless infinite scroll
- Fed by WebSocket data — updates in real time

### `NarrativeHeatmap`
- Grid layout: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- Each cell represents one narrative category
- **Color intensity:** Background opacity scales with `avg_score / max_score` — higher scoring categories glow brighter
- Each cell shows: category icon (unicode symbol) + name + avg score + mini score bar
- **Opportunity badge:** If the category has active sniping opportunities, a colored count badge appears in the top-right corner
- Loading skeleton: animated pulse placeholder cells
- Hover: `brightness-110` for subtle interactivity

### `FilterPresetPicker`
- Shown on the Sniper page above the manual filter bar
- Each preset is a button card with: emoji icon · short name · intent description · match count (live)
- **Active preset:** highlighted border in the preset's accent color + bottom bar indicator
- **Active badge:** "ACTIVE" label appears in header when a preset is selected
- **Clear button:** "✕ Clear preset" resets to manual filters
- **Active detail bar:** When a preset is active, a detail card below shows full name + intent + insight tip
- Responsive grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6`

### `ScoreRing`
- Circular SVG progress indicator
- Two circles: grey background ring + colored foreground arc
- Arc length proportional to score (0-100)
- Color matches band: green (Strong Buy) · yellow (Watch) · orange (Risky) · red (Avoid)
- Score number displayed in the center in monospace font
- Used in the Sniper page token table Score column

### `ScoreBar`
- Linear horizontal progress bar showing a score 0-100
- Used in the expanded token detail row for sub-score breakdown
- Color: green ≥70, yellow ≥50, orange ≥30, red <30
- Width animates with CSS transition

### `AlertsList`
- Renders a list of Alert objects with dark-theme severity styling
- `info` → blue border/background
- `warning` → yellow border/background
- `critical` → red border/background
- Read alerts dimmed to 45% opacity
- Each item: bold coin symbol · severity badge · message text · Dismiss button
- Dismiss button styled as a small bordered button (no filled background)

### `SignalTable`
- Reusable table component for displaying lists of signals
- Columns: Coin · Score (with band color) · Band badge · Entry · Exit · SL · Risk level · Age

### `SignalCard`
- Card-style component for a single signal
- Shows composite score prominently with a ScoreRing
- Sub-scores listed below with ScoreBar for each
- Entry/Exit/SL in monospace font
- Risk flags shown as small orange badges
- Reasoning text in smaller secondary color

### `RiskBadge`
- Small inline badge component for risk level
- `low` → subtle green
- `medium` → yellow
- `high` → orange
- `extreme` → bright red with stronger border

---

## ⚙️ Configuration — All Tunable Settings

All settings live in `backend/app/core/config.py` using Pydantic Settings. Values can be overridden via environment variables or the `.env` file.

| Setting | Default | Type | Description |
|---|---|---|---|
| `app_name` | `"MemeTrader AI"` | str | Application name (shown in API docs) |
| `database_url` | `postgresql+asyncpg://...` | str | Async PostgreSQL connection string |
| `redis_url` | `redis://redis:6379/0` | str | Redis connection URL |
| `debug` | `false` | bool | Enable debug logging |
| `coingecko_api_key` | `""` | str | CoinGecko API key (optional — empty = free tier) |
| `coingecko_max_pages` | `4` | int | Pages to fetch per cycle (250 coins/page) — max 1,000 coins |
| `signal_refresh_interval_seconds` | `30` | int | How often the signal worker runs |
| `min_liquidity_usd` | `50000.0` | float | Minimum liquidity to avoid `low_liquidity` risk flag |
| `whale_concentration_threshold` | `0.30` | float | Concentration above which `whale_concentration` flag triggers |
| `spike_threshold` | `0.50` | float | 24h price change magnitude above which `sudden_spike` flag triggers |
| `min_holders` | `500` | int | Holder count below which `low_holders` flag triggers |
| `birdeye_api_key` | `""` | str | Birdeye API key (optional) |
| `moralis_api_key` | `""` | str | Moralis API key (optional) |
| `bitquery_api_key` | `""` | str | Bitquery API key (optional) |
| `alchemy_api_key` | `""` | str | Alchemy API key (optional) |

---

## 🔑 Environment Variables

> **Tip:** Copy `.env.example` to `.env` and only fill in the keys you have. The platform works with all keys empty — each one simply unlocks more data.

Create a `.env` file in the project root (copy from `.env.example`):

```env
# ─────────────────────────────────────────────
# REQUIRED — Database and Cache
# ─────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/memetrader
REDIS_URL=redis://redis:6379/0

# ─────────────────────────────────────────────
# OPTIONAL — CoinGecko
# Without key: free tier (~30 req/min, may hit limits under load)
# With key:    higher rate limits
# Get key at:  https://www.coingecko.com/en/api/pricing
# ─────────────────────────────────────────────
COINGECKO_API_KEY=

# ─────────────────────────────────────────────
# OPTIONAL — Tier 3 Data Pipelines
# Platform works perfectly without these — Tier 1 & 2 are always active.
# Each unlocks an additional data source pipeline.
# ─────────────────────────────────────────────

# Birdeye — Best Solana + multi-chain DEX data
# Get key at: https://birdeye.so/
BIRDEYE_API_KEY=

# Moralis — EVM multi-chain analytics (ETH, BSC, Base, Polygon, Arbitrum, Solana)
# Get key at: https://moralis.io/
MORALIS_API_KEY=

# Bitquery — Real-time GraphQL blockchain streaming
# Get key at: https://bitquery.io/
BITQUERY_API_KEY=

# Alchemy — Developer-grade EVM infrastructure (ETH, Base, Polygon, Arbitrum, BSC)
# Get key at: https://alchemy.com/
ALCHEMY_API_KEY=

# ─────────────────────────────────────────────
# TUNING — Worker Behaviour
# ─────────────────────────────────────────────

# How often the CoinGecko signal worker runs (seconds)
SIGNAL_REFRESH_INTERVAL_SECONDS=30

# How many CoinGecko pages to fetch per cycle (250 coins/page)
# 4 pages = 1,000 coins. Increase carefully — respects rate limits.
COINGECKO_MAX_PAGES=4

# Enable verbose debug logging
DEBUG=false
```

---

## 🚦 Rate Limiting Awareness

The platform is built to respect free-tier rate limits on all external APIs. Each source has a specific delay strategy:

| Source | Rate Limit (Free) | Strategy |
|---|---|---|
| CoinGecko | ~30 req/min | 3 second delay between paginated pages |
| GeckoTerminal | ~30 req/min | 2 second delay between network requests |
| DexScreener | ~300 req/min | 0.2 second delay between search queries |
| Pump.fun | Unspecified | Single batch fetch per cycle |
| GMGN.ai | Unspecified | Single pipeline call per cycle |
| SolanaFM | Unspecified | Batched per-token metadata calls |
| Moralis | 40k CU/day | Parallel requests within budget |
| Birdeye | Tier-limited | Sequential with backoff on 429 |
| Bitquery | Tier-limited | Single GraphQL query per cycle |
| Alchemy | 300M CU/month | Parallel requests within budget |

If you add API keys for Tier 3 pipelines, the workers automatically start using them without any code changes — the settings are read from environment variables at startup.

---

## ☸️ Kubernetes & Helm Deployment

The platform ships with a full Helm chart for production Kubernetes deployments.

### Prerequisites

- Kubernetes cluster (local: `minikube`, `k3d`, or `kind`; cloud: EKS, GKE, AKS)
- `helm` CLI installed
- `kubectl` configured against your cluster

### Chart Structure

```
helm/meme-trader-ai/
├── Chart.yaml                      # Chart metadata and version
├── values.yaml                     # Default values (override per environment)
└── templates/
    ├── _helpers.tpl                # Named template helpers
    ├── configmap.yaml              # Non-secret environment variables
    ├── secret.yaml                 # Database URL, Redis URL, API keys
    ├── serviceaccount.yaml         # Kubernetes ServiceAccount
    ├── api/
    │   ├── deployment.yaml         # FastAPI Deployment (readiness + liveness probes)
    │   └── service.yaml            # ClusterIP Service on port 8000
    ├── web/
    │   ├── deployment.yaml         # Next.js Deployment
    │   └── service.yaml            # ClusterIP/LoadBalancer on port 3000
    ├── workers/
    │   ├── tasks-worker.yaml        # Signal generation worker Deployment
    │   ├── dex-worker.yaml          # DEX token sniping worker Deployment
    │   ├── behavioral-worker.yaml   # Behavioral intelligence worker Deployment
    │   └── lln-worker.yaml          # LLN Quant Engine worker Deployment
    ├── postgres/
    │   ├── statefulset.yaml        # PostgreSQL StatefulSet with PVC
    │   └── service.yaml            # Headless Service
    └── redis/
        ├── statefulset.yaml        # Redis StatefulSet
        └── service.yaml            # ClusterIP Service
```

### Default Image Configuration (`values.yaml`)

```yaml
image:
  api:
    repository: ghcr.io/mthokozisi-sithole/meme-trader-ai-api
    tag: "latest"
    pullPolicy: Always
  web:
    repository: ghcr.io/mthokozisi-sithole/meme-trader-ai-web
    tag: "latest"
    pullPolicy: Always
```

> Worker containers (`worker`, `dex-worker`, `behavioral-worker`, `lln-worker`) share the same `api` image — they run different `command` entrypoints.

The `lln-worker` Deployment uses `resources.llnWorker` from `values.yaml` (256Mi/512Mi memory — higher than other workers to accommodate numpy/scipy Monte Carlo vectorisation):

```yaml
replicaCount:
  llnWorker: 1

resources:
  llnWorker:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
```

### Deploying with the Makefile

A `Makefile` is included with common Helm + kubectl operations:

```bash
# Validate and lint the chart
make helm-lint

# Preview what will be deployed (dry run)
make helm-dry-run

# Create namespace if it doesn't exist
make k8s-create-ns

# Full deploy (installs or upgrades)
make k8s-deploy

# Upgrade an existing release
make k8s-upgrade

# Check pod and service status
make k8s-status

# Tail API container logs
make k8s-logs-api

# Tail behavioral worker logs
make k8s-logs-worker

# Tear down the release
make k8s-delete
```

### Key Kubernetes Features

- **Init containers:** The API pod uses a `busybox` init container that waits for PostgreSQL to become ready (`nc -z postgres 5432`) before starting uvicorn
- **Health probes:** API Deployment has `readinessProbe` (10s delay, 5s period) and `livenessProbe` (30s delay, 10s period) on `GET /health`
- **Restart policy:** All Deployments and StatefulSets have `restartPolicy: Always`
- **Image pull secrets:** Configurable via `global.imagePullSecrets` in values
- **Resource limits:** Configurable per service via `resources.api`, `resources.web`, etc. in values

### Secrets Setup

Before deploying, create a Kubernetes Secret with your credentials:

```bash
kubectl create secret generic meme-trader-ai-secrets \
  --namespace meme-trader \
  --from-literal=DATABASE_URL="postgresql+asyncpg://postgres:postgres@meme-trader-ai-postgres:5432/memetrader" \
  --from-literal=REDIS_URL="redis://meme-trader-ai-redis:6379/0" \
  --from-literal=BIRDEYE_API_KEY="" \
  --from-literal=MORALIS_API_KEY="" \
  --from-literal=BITQUERY_API_KEY="" \
  --from-literal=ALCHEMY_API_KEY=""
```

Or override in your own `values.yaml`:

```yaml
secrets:
  databaseUrl: "postgresql+asyncpg://..."
  redisUrl: "redis://..."
```

---

## 🔄 CI/CD — GitHub Actions

A GitHub Actions workflow automatically builds and publishes Docker images to the **GitHub Container Registry (GHCR)** on every push.

### Workflow File

`.github/workflows/docker-publish.yml`

### Triggers

| Event | Action |
|---|---|
| Push to `main` | Build + push `latest` tag and `sha-<short>` tag |
| Push a `v*.*.*` tag | Build + push semantic version tags (`v1.2.3`, `1.2`, `1`) |
| Pull request to `main` | Build only (no push) — validates the build is not broken |
| Manual (`workflow_dispatch`) | Build + push on demand |

### Images Published

| Image | Registry Path |
|---|---|
| FastAPI backend | `ghcr.io/mthokozisi-sithole/meme-trader-ai-api` |
| Next.js frontend | `ghcr.io/mthokozisi-sithole/meme-trader-ai-web` |

> Image names are **always lowercase** — the workflow uses `${GITHUB_REPOSITORY_OWNER,,}` bash expansion to lowercase the owner name, which is required by the Docker registry format.

### Tags Published

For a push to `main` with commit `abc1234`:
- `ghcr.io/mthokozisi-sithole/meme-trader-ai-api:latest`
- `ghcr.io/mthokozisi-sithole/meme-trader-ai-api:sha-abc1234`
- `ghcr.io/mthokozisi-sithole/meme-trader-ai-api:main`

For a `v1.2.3` tag push:
- `ghcr.io/mthokozisi-sithole/meme-trader-ai-api:v1.2.3`
- `ghcr.io/mthokozisi-sithole/meme-trader-ai-api:1.2`
- `ghcr.io/mthokozisi-sithole/meme-trader-ai-api:1`
- `ghcr.io/mthokozisi-sithole/meme-trader-ai-api:latest`

### Authentication

The workflow uses `GITHUB_TOKEN` (automatically available in all Actions runs) — **no additional secrets are required**.

### Layer Caching

Build cache is stored in the registry itself using `type=registry,mode=max`:
```yaml
cache-from: type=registry,ref=ghcr.io/mthokozisi-sithole/meme-trader-ai-api:cache
cache-to: type=registry,ref=ghcr.io/mthokozisi-sithole/meme-trader-ai-api:cache,mode=max
```

This dramatically speeds up subsequent builds by reusing unchanged layers.

### Using the Published Images

To deploy from GHCR in your own cluster, the images are public. You can pull directly:

```bash
docker pull ghcr.io/mthokozisi-sithole/meme-trader-ai-api:latest
docker pull ghcr.io/mthokozisi-sithole/meme-trader-ai-web:latest
```

Or deploy using the Helm chart which already points to these images by default.

---

## 📁 Project Structure

```
meme-trader-ai/
│
├── backend/
│   ├── app/
│   │   │
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings — all env vars + defaults
│   │   │   └── database.py        # Async SQLAlchemy engine + session factory
│   │   │
│   │   ├── models/                # SQLAlchemy ORM table definitions
│   │   │   ├── coin.py            # Coin model (coins table)
│   │   │   ├── signal.py          # Signal model (signals table)
│   │   │   ├── alert.py           # Alert model (alerts table)
│   │   │   ├── dex_token.py       # DexToken model (dex_tokens table)
│   │   │   ├── wallet.py          # Wallet + WalletTransaction models
│   │   │   ├── behavioral_signal.py # BehavioralSignal model
│   │   │   ├── liquidity_event.py # LiquidityEvent model
│   │   │   ├── holder_snapshot.py # HolderSnapshot model
│   │   │   ├── token_timeseries.py # TokenTimeseries model
│   │   │   └── lln.py             # 7 LLN analytics models (signal_outcomes,
│   │   │                          #   pattern_performance, return_distributions,
│   │   │                          #   strategy_performance, regime_stats,
│   │   │                          #   simulation_results, feature_importance)
│   │   │
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   │   ├── coin.py            # CoinCreate, CoinOut, CoinUpdate
│   │   │   ├── signal.py          # SignalCreate, SignalOut
│   │   │   ├── alert.py           # AlertCreate, AlertOut
│   │   │   ├── dex_token.py       # DexTokenCreate, DexTokenOut
│   │   │   └── lln.py             # LLNOverview, PatternPerformanceOut,
│   │   │                          #   ReturnDistributionOut, StrategyPerformanceOut,
│   │   │                          #   SignalOutcomeOut, SimulationResultOut,
│   │   │                          #   RegimeStatOut, FeatureImportanceOut, RiskSummaryOut
│   │   │
│   │   ├── repositories/          # Database access layer (CRUD operations)
│   │   │   ├── coin_repo.py       # Coin upsert, search, get
│   │   │   ├── signal_repo.py     # Signal insert, list by coin
│   │   │   ├── alert_repo.py      # Alert create, mark read
│   │   │   ├── dex_token_repo.py  # DexToken upsert, filter, rank
│   │   │   ├── wallet_repo.py     # Wallet + transaction CRUD
│   │   │   ├── behavioral_repo.py # BehavioralSignal create, deactivate
│   │   │   ├── liquidity_repo.py  # LiquidityEvent create, get_all, suspicious
│   │   │   └── timeseries_repo.py # TokenTimeseries insert, get_history, get_latest
│   │   │
│   │   ├── services/              # Business logic
│   │   │   ├── scoring.py         # Composite score formula (sentiment+technical+liquidity+momentum)
│   │   │   ├── risk.py            # Risk flag detection + SL calculation
│   │   │   ├── signal_service.py  # Orchestrates scoring+risk → full signal with trade levels
│   │   │   ├── snipe_scorer.py    # DEX token composite score + trade level generation
│   │   │   ├── narrative_engine.py # Keyword-based category classification + hype velocity
│   │   │   ├── wallet_classifier.py # WalletMetrics → ClassificationResult (8 wallet types)
│   │   │   ├── pattern_detector.py  # detect_patterns(candles) → list[PatternResult] (9 patterns)
│   │   │   ├── behavioral_engine.py # Orchestrates timeseries fetch → pattern detect → persist
│   │   │   ├── signal_fusion.py     # compute_fusion(FusionInput, weights) → FusionResult
│   │   │   ├── liquidity_tracker.py # assess_liquidity_event() → LiquidityRiskResult
│   │   │   └── lln_analytics.py     # LLN Quant Engine — outcome modeling, pattern/strategy
│   │   │                            #   performance, Monte Carlo, regime detection, feature importance
│   │   │
│   │   ├── routes/                # FastAPI route handlers
│   │   │   ├── health.py          # GET /health
│   │   │   ├── coins.py           # GET/POST/PUT/PATCH /coins
│   │   │   ├── signals.py         # GET /signals, POST /signals/{symbol}/generate
│   │   │   ├── alerts.py          # GET /alerts, PATCH /alerts/{id}/read
│   │   │   ├── snipes.py          # GET /snipes, GET /snipes/tokens
│   │   │   ├── market.py          # GET /market/stats|trending|new-pools|score-dist|narrative-perf
│   │   │   ├── wallets.py         # GET /wallets, GET /wallets/{addr}/transactions, POST /classify
│   │   │   ├── behavioral.py      # GET/POST /behavioral/signals, POST /analyze, GET /summary
│   │   │   ├── liquidity.py       # GET /liquidity/events, /suspicious, /events/{addr}
│   │   │   ├── analytics_lln.py   # GET /analytics/overview|patterns|strategies|outcomes|
│   │   │   │                      #   distributions|risk|simulations|regimes|features
│   │   │   └── ws.py              # WS /ws/signals, /ws/snipes, /ws/ticker
│   │   │
│   │   ├── worker/
│   │   │   ├── tasks.py              # CoinGecko signal generation loop
│   │   │   ├── dex_tasks.py          # DEX sniping loop
│   │   │   ├── behavioral_worker.py  # Behavioral intelligence loop (60s cycle)
│   │   │   ├── lln_quant_worker.py   # LLN Quant Engine loop (60s cycle, sidecar)
│   │   │   └── pipelines/            # Per-source data pipeline modules
│   │   │       ├── dexscreener.py     # DexScreener new pairs + boosted tokens
│   │   │       ├── pumpfun.py         # Pump.fun new + trending coins
│   │   │       ├── geckoterminal.py   # GeckoTerminal pools (free)
│   │   │       ├── gmgn_pipeline.py   # GMGN.ai smart money pipeline (free)
│   │   │       ├── solanafm_pipeline.py # SolanaFM on-chain pipeline (free)
│   │   │       ├── birdeye_pipeline.py  # Birdeye pipeline (keyed)
│   │   │       ├── moralis_pipeline.py  # Moralis pipeline (keyed)
│   │   │       ├── bitquery_pipeline.py # Bitquery GraphQL pipeline (keyed)
│   │   │       └── alchemy_pipeline.py  # Alchemy EVM pipeline (keyed)
│   │   │
│   │   └── main.py                # FastAPI app instantiation + CORS middleware + router registration
│   │
│   ├── alembic/
│   │   ├── versions/              # Migration files (auto-applied on startup)
│   │   │   ├── 0001_initial.py    # coins, signals, alerts tables
│   │   │   ├── 0002_dex_tokens.py # dex_tokens table
│   │   │   ├── 0003_...py         # earlier migrations
│   │   │   ├── 0004_add_intelligence_tables.py  # 6 intelligence tables
│   │   │   └── 0005_add_lln_tables.py           # 7 LLN analytics tables
│   │   └── alembic.ini
│   │
│   ├── requirements.txt           # Python dependencies (incl. numpy, scipy, scikit-learn for LLN)
│   └── Dockerfile                 # Python 3.11 slim image
│
├── web/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout — Nav + main wrapper
│   │   ├── globals.css            # CSS variables, dark theme, Tailwind base
│   │   ├── page.tsx               # / — Terminal dashboard
│   │   ├── sniper/
│   │   │   └── page.tsx           # /sniper — DEX Scanner
│   │   ├── analytics/
│   │   │   └── page.tsx           # /analytics — Charts and analytics
│   │   ├── tokens/
│   │   │   └── page.tsx           # /tokens — DEX Tokens table
│   │   ├── coins/
│   │   │   ├── page.tsx           # /coins — CoinGecko coins list
│   │   │   └── [symbol]/
│   │   │       └── page.tsx       # /coins/[symbol] — Coin detail
│   │   ├── alerts/
│   │   │   └── page.tsx           # /alerts — Risk alerts
│   │   ├── wallets/
│   │   │   └── page.tsx           # /wallets — Wallet intelligence
│   │   ├── behavioral/
│   │   │   └── page.tsx           # /behavioral — Behavioral pattern signals
│   │   ├── liquidity/
│   │   │   └── page.tsx           # /liquidity — Liquidity event monitoring
│   │   └── lln/
│   │       ├── layout.tsx         # /lln sub-navigation (7 pages)
│   │       ├── page.tsx           # /lln — LLN Terminal (overview dashboard)
│   │       ├── patterns/
│   │       │   └── page.tsx       # /lln/patterns — Pattern Intelligence
│   │       ├── strategies/
│   │       │   └── page.tsx       # /lln/strategies — Strategy Performance
│   │       ├── outcomes/
│   │       │   └── page.tsx       # /lln/outcomes — Signal Outcomes
│   │       ├── risk/
│   │       │   └── page.tsx       # /lln/risk — Risk Lab (Monte Carlo)
│   │       ├── regimes/
│   │       │   └── page.tsx       # /lln/regimes — Regime Analysis
│   │       └── features/
│   │           └── page.tsx       # /lln/features — Feature Analysis
│   │
│   ├── components/                # Reusable React components
│   │   ├── Nav.tsx                # Navigation bar (hamburger + desktop)
│   │   ├── LiveTicker.tsx         # Scrolling ticker strip
│   │   ├── NarrativeHeatmap.tsx   # Category performance grid
│   │   ├── FilterPresetPicker.tsx # Preset filter button panel
│   │   ├── ScoreRing.tsx          # Circular SVG score indicator
│   │   ├── ScoreBar.tsx           # Linear score progress bar
│   │   ├── AlertsList.tsx         # Alert list with dismiss
│   │   ├── SignalTable.tsx        # Signal table component
│   │   ├── SignalCard.tsx         # Single signal card
│   │   └── RiskBadge.tsx          # Risk level badge
│   │
│   ├── lib/
│   │   ├── api.ts                 # Typed API client (all endpoints, uses /api proxy)
│   │   ├── ws.ts                  # WebSocket hook (useWsData — snapshot + updates)
│   │   └── presets.ts             # Filter preset definitions (PRESETS array + computeMetrics)
│   │
│   ├── types/
│   │   └── index.ts               # TypeScript types (Coin, Signal, Alert, DexToken,
│   │                              #   Wallet, WalletTransaction, BehavioralSignal,
│   │                              #   LiquidityEvent, BehavioralSummary,
│   │                              #   LLNOverview, PatternPerformance, ReturnDistribution,
│   │                              #   StrategyPerformance, SignalOutcome, SimulationResult,
│   │                              #   RegimeStat, FeatureImportance, RiskSummary)
│   │
│   ├── next.config.js             # Proxy rewrites: /api/* → http://api:8000/*
│   ├── tailwind.config.ts         # Tailwind configuration
│   ├── tsconfig.json              # TypeScript config
│   └── Dockerfile                 # Node 20 Alpine multi-stage build
│
├── docker-compose.yml             # All 8 services (restart: always on all)
├── Makefile                       # Helm and kubectl shortcuts (helm-lint, k8s-deploy, etc.)
├── helm/
│   └── meme-trader-ai/
│       ├── Chart.yaml             # Chart metadata
│       ├── values.yaml            # Default values (GHCR image refs)
│       └── templates/             # Kubernetes manifests (Deployments, StatefulSets, Services, etc.)
│           └── workers/
│               ├── tasks-worker.yaml       # Signal worker
│               ├── dex-worker.yaml         # DEX sniping worker
│               ├── behavioral-worker.yaml  # Behavioral worker
│               └── lln-worker.yaml         # LLN Quant Engine worker
├── .env.example                   # Template environment file
├── .claude/                       # Claude project rules and agent definitions
│   ├── rules/                     # Architecture, trading logic, code style, risk management rules
│   ├── agents/                    # Specialised AI agent role definitions
│   ├── skills/                    # Skill definitions (signal generation, market analysis, whale detection)
│   └── commands/                  # Custom commands (deploy, generate-signals, analyze-market, build-system)
├── .github/
│   └── workflows/
│       ├── ci.yml                 # GitHub Actions CI pipeline
│       └── docker-publish.yml     # Build + push API and web images to GHCR
└── README.md
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">

Built with ⚡ by the MemeTrader AI team · Powered by FastAPI + Next.js

</div>
