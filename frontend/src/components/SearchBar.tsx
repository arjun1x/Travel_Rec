import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowUpRight, MapPin, Compass, Globe2 } from 'lucide-react'
import { REGIONS, TRIP_STYLES } from '../lib/discovery'

export default function SearchBar() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('')
  const [tag, setTag] = useState('')
  return <form className="hero-search" onSubmit={(event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (region) params.set('region', region)
    if (tag) params.set('tag', tag)
    navigate(`/explore?${params}`)
  }}>
    <label className="search-field"><MapPin size={19} /><span><strong>Where to?</strong><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Somewhere new…" aria-label="Search a place or country" /></span></label>
    <label className="search-field"><Globe2 size={19} /><span><strong>Your corner of the world</strong><select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Choose a region"><option value="">Anywhere sounds good</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></span></label>
    <label className="search-field"><Compass size={19} /><span><strong>What’s the mood?</strong><select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Choose a travel style">{TRIP_STYLES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></span></label>
    <button className="button button-primary" type="submit">Find my next trip <ArrowUpRight size={18} /></button>
  </form>
}
