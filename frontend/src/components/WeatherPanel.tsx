import { useQuery } from '@tanstack/react-query'
import { getWeather } from '../lib/api'
import { DEMO_MODE } from '../lib/config'
import { formatDay, weatherLook } from '../lib/weather'

export default function WeatherPanel({ destinationId }: { destinationId: number }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['weather', destinationId],
    queryFn: () => getWeather(destinationId),
    staleTime: 30 * 60 * 1000,
    retry: 1,
    enabled: !DEMO_MODE,
  })

  if (DEMO_MODE) return <div className="rounded-xl border border-gray-200 bg-[#eeefe4] p-6"><span className="eyebrow">A LITTLE WEATHER WISDOM</span><h2 className="mt-3 font-[var(--font-display)] text-3xl">Know before you go.</h2><p className="mt-3 text-xs leading-relaxed text-gray-500">Connect the backend for the current weather and a seven-day forecast. Live readings are not available in the preview collection.</p></div>

  if (isPending) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-4 h-16 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        Weather is unavailable right now.
      </div>
    )
  }

  const current = weatherLook(data.current.weather_code)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Weather now
      </h3>

      <div className="mt-3 flex items-center gap-4">
        <span className="text-5xl" aria-hidden>{current.emoji}</span>
        <div>
          <p className="text-4xl font-bold tracking-tight">
            {Math.round(data.current.temperature_c)}°C
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{current.label}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60">
          <dt className="text-xs text-gray-500 dark:text-gray-400">Feels like</dt>
          <dd className="font-semibold">{Math.round(data.current.feels_like_c)}°C</dd>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60">
          <dt className="text-xs text-gray-500 dark:text-gray-400">Humidity</dt>
          <dd className="font-semibold">{data.current.humidity}%</dd>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60">
          <dt className="text-xs text-gray-500 dark:text-gray-400">Wind</dt>
          <dd className="font-semibold">{Math.round(data.current.wind_kmh)} km/h</dd>
        </div>
      </dl>

      <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Next 7 days
      </h4>
      <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
        {data.daily.map((day) => {
          const look = weatherLook(day.weather_code)
          return (
            <li key={day.date} className="flex items-center gap-3 py-1.5 text-sm">
              <span className="w-10 font-medium text-gray-600 dark:text-gray-300">
                {formatDay(day.date)}
              </span>
              <span title={look.label} aria-label={look.label}>{look.emoji}</span>
              <span className="w-10 text-xs text-sky-600 dark:text-sky-400">
                {day.precipitation_chance != null ? `${day.precipitation_chance}%` : ''}
              </span>
              <span className="ml-auto tabular-nums text-gray-500 dark:text-gray-400">
                {Math.round(day.temp_min_c)}°
              </span>
              <span className="w-8 text-right font-semibold tabular-nums">
                {Math.round(day.temp_max_c)}°
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
