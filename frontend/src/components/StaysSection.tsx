import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getListings } from '../lib/api'
import type { ListingFilters, ListingSort, ListingType } from '../types/listing'
import ListingCard from './ListingCard'

const SHOWN = 6

const selectClass =
  'rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900'

export default function StaysSection({ destinationId }: { destinationId: number }) {
  const [filters, setFilters] = useState<ListingFilters>({ sort: 'rating' })
  const [showAll, setShowAll] = useState(false)

  const { data, isPending } = useQuery({
    queryKey: ['listings', destinationId, filters],
    queryFn: () => getListings(destinationId, filters),
  })

  const items = data?.items ?? []
  const visible = showAll ? items : items.slice(0, SHOWN)

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Places to <span className="text-sky-600 dark:text-sky-400">stay</span>
          {data && (
            <span className="ml-2 align-middle text-sm font-medium text-gray-400">
              {data.total} stays
            </span>
          )}
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Property type"
            className={selectClass}
            value={filters.type ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: (e.target.value || undefined) as ListingType }))
            }
          >
            <option value="">Any type</option>
            <option value="hotel">Hotel</option>
            <option value="apartment">Apartment</option>
            <option value="hostel">Hostel</option>
            <option value="villa">Villa</option>
          </select>
          <select
            aria-label="Guests"
            className={selectClass}
            value={filters.guests ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, guests: e.target.value ? +e.target.value : undefined }))
            }
          >
            <option value="">Any guests</option>
            {[2, 4, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n}+ guests
              </option>
            ))}
          </select>
          <select
            aria-label="Max price"
            className={selectClass}
            value={filters.max_price ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, max_price: e.target.value ? +e.target.value : undefined }))
            }
          >
            <option value="">Any price</option>
            {[100, 200, 400, 800].map((p) => (
              <option key={p} value={p}>
                Under ${p}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort"
            className={selectClass}
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as ListingSort }))}
          >
            <option value="rating">Top rated</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isPending &&
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="aspect-[3/2] animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        {visible.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {!isPending && items.length === 0 && (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          No stays match these filters.
        </p>
      )}

      {items.length > SHOWN && (
        <div className="mt-5 text-center">
          <button
            onClick={() => setShowAll((s) => !s)}
            className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {showAll ? 'Show fewer' : `Show all ${items.length}`}
          </button>
        </div>
      )}
    </section>
  )
}
