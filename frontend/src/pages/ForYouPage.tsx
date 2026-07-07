import { Link, Navigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { getRecommendations, trackInteraction } from '../lib/api'
import { useAuth } from '../lib/auth'
import ListingCard from '../components/ListingCard'

export default function ForYouPage() {
  const { isAuthed } = useAuth()

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => getRecommendations(24),
    enabled: isAuthed,
    staleTime: 60 * 1000,
  })

  if (!isAuthed) return <Navigate to="/login" replace />

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        For <span className="text-sky-600 dark:text-sky-400">you</span>
      </h1>
      <p className="mt-2 max-w-2xl text-gray-500 dark:text-gray-400">
        Stays ranked by your trip styles, budget, and what you've been looking at.
        Tune them on your{' '}
        <Link to="/profile" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400">
          profile
        </Link>
        .
      </p>

      <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {isPending &&
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[3/2] animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        {data?.map(({ listing, destination }) => (
          <div key={listing.id}>
            <Link
              to={`/destinations/${destination.id}`}
              className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-sky-600 dark:text-gray-300 dark:hover:text-sky-400"
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {destination.name},{' '}
              {destination.country}
            </Link>
            <div onClick={() => trackInteraction(listing.id, 'click')}>
              <ListingCard listing={listing} />
            </div>
          </div>
        ))}
      </div>

      {isError && (
        <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error.message}
        </div>
      )}
    </main>
  )
}
