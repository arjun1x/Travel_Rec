from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models import User
from app.schemas.listing import ListingRead
from app.schemas.recommendation import RecommendationsResponse
from app.services import listings as listing_service
from app.services import recommendations as service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=RecommendationsResponse)
async def get_recommendations(
    limit: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RecommendationsResponse:
    items = await service.get_feed(db, user, limit=limit)
    return RecommendationsResponse(items=items)


@router.get("/similar/{listing_id}", response_model=list[ListingRead])
async def get_similar_listings(
    listing_id: int,
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> list[ListingRead]:
    listing = await listing_service.get_listing(db, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return await service.similar_listings(db, listing, limit=limit)
