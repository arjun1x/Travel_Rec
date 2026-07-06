"""Seed the database with a small set of destinations.

Idempotent: skips seeding if the destinations table is non-empty.
Run from the repo root:  uv run --project backend python scripts/seed.py
"""

import asyncio

from sqlalchemy import func, select

from app.core.db import SessionLocal
from app.models import Destination

DESTINATIONS = [
    Destination(
        name="Paris",
        country="France",
        lat=48.8566,
        lng=2.3522,
        description="The City of Light — world-class museums, cafe culture, and iconic architecture from the Eiffel Tower to Montmartre.",
        tags=["city", "culture", "food", "romance"],
        popularity_score=0.95,
    ),
    Destination(
        name="Kyoto",
        country="Japan",
        lat=35.0116,
        lng=135.7681,
        description="Japan's ancient capital: thousands of temples and shrines, tranquil zen gardens, geisha districts, and seasonal beauty.",
        tags=["culture", "temples", "history", "food"],
        popularity_score=0.90,
    ),
    Destination(
        name="Cusco",
        country="Peru",
        lat=-13.5320,
        lng=-71.9675,
        description="Gateway to Machu Picchu high in the Andes — Incan ruins, colonial plazas, and vibrant markets.",
        tags=["adventure", "history", "mountains", "hiking"],
        popularity_score=0.78,
    ),
    Destination(
        name="Reykjavik",
        country="Iceland",
        lat=64.1466,
        lng=-21.9426,
        description="Nordic charm on the edge of raw nature — northern lights, geothermal lagoons, glaciers, and volcanic landscapes.",
        tags=["nature", "adventure", "northern-lights", "cold"],
        popularity_score=0.82,
    ),
    Destination(
        name="Cape Town",
        country="South Africa",
        lat=-33.9249,
        lng=18.4241,
        description="Where mountains meet the sea — Table Mountain hikes, penguin beaches, winelands, and a buzzing food scene.",
        tags=["beach", "nature", "wine", "city"],
        popularity_score=0.80,
    ),
    Destination(
        name="Queenstown",
        country="New Zealand",
        lat=-45.0312,
        lng=168.6626,
        description="The adventure capital of the world — bungee jumping, jet boats, skiing, and stunning alpine lake scenery.",
        tags=["adventure", "mountains", "skiing", "nature"],
        popularity_score=0.75,
    ),
    Destination(
        name="Lisbon",
        country="Portugal",
        lat=38.7223,
        lng=-9.1393,
        description="Sun-drenched hills, historic trams, pastel-tiled facades, fado music, and fresh seafood by the Atlantic.",
        tags=["city", "food", "beach", "culture"],
        popularity_score=0.87,
    ),
    Destination(
        name="Banff",
        country="Canada",
        lat=51.1784,
        lng=-115.5708,
        description="Turquoise lakes and towering Rockies — hiking, skiing, wildlife, and hot springs inside Canada's oldest national park.",
        tags=["nature", "mountains", "hiking", "skiing"],
        popularity_score=0.79,
    ),
]


async def main() -> None:
    async with SessionLocal() as session:
        count = (await session.execute(select(func.count(Destination.id)))).scalar_one()
        if count:
            print(f"destinations table already has {count} rows — skipping seed")
            return
        session.add_all(DESTINATIONS)
        await session.commit()
        print(f"seeded {len(DESTINATIONS)} destinations")


if __name__ == "__main__":
    asyncio.run(main())
