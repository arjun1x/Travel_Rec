import type { Destination, Weather } from '../types/destination'
import type { Listing, ListingFilters, ListingsPage } from '../types/listing'
import { authFetch } from './auth'

export interface RecommendationItem {
  listing: Listing
  destination: Destination
  score: number
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

export function getDestinations(limit = 20): Promise<Destination[]> {
  return fetchJson(`/api/destinations?limit=${limit}`)
}

export function searchDestinations(q: string, limit = 20): Promise<Destination[]> {
  return fetchJson(`/api/destinations/search?q=${encodeURIComponent(q)}&limit=${limit}`)
}

export function getDestination(id: number | string): Promise<Destination> {
  return fetchJson(`/api/destinations/${id}`)
}

export function getWeather(id: number | string): Promise<Weather> {
  return fetchJson(`/api/destinations/${id}/weather`)
}

export function getSimilar(id: number | string, limit = 4): Promise<Destination[]> {
  return fetchJson(`/api/destinations/${id}/similar?limit=${limit}`)
}

export function getListings(
  destinationId: number,
  filters: ListingFilters = {},
  limit = 60,
): Promise<ListingsPage> {
  const params = new URLSearchParams({ destination_id: String(destinationId), limit: String(limit) })
  if (filters.type) params.set('type', filters.type)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.guests) params.set('guests', String(filters.guests))
  if (filters.max_price) params.set('max_price', String(filters.max_price))
  return fetchJson(`/api/listings?${params}`)
}

export async function getRecommendations(limit = 20): Promise<RecommendationItem[]> {
  const res = await authFetch(`/api/recommendations?limit=${limit}`)
  if (!res.ok) throw new Error(`Could not load recommendations (${res.status})`)
  const data = await res.json()
  return data.items
}

/** Fire-and-forget engagement tracking; silently no-ops when signed out. */
export function trackInteraction(listingId: number, type: 'view' | 'click' | 'save' | 'book'): void {
  void authFetch('/api/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId, type }),
  }).catch(() => {})
}
