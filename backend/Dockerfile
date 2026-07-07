# Travel Rec API — production-ish image used by the compose `full` profile
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# install deps first for layer caching
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
RUN uv sync --frozen --no-dev

EXPOSE 8000
# run migrations, then serve
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
