import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Search, SlidersHorizontal, LayoutGrid, List, Globe2, X, Shuffle, Compass } from 'lucide-react'
import { getDestinations } from '../lib/api'
import { REGIONS, TRIP_STYLES, filterDestinations } from '../lib/discovery'
import CardSkeleton from '../components/CardSkeleton'
import DestinationCard from '../components/DestinationCard'
import { EmptyState, ErrorState } from '../components/QueryState'
const ExploreGlobe = lazy(() => import('../components/ExploreGlobe'))

export default function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [moreFilters, setMoreFilters] = useState(false)
  const [visible, setVisible] = useState(12)
  const q = params.get('q') ?? ''
  const region = params.get('region') ?? ''
  const tags = useMemo(() => params.getAll('tag'), [params])
  const sort = params.get('sort') ?? 'popular'
  const view = ['grid', 'list', 'map'].includes(params.get('view') ?? '') ? params.get('view')! : 'grid'
  const signature = params.toString()
  useEffect(() => { setVisible(12) }, [signature])
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['destinations', 'catalog'], queryFn: () => getDestinations(500) })
  const results = useMemo(() => filterDestinations(data ?? [], { q, region, tags, sort }), [data, q, region, tags, sort])
  const allTags = useMemo(() => [...new Set((data ?? []).flatMap((d) => d.tags))].sort(), [data])
  const update = (key: string, value: string) => setParams((prev) => { const next = new URLSearchParams(prev); if (value) next.set(key, value); else next.delete(key); return next }, { replace: true })
  const toggleTag = (tag: string) => setParams((prev) => {
    const next = new URLSearchParams(prev)
    const selected = prev.getAll('tag'); next.delete('tag')
    ;(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]).forEach((t) => next.append('tag', t))
    return next
  }, { replace: true })
  const clear = () => setParams(view === 'grid' ? {} : { view }, { replace: true })
  const filterCount = tags.length + Number(Boolean(region)) + Number(Boolean(q))

  return <main className="explore-page page-width">
    <div className="explore-heading"><div><span className="eyebrow">LET CURIOSITY LEAD</span><h1>Find your <em>somewhere.</em></h1><p>A city to get lost in. A coast to slow down on. A place you didn’t know you needed.</p></div><button className="button button-light surprise-button" disabled={!results.length} onClick={() => navigate(`/destinations/${results[Math.floor(Math.random() * results.length)].id}`)}><Shuffle size={17} /> Surprise me</button></div>
    <div className="discovery-bar"><label className="discovery-search"><Search size={19} /><input type="search" aria-label="Search destinations" placeholder="Search places, countries, or a feeling…" value={q} onChange={(e) => update('q', e.target.value)} /></label>
      <label className="region-select"><Globe2 size={17} /><select aria-label="Region" value={region} onChange={(e) => update('region', e.target.value)}><option value="">Everywhere</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></label>
      <button className={`filter-toggle ${moreFilters ? 'is-active' : ''}`} aria-expanded={moreFilters} aria-controls="more-filters" onClick={() => setMoreFilters(!moreFilters)}><SlidersHorizontal size={17} /> Filters {filterCount > 0 && <b>{filterCount}</b>}</button>
    </div>
    <div className="filter-chips" aria-label="Travel styles">{TRIP_STYLES.map((style) => <button key={style.value} aria-pressed={style.value ? tags.includes(style.value) : tags.length === 0} className={(style.value ? tags.includes(style.value) : tags.length === 0) ? 'filter-chip active' : 'filter-chip'} onClick={() => style.value ? toggleTag(style.value) : setParams((prev) => { const next = new URLSearchParams(prev); next.delete('tag'); return next }, { replace: true })}>{!style.value && <Compass size={14} />}{style.label}</button>)}</div>
    {moreFilters && <section className="advanced-filters" id="more-filters"><div><h2>Make it a little more you.</h2><p>Pick the interests your destination should have. Every selected interest must match.</p></div><div className="filter-chips">{allTags.map((tag) => <button className={tags.includes(tag) ? 'filter-chip active' : 'filter-chip'} aria-pressed={tags.includes(tag)} key={tag} onClick={() => toggleTag(tag)}>{tag.replaceAll('-', ' ')}</button>)}</div></section>}
    {filterCount > 0 && <div className="active-filters"><span>Looking for:</span>{q && <button onClick={() => update('q', '')}>“{q}” <X size={12} /></button>}{region && <button onClick={() => update('region', '')}>{region} <X size={12} /></button>}{tags.map((t) => <button key={t} onClick={() => toggleTag(t)}>{t} <X size={12} /></button>)}<button className="clear-filters" onClick={clear}>Clear all</button></div>}
    <div className="results-toolbar"><p aria-live="polite">{isPending ? 'Finding your places…' : <><strong>{results.length}</strong> {results.length === 1 ? 'place' : 'places'} to get you going</>}</p><div><label className="sort-select"><span>Sort by</span><select value={sort} aria-label="Sort destinations" onChange={(e) => update('sort', e.target.value)}><option value="popular">Most popular</option><option value="name">Name: A–Z</option><option value="quiet">Less discovered</option></select></label><div className="view-switch" aria-label="Display options">{[{ key: 'grid', label: 'Grid view', Icon: LayoutGrid }, { key: 'list', label: 'List view', Icon: List }, { key: 'map', label: 'Globe view', Icon: Globe2 }].map(({ key, label, Icon }) => <button key={key} aria-label={label} title={label} aria-pressed={view === key} onClick={() => update('view', key)}><Icon size={17} /></button>)}</div></div></div>
    {isError ? <ErrorState onRetry={() => void refetch()} /> : <div className={`explore-results ${view === 'map' ? 'with-map' : ''}`}>
      <div><div className={`destination-grid ${view === 'list' ? 'list-layout' : ''}`}>{isPending ? Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />) : results.slice(0, visible).map((d) => <DestinationCard key={d.id} destination={d} />)}</div>
        {!isPending && results.length === 0 && <EmptyState title="A little too far off the map." description="Try a different place or loosen a filter. There’s still plenty to discover." action={<button onClick={clear} className="button button-primary">Reset filters <ArrowUpRight size={16} /></button>} />}
        {results.length > visible && <div className="show-more"><button className="button button-light" onClick={() => setVisible((n) => n + 12)}>Show more places <ArrowUpRight size={17} /></button><span>{visible} of {results.length} destinations</span></div>}
      </div>
      {view === 'map' && <aside className="globe-aside"><Suspense fallback={<div className="map-loading">Opening the globe…</div>}><ExploreGlobe destinations={results} /></Suspense></aside>}
    </div>}
  </main>
}
