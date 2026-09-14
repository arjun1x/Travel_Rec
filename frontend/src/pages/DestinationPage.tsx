import { lazy, Suspense, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowUpRight, Share2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getDestination } from '../lib/api'
import DestinationImage from '../components/DestinationImage'
import ItineraryBuilder from '../components/ItineraryBuilder'
import SaveButton from '../components/SaveButton'
import SimilarRail from '../components/SimilarRail'
import StaysSection from '../components/StaysSection'
import WeatherPanel from '../components/WeatherPanel'
import { ErrorState } from '../components/QueryState'
const DestinationMap = lazy(() => import('../components/DestinationMap'))

export default function DestinationPage() {
  const { id } = useParams<{ id: string }>()
  const [shareStatus, setShareStatus] = useState('')
  const { data: destination, isPending, isError, refetch } = useQuery({ queryKey: ['destination', id], queryFn: () => getDestination(id!), enabled: id != null })
  if (isPending) return <main className="page-width py-10" aria-label="Loading destination"><div className="h-96 animate-pulse rounded-xl bg-gray-200" /><div className="mt-8 h-12 w-1/2 animate-pulse bg-gray-200" /></main>
  if (isError || !destination) return <main className="page-width py-16"><ErrorState title="This destination isn’t available right now." onRetry={() => void refetch()} /><Link to="/explore" className="text-link mt-5">Back to explore <ArrowUpRight size={16} /></Link></main>
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareStatus('Link copied')
    } catch { setShareStatus('Copy the address from your browser to share this place.') }
  }
  return <main className="detail-page page-width">
    <div className="detail-breadcrumb"><Link to="/explore" className="flex items-center gap-2"><ArrowLeft size={13} />Explore</Link><span>/</span><Link to={`/explore?q=${encodeURIComponent(destination.country)}`}>{destination.country}</Link><span>/</span><span>{destination.name}</span></div>
    <div className="detail-title-row"><div><h1>{destination.name}<span className="text-sky-600">.</span></h1><p>{destination.country} · Your next change of scenery</p></div><div><button className="button button-light" onClick={() => void share()}><Share2 size={15} />Share</button><SaveButton destinationId={destination.id} destinationName={destination.name} size="lg" /></div></div>
    {shareStatus && <p className="text-xs text-gray-500 mb-4" role="status">{shareStatus}</p>}
    <div className="detail-hero"><DestinationImage destination={destination} priority className="h-full w-full" /></div>
    <nav className="detail-nav" aria-label="Destination sections"><a href="#overview">The place</a><a href="#itinerary">Plan your days</a><a href="#stays">Places to stay</a><a href="#location">On the map</a></nav>
    <div className="detail-content" id="overview"><section><span className="eyebrow mb-4">A LITTLE TASTE OF BEING HERE</span><p className="detail-description">{destination.description}</p><div className="detail-interest-links">{destination.tags.map((tag) => <Link key={tag} to={`/explore?tag=${encodeURIComponent(tag)}`} className="filter-chip">{tag.replaceAll('-', ' ')} <ArrowUpRight size={12} /></Link>)}</div><h2 id="location" className="detail-subheading">Get your bearings.</h2><Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-gray-200" />}><DestinationMap name={destination.name} lat={destination.lat} lng={destination.lng} /></Suspense></section><aside><WeatherPanel destinationId={destination.id} /></aside></div>
    <div id="itinerary"><ItineraryBuilder key={destination.id} destination={destination} /></div>
    <div id="stays"><StaysSection key={destination.id} destinationId={destination.id} /></div>
    <SimilarRail destinationId={destination.id} />
  </main>
}
