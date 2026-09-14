import { useState } from 'react'
import { Link } from 'react-router'
import { Download, ArrowUpRight, Columns3 } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { getDestination } from '../lib/api'
import { useShortlist } from '../lib/shortlist'
import CardSkeleton from '../components/CardSkeleton'
import DestinationCard from '../components/DestinationCard'
import { EmptyState, ErrorState } from '../components/QueryState'
import Modal from '../components/Modal'

export default function SavedPage() {
  const { ids } = useShortlist()
  const [selected, setSelected] = useState<number[]>([])
  const [compare, setCompare] = useState(false)
  const queries = useQueries({ queries: ids.map((id) => ({ queryKey: ['destination', String(id)], queryFn: () => getDestination(id) })) })
  const loading = queries.some((q) => q.isPending)
  const failed = queries.filter((q) => q.isError)
  const destinations = queries.flatMap((q) => q.data ? [q.data] : [])
  const comparison = destinations.filter((d) => selected.includes(d.id))
  const exportSaved = () => {
    const blob = new Blob([JSON.stringify({ title: 'My Travel Rec shortlist', places: destinations.map(({ name, country, tags, description }) => ({ name, country, tags, description })) }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'my-travel-shortlist.json'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <main className="saved-page page-width"><div className="saved-heading"><div className="page-intro"><span className="eyebrow">YOUR “ONE DAY” LIST</span><h1>Keep a little <em>wanderlust.</em></h1><p>Your favorite places, saved in this browser. No account needed.</p></div>{destinations.length > 0 && <div className="saved-actions"><button className="button button-light" onClick={exportSaved} disabled={loading || failed.length > 0}><Download size={15} />Export list</button><button className="button button-dark" disabled={comparison.length < 2} onClick={() => setCompare(true)}><Columns3 size={15} />Compare ({comparison.length}/3)</button></div>}</div>
    {!ids.length ? <EmptyState title="Your next trip starts with a little curiosity." description="Tap the heart on a destination to keep it here. Come back whenever you’re ready to turn that idea into a trip." action={<Link to="/explore" className="button button-primary">Find a place to love <ArrowUpRight size={16} /></Link>} /> : <>
      {failed.length > 0 && <div className="mb-6"><ErrorState title="Some saved places couldn’t be loaded." onRetry={() => failed.forEach((q) => void q.refetch())} /></div>}
      <div className="destination-grid">{loading && destinations.length === 0 ? Array.from({ length: Math.min(ids.length,4) }, (_, i) => <CardSkeleton key={i} />) : destinations.map((d) => <div key={d.id}><DestinationCard destination={d} /><label className="saved-select"><input type="checkbox" checked={selected.includes(d.id)} disabled={!selected.includes(d.id) && comparison.length >= 3} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev.filter((id) => ids.includes(id)), d.id] : prev.filter((id) => id !== d.id))} />Compare {d.name}</label></div>)}</div>
    </>}
    {compare && <Modal title="Which place feels like you?" onClose={() => setCompare(false)}><div className="overflow-x-auto"><table className="comparison-table"><thead><tr><th scope="col">At a glance</th>{comparison.map((d) => <th scope="col" key={d.id}>{d.name}</th>)}</tr></thead><tbody><tr><th scope="row">Country</th>{comparison.map((d) => <td key={d.id}>{d.country}</td>)}</tr><tr><th scope="row">Good for</th>{comparison.map((d) => <td key={d.id}>{d.tags.join(', ')}</td>)}</tr><tr><th scope="row">The feeling</th>{comparison.map((d) => <td key={d.id}>{d.description}</td>)}</tr><tr><th scope="row">Take a look</th>{comparison.map((d) => <td key={d.id}><Link to={`/destinations/${d.id}`}>Explore {d.name}</Link></td>)}</tr></tbody></table></div></Modal>}
  </main>
}
