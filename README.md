# 🧠 MemeTrader AI — Meme Coin Intelligence Terminal

A production-ready, full-stack meme coin trading intelligence platform. Scans **9 data sources every 30 seconds**, scores every token with a multi-factor algorithm, and outputs actionable **entry / exit / stop-loss signals** with risk context — all in a live dark-terminal dashboard.

> ⚠️ **Not financial advice.** This is a research and analytics tool. Meme coins are extremely high risk. Always DYOR.

---

## 🎯 What It Does

- Discovers new tokens from DexScreener, GeckoTerminal, GMGN, Birdeye, Moralis, Bitquery, Alchemy, SolanaFM, CoinGecko
- Scores every token 0–100 using narrative + momentum + liquidity + sentiment
- Generates entry zone, 3 exit targets, and stop-loss for every token
- Flags rugs, whale dumps, and bot-driven fake pumps
- Streams live updates to the browser via WebSocket

---

## 📸 Pages

| Page | URL | Description |
|------|-----|-------------|
| Intelligence Terminal | `/` | Live signal stream, narrative heatmap, top snipes |
| DEX Sniper | `/sniper` | Full token scanner with 11 analytics presets |
| Analytics | `/analytics` | SVG charts, score distribution, narrative performance |
| Coins | `/coins` | CoinGecko established meme coins |
| Alerts | `/alerts` | Risk alert feed |

---

## 🚀 Quick Start (5 minutes, requires Docker)

### Step 1 — Install Docker

Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### Step 2 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/meme-trader-ai.git
cd meme-trader-ai
```

### Step 3 — (Optional) Add API keys

```bash
cp .env.example .env
# Edit .env and add any API keys you have
# The system works without any keys — they just unlock more data sources
```

### Step 4 — Start everything

```bash
docker compose up -d
```

Wait about 30 seconds for the first data scan. Then open:

**http://localhost:3000**

---

## 🔑 API Keys — What You Need

The system runs **without any API keys** using free public endpoints. Keys unlock additional data sources.

### Free — Works Immediately (No Key)

| Source | Data | Docs |
|--------|------|------|
| DexScreener | New token pairs, boosted tokens | [docs.dexscreener.com](https://docs.dexscreener.com) |
| GeckoTerminal | Cross-chain new pools + trending | [docs.geckoterminal.com](https://docs.geckoterminal.com) |
| GMGN | Solana smart money, swap rankings | [gmgn.ai](https://gmgn.ai) |
| CoinGecko (free) | Meme coin market data | [coingecko.com](https://coingecko.com) |

### Paid — Add to `.env` to Unlock

| Variable | Source | What It Adds | Get Key |
|----------|--------|--------------|---------|
| `BIRDEYE_API_KEY` | Birdeye | Best Solana new listings, whale detection | [birdeye.so](https://birdeye.so) |
| `MORALIS_API_KEY` | Moralis | ETH/BSC/Base gainers, trending tokens | [moralis.io](https://moralis.io) |
| `BITQUERY_API_KEY` | Bitquery | Real-time Pump.fun events via GraphQL | [bitquery.io](https://bitquery.io) |
| `ALCHEMY_API_KEY` | Alchemy | EVM token prices, whale transfer detection | [alchemy.com](https://alchemy.com) |

After adding keys, restart the worker:
```bash
docker compose up -d --build dex-worker
```

---

## ⚙️ How Scoring Works

Every token gets a composite score (0–100):

```
Score = (0.35 × Narrative) + (0.25 × Momentum) + (0.25 × Liquidity) + (0.15 × Sentiment)
```

| Score | Band | Meaning |
|-------|------|---------|
| 80–100 | 🟢 Strong Buy | High conviction — all signals green |
| 60–79 | 🔵 Watch | Solid setup, worth monitoring |
| 40–59 | 🟡 Risky | Weak signals, small position only |
| < 40 | 🔴 Avoid | Skip it |

### What Each Component Measures

**Narrative (35%)** — Is the token riding a hot meta?
Detects keywords: AI, Animal (dog/cat/frog), Celebrity, Political, Gaming, etc. High hype velocity = higher score.

**Momentum (25%)** — Is trading activity accelerating?
Volume in last 5m vs historical average. Buy pressure percentage. Price change velocity.

**Liquidity (25%)** — Can you actually exit?
Pool depth in USD. FDV/liquidity ratio (low ratio = healthier). Buy/sell transaction balance.

**Sentiment (15%)** — Are people talking about it?
Has Twitter/Telegram/website. DexScreener boosted. CoinGecko trending.

### Risk Flags (Score Downgrades)

These automatically lower the score and tighten the stop-loss:
- Liquidity under $5,000 (rug risk)
- Top wallets hold > 30% of supply (whale dump risk)
- Price spiked > 50% suddenly (pump & dump setup)
- FDV/liquidity ratio > 100× (exit liquidity trap)
- No social presence

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                           │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────────┐   │
│  │ postgres │   │  redis   │   │      dex-worker           │   │
│  │ :5432    │   │  :6379   │   │  scans 9 sources / 30s   │   │
│  └──────────┘   └──────────┘   └──────────────────────────┘   │
│       ▲               ▲               ▼                        │
│  ┌─────────────────────────────────────────────────────┐       │
│  │                  FastAPI :8000                       │       │
│  │  /snipes /signals /market /alerts /ws/*             │       │
│  └─────────────────────────────────────────────────────┘       │
│                          ▲                                      │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Next.js :3000                           │       │
│  │  WebSocket + SWR polling → live dashboard           │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
meme-trader-ai/
├── backend/
│   └── app/
│       ├── core/
│       │   ├── config.py           # All settings via env vars
│       │   └── database.py         # Async PostgreSQL connection
│       ├── models/                 # SQLAlchemy database tables
│       ├── schemas/                # Pydantic request/response models
│       ├── repositories/           # Database query layer
│       ├── services/
│       │   ├── snipe_scorer.py     # ← Main scoring engine
│       │   ├── narrative_engine.py # Token narrative classification
│       │   ├── risk.py             # Risk flag detection
│       │   ├── dexscreener_client.py
│       │   ├── geckoterm_client.py
│       │   ├── gmgn_client.py      # Free smart money data
│       │   ├── solanafm_client.py  # Free Solana on-chain data
│       │   ├── birdeye_client.py   # Requires BIRDEYE_API_KEY
│       │   ├── moralis_client.py   # Requires MORALIS_API_KEY
│       │   ├── bitquery_client.py  # Requires BITQUERY_API_KEY
│       │   └── alchemy_client.py   # Requires ALCHEMY_API_KEY
│       ├── routes/
│       │   ├── snipes.py           # /snipes/* endpoints
│       │   ├── market.py           # /market/* analytics
│       │   ├── ws.py               # WebSocket streams
│       │   └── ...
│       └── worker/
│           ├── dex_tasks.py        # ← DEX scanner (runs every 30s)
│           └── tasks.py            # CoinGecko worker
│
├── web/
│   ├── app/
│   │   ├── page.tsx                # Intelligence Terminal
│   │   ├── sniper/page.tsx         # DEX Scanner with presets
│   │   └── analytics/page.tsx      # Charts dashboard
│   ├── components/
│   │   ├── FilterPresetPicker.tsx  # 11 analytics presets UI
│   │   ├── NarrativeHeatmap.tsx
│   │   ├── ScoreRing.tsx           # SVG donut score ring
│   │   └── LiveTicker.tsx
│   └── lib/
│       ├── presets.ts              # 11 filter preset definitions
│       ├── ws.ts                   # WebSocket hook (auto-reconnect)
│       └── api.ts                  # All API client functions
│
├── docker-compose.yml
└── .env.example
```

