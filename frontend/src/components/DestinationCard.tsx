import { Link } from 'react-router'
import { ArrowUpRight, MapPin } from 'lucide-react'
import type { Destination } from '../types/destination'
import DestinationImage from './DestinationImage'
import SaveButton from './SaveButton'

export default function DestinationCard({ destination }: { destination: Destination }) {
  return <article className="destination-card">
    <div className="destination-photo">
      <Link to={`/destinations/${destination.id}`} tabIndex={-1} aria-hidden="true"><DestinationImage destination={destination} className="h-full w-full" /></Link>
      <span className="photo-tag">{destination.tags[0] ?? 'destination'}</span>
      <SaveButton destinationId={destination.id} destinationName={destination.name} />
    </div>
    <div className="destination-copy"><p className="destination-country"><MapPin size={12} />{destination.country}</p>
      <Link to={`/destinations/${destination.id}`} className="destination-title"><h3>{destination.name}</h3><ArrowUpRight size={20} /></Link>
      <p className="destination-description">{destination.description}</p>
      <p className="destination-tags">{destination.tags.slice(0, 3).join(' · ')}</p>
    </div>
  </article>
}
