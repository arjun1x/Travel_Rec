from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# ── LLM-generated plan (strict schema for structured outputs) ─────────
# extra="forbid" makes Pydantic emit additionalProperties: false, which the
# structured-outputs API requires on every object.


class Activity(BaseModel):
    model_config = ConfigDict(extra="forbid")

    time: str = Field(description="Start time, 24h format like '09:00'")
    name: str
    description: str
    estimated_cost_usd: float
    lat: float | None = Field(default=None, description="Latitude if the place is well known")
    lng: float | None = Field(default=None, description="Longitude if the place is well known")


class DayPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: str = Field(description="ISO date, e.g. 2026-08-14")
    title: str = Field(description="Short theme for the day")
    activities: list[Activity]


class ItineraryPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    days: list[DayPlan]
    budget_total_usd: float
    budget_tips: list[str] = Field(description="2-4 concrete tips to save money on this trip")


# ── API request/response ──────────────────────────────────────────────


class ItineraryGenerateRequest(BaseModel):
    destination_id: int
    start_date: date
    end_date: date
    interests: list[str] = Field(default_factory=list, max_length=10)
    budget_usd: float | None = Field(default=None, ge=0)


class ItineraryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    destination_id: int
    start_date: date
    end_date: date
    days: dict
    budget_total: float | None
    llm_model: str | None
    prompt_version: str | None
    status: str
    created_at: datetime
