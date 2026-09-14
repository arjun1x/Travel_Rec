import { useState, type ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Backpack, Building2, Hotel, House, Star } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { trackInteraction } from '../lib/api'
import type { Listing } from '../types/listing'
import BookingModal from './BookingModal'

const TYPES: Record<string, { icon: ComponentType<{ className?: string }>; label: string }> = {
  hotel: { icon: Hotel, label: 'Hotel' },
  apartment: { icon: Building2, label: 'Apartment' },
  hostel: { icon: Backpack, label: 'Hostel' },
  villa: { icon: House, label: 'Villa' },
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [booking, setBooking] = useState(false)
  const { isAuthed } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const onBook = () => {
    if (!isAuthed) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    trackInteraction(listing.id, 'click')
    setBooking(true)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700">
        {listing.images[0] && !listing.images[0].includes('picsum.photos') && !imageFailed && (
          <img
            src={listing.images[0]}
            alt={listing.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        {(!listing.images[0] || listing.images[0].includes('picsum.photos') || imageFailed) && <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500"><Hotel size={40} strokeWidth={1} /><span className="text-xs">Sample property · photo unavailable</span></div>}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur dark:bg-gray-900/80 dark:text-gray-100">
          {(() => {
            const t = TYPES[listing.type]
            return t ? (
              <>
                <t.icon className="h-3.5 w-3.5" aria-hidden /> {t.label}
              </>
            ) : (
              listing.type
            )
          })()}
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur dark:bg-gray-900/80 dark:text-gray-100">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
          {listing.rating.toFixed(1)}
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
            Try a stay
          </button>
        </div>
      </div>
      {booking && <BookingModal listing={listing} onClose={() => setBooking(false)} />}
    </div>
  )
}
