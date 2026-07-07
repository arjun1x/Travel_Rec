"""Seed the database with destinations, listings, demo users, and interactions.

Idempotent: destinations upsert by unique name; listings/users/interactions
are skipped when their tables already contain rows.
Run from the repo root:  uv run --project backend python scripts/seed.py
"""

import asyncio
import random
import re

from sqlalchemy import func, select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models import Destination, Interaction, Listing, User

# (name, country, lat, lng, tags, popularity, description)
DESTINATIONS: list[tuple] = [
    ("Paris", "France", 48.8566, 2.3522, ["city", "culture", "food", "romance"], 0.95,
     "The City of Light — world-class museums, cafe culture, and iconic architecture from the Eiffel Tower to Montmartre."),
    ("Kyoto", "Japan", 35.0116, 135.7681, ["culture", "temples", "history", "food"], 0.90,
     "Japan's ancient capital: thousands of temples and shrines, tranquil zen gardens, geisha districts, and seasonal beauty."),
    ("Cusco", "Peru", -13.5320, -71.9675, ["adventure", "history", "mountains", "hiking"], 0.78,
     "Gateway to Machu Picchu high in the Andes — Incan ruins, colonial plazas, and vibrant markets."),
    ("Reykjavik", "Iceland", 64.1466, -21.9426, ["nature", "adventure", "northern-lights", "cold"], 0.82,
     "Nordic charm on the edge of raw nature — northern lights, geothermal lagoons, glaciers, and volcanic landscapes."),
    ("Cape Town", "South Africa", -33.9249, 18.4241, ["beach", "nature", "wine", "city"], 0.80,
     "Where mountains meet the sea — Table Mountain hikes, penguin beaches, winelands, and a buzzing food scene."),
    ("Queenstown", "New Zealand", -45.0312, 168.6626, ["adventure", "mountains", "skiing", "nature"], 0.75,
     "The adventure capital of the world — bungee jumping, jet boats, skiing, and stunning alpine lake scenery."),
    ("Lisbon", "Portugal", 38.7223, -9.1393, ["city", "food", "beach", "culture"], 0.87,
     "Sun-drenched hills, historic trams, pastel-tiled facades, fado music, and fresh seafood by the Atlantic."),
    ("Banff", "Canada", 51.1784, -115.5708, ["nature", "mountains", "hiking", "skiing"], 0.79,
     "Turquoise lakes and towering Rockies — hiking, skiing, wildlife, and hot springs inside Canada's oldest national park."),
    ("Rome", "Italy", 41.9028, 12.4964, ["city", "culture", "history", "food"], 0.93,
     "The Eternal City — the Colosseum, Vatican treasures, trattoria dinners, and 2,500 years of history on every corner."),
    ("Barcelona", "Spain", 41.3874, 2.1686, ["city", "beach", "culture", "food"], 0.91,
     "Gaudí's playground by the Mediterranean — tapas crawls, Gothic lanes, golden beaches, and late-night energy."),
    ("Tokyo", "Japan", 35.6762, 139.6503, ["city", "food", "culture", "nightlife"], 0.94,
     "Neon futurism meets quiet shrines — sushi counters, cherry blossoms, and the world's best-organized chaos."),
    ("Bali", "Indonesia", -8.4095, 115.1889, ["beach", "temples", "nature", "surfing"], 0.92,
     "Island of the gods — emerald rice terraces, clifftop temples, surf breaks, and jungle yoga retreats."),
    ("Santorini", "Greece", 36.3932, 25.4615, ["beach", "romance", "island", "food"], 0.88,
     "Whitewashed villages spilling down volcanic cliffs — caldera sunsets, black-sand beaches, and crisp Assyrtiko wine."),
    ("Marrakech", "Morocco", 31.6295, -7.9811, ["culture", "markets", "history", "food"], 0.81,
     "A sensory maze of souks, riads, and rooftop mint tea — with the Atlas Mountains shimmering beyond the medina."),
    ("Petra", "Jordan", 30.3285, 35.4444, ["history", "adventure", "desert", "hiking"], 0.76,
     "The rose-red city carved into desert cliffs — walk the Siq at dawn and watch the Treasury glow."),
    ("Cairo", "Egypt", 30.0444, 31.2357, ["history", "culture", "desert", "city"], 0.79,
     "Pyramids on the horizon, pharaonic treasures in the museum, and feluccas drifting down the Nile at sunset."),
    ("Istanbul", "Turkey", 41.0082, 28.9784, ["city", "culture", "history", "food"], 0.86,
     "Where continents meet — Hagia Sophia, spice bazaars, Bosphorus ferries, and layers of empire in one skyline."),
    ("Dubrovnik", "Croatia", 42.6507, 18.0944, ["beach", "history", "city", "romance"], 0.80,
     "The Pearl of the Adriatic — marble streets inside medieval walls, island hops, and cliff-bar sunsets."),
    ("Amalfi Coast", "Italy", 40.6340, 14.6027, ["beach", "romance", "food", "scenic"], 0.85,
     "Lemon groves and pastel villages stacked above a sapphire sea — drive the coast road, then linger over limoncello."),
    ("Interlaken", "Switzerland", 46.6863, 7.8632, ["mountains", "hiking", "skiing", "nature"], 0.84,
     "Between two alpine lakes under the Jungfrau — paragliding, cogwheel trains, and trails with impossible views."),
    ("Prague", "Czech Republic", 50.0755, 14.4378, ["city", "history", "culture", "nightlife"], 0.82,
     "A fairy-tale skyline of spires and bridges — castle views, cobbled lanes, and legendary beer halls."),
    ("Vienna", "Austria", 48.2082, 16.3738, ["city", "culture", "music", "history"], 0.78,
     "Imperial palaces, gilded concert halls, and coffee houses where time slows — Europe at its most elegant."),
    ("Amsterdam", "Netherlands", 52.3676, 4.9041, ["city", "culture", "nightlife", "romance"], 0.83,
     "Canals, bicycles, and gabled houses — world-class museums by day, brown cafés and canal lights by night."),
    ("London", "United Kingdom", 51.5074, -0.1278, ["city", "culture", "history", "food"], 0.90,
     "Royal pageantry meets global cool — West End shows, market food halls, and museums that could swallow a week."),
    ("Edinburgh", "United Kingdom", 55.9533, -3.1883, ["city", "history", "culture", "nature"], 0.77,
     "A castle on a crag above medieval closes — festivals, whisky bars, and Arthur's Seat rising over it all."),
    ("New York City", "United States", 40.7128, -74.0060, ["city", "food", "culture", "nightlife"], 0.93,
     "The city that never sleeps — Broadway, world cuisine in every borough, and skyline views from Central Park to DUMBO."),
    ("San Francisco", "United States", 37.7749, -122.4194, ["city", "nature", "food", "scenic"], 0.80,
     "Fog rolling under the Golden Gate — hilly streets, waterfront sourdough, and redwoods within an hour's drive."),
    ("Maui", "United States", 20.7984, -156.3319, ["beach", "nature", "surfing", "romance"], 0.83,
     "The Valley Isle — sunrise above the clouds at Haleakalā, the Road to Hana, and beaches for every mood."),
    ("Yellowstone", "United States", 44.4280, -110.5885, ["nature", "wildlife", "hiking", "mountains"], 0.78,
     "Geysers, technicolor hot springs, and free-roaming bison — America's first national park still feels primeval."),
    ("Grand Canyon", "United States", 36.1069, -112.1129, ["nature", "hiking", "desert", "adventure"], 0.82,
     "A mile-deep chasm of banded rock — rim-to-rim hikes, mule rides, and sunsets that silence a crowd."),
    ("Tulum", "Mexico", 20.2114, -87.4654, ["beach", "history", "nature", "food"], 0.81,
     "Mayan ruins on a cliff above turquoise water — cenote swims, beach clubs, and jungle dinners under fairy lights."),
    ("Mexico City", "Mexico", 19.4326, -99.1332, ["city", "food", "culture", "history"], 0.79,
     "Aztec foundations, muralist masterpieces, and arguably the best street food on the planet."),
    ("Rio de Janeiro", "Brazil", -22.9068, -43.1729, ["beach", "city", "nightlife", "nature"], 0.84,
     "Samba between mountains and sea — Copacabana mornings, Sugarloaf sunsets, and Carnival energy year-round."),
    ("El Chaltén", "Argentina", -49.3315, -72.8863, ["mountains", "hiking", "nature", "adventure"], 0.75,
     "Patagonia's trekking capital — granite spires of Fitz Roy, glacier lakes, and trails straight from town."),
    ("Buenos Aires", "Argentina", -34.6037, -58.3816, ["city", "food", "culture", "nightlife"], 0.77,
     "Tango in candlelit milongas, steak with Malbec, and grand boulevards with a bohemian heart."),
    ("Galápagos Islands", "Ecuador", -0.9538, -90.9656, ["nature", "wildlife", "island", "adventure"], 0.74,
     "Evolution's living laboratory — snorkel with sea lions, walk among giant tortoises, and meet fearless wildlife."),
    ("Serengeti", "Tanzania", -2.3333, 34.8333, ["wildlife", "nature", "safari", "adventure"], 0.76,
     "Endless golden plains where the Great Migration thunders past — safaris, balloon rides, and big-cat sightings."),
    ("Zanzibar", "Tanzania", -6.1659, 39.2026, ["beach", "island", "culture", "food"], 0.72,
     "Spice-scented Stone Town lanes and powder-white beaches — dhow sails at sunset off the Swahili coast."),
    ("Victoria Falls", "Zimbabwe", -17.9243, 25.8572, ["nature", "adventure", "wildlife", "scenic"], 0.71,
     "The smoke that thunders — a mile-wide curtain of falling water, devil's-pool swims, and river safaris."),
    ("Seychelles", "Seychelles", -4.6796, 55.4920, ["beach", "island", "romance", "nature"], 0.78,
     "Granite boulders on flour-soft sand — turquoise coves, giant tortoises, and barefoot-luxury island hopping."),
    ("Maldives", "Maldives", 3.2028, 73.2207, ["beach", "island", "romance", "scenic"], 0.89,
     "Overwater villas on impossibly blue lagoons — house reefs, sandbank picnics, and sunsets made for two."),
    ("Singapore", "Singapore", 1.3521, 103.8198, ["city", "food", "culture", "nightlife"], 0.85,
     "A garden city of glass and green — hawker-stall feasts, Supertree light shows, and spotless efficiency."),
    ("Bangkok", "Thailand", 13.7563, 100.5018, ["city", "food", "temples", "nightlife"], 0.87,
     "Golden temples beside mega-malls — river taxis, floating markets, and street food worth the flight alone."),
    ("Chiang Mai", "Thailand", 18.7883, 98.9853, ["temples", "culture", "food", "nature"], 0.79,
     "Lanna temples inside a moated old city — night bazaars, cooking classes, and misty mountain treks."),
    ("Hanoi", "Vietnam", 21.0285, 105.8542, ["city", "food", "culture", "history"], 0.78,
     "Scooters swirling around a serene lake — pho at dawn, French-colonial facades, and thousand-year-old temples."),
    ("Ha Long Bay", "Vietnam", 20.9101, 107.1839, ["nature", "island", "scenic", "adventure"], 0.80,
     "Thousands of limestone karsts rising from jade water — overnight cruises, kayak caves, and floating villages."),
    ("Seoul", "South Korea", 37.5665, 126.9780, ["city", "food", "culture", "nightlife"], 0.84,
     "Palaces beside neon — Korean barbecue, hanok villages, K-fashion streets, and mountains ringing the city."),
    ("Sydney", "Australia", -33.8688, 151.2093, ["city", "beach", "surfing", "food"], 0.86,
     "Harbour-city glamour — Opera House sails, Bondi surf, coastal cliff walks, and brunch culture done right."),
    ("Cairns", "Australia", -16.9186, 145.7781, ["nature", "island", "adventure", "wildlife"], 0.79,
     "Gateway to the Great Barrier Reef — dive coral gardens, then cool off under Daintree rainforest waterfalls."),
    ("Fiji", "Fiji", -17.7765, 177.4356, ["beach", "island", "romance", "nature"], 0.73,
     "Three hundred islands of soft coral and softer welcomes — village visits, reef dives, and hammock time."),
]

