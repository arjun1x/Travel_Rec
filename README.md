# Travel Rec — AI-Powered Travel Recommendation Platform

Full-stack platform for personalized travel recommendations and AI-generated itineraries. See [claude.md](claude.md) for the full spec and roadmap.

**Stack:** FastAPI + SQLAlchemy 2 (async) + Alembic · PostgreSQL 16 (pgvector) · Redis 7 · React 18 + TypeScript + Vite + Tailwind v4 + TanStack Query

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (WSL2 backend on Windows)
- [uv](https://docs.astral.sh/uv/) ≥ 0.11 (manages Python 3.12 automatically — no system Python needed)
- Node.js ≥ 20

## Quickstart

```powershell
# 1. Infrastructure (Postgres with pgvector + Redis)
docker compose up -d
docker compose ps          # wait until both services are "healthy"

# 2. Backend
cd backend
uv sync                    # creates .venv with Python 3.12 + deps
uv run alembic upgrade head
cd ..
uv run --project backend python scripts/seed.py

# 3. Run the API (terminal 1)
cd backend
uv run uvicorn app.main:app --reload --port 8000

# 4. Run the frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and search for a destination (try "kyo" → Kyoto).

API docs: http://localhost:8000/docs

## Health checks

- `GET http://localhost:8000/health` — liveness
- `GET http://localhost:8000/health/ready` — readiness (checks Postgres + Redis connectivity)

## Tests

```powershell
cd backend
uv run pytest
```

## Configuration

Dev works with zero configuration — defaults in [.env.example](.env.example) match `docker-compose.yml` and the app settings. To override (e.g. port conflict with a native Postgres), copy `.env.example` to `.env` and adjust:

```
POSTGRES_PORT=5433
DATABASE_URL=postgresql+asyncpg://travel:travel@localhost:5433/travel
```

## Project layout

```
backend/
  app/
    api/        # routers (health, destinations; more per milestone)
    core/       # config (pydantic-settings), async DB engine/session
    models/     # SQLAlchemy models — every model must be imported in models/__init__.py
    schemas/    # Pydantic response/request schemas
    services/   # query/business logic (routes stay thin)
    workers/    # background jobs (later milestones)
  alembic/      # async migrations (0001 enables pgvector + creates destinations)
  tests/
frontend/
  src/
    lib/api.ts        # typed API client (relative /api URLs via Vite dev proxy)
    pages/            # route components
    types/            # TS interfaces mirroring backend schemas
scripts/seed.py       # idempotent destination seed
docker-compose.yml    # infra only; api/frontend run natively in dev
```

## Roadmap

Milestone 1 (this) — scaffold + destinations searchable end-to-end. Next: auth + full data model → search filters → recommendations v1 → LLM itineraries → embeddings/pgvector recs → bookings → admin dashboard. Details in [claude.md](claude.md).
