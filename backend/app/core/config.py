from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # reads the repo-root .env first, then backend/.env (later wins); real env vars win over both
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "postgresql+asyncpg://travel:travel@localhost:5432/travel"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: list[str] = ["http://localhost:5173"]

    voyage_api_key: str | None = None

    anthropic_api_key: str | None = None
    llm_model: str = "claude-sonnet-4-6"  # itinerary generation + assistant
    llm_model_light: str = "claude-haiku-4-5"  # cheap/lightweight tasks
    prompt_version: str = "v2"
    # adaptive-thinking effort for itinerary calls; "low" keeps reasoning to a
    # few hundred tokens instead of ~10K, which is most of the wall-clock time
    llm_effort: Literal["low", "medium", "high", "xhigh", "max"] = "low"
    llm_rate_limit_per_hour: int = 20

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    refresh_token_days: int = 7


settings = Settings()
