COMMAND: build-system

Goal:
Build a full production system.

Execution Plan:
1. Product Manager → PRD (features, user flows)
2. Architect → system design (services, data flow)
3. Data Engineer → sources, schemas, ETL
4. Quant Analyst → scoring + indicators
5. Backend Engineer → FastAPI services
6. Frontend Engineer → Next.js dashboard
7. QA → tests + edge cases
8. DevOps → Docker, CI/CD, deploy

Output:
- Monorepo structure
- Backend (FastAPI) with endpoints
- Frontend (Next.js) components/pages
- DB schema (Postgres)
- Docker + docker-compose
- CI (GitHub Actions)
- README with run steps
