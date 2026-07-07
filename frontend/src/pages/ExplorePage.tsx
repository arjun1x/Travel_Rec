import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDestinations, searchDestinations } from '../lib/api'
import CardSkeleton from '../components/CardSkeleton'
import DestinationCard from '../components/DestinationCard'

export default function ExplorePage() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handle = setTimeout(() => setQuery(input.trim()), 300)
    return () => clearTimeout(handle)
  }, [input])

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['destinations', query],
    queryFn: () => (query ? searchDestinations(query) : getDestinations()),
  })

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of data ?? []) {
      for (const t of d.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 10)
  }, [data])

  const results = useMemo(() => {
    if (!data) return []
    if (activeTags.size === 0) return data
    return data.filter((d) => [...activeTags].every((t) => d.tags.includes(t)))
  }, [data, activeTags])

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Explore <span className="text-sky-600 dark:text-sky-400">destinations</span>
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Search by name, country, or vibe — live weather on every card.
      </p>

      <div className="relative mt-6 max-w-xl">
        <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try “Kyoto”, “Portugal”, or “mountains”…"
          aria-label="Search destinations"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-sky-900"
        />
      </div>

      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const active = activeTags.has(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium shadow-sm ring-1 transition ${
                  active
                    ? 'bg-sky-600 text-white ring-sky-600'
                    : 'bg-white text-gray-700 ring-gray-200 hover:bg-sky-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="text-xl font-bold tracking-tight">
          {query ? `Results for “${query}”` : 'All destinations'}
        </h2>
        {!isPending && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {results.length} {results.length === 1 ? 'place' : 'places'}
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isPending && Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
        {!isPending && results.map((d) => <DestinationCard key={d.id} destination={d} />)}
      </div>

      {isError && (
        <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Could not load destinations: {error.message}
        </div>
      )}
      {!isPending && !isError && results.length === 0 && (
        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-3xl" aria-hidden>🧳</p>
          <p className="mt-2 font-medium">No destinations match</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try a different search{activeTags.size > 0 && ' or clear the tag filters'}.
          </p>
        </div>
      )}
    </main>
  )
}
