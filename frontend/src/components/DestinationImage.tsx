import { useState } from 'react'
import { emojiFor, gradientFor } from '../lib/visuals'
import type { Destination } from '../types/destination'

interface Props {
  destination: Destination
  className?: string
}

export default function DestinationImage({ destination, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const showImage = destination.image_url && !failed

  if (showImage) {
    return (
      <img
        src={destination.image_url!}
        alt={`${destination.name}, ${destination.country}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    )
  }

  return (
    <div
      aria-hidden
      className={`flex items-center justify-center bg-gradient-to-br ${gradientFor(destination.name)} ${className}`}
    >
      <span className="text-5xl drop-shadow-sm">{emojiFor(destination.tags)}</span>
    </div>
  )
}
