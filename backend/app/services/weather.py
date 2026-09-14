import asyncio
import json

import httpx

from app.core.cache import redis_client

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_TTL_SECONDS = 1800

# A grid of destination cards fires one request per card, so a cold page load
# would otherwise stampede the upstream API and get us rate-limited. Cap how
# many calls leave this process at once; queued callers re-check the cache
# after acquiring, so duplicates for the same destination cost nothing.
MAX_CONCURRENT_UPSTREAM = 4
_upstream_slots = asyncio.Semaphore(MAX_CONCURRENT_UPSTREAM)


class WeatherUnavailableError(Exception):
    pass


async def get_weather(destination_id: int, lat: float, lng: float) -> dict:
    cache_key = f"weather:{destination_id}"
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "forecast_days": 7,
        "timezone": "auto",
    }
    async with _upstream_slots:
        # another caller may have filled the cache while we waited for a slot
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(OPEN_METEO_URL, params=params)
                response.raise_for_status()
                # a 2xx with a non-JSON body (upstream throttling, an error
                # page) must degrade like any other upstream failure, not 500
                data = response.json()
            current = data["current"]
            daily = data["daily"]
        except httpx.HTTPError as exc:
            raise WeatherUnavailableError(str(exc)) from exc
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            raise WeatherUnavailableError(f"malformed upstream payload: {exc}") from exc

    payload = {
        "current": {
            "temperature_c": current["temperature_2m"],
            "feels_like_c": current["apparent_temperature"],
            "humidity": current["relative_humidity_2m"],
            "wind_kmh": current["wind_speed_10m"],
            "weather_code": current["weather_code"],
        },
        "daily": [
            {
                "date": daily["time"][i],
                "weather_code": daily["weather_code"][i],
                "temp_max_c": daily["temperature_2m_max"][i],
                "temp_min_c": daily["temperature_2m_min"][i],
                "precipitation_chance": (daily.get("precipitation_probability_max") or [None] * 7)[i],
            }
            for i in range(len(daily["time"]))
        ],
    }

    await redis_client.set(cache_key, json.dumps(payload), ex=CACHE_TTL_SECONDS)
    return payload
