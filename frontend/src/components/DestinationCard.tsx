import { Link } from 'react-router'
import type { Destination } from '../types/destination'
import DestinationImage from './DestinationImage'
import WeatherBadge from './WeatherBadge'

export default function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link
      to={`/destinations/${destination.id}`}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <DestinationImage
          destination={destination}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3">
          <WeatherBadge destinationId={destination.id} />
        </div>
        {destination.popularity_score >= 0.85 && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400/95 px-2.5 py-1 text-xs font-semibold text-amber-950 shadow-sm">
            ★ Trending
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            {destination.name}
          </h2>
          <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
            {destination.country}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {destination.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {destination.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
