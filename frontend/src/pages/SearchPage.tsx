import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDestinations, searchDestinations } from '../lib/api'
import type { Destination } from '../types/destination'

function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{destination.name}</h2>
        <span className="text-sm text-gray-500">{destination.country}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{destination.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {destination.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SearchPage() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handle = setTimeout(() => setQuery(input.trim()), 300)
    return () => clearTimeout(handle)
  }, [input])

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['destinations', query],
    queryFn: () => (query ? searchDestinations(query) : getDestinations()),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Where to next?</h1>
        <p className="mt-1 text-gray-500">Search destinations by name, country, or vibe.</p>

        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try “Kyoto”, “Portugal”, or “mountains”…"
          className="mt-6 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />

        <div className="mt-8 space-y-4">
          {isPending && <p className="text-gray-500">Loading destinations…</p>}
          {isError && (
            <p className="text-red-600">Could not load destinations: {error.message}</p>
          )}
          {data && data.length === 0 && (
            <p className="text-gray-500">No destinations match “{query}”.</p>
          )}
          {data?.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      </main>
    </div>
  )
}
