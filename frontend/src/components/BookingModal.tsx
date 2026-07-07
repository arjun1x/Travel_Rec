import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { PartyPopper } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBooking } from '../lib/api'
import type { Listing } from '../types/listing'

interface Props {
  listing: Listing
  onClose: () => void
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900'

export default function BookingModal({ listing, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const queryClient = useQueryClient()

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
    return Math.max(0, Math.round(diff))
  }, [checkIn, checkOut])

  const mutation = useMutation({
    mutationFn: () =>
      createBooking({ listing_id: listing.id, check_in: checkIn, check_out: checkOut, guests }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Book ${listing.title}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {mutation.isSuccess ? (
          <div className="py-6 text-center">
            <PartyPopper aria-hidden className="mx-auto h-10 w-10 text-sky-500" />
            <h2 className="mt-3 text-xl font-bold tracking-tight">Hold placed!</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {listing.title} · {nights} {nights === 1 ? 'night' : 'nights'} · $
              {Math.round(nights * listing.price_per_night)}. Confirm it from your trips page.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                to="/trips"
                className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
              >
                Go to trips
              </Link>
              <button
                onClick={onClose}
                className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold dark:border-gray-700"
              >
                Keep browsing
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">{listing.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${Math.round(listing.price_per_night)} / night · sleeps {listing.capacity}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                mutation.mutate()
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Check-in</span>
                  <input
                    type="date" required min={today} value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)} className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Check-out</span>
                  <input
                    type="date" required min={checkIn || today} value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)} className={inputClass}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Guests</span>
                <select
                  value={guests}
                  onChange={(e) => setGuests(+e.target.value)}
                  className={inputClass}
                >
                  {Array.from({ length: listing.capacity }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'guest' : 'guests'}
                    </option>
                  ))}
                </select>
              </label>

              {nights > 0 && (
                <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm dark:bg-sky-950/50">
                  {nights} {nights === 1 ? 'night' : 'nights'} ×{' '}
                  ${Math.round(listing.price_per_night)} ={' '}
                  <span className="font-bold">${Math.round(nights * listing.price_per_night)}</span>
                </p>
              )}

              {mutation.isError && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {mutation.error.message}
                </p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || nights === 0}
                className="w-full rounded-full bg-gray-900 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {mutation.isPending ? 'Placing hold…' : 'Place hold — free cancellation'}
              </button>
              <p className="text-center text-xs text-gray-400">
                Simulated booking — no payment required.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
