from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models import Interaction, Listing, User
from app.schemas.recommendation import InteractionCreate
from app.services.recommendations import invalidate_feed

router = APIRouter(prefix="/interactions", tags=["interactions"])


@router.post("", status_code=201)
async def create_interaction(
    payload: InteractionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    listing = await db.get(Listing, payload.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    db.add(Interaction(user_id=user.id, listing_id=payload.listing_id, type=payload.type))
    await db.commit()
    await invalidate_feed(user.id)
    return {"status": "recorded"}
