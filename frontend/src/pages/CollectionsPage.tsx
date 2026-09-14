import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'

const collections = [
  { title: 'The art of doing nothing.', label: 'COASTAL ESCAPES', text: 'Warm sea air, a good book, and nowhere else to be.', image: 'santorini', query: 'tag=beach' },
  { title: 'Take the long way round.', label: 'WILD & WIDE OPEN', text: 'Waterfalls, walking trails, and a much bigger sky.', image: 'iceland', query: 'tag=nature' },
  { title: 'One more little side street.', label: 'CITIES WITH STORIES', text: 'Neighborhood cafés, old bookstores, and getting happily lost.', image: 'paris', query: 'tag=city' },
  { title: 'Follow your appetite.', label: 'FOOD WORTH A FLIGHT', text: 'From late-night noodle counters to slow, long lunches.', image: 'tokyo', query: 'tag=food' },
  { title: 'A different kind of perspective.', label: 'CULTURE & CONNECTION', text: 'Living traditions, quiet temples, and something new to learn.', image: 'kyoto', query: 'tag=culture' },
  { title: 'Make a little time for two.', label: 'JUST YOU TWO', text: 'Unhurried mornings and a view you’ll talk about for years.', image: 'bali', query: 'tag=romance' },
]
export default function CollectionsPage() {
  return <main className="collections-page page-width"><div className="page-intro"><span className="eyebrow">A PLACE FOR EVERY MOOD</span><h1>Follow <em>a feeling.</em></h1><p>You don’t always need a destination in mind. Sometimes, you just know how you want to feel.</p></div>
    <div className="collections-full">{collections.map((c) => <Link to={`/explore?${c.query}`} className="collection-card" key={c.query}><img src={`/images/${c.image}.jpg`} alt={c.label.toLowerCase()} loading="lazy" /><div><span>{c.label}</span><h2>{c.title}</h2><p>{c.text}</p><span className="collection-cta">Find your escape <ArrowUpRight size={19} /></span></div></Link>)}</div>
  </main>
}
