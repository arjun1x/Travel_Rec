import type { Destination } from '../types/destination'

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
