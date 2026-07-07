// WMO weather interpretation codes (Open-Meteo `weather_code`)
// https://open-meteo.com/en/docs — grouped into human-friendly buckets.

export interface WeatherLook {
  label: string
  emoji: string
}

const CODES: [Set<number>, WeatherLook][] = [
  [new Set([0]), { label: 'Clear sky', emoji: '☀️' }],
  [new Set([1]), { label: 'Mostly clear', emoji: '🌤️' }],
  [new Set([2]), { label: 'Partly cloudy', emoji: '⛅' }],
  [new Set([3]), { label: 'Overcast', emoji: '☁️' }],
  [new Set([45, 48]), { label: 'Fog', emoji: '🌫️' }],
  [new Set([51, 53, 55, 56, 57]), { label: 'Drizzle', emoji: '🌦️' }],
  [new Set([61, 63, 65, 66, 67]), { label: 'Rain', emoji: '🌧️' }],
  [new Set([71, 73, 75, 77]), { label: 'Snow', emoji: '🌨️' }],
  [new Set([80, 81, 82]), { label: 'Showers', emoji: '🌦️' }],
  [new Set([85, 86]), { label: 'Snow showers', emoji: '❄️' }],
  [new Set([95, 96, 99]), { label: 'Thunderstorm', emoji: '⛈️' }],
]

export function weatherLook(code: number): WeatherLook {
  for (const [codes, look] of CODES) {
    if (codes.has(code)) return look
  }
  return { label: 'Unknown', emoji: '🌡️' }
}

export function formatDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}