LISTING_TEMPLATES = {
    "hotel": [
        "The {name} Grand Hotel",
        "Hotel Centrale {name}",
        "{name} Park Hotel",
        "The Heritage {name}",
        "Skyline Hotel {name}",
    ],
    "apartment": [
        "Cozy Apartment near {name} Old Town",
        "Modern Loft in Central {name}",
        "Sunny Studio {name}",
        "Designer Flat {name}",
    ],
    "hostel": [
        "{name} Backpackers Hostel",
        "Wanderer's Hostel {name}",
        "The Social Hostel {name}",
    ],
    "villa": [
        "Villa Serena {name}",
        "Private Villa with Pool — {name}",
        "Hillside Villa {name}",
    ],
}

TYPE_WEIGHTS = [("hotel", 0.4), ("apartment", 0.3), ("hostel", 0.15), ("villa", 0.15)]
PRICE_RANGES = {"hotel": (100, 350), "apartment": (70, 180), "hostel": (25, 60), "villa": (250, 800)}
CAPACITY_RANGES = {"hotel": (1, 4), "apartment": (2, 6), "hostel": (1, 4), "villa": (4, 10)}
AMENITIES = [
    "wifi", "kitchen", "pool", "parking", "breakfast", "air-conditioning", "gym",
    "spa", "pet-friendly", "washer", "balcony", "sea-view", "city-view", "hot-tub",
]
DEMO_USERS = [
    ("demo@travelrec.dev", "demo1234", "Demo Explorer"),
    ("mia@travelrec.dev", "demo1234", "Mia Torres"),
    ("leo@travelrec.dev", "demo1234", "Leo Novak"),
]
INTERACTION_TYPES = [("view", 0.70), ("click", 0.15), ("save", 0.10), ("book", 0.05)]


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def weighted_choice(rng: random.Random, weighted: list[tuple[str, float]]) -> str:
    return rng.choices([w[0] for w in weighted], weights=[w[1] for w in weighted])[0]


