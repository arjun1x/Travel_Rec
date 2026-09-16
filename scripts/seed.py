"""Seed the database with destinations, listings, demo users, and interactions.

Idempotent: destinations upsert by unique name; listings/users/interactions
are skipped when their tables already contain rows.
Run from the repo root:  uv run --project backend python scripts/seed.py
"""

import asyncio
import random
import re
import unicodedata
from pathlib import Path

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
    # ── expanded catalog ────────────────────────────────────────────────
    # Europe
    ("Venice", "Italy", 45.4408, 12.3155, ["romance", "history", "culture", "scenic"], 0.90,
     "Canals instead of streets — gondolas gliding under stone bridges, Byzantine mosaics in St Mark's, and cicchetti bars tucked down quiet calli."),
    ("Florence", "Italy", 43.7696, 11.2558, ["culture", "history", "food", "romance"], 0.88,
     "Cradle of the Renaissance — Brunelleschi's dome, the Uffizi, leather markets, and bistecca alla fiorentina in a city built for walking."),
    ("Athens", "Greece", 37.9838, 23.7275, ["history", "culture", "city", "food"], 0.84,
     "The Acropolis above a buzzing modern capital — ancient agoras, rooftop bars facing the Parthenon, and souvlaki after midnight."),
    ("Madrid", "Spain", 40.4168, -3.7038, ["city", "food", "culture", "nightlife"], 0.86,
     "Late dinners, later nights — the Prado's masterpieces, tapas crawls through La Latina, and long afternoons in Retiro Park."),
    ("Seville", "Spain", 37.3891, -5.9845, ["culture", "history", "food", "romance"], 0.83,
     "Orange-scented plazas, flamenco in Triana, the Alcázar's Moorish gardens, and a cathedral that swallowed a mosque."),
    ("Porto", "Portugal", 41.1579, -8.6291, ["food", "wine", "city", "scenic"], 0.84,
     "Tiled churches and terracotta roofs tumbling to the Douro — port-wine lodges, francesinha sandwiches, and the world's prettiest bookshop."),
    ("Berlin", "Germany", 52.5200, 13.4050, ["city", "culture", "history", "nightlife"], 0.87,
     "History on every corner and techno until dawn — Museum Island, East Side Gallery murals, and beer gardens in leafy Kreuzberg."),
    ("Munich", "Germany", 48.1351, 11.5820, ["city", "culture", "food", "mountains"], 0.80,
     "Beer halls, baroque palaces, and surfers on the Eisbach — with the Alps and fairy-tale Neuschwanstein a day trip away."),
    ("Copenhagen", "Denmark", 55.6761, 12.5683, ["city", "food", "culture", "scenic"], 0.85,
     "Bicycles, hygge, and harbor swims — Nyhavn's painted townhouses, Tivoli Gardens, and a New Nordic food scene led by Noma's alumni."),
    ("Stockholm", "Sweden", 59.3293, 18.0686, ["city", "island", "culture", "scenic"], 0.82,
     "A capital spread across fourteen islands — Gamla Stan's medieval lanes, the Vasa warship, and archipelago ferries to summer cabins."),
    ("Oslo", "Norway", 59.9139, 10.7522, ["city", "nature", "culture", "scenic"], 0.76,
     "A fjord-side opera house you can walk on, Munch's Scream, sculpture parks, and forests reachable by metro."),
    ("Helsinki", "Finland", 60.1699, 24.9384, ["city", "culture", "cold", "scenic"], 0.72,
     "Design-district cool, seaside saunas, art nouveau streets, and ferries to the Suomenlinna sea fortress."),
    ("Dublin", "Ireland", 53.3498, -6.2603, ["city", "culture", "nightlife", "history"], 0.83,
     "Literary pubs and live fiddles — Trinity's Book of Kells, Georgian squares, and the Guinness Storehouse with a view of the whole city."),
    ("Budapest", "Hungary", 47.4979, 19.0402, ["city", "history", "nightlife", "culture"], 0.85,
     "Thermal baths and ruin bars — the Danube dividing hilly Buda's castle from Pest's grand boulevards and glowing Parliament."),
    ("Kraków", "Poland", 50.0647, 19.9450, ["history", "culture", "city", "food"], 0.80,
     "Europe's largest medieval square, Wawel Castle, pierogi and vodka in Kazimierz, and sobering day trips to Auschwitz and the salt mines."),
    ("Bruges", "Belgium", 51.2093, 3.2247, ["romance", "history", "scenic", "food"], 0.79,
     "A perfectly preserved medieval town of canals, step-gabled houses, chocolate shops, and Belgian beer by candlelight."),
    ("Tallinn", "Estonia", 59.4370, 24.7536, ["history", "city", "culture", "cold"], 0.72,
     "A storybook walled old town of towers and cobbles, backed by one of Europe's most digital, creative capitals."),
    ("Lake Bled", "Slovenia", 46.3683, 14.1146, ["nature", "romance", "mountains", "scenic"], 0.78,
     "An emerald alpine lake with a church on its island and a cliff-top castle — row out, ring the bell, then hike Vintgar Gorge."),
    ("Mallorca", "Spain", 39.6953, 3.0176, ["beach", "island", "hiking", "food"], 0.84,
     "Turquoise calas, the Tramuntana's cliff-hugging villages, Palma's cathedral, and cycling roads loved by the pros."),
    ("Madeira", "Portugal", 32.6669, -16.9241, ["nature", "hiking", "island", "scenic"], 0.77,
     "Levada walks along irrigation channels, cloud-forest peaks, poncha bars, and year-round spring on an Atlantic volcanic island."),
    ("Nice", "France", 43.7102, 7.2620, ["beach", "food", "city", "scenic"], 0.82,
     "The Promenade des Anglais, pastel old-town markets, socca and rosé, and the whole Riviera strung out along the coast."),
    ("Zermatt", "Switzerland", 46.0207, 7.7491, ["mountains", "skiing", "hiking", "scenic"], 0.80,
     "A car-free village beneath the Matterhorn — glacier skiing, the Gornergrat railway, and fondue with the world's most famous peak."),
    ("Salzburg", "Austria", 47.8095, 13.0550, ["culture", "music", "history", "mountains"], 0.76,
     "Mozart's baroque birthplace — a hilltop fortress, Sound of Music gardens, and alpine lakes minutes from the old town."),
    ("Bergen", "Norway", 60.3913, 5.3221, ["nature", "scenic", "city", "cold"], 0.78,
     "Gateway to the fjords — Bryggen's wooden wharf, a funicular to Fløyen, and boats into Nærøyfjord's sheer walls."),
    # Asia & Middle East
    ("Hong Kong", "Hong Kong", 22.3193, 114.1694, ["city", "food", "nightlife", "hiking"], 0.88,
     "Skyscrapers against jungle peaks — dim sum, the Star Ferry at dusk, Victoria Peak, and hiking trails a tram ride from Central."),
    ("Shanghai", "China", 31.2304, 121.4737, ["city", "food", "culture", "nightlife"], 0.84,
     "Art deco on the Bund facing a sci-fi skyline — soup dumplings, French Concession plane trees, and the fastest train on earth."),
    ("Beijing", "China", 39.9042, 116.4074, ["history", "culture", "city", "food"], 0.85,
     "The Forbidden City, hutong alleys, Peking duck, and the Great Wall snaking across the hills an hour north."),
    ("Taipei", "Taiwan", 25.0330, 121.5654, ["food", "city", "nature", "culture"], 0.80,
     "Night-market feasts, hot springs at Beitou, Taipei 101, and misty tea mountains within the city limits."),
    ("Kuala Lumpur", "Malaysia", 3.1390, 101.6869, ["city", "food", "culture", "nightlife"], 0.78,
     "Petronas Towers, Batu Caves, and three cuisines on every street — Malay, Chinese, and Indian — at hawker prices."),
    ("Hoi An", "Vietnam", 15.8801, 108.3380, ["culture", "food", "history", "beach"], 0.83,
     "Lantern-lit old town on a river — tailors, cao lầu noodles, the Japanese bridge, and An Bang beach a bike ride away."),
    ("Luang Prabang", "Laos", 19.8856, 102.1347, ["temples", "culture", "nature", "scenic"], 0.76,
     "Saffron-robed monks at dawn alms, gilded temples, the Mekong at sunset, and turquoise Kuang Si waterfalls."),
    ("Siem Reap", "Cambodia", 13.3671, 103.8448, ["history", "temples", "culture", "adventure"], 0.84,
     "Gateway to Angkor — sunrise over Angkor Wat, tree-strangled Ta Prohm, and the smiling faces of the Bayon."),
    ("Phuket", "Thailand", 7.8804, 98.3923, ["beach", "island", "nightlife", "food"], 0.83,
     "Thailand's largest island — longtail boats to Phang Nga Bay, Old Town shophouses, and beaches for every budget."),
    ("Jaipur", "India", 26.9124, 75.7873, ["history", "culture", "markets", "city"], 0.82,
     "The Pink City — Amber Fort at sunrise, the Hawa Mahal's honeycomb windows, block-print bazaars, and dal baati feasts."),
    ("Udaipur", "India", 24.5854, 73.7125, ["romance", "history", "culture", "scenic"], 0.78,
     "The City of Lakes — marble palaces reflected in Lake Pichola, rooftop restaurants, and miniature-painting workshops."),
    ("Goa", "India", 15.2993, 74.1240, ["beach", "food", "nightlife", "culture"], 0.80,
     "Palm-fringed beaches, Portuguese churches, spice farms, vindaloo and feni — India at its most laid-back."),
    ("Kathmandu", "Nepal", 27.7172, 85.3240, ["culture", "temples", "mountains", "adventure"], 0.77,
     "Durbar squares and prayer flags — Boudhanath stupa, momos in Thamel, and Himalayan trailheads a short flight away."),
    ("Galle", "Sri Lanka", 6.0535, 80.2210, ["history", "beach", "culture", "food"], 0.76,
     "A Dutch colonial fort on the Indian Ocean — ramparts at sunset, boutique hotels in merchant houses, and Unawatuna's beach nearby."),
    ("Osaka", "Japan", 34.6937, 135.5023, ["food", "city", "nightlife", "culture"], 0.86,
     "Japan's kitchen — takoyaki and okonomiyaki under Dotonbori's neon, a reconstructed castle, and locals who live to eat."),
    ("Hiroshima", "Japan", 34.3853, 132.4553, ["history", "culture", "food", "island"], 0.77,
     "A city of peace and resilience — the A-Bomb Dome, layered okonomiyaki, and the floating torii of Miyajima across the bay."),
    ("Busan", "South Korea", 35.1796, 129.0756, ["beach", "food", "city", "culture"], 0.79,
     "Korea's seaside second city — Haeundae beach, the hillside Gamcheon Culture Village, and raw fish at Jagalchi market."),
    ("Dubai", "United Arab Emirates", 25.2048, 55.2708, ["city", "desert", "beach", "nightlife"], 0.87,
     "The tallest tower, indoor ski slopes, gold souks, and dune bashing at sunset — excess done with genuine warmth."),
    ("Muscat", "Oman", 23.5880, 58.3829, ["culture", "desert", "beach", "history"], 0.72,
     "Whitewashed low-rise elegance between mountains and sea — the Grand Mosque, Mutrah souk, and wadis with turquoise pools."),
    ("Tbilisi", "Georgia", 41.7151, 44.8271, ["food", "culture", "wine", "history"], 0.75,
     "Sulfur baths, crumbling balconies, khachapuri, and 8,000 years of winemaking in the Caucasus' most charming capital."),
    ("Samarkand", "Uzbekistan", 39.6270, 66.9750, ["history", "culture", "markets", "scenic"], 0.72,
     "Silk Road splendor — the turquoise domes of Registan Square, Timur's mausoleum, and bread markets unchanged for centuries."),
    # Africa
    ("Masai Mara", "Kenya", -1.4061, 35.0080, ["safari", "wildlife", "nature", "adventure"], 0.79,
     "Big-cat country on the Kenyan side of the Serengeti — hot-air balloons at dawn, Maasai villages, and the migration's river crossings."),
    ("Mauritius", "Mauritius", -20.3484, 57.5522, ["beach", "island", "romance", "nature"], 0.80,
     "A lagoon-ringed volcanic island of Creole, Indian, and French flavors — Le Morne's peak, seven-colored earth, and street dholl puri."),
    ("Fes", "Morocco", 34.0181, -5.0078, ["history", "culture", "markets", "food"], 0.77,
     "The world's largest car-free medina — tanneries, medieval madrasas, and a labyrinth of 9,000 alleys best surrendered to."),
    ("Luxor", "Egypt", 25.6872, 32.6396, ["history", "culture", "desert", "scenic"], 0.78,
     "The world's greatest open-air museum — Karnak's columns, the Valley of the Kings, and a felucca on the Nile at sunset."),
    ("Sossusvlei", "Namibia", -24.7275, 15.3419, ["desert", "nature", "adventure", "scenic"], 0.74,
     "The tallest dunes on earth glowing apricot at dawn, and the dead camelthorn trees of Deadvlei on a cracked white pan."),
    ("Lalibela", "Ethiopia", 12.0316, 39.0475, ["history", "culture", "temples", "mountains"], 0.66,
     "Eleven medieval churches carved straight down into volcanic rock — still alive with white-robed pilgrims and chanting priests."),
    # Americas
    ("Vancouver", "Canada", 49.2827, -123.1207, ["city", "nature", "food", "mountains"], 0.84,
     "Mountains, ocean, and rainforest inside a city — Stanley Park's seawall, Granville Island market, and ski slopes twenty minutes away."),
    ("Montreal", "Canada", 45.5017, -73.5673, ["city", "food", "culture", "nightlife"], 0.81,
     "French joie de vivre in North America — bagels and poutine, Old Port cobbles, jazz festivals, and a summer of terrasses."),
    ("Quebec City", "Canada", 46.8139, -71.2080, ["history", "romance", "culture", "cold"], 0.77,
     "Walled Old World streets, the château on the cliff, and a winter carnival — the closest thing to Europe this side of the Atlantic."),
    ("Chicago", "United States", 41.8781, -87.6298, ["city", "culture", "food", "music"], 0.84,
     "Architecture cruises on the river, deep dish and hot dogs, blues clubs, and a skyline reflected in a lakefront bean."),
    ("Los Angeles", "United States", 34.0522, -118.2437, ["city", "beach", "food", "nightlife"], 0.87,
     "A sprawling sun-drenched playground — Venice Beach, Griffith Observatory sunsets, taco trucks, and Hollywood's hills."),
    ("Miami", "United States", 25.7617, -80.1918, ["beach", "nightlife", "food", "city"], 0.85,
     "Art deco pastels, Cuban coffee in Little Havana, Wynwood murals, and South Beach nights that never quite end."),
    ("New Orleans", "United States", 29.9511, -90.0715, ["music", "food", "culture", "nightlife"], 0.83,
     "Jazz spilling from French Quarter balconies — beignets, gumbo, second-line parades, and a city that celebrates everything."),
    ("Sedona", "United States", 34.8697, -111.7610, ["nature", "hiking", "desert", "scenic"], 0.78,
     "Red-rock spires glowing at sunset, vortex trails, creekside swimming holes, and some of the darkest night skies in America."),
    ("Honolulu", "United States", 21.3069, -157.8583, ["beach", "surfing", "nature", "city"], 0.85,
     "Waikiki surf lessons, the Diamond Head hike, poke bowls, and Pearl Harbor — Oahu's easygoing island capital."),
    ("Havana", "Cuba", 23.1136, -82.3666, ["culture", "music", "history", "city"], 0.80,
     "Faded pastel mansions, 1950s Chevys, son music drifting from doorways, and a Malecón sunset with rum in hand."),
    ("Cartagena", "Colombia", 10.3910, -75.4794, ["history", "beach", "culture", "romance"], 0.82,
     "Bougainvillea-draped colonial walls, salsa in Getsemaní, ceviche carts, and boat trips to the Rosario Islands."),
    ("Medellín", "Colombia", 6.2442, -75.5812, ["city", "culture", "nightlife", "nature"], 0.79,
     "The city of eternal spring — cable cars over the hills, Comuna 13's street art, and a nightlife scene that reinvented itself."),
    ("Lima", "Peru", -12.0464, -77.0428, ["food", "city", "culture", "history"], 0.82,
     "South America's culinary capital — ceviche and pisco sours on the Miraflores cliffs, pre-Incan pyramids, and colonial Barranco."),
    ("Santiago", "Chile", -33.4489, -70.6693, ["city", "wine", "mountains", "food"], 0.76,
     "The Andes on the skyline, wine valleys an hour away, and a food and arts scene unfolding in Bellavista and Lastarria."),
    ("Torres del Paine", "Chile", -50.9423, -73.4068, ["hiking", "mountains", "nature", "adventure"], 0.78,
     "Patagonia's granite towers, blue glaciers, and guanaco-dotted steppe — the W Trek is the walk of a lifetime."),
    ("Oaxaca", "Mexico", 17.0732, -96.7266, ["food", "culture", "markets", "history"], 0.81,
     "Mole, mezcal, and markets — Zapotec ruins at Monte Albán, artisan villages, and the most vivid Day of the Dead in Mexico."),
    ("La Fortuna", "Costa Rica", 10.4678, -84.6427, ["nature", "adventure", "wildlife", "hiking"], 0.78,
     "Arenal Volcano rising over rainforest — hot springs, hanging bridges, sloths and toucans, and zip lines through the canopy."),
    ("Iguazu Falls", "Argentina", -25.6953, -54.4367, ["nature", "scenic", "adventure", "wildlife"], 0.82,
     "275 waterfalls thundering through jungle on the Argentina–Brazil border — walk the catwalks right to the Devil's Throat."),
    ("Quito", "Ecuador", -0.1807, -78.4678, ["history", "culture", "mountains", "city"], 0.74,
     "A UNESCO old town at 2,850 meters — gilded churches, the Equator line, and a cable car up the Pichincha volcano."),
    ("Bariloche", "Argentina", -41.1335, -71.3103, ["mountains", "nature", "skiing", "food"], 0.76,
     "Lakes and peaks with a Swiss accent — chocolate shops, the Seven Lakes road, skiing at Cerro Catedral, and Patagonian lamb."),
    # Oceania
    ("Melbourne", "Australia", -37.8136, 144.9631, ["city", "food", "culture", "nightlife"], 0.85,
     "Laneway coffee, street art, and sports mania — plus the Great Ocean Road and penguins on Phillip Island a day away."),
    ("Auckland", "New Zealand", -36.8485, 174.7633, ["city", "nature", "island", "adventure"], 0.78,
     "The City of Sails between two harbors — volcanic cones to climb, Waiheke's vineyards, and black-sand surf beaches to the west."),
    ("Uluru", "Australia", -25.3444, 131.0369, ["desert", "nature", "culture", "scenic"], 0.79,
     "The sacred red monolith of the Anangu — sunrise color shifts, the Field of Light, and the domes of Kata Tjuta nearby."),
    ("Hobart", "Australia", -42.8821, 147.3272, ["nature", "food", "culture", "island"], 0.72,
     "Tasmania's harbor capital — MONA's subterranean art, Salamanca market, kunanyi's summit, and oysters straight from the water."),
    ("Bora Bora", "French Polynesia", -16.5004, -151.7415, ["island", "beach", "romance", "scenic"], 0.84,
     "The lagoon everyone pictures — overwater bungalows under Mount Otemanu, manta rays, and impossibly blue water."),
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
    ("demo@travelrec.dev", "demo1234", "Demo Explorer", False),
    ("mia@travelrec.dev", "demo1234", "Mia Torres", False),
    ("leo@travelrec.dev", "demo1234", "Leo Novak", False),
    ("admin@travelrec.dev", "admin1234", "Site Admin", True),
]
INTERACTION_TYPES = [("view", 0.70), ("click", 0.15), ("save", 0.10), ("book", 0.05)]


def slugify(name: str) -> str:
    folded = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", folded.lower()).strip("-")


# bundled editorial photos live in the frontend; a destination gets one when a
# file named after its slug exists there (see scripts/fetch_photos.py)
IMAGE_DIR = Path(__file__).resolve().parents[1] / "frontend" / "public" / "images"


def local_image_url(name: str) -> str | None:
    return f"/images/{slugify(name)}.jpg" if (IMAGE_DIR / f"{slugify(name)}.jpg").exists() else None


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
                "image_url": local_image_url(name),
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

        # -- listings: only for destinations that have none yet ---------------
        with_listings = set(
            (await session.execute(select(Listing.destination_id).distinct())).scalars()
        )
        missing = [d for d in destinations if d.id not in with_listings]
        if missing:
            # a fresh generator per batch keeps reruns deterministic
            listings = build_listings(random.Random(f"listings-{len(with_listings)}"), missing)
            session.add_all(listings)
            await session.commit()
            print(f"listings: {len(listings)} inserted for {len(missing)} destinations")
        else:
            print(f"listings: all {len(destinations)} destinations already have stays — skipping")

        # -- demo users: insert any that are missing --------------------------
        demo_emails = [email for email, _, _, _ in DEMO_USERS]
        existing_demos = list(
            (await session.execute(select(User).where(User.email.in_(demo_emails)))).scalars()
        )
        existing_emails = {u.email for u in existing_demos}
        new_users = [
            User(
                email=email,
                hashed_password=hash_password(pw),
                name=name,
                is_admin=is_admin,
            )
            for email, pw, name, is_admin in DEMO_USERS
            if email not in existing_emails
        ]
        if new_users:
            session.add_all(new_users)
            await session.commit()
            for u in new_users:
                await session.refresh(u)
            print(f"demo users: {len(new_users)} inserted")
        else:
            print(f"demo users: {len(existing_demos)} already present — skipping")
        demo_users = existing_demos + new_users

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
