from pydantic import BaseModel


class CurrentWeather(BaseModel):
    temperature_c: float
    feels_like_c: float
    humidity: int
    wind_kmh: float
    weather_code: int


class DailyForecast(BaseModel):
    date: str
    weather_code: int
    temp_max_c: float
    temp_min_c: float
    precipitation_chance: int | None = None


class WeatherRead(BaseModel):
    current: CurrentWeather
    daily: list[DailyForecast]
