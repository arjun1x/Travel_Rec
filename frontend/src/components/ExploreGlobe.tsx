import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { MousePointerClick } from 'lucide-react'
import { GlobeLive, type GlobeMarker } from '@/components/ui/globe-live'
import type { Destination } from '../types/destination'
import DestinationImage from './DestinationImage'

export default function ExploreGlobe({ destinations }: { destinations: Destination[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = destinations.find((d) => d.id === selectedId) ?? null

  const markers = useMemo<GlobeMarker[]>(
    () =>
      destinations.map((d) => ({
        id: String(d.id),
        location: [d.lat, d.lng] as [number, number],
        size: 0.035 + 0.04 * d.popularity_score,
      })),
    [destinations],
  )
  const labels = useMemo(
    () => new Map(destinations.map((d) => [String(d.id), `${d.name}, ${d.country}`])),
    [destinations],
  )

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="relative mx-auto w-full max-w-sm">
        <div
          aria-hidden
          className="absolute inset-6 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10"
        />
        <GlobeLive
          markers={markers}
          className="relative"
          speed={0.0025}
          showLiveBadge={false}
          onMarkerClick={(id) => setSelectedId(Number(id))}
          getMarkerLabel={(id) => labels.get(id) ?? ''}
        />
      </div>

      {selected ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg">
            <DestinationImage destination={selected} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold tracking-tight">{selected.name}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {selected.country} · {selected.tags.slice(0, 3).join(' · ')}
            </p>
          </div>
          <Link
            to={`/destinations/${selected.id}`}
            className="shrink-0 rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            View
          </Link>
        </div>
      ) : (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400 dark:text-gray-500">
          <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
          Click a dot to preview a destination — drag to spin.
        </p>
      )}
    </div>
  )
}
