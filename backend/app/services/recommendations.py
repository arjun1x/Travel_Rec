"""Recommendations — heuristic scoring (v1) blended with embeddings (v2).

Without a profile embedding:
    score = 0.30 popularity + 0.25 rating + 0.20 price fit + 0.25 tag affinity
With one (user has interactions on embedded listings):
    score = 0.25 popularity + 0.20 rating + 0.15 price fit + 0.20 tag affinity
          + 0.20 cosine(profile embedding, listing embedding)

The profile embedding is the interaction-weighted average of embeddings of
listings the user engaged with. Feeds are cached in Redis for a short TTL and
invalidated on new interactions or preference changes.
"""

import json
import math
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import redis_client
from app.models import Destination, Interaction, Listing, User, UserPreference
from app.schemas.destination import DestinationRead
from app.schemas.listing import ListingRead
from app.schemas.recommendation import RecommendationItem

FEED_CACHE_TTL = 120
FEED_SIZE = 50
MAX_PER_DESTINATION = 3
INTERACTION_WEIGHTS = {"view": 1.0, "click": 2.0, "save": 3.0, "book": 5.0}
EXPLICIT_STYLE_WEIGHT = 2.0


def _cache_key(user_id: int) -> str:
    return f"recs:{user_id}"


def price_fit(price: float, budget_min: float | None, budget_max: float | None) -> float:
    """1.0 inside the budget window, linear decay outside, 0.5 when no budget set."""
    if budget_min is None and budget_max is None:
        return 0.5
    low = budget_min or 0.0
    high = budget_max if budget_max is not None else float("inf")
    if low <= price <= high:
        return 1.0
    if price > high:
        return max(0.0, 1.0 - (price - high) / max(high, 1.0))
    return max(0.0, 1.0 - (low - price) / max(low, 1.0))


def tag_affinity(tags: list[str], profile: dict[str, float]) -> float:
    """Overlap between destination tags and the user's tag profile, in [0, 1]."""
    if not profile or not tags:
        return 0.0
    hit = sum(profile.get(tag, 0.0) for tag in tags)
    top = sorted(profile.values(), reverse=True)[: len(tags)]
    return min(1.0, hit / max(sum(top), 1e-9))


def cosine_similarity(a, b) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def score_listing(
    listing: Listing,
    destination: Destination,
    profile: dict[str, float],
    budget_min: float | None,
    budget_max: float | None,
    profile_vec: list[float] | None = None,
) -> float:
    base = (
        0.30 * destination.popularity_score
        + 0.25 * (listing.rating / 5.0)
        + 0.20 * price_fit(listing.price_per_night, budget_min, budget_max)
        + 0.25 * tag_affinity(destination.tags, profile)
    )
    if profile_vec is None or listing.embedding is None:
        return base
    # renormalize heuristics to 0.8 and give the semantic match the last 0.2
    semantic = max(0.0, cosine_similarity(profile_vec, listing.embedding))
    return 0.8 * base + 0.2 * semantic


async def build_tag_profile(db: AsyncSession, user: User) -> dict[str, float]:
    # implicit signal from interactions, normalized so a heavy history can't
    # drown out the user's explicit trip styles
    implicit: dict[str, float] = defaultdict(float)
    rows = await db.execute(
        select(Interaction.type, Destination.tags)
        .join(Listing, Interaction.listing_id == Listing.id)
        .join(Destination, Listing.destination_id == Destination.id)
        .where(Interaction.user_id == user.id)
    )
    for itype, tags in rows:
        weight = INTERACTION_WEIGHTS.get(itype, 1.0)
        for tag in tags:
            implicit[tag] += weight
    peak = max(implicit.values(), default=0.0)

    profile: dict[str, float] = defaultdict(float)
    if peak > 0:
        for tag, value in implicit.items():
            profile[tag] = value / peak  # implicit contribution capped at 1.0
    prefs = await db.get(UserPreference, user.id)
    if prefs:
        for style in prefs.trip_styles:
            profile[style] += EXPLICIT_STYLE_WEIGHT
    return dict(profile)


