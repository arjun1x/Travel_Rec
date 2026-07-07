import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router'
import { Map as MapIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getDestination } from '../lib/api'
import DestinationImage from '../components/DestinationImage'
import ItineraryBuilder from '../components/ItineraryBuilder'
import SaveButton from '../components/SaveButton'
import SimilarRail from '../components/SimilarRail'
import StaysSection from '../components/StaysSection'
import WeatherPanel from '../components/WeatherPanel'

// Leaflet is heavy — load the map chunk only when a detail page renders
const DestinationMap = lazy(() => import('../components/DestinationMap'))

export default function DestinationPage() {
  const { id } = useParams<{ id: string }>()

  const { data: destination, isPending, isError } = useQuery({
    queryKey: ['destination', id],
    queryFn: () => getDestination(id!),
    enabled: id != null,
  })

  if (isPending) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-72 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800 sm:h-96" />
        <div className="mt-6 h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </main>
    )
  }

  if (isError || !destination) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <MapIcon aria-hidden className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
        <h1 className="mt-3 text-2xl font-bold">Destination not found</h1>
        <Link
          to="/"
          className="mt-4 inline-block rounded-full bg-sky-600 px-5 py-2 font-medium text-white hover:bg-sky-700"
        >
          ← Back to explore
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
      >
        ← Back to explore
      </Link>

      {/* Hero */}
      <div className="relative mt-4 overflow-hidden rounded-3xl">
        <DestinationImage destination={destination} className="h-72 w-full sm:h-96" />
        <div className="absolute right-4 top-4">
          <SaveButton destinationId={destination.id} size="lg" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {destination.name}
          </h1>
          <p className="mt-1 font-medium text-gray-200">{destination.country}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left: description, tags, map */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {destination.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-5 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            {destination.description}
          </p>

          <h2 className="mt-8 text-xl font-bold tracking-tight">On the map</h2>
          <div className="mt-3">
            <Suspense
              fallback={
                <div className="h-72 w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
              }
            >
              <DestinationMap
                name={destination.name}
                lat={destination.lat}
                lng={destination.lng}
              />
            </Suspense>
          </div>

        </div>

        {/* Right: weather */}
        <aside>
          <WeatherPanel destinationId={destination.id} />
        </aside>
      </div>

      <ItineraryBuilder destination={destination} />

      <StaysSection destinationId={destination.id} />

      <SimilarRail destinationId={destination.id} />
    </main>
  )
}
