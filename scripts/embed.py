"""Compute and store embeddings for destinations and listings.

Uses Voyage AI when VOYAGE_API_KEY is set, otherwise the local
sentence-transformers model (requires the `embeddings` dependency group):

    uv run --project backend --group embeddings python scripts/embed.py
"""

import asyncio

from sqlalchemy import select

from app.core.db import SessionLocal
from app.models import Destination, Listing
from app.services.embeddings import get_provider

BATCH = 64


def destination_text(d: Destination) -> str:
    return f"{d.name}, {d.country}. {d.description} Travel styles: {', '.join(d.tags)}."


def listing_text(listing: Listing, destination: Destination) -> str:
    return (
        f"{listing.title} — a {listing.type} in {destination.name}, {destination.country}. "
        f"{listing.description} Amenities: {', '.join(listing.amenities)}."
    )


async def main() -> None:
    provider = get_provider()
    print(f"embedding provider: {provider.name}")

    async with SessionLocal() as session:
        destinations = list((await session.execute(select(Destination))).scalars())
        vectors = []
        for i in range(0, len(destinations), BATCH):
            batch = destinations[i : i + BATCH]
            vectors.extend(await provider.embed([destination_text(d) for d in batch]))
        for dest, vec in zip(destinations, vectors):
            dest.embedding = vec
        await session.commit()
        print(f"destinations embedded: {len(destinations)}")

        dest_by_id = {d.id: d for d in destinations}
        listings = list((await session.execute(select(Listing))).scalars())
        vectors = []
        for i in range(0, len(listings), BATCH):
            batch = listings[i : i + BATCH]
            texts = [listing_text(l, dest_by_id[l.destination_id]) for l in batch]
            vectors.extend(await provider.embed(texts))
        for listing, vec in zip(listings, vectors):
            listing.embedding = vec
        await session.commit()
        print(f"listings embedded: {len(listings)}")


if __name__ == "__main__":
    asyncio.run(main())
