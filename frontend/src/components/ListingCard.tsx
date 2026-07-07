import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { trackInteraction } from '../lib/api'
import type { Listing } from '../types/listing'
import BookingModal from './BookingModal'

const TYPE_LABELS: Record<string, string> = {
  hotel: '🏨 Hotel',
  apartment: '🏢 Apartment',
  hostel: '🎒 Hostel',
  villa: '🏡 Villa',
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [booking, setBooking] = useState(false)
  const { isAuthed } = useAuth()
  const navigate = useNavigate()

  const onBook = () => {
    if (!isAuthed) {
      navigate('/login')
      return
    }
    trackInteraction(listing.id, 'click')
    setBooking(true)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700">
        {listing.images[0] && !imageFailed && (
          <img
            src={listing.images[0]}
            alt={listing.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur dark:bg-gray-900/80 dark:text-gray-100">
          {TYPE_LABELS[listing.type] ?? listing.type}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur dark:bg-gray-900/80 dark:text-gray-100">
          ★ {listing.rating.toFixed(1)}
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-semibold tracking-tight" title={listing.title}>
          {listing.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sleeps {listing.capacity} · {listing.amenities.slice(0, 3).join(' · ')}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p>
            <span className="text-lg font-bold">${Math.round(listing.price_per_night)}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400"> / night</span>
          </p>
          <button
            onClick={onBook}
            className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Book
          </button>
        </div>
      </div>
      {booking && <BookingModal listing={listing} onClose={() => setBooking(false)} />}
    </div>
  )
}
