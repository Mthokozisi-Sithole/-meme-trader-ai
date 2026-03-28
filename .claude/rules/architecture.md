RULE: Architecture

- Services: api, worker (optional), web
- Data: Postgres (primary), Redis (cache)
- External: market data APIs
- Pattern: Clean architecture (routers -> services -> repositories)

Must:
- Separate concerns
- Typed schemas
- Idempotent endpoints where possible
