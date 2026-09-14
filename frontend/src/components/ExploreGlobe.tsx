import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Globe2 } from 'lucide-react'
import { GlobeLive, type GlobeMarker } from './ui/globe-live'
import type { Destination } from '../types/destination'
import DestinationImage from './DestinationImage'

export default function ExploreGlobe({ destinations }: { destinations: Destination[] }) {
  const [selectedId, setSelectedId] = useState('')
  const selected = destinations.find((d) => String(d.id) === selectedId) ?? null
  const markers = useMemo<GlobeMarker[]>(() => destinations.map((d) => ({ id: String(d.id), location: [d.lat, d.lng], size: 0.045 })), [destinations])
  const labels = useMemo(() => new Map(destinations.map((d) => [String(d.id), `${d.name}, ${d.country}`])), [destinations])
  return <div className="rounded-xl border border-gray-200 bg-[#edeee3] p-6">
    <span className="eyebrow flex items-center gap-2"><Globe2 size={13} /> A WORLD OF POSSIBILITIES</span>
    <div className="mx-auto mt-4 max-w-sm"><GlobeLive markers={markers} speed={0.0015} onMarkerClick={setSelectedId} getMarkerLabel={(id) => labels.get(id) ?? ''} /></div>
    <p className="mt-4 mb-4 text-center text-[11px] text-gray-500">Drag to explore. Choose a place below to take a closer look.</p>
    <label className="block text-[10px] font-medium text-gray-600">Choose a destination<select className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-xs" value={selected?.id ?? ''} onChange={(e) => setSelectedId(e.target.value)}><option value="">Find a point on your map</option>{destinations.map((d) => <option key={d.id} value={d.id}>{d.name}, {d.country}</option>)}</select></label>
    {selected && <Link to={`/destinations/${selected.id}`} className="mt-4 flex items-center gap-3 rounded-lg bg-white p-3"><div className="h-14 w-16 overflow-hidden rounded-md"><DestinationImage destination={selected} className="h-full w-full" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{selected.name}</p><p className="text-[10px] text-gray-500">{selected.country}</p></div><ArrowUpRight size={16} /></Link>}
  </div>
}
