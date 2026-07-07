from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.db import get_db
from app.models import Destination, Itinerary, User
from pydantic import BaseModel, Field

from app.schemas.itinerary import ItineraryGenerateRequest, ItineraryPlan, ItineraryRead


class DayRegenerateRequest(BaseModel):
    instructions: str | None = Field(default=None, max_length=500)
from app.services import llm
from app.services.weather import WeatherUnavailableError, get_weather

router = APIRouter(prefix="/itineraries", tags=["itineraries"])

MAX_TRIP_DAYS = 14


async def _weather_summary(destination: Destination) -> str | None:
    try:
        weather = await get_weather(destination.id, destination.lat, destination.lng)
    except WeatherUnavailableError:
        return None
    lines = [
        f"{day['date']}: {day['temp_min_c']:.0f}-{day['temp_max_c']:.0f}°C, "
        f"precipitation chance {day['precipitation_chance'] or 0}%"
        for day in weather["daily"]
    ]
    return "\n".join(lines)


@router.post("/generate")
async def generate_itinerary(
    payload: ItineraryGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    destination = await db.get(Destination, payload.destination_id)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found")
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")
    if (payload.end_date - payload.start_date).days + 1 > MAX_TRIP_DAYS:
        raise HTTPException(status_code=400, detail=f"Trips are capped at {MAX_TRIP_DAYS} days")

    # fail fast (proper status codes) before the stream starts
    try:
        llm.get_client()
        await llm.check_rate_limit(user.id, "itinerary")
    except llm.LlmNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except llm.RateLimitedError as exc:
        raise HTTPException(status_code=429, detail=str(exc))

    weather_summary = await _weather_summary(destination)
    prompt = llm.build_itinerary_prompt(
        destination,
        payload.start_date.isoformat(),
        payload.end_date.isoformat(),
        payload.interests,
        payload.budget_usd,
        weather_summary,
    )

    async def event_stream():
        try:
            async for kind, data in llm.stream_itinerary(prompt):
                if kind == "delta":
                    yield llm.sse({"type": "delta", "text": data})
                else:
                    plan, usage = data
                    itinerary = Itinerary(
                        user_id=user.id,
                        destination_id=destination.id,
                        start_date=payload.start_date,
                        end_date=payload.end_date,
                        days=plan.model_dump(),
                        budget_total=plan.budget_total_usd,
                        llm_model=settings.llm_model,
                        prompt_version=settings.prompt_version,
                        status="ready",
                    )
                    db.add(itinerary)
                    await db.commit()
                    await db.refresh(itinerary)
                    await llm.log_usage(db, user, "itinerary", settings.llm_model, usage)
                    yield llm.sse(
                        {
                            "type": "done",
                            "itinerary_id": itinerary.id,
                            "plan": plan.model_dump(),
                        }
                    )
        except Exception as exc:  # stream already started — report in-band
            yield llm.sse({"type": "error", "detail": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.patch("/{itinerary_id}/days/{day_index}", response_model=ItineraryRead)
async def regenerate_itinerary_day(
    itinerary_id: int,
    day_index: int,
    payload: DayRegenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ItineraryRead:
    itinerary = (
        await db.execute(
            select(Itinerary).where(
                Itinerary.id == itinerary_id, Itinerary.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if itinerary is None:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    plan = ItineraryPlan.model_validate(itinerary.days)
    if not 0 <= day_index < len(plan.days):
        raise HTTPException(status_code=400, detail="Day index out of range")

    try:
        llm.get_client()
        await llm.check_rate_limit(user.id, "itinerary")
    except llm.LlmNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except llm.RateLimitedError as exc:
        raise HTTPException(status_code=429, detail=str(exc))

    destination = await db.get(Destination, itinerary.destination_id)
    new_day, usage = await llm.regenerate_day(
        destination.name if destination else "the destination",
        plan,
        day_index,
        payload.instructions,
    )
    plan.days[day_index] = new_day
    plan.budget_total_usd = round(
        sum(a.estimated_cost_usd for d in plan.days for a in d.activities), 2
    )
    itinerary.days = plan.model_dump()
    itinerary.budget_total = plan.budget_total_usd
    await db.commit()
    await db.refresh(itinerary)
    await llm.log_usage(db, user, "itinerary", settings.llm_model, usage)
    return itinerary


@router.get("", response_model=list[ItineraryRead])
async def list_itineraries(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ItineraryRead]:
    result = await db.execute(
        select(Itinerary)
        .where(Itinerary.user_id == user.id)
        .order_by(Itinerary.created_at.desc())
    )
    return list(result.scalars())


@router.get("/{itinerary_id}", response_model=ItineraryRead)
async def get_itinerary(
    itinerary_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ItineraryRead:
    itinerary = (
        await db.execute(
            select(Itinerary).where(
                Itinerary.id == itinerary_id, Itinerary.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if itinerary is None:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return itinerary
