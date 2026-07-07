from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user
from app.core.db import get_db
from app.models import (
    Booking,
    Destination,
    Interaction,
    Itinerary,
    Listing,
    LlmUsage,
    User,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_admin_user)])

# USD per million tokens (input, output); cache reads bill ~0.1x input,
# cache writes ~1.25x input
MODEL_PRICING = {
    "claude-sonnet-4-6": (3.0, 15.0),
    "claude-haiku-4-5": (1.0, 5.0),
    "claude-opus-4-8": (5.0, 25.0),
}
DEFAULT_PRICING = (3.0, 15.0)

TREND_DAYS = 14


def _estimate_cost(model: str, row) -> float:
    input_price, output_price = MODEL_PRICING.get(model, DEFAULT_PRICING)
    return (
        (row.input_tokens or 0) * input_price
        + (row.output_tokens or 0) * output_price
        + (row.cache_read or 0) * input_price * 0.1
        + (row.cache_creation or 0) * input_price * 1.25
    ) / 1_000_000


@router.get("/metrics")
async def get_metrics(db: AsyncSession = Depends(get_db)) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=TREND_DAYS)

    # ── totals ────────────────────────────────────────────────────────
    async def count(model) -> int:
        return (await db.execute(select(func.count()).select_from(model))).scalar_one()

    totals = {
        "users": await count(User),
        "destinations": await count(Destination),
        "listings": await count(Listing),
        "itineraries": await count(Itinerary),
    }

    # ── engagement: interactions by type + per-day trend ──────────────
    by_type = {
        itype: n
        for itype, n in await db.execute(
            select(Interaction.type, func.count()).group_by(Interaction.type)
        )
    }
    views = by_type.get("view", 0) or 1
    rec_quality = {
        "click_rate": round(by_type.get("click", 0) / views, 3),
        "save_rate": round(by_type.get("save", 0) / views, 3),
        "book_rate": round(by_type.get("book", 0) / views, 3),
    }

    per_day = [
        {"date": str(day), "count": n}
        for day, n in await db.execute(
            select(cast(Interaction.created_at, Date).label("day"), func.count())
            .where(Interaction.created_at >= since)
            .group_by("day")
            .order_by("day")
        )
    ]

    # ── top destinations by engagement ────────────────────────────────
    top_destinations = [
        {"name": name, "country": country, "interactions": n}
        for name, country, n in await db.execute(
            select(Destination.name, Destination.country, func.count(Interaction.id))
            .join(Listing, Listing.destination_id == Destination.id)
            .join(Interaction, Interaction.listing_id == Listing.id)
            .group_by(Destination.id)
            .order_by(func.count(Interaction.id).desc())
            .limit(5)
        )
    ]

    # ── bookings ──────────────────────────────────────────────────────
    bookings_by_status = {
        status: {"count": n, "revenue": float(revenue or 0)}
        for status, n, revenue in await db.execute(
            select(Booking.status, func.count(), func.sum(Booking.total_price)).group_by(
                Booking.status
            )
        )
    }

    # ── LLM usage & estimated cost ────────────────────────────────────
    llm_rows = (
        await db.execute(
            select(
                LlmUsage.model,
                LlmUsage.endpoint,
                func.count().label("requests"),
                func.sum(LlmUsage.input_tokens).label("input_tokens"),
                func.sum(LlmUsage.output_tokens).label("output_tokens"),
                func.sum(LlmUsage.cache_read_input_tokens).label("cache_read"),
                func.sum(LlmUsage.cache_creation_input_tokens).label("cache_creation"),
            ).group_by(LlmUsage.model, LlmUsage.endpoint)
        )
    ).all()
    llm_by_endpoint = [
        {
            "model": row.model,
            "endpoint": row.endpoint,
            "requests": row.requests,
            "input_tokens": int(row.input_tokens or 0),
            "output_tokens": int(row.output_tokens or 0),
            "estimated_cost_usd": round(_estimate_cost(row.model, row), 4),
        }
        for row in llm_rows
    ]
    llm_tokens_per_day = [
        {"date": str(day), "tokens": int(tokens or 0)}
        for day, tokens in await db.execute(
            select(
                cast(LlmUsage.created_at, Date).label("day"),
                func.sum(LlmUsage.input_tokens + LlmUsage.output_tokens),
            )
            .where(LlmUsage.created_at >= since)
            .group_by("day")
            .order_by("day")
        )
    ]

    return {
        "totals": totals,
        "interactions_by_type": by_type,
        "interactions_per_day": per_day,
        "rec_quality": rec_quality,
        "top_destinations": top_destinations,
        "bookings_by_status": bookings_by_status,
        "llm": {
            "by_endpoint": llm_by_endpoint,
            "tokens_per_day": llm_tokens_per_day,
            "total_cost_usd": round(
                sum(item["estimated_cost_usd"] for item in llm_by_endpoint), 4
            ),
        },
    }