def build_listings(rng: random.Random, destinations: list[Destination]) -> list[Listing]:
    listings: list[Listing] = []
    counter = 0
    for dest in destinations:
        for _ in range(rng.randint(8, 12)):
            counter += 1
            ltype = weighted_choice(rng, TYPE_WEIGHTS)
            template = rng.choice(LISTING_TEMPLATES[ltype])
            low, high = PRICE_RANGES[ltype]
            price = round(rng.uniform(low, high) * (0.6 + dest.popularity_score), 0)
            amenities = rng.sample(AMENITIES, rng.randint(3, 7))
            listings.append(
                Listing(
                    destination_id=dest.id,
                    type=ltype,
                    title=template.format(name=dest.name),
                    description=(
                        f"A {ltype} in {dest.name}, {dest.country} — "
                        f"{', '.join(amenities[:3])} included. Ideal base for "
                        f"{' and '.join(dest.tags[:2])} trips."
                    ),
                    price_per_night=price,
                    capacity=rng.randint(*CAPACITY_RANGES[ltype]),
                    amenities=amenities,
                    images=[f"https://picsum.photos/seed/listing-{counter}/800/600"],
                    rating=round(rng.uniform(3.4, 4.9), 1),
                )
            )
    return listings


async def main() -> None:
    rng = random.Random(42)
    async with SessionLocal() as session:
        # -- destinations: upsert by unique name -----------------------------
        inserted = updated = 0
        for name, country, lat, lng, tags, popularity, description in DESTINATIONS:
            data = {
                "name": name,
                "country": country,
                "lat": lat,
                "lng": lng,
                "tags": tags,
                "popularity_score": popularity,
                "description": description,
                "image_url": f"https://picsum.photos/seed/{slugify(name)}-travel/800/600",
            }
            existing = (
                await session.execute(select(Destination).where(Destination.name == name))
            ).scalar_one_or_none()
            if existing is None:
                session.add(Destination(**data))
                inserted += 1
            else:
                for key, value in data.items():
                    setattr(existing, key, value)
                updated += 1
        await session.commit()
        print(f"destinations: {inserted} inserted, {updated} updated")

        destinations = list((await session.execute(select(Destination))).scalars())

        # -- listings: skip when already seeded -------------------------------
        listing_count = (await session.execute(select(func.count(Listing.id)))).scalar_one()
        if listing_count:
            print(f"listings: {listing_count} already present — skipping")
        else:
            listings = build_listings(rng, destinations)
            session.add_all(listings)
            await session.commit()
            print(f"listings: {len(listings)} inserted")

        # -- demo users -------------------------------------------------------
        demo_emails = [email for email, _, _ in DEMO_USERS]
        existing_demos = list(
            (await session.execute(select(User).where(User.email.in_(demo_emails)))).scalars()
        )
        if existing_demos:
            print(f"demo users: {len(existing_demos)} already present — skipping")
            demo_users = existing_demos
        else:
            demo_users = [
                User(email=email, hashed_password=hash_password(pw), name=name)
                for email, pw, name in DEMO_USERS
            ]
            session.add_all(demo_users)
            await session.commit()
            for u in demo_users:
                await session.refresh(u)
            print(f"demo users: {len(demo_users)} inserted (password: demo1234)")

        # -- interactions: synthetic engagement, weighted by listing rating ---
        interaction_count = (
            await session.execute(select(func.count(Interaction.id)))
        ).scalar_one()
        if interaction_count:
            print(f"interactions: {interaction_count} already present — skipping")
        else:
            all_listings = list((await session.execute(select(Listing))).scalars())
            weights = [listing.rating**2 for listing in all_listings]
            interactions = []
            for user in demo_users:
                for listing in rng.choices(all_listings, weights=weights, k=rng.randint(60, 120)):
                    interactions.append(
                        Interaction(
                            user_id=user.id,
                            listing_id=listing.id,
                            type=weighted_choice(rng, INTERACTION_TYPES),
                        )
                    )
            session.add_all(interactions)
            await session.commit()
            print(f"interactions: {len(interactions)} inserted")


if __name__ == "__main__":
    asyncio.run(main())
