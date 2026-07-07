import { useQuery } from '@tanstack/react-query'
import { getWeather } from '../lib/api'
import { weatherLook } from '../lib/weather'

export default function WeatherBadge({ destinationId }: { destinationId: number }) {
  const { data } = useQuery({
    queryKey: ['weather', destinationId],
    queryFn: () => getWeather(destinationId),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  })

  if (!data) return null
  const look = weatherLook(data.current.weather_code)

  return (
    <span
      title={look.label}
      className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur dark:bg-gray-900/80 dark:text-gray-100"
    >
      <span aria-hidden>{look.emoji}</span>
      {Math.round(data.current.temperature_c)}°C
    </span>
  )
}
