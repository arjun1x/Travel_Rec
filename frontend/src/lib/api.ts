import type { Booking, BookingDetail } from '../types/booking'
import type { Destination, Weather } from '../types/destination'
import type { Itinerary } from '../types/itinerary'
import type { Listing, ListingFilters, ListingsPage } from '../types/listing'
import { authFetch } from './auth'
import { DEMO_MODE } from './config'
import { demoDestinations } from './demo-data'
import { filterDestinations } from './discovery'

export interface RecommendationItem {
  listing: Listing
  destination: Destination
  score: number
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

export function getDestinations(limit = 20): Promise<Destination[]> {
  if (DEMO_MODE) return Promise.resolve(demoDestinations.slice(0, limit))
  return fetchJson(`/api/destinations?limit=${limit}`)
}

export function searchDestinations(q: string, limit = 20): Promise<Destination[]> {
  if (DEMO_MODE) return Promise.resolve(filterDestinations(demoDestinations, { q, region: '', tags: [], sort: 'popular' }).slice(0, limit))
  return fetchJson(`/api/destinations/search?q=${encodeURIComponent(q)}&limit=${limit}`)
}

export function getDestination(id: number | string): Promise<Destination> {
  if (DEMO_MODE) {
    const destination = demoDestinations.find((d) => d.id === Number(id))
    return destination ? Promise.resolve(destination) : Promise.reject(new Error('Destination not found'))
  }
  return fetchJson(`/api/destinations/${id}`)
}

export function getWeather(id: number | string): Promise<Weather> {
  if (DEMO_MODE) return Promise.reject(new Error('Live weather is not available in preview mode.'))
  return fetchJson(`/api/destinations/${id}/weather`)
}

export function getSimilar(id: number | string, limit = 4): Promise<Destination[]> {
  if (DEMO_MODE) {
    const source = demoDestinations.find((d) => d.id === Number(id))
    return Promise.resolve(demoDestinations.filter((d) => d.id !== Number(id))
      .sort((a, b) => b.tags.filter((t) => source?.tags.includes(t)).length - a.tags.filter((t) => source?.tags.includes(t)).length).slice(0, limit))
  }
  return fetchJson(`/api/destinations/${id}/similar?limit=${limit}`)
}

export function getListings(
  destinationId: number,
  filters: ListingFilters = {},
  limit = 60,
): Promise<ListingsPage> {
  if (DEMO_MODE) return Promise.resolve({ items: [], total: 0 })
  const params = new URLSearchParams({ destination_id: String(destinationId), limit: String(limit) })
  if (filters.type) params.set('type', filters.type)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.guests) params.set('guests', String(filters.guests))
  if (filters.min_price != null) params.set('min_price', String(filters.min_price))
  filters.amenities?.forEach((amenity) => params.append('amenities', amenity))
  if (filters.max_price) params.set('max_price', String(filters.max_price))
  return fetchJson(`/api/listings?${params}`)
}

export async function getRecommendations(limit = 20): Promise<RecommendationItem[]> {
  const res = await authFetch(`/api/recommendations?limit=${limit}`)
  if (!res.ok) throw new Error(`Could not load recommendations (${res.status})`)
  const data = await res.json()
  return data.items
}

export async function createBooking(input: {
  listing_id: number
  check_in: string
  check_out: string
  guests: number
}): Promise<Booking> {
  const res = await authFetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `Could not create booking (${res.status})`)
  }
  return res.json()
}

export async function getBookings(): Promise<BookingDetail[]> {
  const res = await authFetch('/api/bookings')
  if (!res.ok) throw new Error(`Could not load trips (${res.status})`)
  return res.json()
}

export async function transitionBooking(id: number, action: 'confirm' | 'cancel'): Promise<Booking> {
  const res = await authFetch(`/api/bookings/${id}/${action}`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `Could not ${action} booking`)
  }
  return res.json()
}

export async function getItineraries(): Promise<Itinerary[]> {
  const res = await authFetch('/api/itineraries')
  if (!res.ok) throw new Error(`Could not load itineraries (${res.status})`)
  return res.json()
}

/** Fire-and-forget engagement tracking; silently no-ops when signed out. */
export function trackInteraction(listingId: number, type: 'view' | 'click' | 'save' | 'book'): void {
  if (DEMO_MODE) return
  void authFetch('/api/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId, type }),
  }).catch(() => {})
}
