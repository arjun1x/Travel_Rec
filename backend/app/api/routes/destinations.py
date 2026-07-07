from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.schemas.destination import DestinationRead
from app.schemas.weather import WeatherRead
from app.services import destinations as service
from app.services.weather import WeatherUnavailableError, get_weather

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


@router.get("/{destination_id}", response_model=DestinationRead)
async def get_destination_detail(
    destination_id: int,
    db: AsyncSession = Depends(get_db),
) -> DestinationRead:
    destination = await service.get_destination(db, destination_id)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found")
    return destination


@router.get("/{destination_id}/similar", response_model=list[DestinationRead])
async def get_similar_destinations(
    destination_id: int,
    limit: int = Query(4, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
) -> list[DestinationRead]:
    destination = await service.get_destination(db, destination_id)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found")
    return await service.similar_destinations(db, destination, limit=limit)


@router.get("/{destination_id}/weather", response_model=WeatherRead)
async def get_destination_weather(
    destination_id: int,
    db: AsyncSession = Depends(get_db),
) -> WeatherRead:
    destination = await service.get_destination(db, destination_id)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found")
    try:
        weather = await get_weather(destination.id, destination.lat, destination.lng)
    except WeatherUnavailableError:
        raise HTTPException(status_code=502, detail="Weather service unavailable")
    return WeatherRead.model_validate(weather)
