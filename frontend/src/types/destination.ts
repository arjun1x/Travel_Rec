export interface Destination {
  id: number
  name: string
  country: string
  lat: number
  lng: number
  description: string
  tags: string[]
  image_url: string | null
  popularity_score: number
}

export interface CurrentWeather {
  temperature_c: number
  feels_like_c: number
  humidity: number
  wind_kmh: number
  weather_code: number
}

export interface DailyForecast {
  date: string
  weather_code: number
  temp_max_c: number
  temp_min_c: number
  precipitation_chance: number | null
}

export interface Weather {
  current: CurrentWeather
  daily: DailyForecast[]
}
