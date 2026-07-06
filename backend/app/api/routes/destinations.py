from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.schemas.destination import DestinationRead
from app.services import destinations as service

router = APIRouter(prefix="/destinations", tags=["destinations"])


@router.get("", response_model=list[DestinationRead])
async def list_destinations(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[DestinationRead]:
    return await service.list_destinations(db, limit=limit)


@router.get("/search", response_model=list[DestinationRead])
async def search_destinations(
    q: str = Query(min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[DestinationRead]:
    return await service.search_destinations(db, q=q, limit=limit)
