# Travel Rec — AI-Powered Travel Recommendation Platform

Full-stack platform for personalized travel recommendations and AI-generated itineraries.

**Stack:** FastAPI + SQLAlchemy 2 (async) + Alembic · PostgreSQL 16 (pgvector) · Redis 7 · Anthropic Claude API · React 19 + TypeScript + Vite + Tailwind v4 + TanStack Query

**Features:** destination search with live weather (Open-Meteo) · pgvector semantic similarity · personalized recommendation feed · JWT auth · simulated bookings (hold/confirm/cancel) · Claude-generated day-by-day itineraries with budget tips (SSE-streamed) · grounded travel-assistant chat · admin dashboard with engagement + LLM cost metrics

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (WSL2 backend on Windows)
- [uv](https://docs.astral.sh/uv/) ≥ 0.11 (manages Python 3.12 automatically)
- Node.js ≥ 20

## Quickstart (dev — hot reload)

```powershell
# 1. Infrastructure (Postgres with pgvector + Redis)
docker compose up -d

# 2. Backend
cd backend
uv sync
uv run alembic upgrade head
cd ..
uv run --project backend python scripts/seed.py

# optional: semantic similarity (downloads a local embedding model once)
uv run --project backend --group embeddings python scripts/embed.py

# 3. API (terminal 1)
cd backend
uv run uvicorn app.main:app --port 8000

# 4. Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. API docs: http://localhost:8000/docs.

**Demo accounts:** `demo@travelrec.dev` / `demo1234` · admin: `admin@travelrec.dev` / `admin1234`

## Frontend preview

The redesigned frontend also includes a backend-free preview mode for reviewing the visual experience:

```bash
cd frontend
npm install
npm run demo
```

This uses a small local destination catalog and bundled editorial photos. Use `npm run dev` for the full API-connected experience; see [frontend/README.md](frontend/README.md) for the frontend commands and environment variables.

## Enable AI features (itineraries + assistant)

Get an API key at [console.anthropic.com](https://console.anthropic.com/) → API Keys, then:

```
# .env at the repo root (gitignored)
ANTHROPIC_API_KEY=sk-ant-...
```

Restart the API server. Without a key, AI endpoints return a clear 503 and the
rest of the app works normally.

## Full containerized run (CI / demo)

Builds and runs everything — postgres, redis, api (with migrations), frontend (nginx):

```powershell
docker compose --profile full up --build
# app on http://localhost:5173, api on http://localhost:8000
# seed once the api is healthy:
docker compose exec api uv run python -c "print('use scripts/seed.py from host or bake a seed step')"
```

Seeding in full mode: run `uv run --project backend python scripts/seed.py` from
the host (it connects to the published postgres port).

## Tests

```powershell
cd backend
uv run pytest         # unit + API integration (integration skips if DB is down)
```

## Configuration

Dev works with zero configuration — defaults match `docker-compose.yml`. Override
via `.env` (root) — see [.env.example](.env.example) for every knob
(`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, ports…).

## Observability

- Every response carries `X-Request-ID` (inbound header honored).
- Requests are logged as single-line JSON (`travelrec` logger): request id,
  method, path, status, duration.
- LLM token usage per call is stored in `llm_usage` and surfaced on `/admin`.

## Project layout

```
backend/
  app/
    api/        # routers: auth, destinations, listings, recs, itineraries, assistant, bookings, interactions, admin, users
    core/       # config, security (JWT/bcrypt), db, redis, logging
    models/     # SQLAlchemy models (incl. pgvector embeddings)
    schemas/    # Pydantic schemas (incl. strict itinerary plan for structured outputs)
    services/   # recommendations, llm (Claude), weather, embeddings, bookings, listings
  alembic/      # async migrations 0001-0005
  tests/        # unit + integration
  Dockerfile
frontend/
  src/          # pages, components (incl. components/ui), lib (api, auth, sse, shortlist)
  Dockerfile + nginx.conf
scripts/seed.py       # idempotent: 126 destinations, ~1,280 listings, demo users, interactions
scripts/fetch_photos.py  # licensed Wikimedia photo per destination + CREDITS.md
scripts/embed.py      # embeddings via Voyage AI or local sentence-transformers
docker-compose.yml    # infra by default; --profile full adds api + frontend
```

## Deploying to AWS (notes)

The compose `full` profile maps cleanly onto AWS:

| Piece | AWS service | Notes |
|---|---|---|
| API container | **ECS Fargate** (behind an ALB) | Health check `GET /health`; run `alembic upgrade head` as a one-off task or entrypoint (as the image already does). SSE needs ALB idle timeout ≥ 300s. |
| Frontend | **S3 + CloudFront** | `npm run build` → sync `dist/` to S3; CloudFront behavior routing `/api/*` to the ALB origin (mirrors nginx.conf). |
| Postgres | **RDS for PostgreSQL 16** | Enable the `vector` extension (supported natively on RDS); migration 0001 runs `CREATE EXTENSION IF NOT EXISTS vector` and needs `rds_superuser`. |
| Redis | **ElastiCache (Redis 7)** | Used for weather cache, rec feeds, rate limits, assistant catalog. |
| Secrets | **Secrets Manager / SSM** | `JWT_SECRET`, `ANTHROPIC_API_KEY`, `DATABASE_URL` — inject as ECS task env vars. |
| Images | **ECR** | `docker compose --profile full build` then tag/push both images. |
| Logs | **CloudWatch** | JSON log lines from the request middleware parse directly. |

Hardening before real traffic: set a strong `JWT_SECRET`, restrict CORS origins,
put the seed script behind an ops runbook (never auto-run in prod), and consider
moving itinerary generation onto a queue if request volume grows.
