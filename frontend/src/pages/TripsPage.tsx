import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { ChevronDown, Luggage, Sparkles } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBookings, getDestination, getItineraries, transitionBooking } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { BookingDetail, BookingStatus } from '../types/booking'
import type { Itinerary } from '../types/itinerary'
import DestinationImage from '../components/DestinationImage'
import ItineraryView from '../components/ItineraryView'
import { ErrorState } from '../components/QueryState'

const STATUS_STYLES: Record<BookingStatus, string> = {
  held: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function TripRow({ booking }: { booking: BookingDetail }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (action: 'confirm' | 'cancel') => transitionBooking(booking.id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-gray-800 dark:bg-gray-900">
      <Link
        to={`/destinations/${booking.destination.id}`}
        className="block h-24 w-full shrink-0 overflow-hidden rounded-xl sm:w-36"
      >
        <DestinationImage destination={booking.destination} className="h-full w-full" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold tracking-tight">{booking.listing.title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {booking.destination.name}, {booking.destination.country}
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {formatDate(booking.check_in)} → {formatDate(booking.check_out)} · {booking.guests}{' '}
          {booking.guests === 1 ? 'guest' : 'guests'} ·{' '}
          <span className="font-semibold">${Math.round(booking.total_price)}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[booking.status]}`}
        >
          {booking.status}
        </span>
        {booking.status === 'held' && (
          <button
            onClick={() => mutation.mutate('confirm')}
            disabled={mutation.isPending}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Confirm
          </button>
        )}
        {booking.status !== 'cancelled' && (
          <button
            onClick={() => mutation.mutate('cancel')}
            disabled={mutation.isPending}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        )}
      </div>
      {mutation.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">{mutation.error.message}</p>
      )}
    </div>
  )
}

function ItineraryRow({ itinerary }: { itinerary: Itinerary }) {
  const [expanded, setExpanded] = useState(false)
  const { data: destination } = useQuery({
    queryKey: ['destination', String(itinerary.destination_id)],
    queryFn: () => getDestination(itinerary.destination_id),
  })

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-sky-500" aria-hidden />
          <div>
            <p className="font-semibold tracking-tight">
              {destination ? `${destination.name}, ${destination.country}` : 'Itinerary'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {itinerary.start_date} → {itinerary.end_date} ·{' '}
              {itinerary.days.days?.length ?? 0} days
              {itinerary.budget_total != null && ` · ~$${Math.round(itinerary.budget_total)}`}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {expanded && (
        <div className="mt-4">
          <ItineraryView plan={itinerary.days} />
        </div>
      )}
    </div>
  )
}

export default function TripsPage() {
  const { isAuthed, user } = useAuth()
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: getBookings,
    enabled: isAuthed,
  })
  const { data: itineraries, isPending: plansPending, isError: plansError, refetch: retryPlans } = useQuery({
    queryKey: ['itineraries', user?.id],
    queryFn: getItineraries,
    enabled: isAuthed,
  })

  if (!isAuthed) return <Navigate to="/login" state={{ from: "/trips" }} replace />

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Your <span className="text-sky-600 dark:text-sky-400">trips</span>
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Your day-by-day plans and simulated stay reservations, all in one place.
      </p>

      <div className="mt-8 space-y-4">
        {isPending &&
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        {data?.map((booking) => <TripRow key={booking.id} booking={booking} />)}
      </div>

      {isError && <ErrorState title="We couldn’t load your stays." onRetry={() => void refetch()} />}
      {plansError && <ErrorState title="We couldn’t load your itineraries." onRetry={() => void retryPlans()} />}
      {plansPending && <p className="mt-6 text-sm text-gray-500" role="status">Loading your itineraries…</p>}
      {itineraries && itineraries.length > 0 && (
        <>
          <h2 className="mt-12 flex items-center gap-2 text-xl font-bold tracking-tight">
            <Sparkles className="h-5 w-5 text-sky-500" aria-hidden />
            AI itineraries
          </h2>
          <div className="mt-4 space-y-4">
            {itineraries.map((itinerary) => (
              <ItineraryRow key={itinerary.id} itinerary={itinerary} />
            ))}
          </div>
        </>
      )}

      {data && data.length === 0 && !plansPending && !plansError && !itineraries?.length && (
        <div className="mt-12 rounded-3xl border border-dashed border-gray-300 bg-white p-14 text-center dark:border-gray-700 dark:bg-gray-900">
          <Luggage aria-hidden className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <h2 className="mt-3 text-xl font-bold">No trips yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Find a stay you love and place a hold — free cancellation, no payment.
          </p>
          <Link
            to="/explore"
            className="mt-6 inline-block rounded-full bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Explore destinations
          </Link>
        </div>
      )}
    </main>
  )
}
