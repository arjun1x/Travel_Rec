from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Destination


async def list_destinations(db: AsyncSession, limit: int = 20) -> list[Destination]:
    result = await db.execute(
        select(Destination).order_by(Destination.popularity_score.desc()).limit(limit)
    )
    return list(result.scalars())


async def search_destinations(db: AsyncSession, q: str, limit: int = 20) -> list[Destination]:
    pattern = f"%{q}%"
    result = await db.execute(
        select(Destination)
        .where(
            or_(
                Destination.name.ilike(pattern),
                Destination.country.ilike(pattern),
                Destination.description.ilike(pattern),
            )
        )
        .order_by(Destination.popularity_score.desc())
        .limit(limit)
    )
    return list(result.scalars())
