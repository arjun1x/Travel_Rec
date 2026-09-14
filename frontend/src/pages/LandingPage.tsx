import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, Compass, Waves, Mountain, Building2, Utensils, TreePine, Landmark, Heart, MapPin, Bookmark, Route } from 'lucide-react'
import { getDestinations } from '../lib/api'
import { TRIP_STYLES } from '../lib/discovery'
import DestinationCard from '../components/DestinationCard'
import CardSkeleton from '../components/CardSkeleton'
import SearchBar from '../components/SearchBar'
import BrandMark from '../components/BrandMark'
import { ErrorState } from '../components/QueryState'
const BrandSculpture = lazy(() => import('../components/BrandSculpture'))
const icons = [Compass, Waves, Mountain, Building2, Utensils, TreePine, Landmark, Heart]
const featuredNames = ['Kyoto', 'Bali', 'Paris', 'Reykjavik']

function DeferredCompass() {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } }, { rootMargin: '180px' })
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={host} className="compass-observer">{visible ? <Suspense fallback={<BrandMark className="sculpture-fallback" />}><BrandSculpture /></Suspense> : <BrandMark className="sculpture-fallback" />}</div>
}

export default function LandingPage() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['destinations', 'catalog'], queryFn: () => getDestinations(100) })
  const picks = data ? featuredNames.flatMap((name) => { const d = data.find((d) => d.name === name); return d ? [d] : [] }) : []
  const featured = picks.length ? picks : (data ?? []).slice(0, 4)
  return <main className="landing-page">
    <section className="hero-wrap page-width" aria-labelledby="hero-title">
      <div className="travel-hero">
        <img src="/images/italian-coast.jpg" alt="Colorful houses overlooking the sea in Manarola, on the Italian Riviera" className="hero-image" fetchPriority="high" />
        <div className="hero-shade" />
        <div className="hero-copy"><span className="eyebrow light"><span className="small-dash" /> TAKE THE SCENIC ROUTE</span>
          <h1 id="hero-title">Less planning.<br />More <em>being there.</em></h1>
          <p>Little-known corners. Big, wide-open moments.<br className="desktop-break" /> Find a place that feels like you, and make it a trip.</p>
          <Link to="/explore" className="hero-text-link">Let’s find your somewhere <ArrowUpRight size={19} /></Link>
        </div>
        <div className="hero-seal" aria-hidden="true"><BrandMark /><span>GO A LITTLE<br />FURTHER</span></div>
        <Link to="/explore?region=Europe&tag=beach" className="hero-location"><MapPin size={17} /><span>The Italian Riviera<small>A slower kind of escape</small></span><ArrowUpRight size={17} /></Link>
        <div className="hero-edition">THE WORLD IS STILL FULL OF FIRSTS.</div>
      </div>
      <SearchBar />
    </section>

    <section className="trip-moods page-width" aria-label="Browse by travel style"><p>YOUR TRIP. YOUR TEMPO.</p><div className="mood-rail">{TRIP_STYLES.map((style, i) => {
      const Icon = icons[i]
      return <Link key={style.value} to={style.value ? `/explore?tag=${style.value}` : '/explore'} className={i === 0 ? 'mood-link selected' : 'mood-link'}><Icon strokeWidth={1.5} size={22} /><span>{style.label}</span></Link>
    })}</div></section>

    <section className="featured-section page-width"><div className="section-heading"><div><span className="eyebrow">A GOOD PLACE TO START</span><h2>Some places just <em>stay with you.</em></h2><p>A few favorites for your ever-growing “one day” list.</p></div><Link className="text-link" to="/explore">All destinations <ArrowUpRight size={17} /></Link></div>
      {isError ? <ErrorState onRetry={() => void refetch()} /> : <div className="destination-grid">{isPending ? Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />) : featured.map((d) => <DestinationCard key={d.id} destination={d} />)}</div>}
    </section>

    <section className="collection-section page-width"><div className="section-heading"><div><span className="eyebrow">FOLLOW A FEELING</span><h2>There’s more than one way <em>to get away.</em></h2></div><Link className="text-link" to="/collections">Explore collections <ArrowUpRight size={17} /></Link></div>
      <div className="collection-grid"><Link to="/explore?tag=beach" className="collection-card collection-wide"><img src="/images/santorini.jpg" alt="Sunlit white buildings above the Aegean Sea in Santorini" loading="lazy" /><div><span>NO ALARM REQUIRED</span><h3>Salt in the air.<br />Nothing on the agenda.</h3><p>Find your coastal escape <ArrowUpRight size={18} /></p></div></Link>
      <Link to="/explore?tag=nature" className="collection-card"><img src="/images/iceland.jpg" alt="Icelandic waterfall in a green valley" loading="lazy" /><div><span>A BREATH OF FRESH AIR</span><h3>Less screen time.<br />More sky.</h3><p>Head outside <ArrowUpRight size={18} /></p></div></Link></div>
    </section>

    <section className="trip-note page-width"><div className="note-art"><span className="note-overline">A LITTLE DIRECTION GOES A LONG WAY</span><DeferredCompass /><span className="note-signature">Find your own north.</span></div>
      <div className="note-copy"><span className="eyebrow">FROM “WHAT IF” TO “WE’RE GOING”</span><h2>A trip that feels like you.<br /><em>Down to the little things.</em></h2><p>Start with a feeling. Save the places that catch your eye. Then bring it together with stays, weather, and a day-by-day plan shaped around you.</p>
      <div className="note-steps"><div><Bookmark size={19} /><span>Keep your favorites in one place</span></div><div><Compass size={19} /><span>Choose your interests and your pace</span></div><div><Route size={19} /><span>Build a plan around your dates and budget</span></div></div><Link to="/explore" className="button button-dark">Make room for your next trip <ArrowUpRight size={18} /></Link></div>
    </section>
    <section className="closing-line page-width"><span>A CHANGE OF SCENERY CAN CHANGE A LOT.</span><Link to="/explore">Where will you go next? <ArrowRight /></Link></section>
  </main>
}
