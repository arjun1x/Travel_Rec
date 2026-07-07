import { Link } from 'react-router'
import { Heart } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { getDestination } from '../lib/api'
import { useShortlist } from '../lib/shortlist'
import CardSkeleton from '../components/CardSkeleton'
import DestinationCard from '../components/DestinationCard'

export default function SavedPage() {
  const { ids } = useShortlist()

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['destination', String(id)],
      queryFn: () => getDestination(id),
    })),
  })

  const loading = queries.some((q) => q.isPending)
  const destinations = queries.flatMap((q) => (q.data ? [q.data] : []))

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Saved <span className="text-sky-600 dark:text-sky-400">trips</span>
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Your shortlist, kept in this browser — tap the heart on any destination to add it.
      </p>

      {ids.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-gray-300 bg-white p-14 text-center dark:border-gray-700 dark:bg-gray-900">
          <Heart aria-hidden className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <h2 className="mt-3 text-xl font-bold">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Browse destinations and tap the heart to build your shortlist.
          </p>
          <Link
            to="/explore"
            className="mt-6 inline-block rounded-full bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Explore destinations
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: ids.length }, (_, i) => <CardSkeleton key={i} />)}
          {!loading && destinations.map((d) => <DestinationCard key={d.id} destination={d} />)}
        </div>
      )}
    </main>
  )
}
