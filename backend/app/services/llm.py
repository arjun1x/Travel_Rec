"""Claude integration: itinerary generation and the travel assistant.

- Official `anthropic` SDK (AsyncAnthropic), models from settings
  (spec: claude-sonnet-4-6 for generation/assistant, claude-haiku-4-5 light).
- Itinerary JSON is enforced with structured outputs (output_config.format).
- The large static system prompts carry cache_control for prompt caching.
- Every call logs token usage into llm_usage for the admin dashboard.
"""

import json
from collections.abc import AsyncIterator

from anthropic import AsyncAnthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import redis_client
from app.core.config import settings
from app.models import Destination, LlmUsage, User
from app.schemas.itinerary import DayPlan, ItineraryPlan

_client: AsyncAnthropic | None = None


class LlmNotConfiguredError(Exception):
    pass


class RateLimitedError(Exception):
    pass


def get_client() -> AsyncAnthropic:
    global _client
    if _client is not None:
        return _client
    if settings.anthropic_api_key:
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        return _client
    # fall back to the SDK's standard credential chain
    # (ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN env vars, `ant auth login` profile)
    try:
        candidate = AsyncAnthropic()
        if getattr(candidate, "api_key", None) or getattr(candidate, "auth_token", None):
            _client = candidate
            return _client
    except Exception:
        pass
    raise LlmNotConfiguredError(
        "AI features need an Anthropic API key. Get one at console.anthropic.com, "
        "put ANTHROPIC_API_KEY=sk-ant-... in the .env file at the repo root, "
        "and restart the API server."
    )


async def check_rate_limit(user_id: int, action: str) -> None:
    key = f"ratelimit:{action}:{user_id}"
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, 3600)
    if count > settings.llm_rate_limit_per_hour:
        raise RateLimitedError(
            f"Rate limit reached ({settings.llm_rate_limit_per_hour}/hour) — try again later"
        )


async def log_usage(db: AsyncSession, user: User, endpoint: str, model: str, usage) -> None:
    db.add(
        LlmUsage(
            user_id=user.id,
            endpoint=endpoint,
            model=model,
            input_tokens=usage.input_tokens or 0,
            output_tokens=usage.output_tokens or 0,
            cache_creation_input_tokens=getattr(usage, "cache_creation_input_tokens", 0) or 0,
            cache_read_input_tokens=getattr(usage, "cache_read_input_tokens", 0) or 0,
        )
    )
    await db.commit()


# ── Itinerary generation ──────────────────────────────────────────────

# Static format spec — stable bytes so prompt caching can do its job.
ITINERARY_SYSTEM = """You are the expert travel planner behind Travel Rec, an AI trip discovery platform.

You produce realistic, delightful day-by-day itineraries. Rules:
- Ground every activity in real, well-known places at the destination; include lat/lng when you are confident of the location, otherwise omit them.
- Respect the traveler's dates exactly: one day plan per date, in order.
- Pace days realistically: 3-5 activities per day, sensible travel time between them, meals included with local specialities.
- Estimate costs honestly in USD per person (activities, meals, local transport — exclude flights and lodging).
- If a budget is given, keep budget_total_usd within it and say in budget_tips how you did; if the plan must exceed it, say so plainly in budget_tips.
- Use the provided weather forecast: put outdoor highlights on the best-weather days and have indoor alternatives on wet days.
- Tailor to the stated interests; when none are given, cover the destination's essential experiences.
- budget_total_usd must equal the sum of all activity estimated_cost_usd values.
"""


def build_itinerary_prompt(
    destination: Destination,
    start_date: str,
    end_date: str,
    interests: list[str],
    budget_usd: float | None,
    weather_summary: str | None,
) -> str:
    parts = [
        f"Plan a trip to {destination.name}, {destination.country} "
        f"({destination.description})",
        f"Dates: {start_date} to {end_date} (inclusive).",
        f"Traveler interests: {', '.join(interests) if interests else 'no specific preferences'}.",
    ]
    if budget_usd:
        parts.append(f"Budget: ${budget_usd:.0f} per person for activities/food/transport.")
    if weather_summary:
        parts.append(f"Weather forecast:\n{weather_summary}")
    return "\n".join(parts)


async def stream_itinerary(
    user_prompt: str,
) -> AsyncIterator[tuple[str, object]]:
    """Yield ("delta", text) chunks, then ("final", (plan, usage))."""
    client = get_client()
    schema = ItineraryPlan.model_json_schema()

    async with client.messages.stream(
        model=settings.llm_model,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        output_config={"format": {"type": "json_schema", "schema": schema}},
        system=[
            {
                "type": "text",
                "text": ITINERARY_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield ("delta", text)
        message = await stream.get_final_message()

    raw = next(block.text for block in message.content if block.type == "text")
    plan = ItineraryPlan.model_validate_json(raw)
    yield ("final", (plan, message.usage))


async def regenerate_day(
    destination_name: str,
    plan: ItineraryPlan,
    day_index: int,
    instructions: str | None,
) -> tuple[DayPlan, object]:
    """Regenerate one day of an existing plan, keeping the rest as context."""
    client = get_client()
    target = plan.days[day_index]
    prompt = (
        f"Here is an existing itinerary for {destination_name}:\n"
        f"{plan.model_dump_json()}\n\n"
        f"Regenerate ONLY the day dated {target.date} with a fresh set of activities "
        f"that do not repeat activities from the other days."
        + (f"\nTraveler notes for this day: {instructions}" if instructions else "")
    )
    async with client.messages.stream(
        model=settings.llm_model,
        max_tokens=4096,
        thinking={"type": "adaptive"},
        output_config={"format": {"type": "json_schema", "schema": DayPlan.model_json_schema()}},
        system=[
            {
                "type": "text",
                "text": ITINERARY_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        message = await stream.get_final_message()
    raw = next(block.text for block in message.content if block.type == "text")
    return DayPlan.model_validate_json(raw), message.usage


# ── Travel assistant ──────────────────────────────────────────────────

ASSISTANT_SYSTEM = """You are the Travel Rec assistant — a friendly, knowledgeable travel expert embedded in the Travel Rec app.

- Answer questions about trips, destinations, seasons, budgets, and logistics concisely and concretely.
- Prefer recommending destinations from the Travel Rec catalog below when they fit; mention they can open the destination page to see live weather and book stays.
- When a user seems ready to plan, suggest the AI itinerary builder on the destination's page.
- Keep answers short (a few sentences or a compact list). Plain text only — no markdown headers.
"""


async def build_catalog_context(db: AsyncSession) -> str:
    """Small, stable summary of the catalog used to ground the assistant."""
    cached = await redis_client.get("assistant:catalog")
    if cached:
        return cached
    destinations = list((await db.execute(select(Destination))).scalars())
    lines = [
        f"- {d.name}, {d.country} (id {d.id}): {', '.join(d.tags)}"
        for d in sorted(destinations, key=lambda d: -d.popularity_score)
    ]
    catalog = "Travel Rec catalog:\n" + "\n".join(lines)
    await redis_client.set("assistant:catalog", catalog, ex=3600)
    return catalog


async def stream_assistant(
    history: list[dict], catalog: str
) -> AsyncIterator[tuple[str, object]]:
    """Yield ("delta", text) chunks, then ("final", usage)."""
    client = get_client()
    async with client.messages.stream(
        model=settings.llm_model,
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": ASSISTANT_SYSTEM + "\n\n" + catalog,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=history,
    ) as stream:
        async for text in stream.text_stream:
            yield ("delta", text)
        message = await stream.get_final_message()
    yield ("final", message.usage)


def sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"
