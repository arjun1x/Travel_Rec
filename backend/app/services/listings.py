from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Listing

SORTS = {
    "rating": Listing.rating.desc(),
    "price_asc": Listing.price_per_night.asc(),
    "price_desc": Listing.price_per_night.desc(),
}


def _apply_filters(
    stmt: Select,
    *,
    destination_id: int | None,
    listing_type: str | None,
    min_price: float | None,
    max_price: float | None,
    guests: int | None,
    amenities: list[str] | None,
) -> Select:
    if destination_id is not None:
        stmt = stmt.where(Listing.destination_id == destination_id)
    if listing_type is not None:
        stmt = stmt.where(Listing.type == listing_type)
    if min_price is not None:
        stmt = stmt.where(Listing.price_per_night >= min_price)
    if max_price is not None:
        stmt = stmt.where(Listing.price_per_night <= max_price)
    if guests is not None:
        stmt = stmt.where(Listing.capacity >= guests)
    if amenities:
        stmt = stmt.where(Listing.amenities.contains(amenities))
    return stmt


async def list_listings(
    db: AsyncSession,
    *,
    destination_id: int | None = None,
    listing_type: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    guests: int | None = None,
    amenities: list[str] | None = None,
    sort: str = "rating",
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Listing], int]:
    filters = dict(
        destination_id=destination_id,
        listing_type=listing_type,
        min_price=min_price,
        max_price=max_price,
        guests=guests,
        amenities=amenities,
    )
    total = (
        await db.execute(_apply_filters(select(func.count(Listing.id)), **filters))
    ).scalar_one()
    stmt = (
        _apply_filters(select(Listing), **filters)
        .order_by(SORTS.get(sort, SORTS["rating"]), Listing.id)
        .limit(limit)
        .offset(offset)
    )
    items = list((await db.execute(stmt)).scalars())
    return items, total


async def get_listing(db: AsyncSession, listing_id: int) -> Listing | None:
    stmt = (
        select(Listing)
        .where(Listing.id == listing_id)
        .options(selectinload(Listing.destination))
    )
    return (await db.execute(stmt)).scalar_one_or_none()
