import { useState } from 'react'
import { Mountain } from 'lucide-react'
import { DESTINATION_PHOTOS } from '../lib/photography'
import type { Destination } from '../types/destination'

export default function DestinationImage({ destination, className = '', priority = false }: { destination: Destination; className?: string; priority?: boolean }) {
  const curated = DESTINATION_PHOTOS[destination.name]
  const supplied = destination.image_url && !destination.image_url.includes('picsum.photos') ? destination.image_url : null
  const source = supplied || curated
  const [failedSource, setFailedSource] = useState<string | null>(null)
  if (source && failedSource !== source) return <img src={source} alt={`${destination.name}, ${destination.country}`}
    loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSource(source)} className={`object-cover ${className}`} />
  return <div role="img" aria-label={`${destination.name}, photograph unavailable`} className={`destination-placeholder ${className}`}>
    <Mountain strokeWidth={0.6} /><span>{destination.name}</span><small>{destination.country}</small>
  </div>
}