async def build_profile_embedding(db: AsyncSession, user: User) -> list[float] | None:
    """Interaction-weighted average of embeddings of listings the user engaged with."""
    rows = list(
        await db.execute(
            select(Interaction.type, Listing.embedding)
            .join(Listing, Interaction.listing_id == Listing.id)
            .where(Interaction.user_id == user.id, Listing.embedding.isnot(None))
        )
    )
    if not rows:
        return None
    acc: list[float] | None = None
    total_weight = 0.0
    for itype, embedding in rows:
        weight = INTERACTION_WEIGHTS.get(itype, 1.0)
        total_weight += weight
        if acc is None:
            acc = [weight * x for x in embedding]
        else:
            for i, x in enumerate(embedding):
                acc[i] += weight * x
    assert acc is not None
    return [x / total_weight for x in acc]


async def get_feed(db: AsyncSession, user: User, limit: int = 20) -> list[dict]:
    cached = await redis_client.get(_cache_key(user.id))
    if cached:
        return json.loads(cached)[:limit]

    profile = await build_tag_profile(db, user)
    profile_vec = await build_profile_embedding(db, user)
    prefs = await db.get(UserPreference, user.id)
    budget_min = prefs.budget_min if prefs else None
    budget_max = prefs.budget_max if prefs else None

    listings = list(
        (
            await db.execute(select(Listing).options(selectinload(Listing.destination)))
        ).scalars()
    )
    ranked = sorted(
        listings,
        key=lambda l: score_listing(
            l, l.destination, profile, budget_min, budget_max, profile_vec
        ),
        reverse=True,
    )

    feed: list[dict] = []
    per_destination: dict[int, int] = defaultdict(int)
    for listing in ranked:
        if per_destination[listing.destination_id] >= MAX_PER_DESTINATION:
            continue
        per_destination[listing.destination_id] += 1
        feed.append(
            RecommendationItem(
                listing=ListingRead.model_validate(listing),
                destination=DestinationRead.model_validate(listing.destination),
                score=round(
                    score_listing(
                        listing,
                        listing.destination,
                        profile,
                        budget_min,
                        budget_max,
                        profile_vec,
                    ),
                    4,
                ),
            ).model_dump()
        )
        if len(feed) >= FEED_SIZE:
            break

    await redis_client.set(_cache_key(user.id), json.dumps(feed), ex=FEED_CACHE_TTL)
    return feed[:limit]


async def invalidate_feed(user_id: int) -> None:
    await redis_client.delete(_cache_key(user_id))


async def similar_listings(db: AsyncSession, listing: Listing, limit: int = 8) -> list[Listing]:
    """Stays like this one — semantic (pgvector cosine) when embeddings exist,
    else tag overlap + rating + price similarity."""
    if listing.embedding is not None:
        stmt = (
            select(Listing)
            .where(Listing.id != listing.id, Listing.embedding.isnot(None))
            .order_by(Listing.embedding.cosine_distance(listing.embedding))
            .limit(limit)
            .options(selectinload(Listing.destination))
        )
        semantic = list((await db.execute(stmt)).scalars())
        if semantic:
            return semantic

    target_dest = listing.destination
    target_tags = set(target_dest.tags)
    stmt = (
        select(Listing)
        .join(Destination, Listing.destination_id == Destination.id)
        .where(
            Listing.id != listing.id,
            (Listing.destination_id == listing.destination_id)
            | Destination.tags.overlap(target_dest.tags),
        )
        .options(selectinload(Listing.destination))
    )
    candidates = list((await db.execute(stmt)).scalars())

    def score(candidate: Listing) -> float:
        overlap = len(target_tags & set(candidate.destination.tags)) / max(len(target_tags), 1)
        price_sim = 1.0 - min(
            1.0,
            abs(candidate.price_per_night - listing.price_per_night)
            / max(listing.price_per_night, 1.0),
        )
        return 0.5 * overlap + 0.3 * (candidate.rating / 5.0) + 0.2 * price_sim

    return sorted(candidates, key=score, reverse=True)[:limit]
