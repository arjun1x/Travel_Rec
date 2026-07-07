import type { Destination, Weather } from '../types/destination'
import type { ListingFilters, ListingsPage } from '../types/listing'

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
