from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.schemas.listing import ListingDetail, ListingsPage
from app.services import listings as service

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=ListingsPage)
async def list_listings(
    destination_id: int | None = None,
    type: Literal["hotel", "apartment", "hostel", "villa"] | None = None,
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    guests: int | None = Query(None, ge=1, le=20),
    amenities: list[str] | None = Query(None),
    sort: Literal["rating", "price_asc", "price_desc"] = "rating",
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> ListingsPage:
    items, total = await service.list_listings(
        db,
        destination_id=destination_id,
        listing_type=type,
        min_price=min_price,
        max_price=max_price,
        guests=guests,
        amenities=amenities,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return ListingsPage(items=items, total=total)


@router.get("/{listing_id}", response_model=ListingDetail)
async def get_listing_detail(
    listing_id: int,
    db: AsyncSession = Depends(get_db),
) -> ListingDetail:
    listing = await service.get_listing(db, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing
