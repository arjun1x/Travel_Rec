"""Fetch a representative, freely licensed photo for every seeded destination.

Sources, in order:
  1. a hand-picked Commons file (PREFERRED_FILE) or landmark search (SEARCH_QUERY)
  2. the lead image of the destination's English Wikipedia article
  3. photos used in the destination's Wikivoyage, then Wikipedia, article
  4. a plain Wikimedia Commons search

Montages, maps, flags, wildlife close-ups, paintings and the like are skipped.
Photos are resized to at most MAX_WIDTH pixels and written to
frontend/public/images/<slug>.jpg; author, license and source page for each
are recorded in CREDITS.json / CREDITS.md next to them. Existing files are
kept unless --force is given.

    uv run --project backend --with pillow python scripts/fetch_photos.py
    uv run --project backend --with pillow python scripts/fetch_photos.py --force Lisbon Bangkok
"""

import html
import io
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote, unquote

import httpx
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from seed import DESTINATIONS, slugify  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public" / "images"
CREDITS_JSON = OUT / "CREDITS.json"
CREDITS_MD = OUT / "CREDITS.md"
MAX_WIDTH = 1200
JPEG_QUALITY = 82
HEADERS = {"User-Agent": "TravelRec-photo-fetcher/1.0 (https://github.com/arjun1x/Travel_Rec)"}
WIKI_API = "https://en.wikipedia.org/w/api.php"
VOYAGE_API = "https://en.wikivoyage.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"

# file names that are never a destination photo
REJECT = re.compile(
    r"montage|collage|mosaic|\bmap\b|_map|-map|flag|coat|seal|logo|emblem|diagram|locator|"
    r"banner|infobox|\.svg|\.png|\.gif|\.tif|"
    # wildlife close-ups, art and oddities that a plain search loves to return
    r"bird|heron|swallow|dove|tanager|fody|weaver|hawkfish|\bfish\b|clam|urchin|turtle|agouti|"
    r"condor|butterfly|moth|beetle|insect|flower|painting|engraving|lithograph|drawing|"
    r"stamp|certificate|coin|banknote|poster|portrait|nobel|covid|pipe|share\b|"
    r"\b1[5-8]\d\d\b|\b19[0-5]\d\b|interior|ceiling|dome of|organ|altar|"
    r"\bbw\b|black.?and.?white|lccn|photochrom|museum|airport|aeropuerto|terminal",
    re.I,
)

# destinations whose article title differs from the seed name
WIKI_TITLE = {
    "Queenstown": "Queenstown, New Zealand",
    "Yellowstone": "Yellowstone National Park",
    "Serengeti": "Serengeti National Park",
    "Ha Long Bay": "Hạ Long Bay",
    "Banff": "Banff National Park",
    "Masai Mara": "Maasai Mara",
    "Torres del Paine": "Torres del Paine National Park",
    "La Fortuna": "Arenal Volcano",
    "Phuket": "Phuket province",
    "Fes": "Fez, Morocco",
    "Sedona": "Sedona, Arizona",
    "Oaxaca": "Oaxaca City",
    "Bariloche": "San Carlos de Bariloche",
    "Muscat": "Muscat, Oman",
    "Hoi An": "Hội An",
    "Cartagena": "Cartagena, Colombia",
    "Santiago": "Santiago, Chile",
    "Nice": "Nice, France",
    "Galle": "Galle",
}

# landmark searches for places where the article images are montages or weak
SEARCH_QUERY = {
    "Auckland": "Auckland skyline Sky Tower harbour",
    "Barcelona": "Casa Batllo Barcelona facade",
    "Bergen": "Bryggen Bergen wharf",
    "Bora Bora": "Bora Bora lagoon Mount Otemanu",
    "Buenos Aires": "Caminito La Boca Buenos Aires",
    "Busan": "Gamcheon Culture Village Busan",
    "Cairo": "Giza pyramids Cairo",
    "Chicago": "Chicago skyline from Adler Planetarium",
    "Dubai": "Dubai Marina skyline",
    "Dublin": "Ha'penny Bridge Dublin Liffey",
    "El Chaltén": "Fitz Roy El Chaltén",
    "Fiji": "Yasawa Islands Fiji beach",
    "Florence": "Florence panorama Piazzale Michelangelo",
    "Ha Long Bay": "Ha Long Bay karst islands",
    "Havana": "Havana Capitolio classic car",
    "Hobart": "Hobart Constitution Dock Tasmania",
    "Honolulu": "Waikiki Beach Honolulu skyline",
    "Interlaken": "Lake Brienz Iseltwald Interlaken",
    "Kathmandu": "Swayambhunath Kathmandu",
    "Kuala Lumpur": "Petronas Twin Towers Kuala Lumpur",
    "La Fortuna": "Arenal Volcano Costa Rica",
    "Lalibela": "Church of Saint George Lalibela",
    "Lima": "Plaza Mayor Lima cathedral",
    "Lisbon": "Lisbon Praca do Comercio",
    "London": "Tower Bridge London",
    "Los Angeles": "Downtown Los Angeles skyline sunset",
    "Luang Prabang": "Kuang Si Falls Luang Prabang",
    "Madeira": "Madeira Pico do Arieiro",
    "Madrid": "Madrid Gran Via Metropolis building",
    "Maldives": "Maldives overwater bungalows",
    "Mallorca": "Sa Calobra Mallorca",
    "Mauritius": "Le Morne Brabant Mauritius",
    "Melbourne": "Melbourne skyline Princes Bridge Yarra",
    "Mexico City": "Palacio de Bellas Artes Mexico City",
    "Miami": "South Beach Miami lifeguard tower",
    "Munich": "Munich Marienplatz Frauenkirche",
    "New Orleans": "Jackson Square New Orleans St Louis Cathedral",
    "Nice": "Nice Promenade des Anglais Baie des Anges",
    "Oaxaca": "Monte Alban Oaxaca",
    "Osaka": "Dotonbori Osaka night",
    "Oslo": "Oslo Opera House",
    "Prague": "Prague Charles Bridge castle",
    "Quito": "Basilica del Voto Nacional Quito",
    "Rio de Janeiro": "Rio de Janeiro Sugarloaf Christ Redeemer",
    "Salzburg": "Salzburg Hohensalzburg fortress view",
    "San Francisco": "Golden Gate Bridge San Francisco sunset",
    "Santiago": "Santiago Chile Costanera Center Andes",
    "Seville": "Plaza de Espana Sevilla panorama",
    "Seychelles": "Anse Source d'Argent La Digue Seychelles",
    "Shanghai": "Shanghai Bund Pudong skyline",
    "Siem Reap": "Angkor Wat reflection pond",
    "Torres del Paine": "Torres del Paine towers lake",
    "Tulum": "Tulum Mayan ruins beach",
    "Udaipur": "Udaipur City Palace Lake Pichola",
    "Vancouver": "Vancouver skyline Stanley Park",
    "Venice": "Venice Grand Canal Rialto",
    "Victoria Falls": "Victoria Falls aerial",
    "Zanzibar": "Zanzibar Nungwi beach dhow",
}

# hand-picked Commons files (File:...) that override everything else
PREFERRED_FILE = {}

client = httpx.Client(headers=HEADERS, timeout=30, follow_redirects=True)


def get(url: str, **params) -> dict:
    last: Exception | None = None
    for attempt in range(3):
        try:
            response = client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise last  # type: ignore[misc]


def imageinfo(api: str, titles: list[str]) -> list[dict]:
    """imageinfo for up to 50 files, in the order given."""
    if not titles:
        return []
    data = get(
        api,
        action="query",
        format="json",
        titles="|".join(titles[:50]),
        prop="imageinfo",
        iiprop="url|size|mime|extmetadata",
        iiurlwidth=1400,
    )
    by_title = {}
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [None])[0]
        if info:
            info["title"] = page.get("title")
            by_title[page.get("title")] = info
    # normalized titles: the API may return File names with underscores replaced
    normalized = {t.replace("_", " "): info for t, info in by_title.items()}
    return [normalized[t.replace("_", " ")] for t in titles if t.replace("_", " ") in normalized]


def usable(info: dict) -> bool:
    title = info.get("title", "")
    if REJECT.search(title) or not info.get("mime", "").startswith("image/jpeg"):
        return False
    width, height = info.get("width", 0), info.get("height", 0)
    if width < 1000 or height < 600:
        return False
    aspect = width / height
    return 0.7 <= aspect <= 2.4  # banners and tall crops fill a card badly


def points(info: dict, query_words: set[str]) -> float:
    width, height = info["width"], info["height"]
    aspect = width / height
    score = 2.0 if 1.15 <= aspect <= 2.0 else 1.0 if 0.9 <= aspect < 1.15 else 0.0
    assessments = (info.get("extmetadata", {}).get("Assessments", {}).get("value") or "").lower()
    score += 3 if "featured" in assessments else 2 if "quality" in assessments else 1 if "valued" in assessments else 0
    title = info["title"].lower()
    score += sum(1 for w in query_words if w in title)
    return score


def wikipedia_lead(name: str) -> dict | None:
    title = WIKI_TITLE.get(name, name)
    summary = get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(title)}")
    source = (summary.get("originalimage") or {}).get("source")
    if not source:
        return None
    filename = "File:" + unquote(source.rsplit("/", 1)[-1])
    infos = imageinfo(WIKI_API, [filename])
    return infos[0] if infos and usable(infos[0]) else None


def article_images(api: str, title: str) -> dict | None:
    """First usable photo in article order (skips montage, maps, history engravings)."""
    data = get(api, action="parse", format="json", page=title, prop="images", redirects=1)
    files = ["File:" + f for f in data.get("parse", {}).get("images", [])]
    files = [f for f in files if not REJECT.search(f) and f.lower().endswith((".jpg", ".jpeg"))]
    for info in imageinfo(COMMONS_API, files[:20]):
        if usable(info):
            return info
    return None


def commons_search(query: str, name: str) -> dict | None:
    data = get(
        COMMONS_API,
        action="query",
        format="json",
        generator="search",
        gsrsearch=f"{query} filetype:bitmap",
        gsrnamespace=6,
        gsrlimit=40,
        prop="imageinfo",
        iiprop="url|size|mime|extmetadata",
        iiurlwidth=1400,
    )
    words = {w.lower() for w in re.findall(r"[A-Za-z']{4,}", query)} - {slugify(name)}
    best, best_points = None, -1.0
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        info["title"] = page["title"]
        if not usable(info):
            continue
        p = points(info, words)
        if p > best_points:
            best, best_points = info, p
    return best


def find(name: str, country: str) -> dict | None:
    title = WIKI_TITLE.get(name, name)
    if name in PREFERRED_FILE:
        infos = imageinfo(COMMONS_API, [PREFERRED_FILE[name]])
        if infos:
            return infos[0]
    if name in SEARCH_QUERY:
        found = commons_search(SEARCH_QUERY[name], name)
        if found:
            return found
    return (
        wikipedia_lead(name)
        or safe(article_images, VOYAGE_API, name)
        or safe(article_images, WIKI_API, title)
        or commons_search(f"{name} {country}", name)
    )


def safe(fn, *args):
    try:
        return fn(*args)
    except Exception:
        return None


def save(info: dict, slug: str) -> None:
    raw = client.get(info.get("thumburl") or info["url"]).content
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    if image.width > MAX_WIDTH:
        image = image.resize((MAX_WIDTH, round(image.height * MAX_WIDTH / image.width)), Image.LANCZOS)
    image.save(OUT / f"{slug}.jpg", "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def clean(text: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def write_credits(credits: dict) -> None:
    CREDITS_JSON.write_text(json.dumps(credits, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    lines = [
        "# Photo credits",
        "",
        "Destination photographs are from Wikimedia Commons / Wikipedia contributors and are",
        "used under the licenses listed below, resized for the web. Hero and collection images",
        "were bundled separately. Regenerate with `scripts/fetch_photos.py`.",
        "",
        "| Destination | File | Author | License | Source |",
        "|---|---|---|---|---|",
    ]
    for name in sorted(credits):
        c = credits[name]
        author = (c["author"] or "unknown").replace("|", "/")
        lines.append(f"| {name} | `{c['file']}` | {author} | {c['license']} | [Commons]({c['source']}) |")
    CREDITS_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main(argv: list[str]) -> None:
    force = "--force" in argv
    only = {a for a in argv if not a.startswith("--")}
    OUT.mkdir(parents=True, exist_ok=True)
    credits = json.loads(CREDITS_JSON.read_text(encoding="utf-8")) if CREDITS_JSON.exists() else {}
    fetched = skipped = missing = 0
    for name, country, *_ in DESTINATIONS:
        if only and name not in only:
            continue
        slug = slugify(name)
        if (OUT / f"{slug}.jpg").exists() and not force:
            skipped += 1
            continue
        try:
            info = find(name, country)
        except Exception as exc:  # network hiccup: keep going, report at the end
            print(f"!! {name}: {exc}", flush=True)
            info = None
        if info is None:
            print(f"-- {name}: no suitable photo found", flush=True)
            missing += 1
            continue
        save(info, slug)
        meta = info.get("extmetadata", {})
        credits[name] = {
            "file": f"{slug}.jpg",
            "commons_title": info["title"],
            "author": clean(meta.get("Artist", {}).get("value", "")),
            "license": clean(meta.get("LicenseShortName", {}).get("value", "")) or "see source",
            "source": info.get("descriptionurl", ""),
        }
        fetched += 1
        print(f"ok {name}: {info['title']} ({credits[name]['license']})", flush=True)
        time.sleep(0.4)  # be polite to the Wikimedia APIs
    write_credits(credits)
    print(f"\nfetched {fetched}, kept {skipped}, missing {missing}", flush=True)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1:])