---

## 📡 API Endpoints

Base URL: `http://localhost:8000`

### Sniper Data

```bash
# All tracked tokens (paginated)
GET /snipes/tokens?limit=100&offset=0

# Confirmed snipe opportunities only
GET /snipes/tokens?snipe_only=true

# Filter by chain
GET /snipes/tokens?chain=solana

# Min score filter
GET /snipes/tokens?min_score=60
```

### Market Analytics

```bash
GET /market/stats                    # Dashboard counts + narrative breakdown
GET /market/trending                 # Top trending pools
GET /market/score-distribution       # Score histogram for charts
GET /market/narrative-performance    # Performance by narrative category
```

### WebSocket Streams

```javascript
// Connect in browser:
const ws = new WebSocket("ws://localhost:8000/ws/snipes");
ws.onmessage = (e) => console.log(JSON.parse(e.data)); // fires every 5s
```

| Endpoint | Payload | Interval |
|----------|---------|----------|
| `/ws/signals` | Latest trading signals | 5s |
| `/ws/snipes` | All DEX tokens | 5s |
| `/ws/ticker` | Ticker tape data | 5s |

---

## 🧩 The 11 Analytics Presets

The DEX Sniper page has 11 built-in filter presets. Each one computes derived metrics client-side and filters tokens in real-time:

| Preset | Type | What It Finds |
|--------|------|---------------|
| ⚡ Stealth Launch Sniper | BUY | Age < 10 min, liq $2k–$15k, >50 buys, no sells |
| 🧨 Liquidity Trap Detector | AVOID | Low liq + high FDV = exit liquidity setup |
| 🚀 Organic Momentum | BUY | Real buy pressure, consistent volume growth |
| 🔥 Pre-Breakout Compression | BUY | Age 1–6h, flat price, volume building |
| 🧠 Smart Money Footprint | BUY | Large average tx size, whale-level buys |
| ⚔️ FOMO Ignition | BUY | Volume spike 3×, price +15–60%, buy explosion |
| 🧬 Revival Play | BUY | Down 40–90% in 24h but volume returning |
| 🛡️ Safe Trend Rider | BUY | Liq >$100k, low risk, consistent uptrend |
| 🧨 Dev Exit Signal | WARN | High vol, flat price despite buys = dumping |
| 🧠 Algo Bait Detector | AVOID | High tx count, tiny tx size = bot activity |
| 👑 God Mode | BUY | Every signal green simultaneously |

---

## 🐳 Docker Commands Reference

```bash
# Start all services
docker compose up -d

# View live logs from all services
docker compose logs -f

# View logs from specific service
docker compose logs -f dex-worker    # DEX scanner logs
docker compose logs -f api           # API request logs

# Restart after code change
docker compose up -d --build api
docker compose up -d --build web
docker compose up -d --build dex-worker

# Run database migrations manually
docker compose exec api alembic upgrade head

# Open PostgreSQL shell
docker compose exec postgres psql -U postgres memetrader

# Stop everything (keeps database)
docker compose down

# Stop and wipe database (fresh start)
docker compose down -v

# Check service status
docker compose ps
```

---

## 🗄️ Database Tables

### `dex_tokens` — The Main Table

Every token discovered by any data source lands here and gets scored.

Key columns:
- `token_address` + `chain` — unique identifier (composite key)
- `snipe_score` — 0 to 100 composite score
- `band` — "Strong Buy" / "Watch" / "Risky" / "Avoid"
- `sniping_opportunity` — true if meets all threshold criteria
- `entry_low`, `entry_high` — suggested entry price range
- `exit_target_1/2/3` — three profit-taking price levels
- `stop_loss` — where to get out if wrong
- `risk_level` — "low" / "medium" / "high" / "extreme"
- `risk_flags` — JSON array of active risk warnings
- `narrative_category` — AI / Animal / Celebrity / Political / etc.
- `source` — which API discovered this token

---

## 🛠️ Adding a New Data Source

1. Create `backend/app/services/mysource_client.py`:

```python
async def run_pipeline() -> list[dict]:
    """Fetch tokens and return in standard format."""
    # ... your API calls ...
    return [{
        "source": "mysource",
        "chain": "solana",           # required
        "token_address": "ABC123",   # required
        "symbol": "TOKEN",           # required
        "name": "My Token",
        "liquidity_usd": 50000.0,
        "volume_5m": 1234.0,
        "price_usd": 0.001,
        # all other fields optional (use None)
    }]
```

2. Import in `backend/app/worker/dex_tasks.py`:
```python
from app.services.mysource_client import run_pipeline as mysource_pipeline
# ... in run_dex_cycle():
my_tokens = await mysource_pipeline()
_merge_batch(my_tokens)
```

3. If it needs an API key, add to `backend/app/core/config.py`:
```python
mysource_api_key: str = ""
```
And to `docker-compose.yml` under `dex-worker` → `environment`:
```yaml
MYSOURCE_API_KEY: "${MYSOURCE_API_KEY:-}"
```

---

## 🧪 Tests

```bash
# Backend
cd backend && pytest tests/ -v --tb=short

# Frontend
cd web && npm test
```

---

## 🔒 Production Deployment Notes

- Put the API behind nginx/Caddy with HTTPS
- Set strong `POSTGRES_PASSWORD` in docker-compose.yml
- Restrict CORS origins in `backend/app/main.py`
- The web container uses Next.js standalone build — production-ready
- `NEXT_PUBLIC_API_URL` must be set to the public API address at **build time**

---

## 🤝 Contributing

1. Fork the repo
2. `git checkout -b feature/my-feature`
3. Write code + tests
4. `pytest tests/ && cd web && npm test`
5. Open a PR

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Backend API | FastAPI 0.111, Python 3.11 |
| ORM | SQLAlchemy 2.0 (async) |
| DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| HTTP | httpx (async) |
| Frontend | Next.js 14, TypeScript |
| Styling | Tailwind CSS |
| Data Fetching | SWR + WebSocket |
| Charts | Pure SVG |
| Containers | Docker + Docker Compose |
| Tests | pytest, pytest-asyncio, vitest |

---

## ⚠️ Disclaimer

This tool is for **educational and research purposes only**. Meme coins are extremely volatile and most lose 99%+ of their value. Nothing here is financial advice. Never invest more than you can afford to lose entirely.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
