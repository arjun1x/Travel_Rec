import type { Destination } from '../types/destination'

export const REGIONS = ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania'] as const
export const COUNTRY_REGIONS: Record<string, string> = {
  France: 'Europe', Italy: 'Europe', Greece: 'Europe', Portugal: 'Europe', Spain: 'Europe',
  Iceland: 'Europe', Switzerland: 'Europe', Croatia: 'Europe', Austria: 'Europe',
  'Czech Republic': 'Europe', Netherlands: 'Europe', 'United Kingdom': 'Europe', Turkey: 'Europe',
  Japan: 'Asia', Indonesia: 'Asia', Thailand: 'Asia', Vietnam: 'Asia', Singapore: 'Asia',
  'South Korea': 'Asia', Maldives: 'Asia', Jordan: 'Asia',
  Morocco: 'Africa', Egypt: 'Africa', 'South Africa': 'Africa', Tanzania: 'Africa',
  Zimbabwe: 'Africa', Seychelles: 'Africa', Canada: 'North America',
  'United States': 'North America', Mexico: 'North America', Peru: 'South America',
  Brazil: 'South America', Argentina: 'South America', Ecuador: 'South America',
  Australia: 'Oceania', 'New Zealand': 'Oceania', Fiji: 'Oceania', 'French Polynesia': 'Oceania',
  Germany: 'Europe', Denmark: 'Europe', Sweden: 'Europe', Norway: 'Europe', Finland: 'Europe',
  Ireland: 'Europe', Hungary: 'Europe', Poland: 'Europe', Belgium: 'Europe', Estonia: 'Europe', Slovenia: 'Europe',
  'Hong Kong': 'Asia', China: 'Asia', Taiwan: 'Asia', Malaysia: 'Asia', Laos: 'Asia', Cambodia: 'Asia',
  India: 'Asia', Nepal: 'Asia', 'Sri Lanka': 'Asia', 'United Arab Emirates': 'Asia', Oman: 'Asia',
  Georgia: 'Asia', Uzbekistan: 'Asia', Kenya: 'Africa', Mauritius: 'Africa', Namibia: 'Africa', Ethiopia: 'Africa',
  Cuba: 'North America', 'Costa Rica': 'North America', Colombia: 'South America', Chile: 'South America',
}
export const TRIP_STYLES = [
  { value: '', label: 'A bit of everything', icon: 'compass' },
  { value: 'beach', label: 'Coastal escapes', icon: 'waves' },
  { value: 'mountains', label: 'Into the mountains', icon: 'mountain' },
  { value: 'city', label: 'City weekends', icon: 'building' },
  { value: 'food', label: 'Food worth a flight', icon: 'utensils' },
  { value: 'nature', label: 'The great outdoors', icon: 'tree' },
  { value: 'culture', label: 'A little culture', icon: 'landmark' },
  { value: 'romance', label: 'Just the two of you', icon: 'heart' },
] as const

export type DiscoverFilters = { q: string; region: string; tags: string[]; sort: string }
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function filterDestinations(data: Destination[], filters: DiscoverFilters): Destination[] {
  const terms = normalize(filters.q).split(/\s+/).filter(Boolean)
  const result = data.filter((d) => {
    const text = normalize([d.name, d.country, d.description, ...d.tags].join(' '))
    return terms.every((term) => text.includes(term))
      && (!filters.region || COUNTRY_REGIONS[d.country] === filters.region)
      && filters.tags.every((tag) => d.tags.includes(tag))
  })
  return result.sort((a, b) => filters.sort === 'name'
    ? a.name.localeCompare(b.name)
    : filters.sort === 'quiet' ? a.popularity_score - b.popularity_score : b.popularity_score - a.popularity_score)
}

/** Only same-origin relative paths may be used after authentication. */
export function safeReturnPath(value: unknown, fallback = '/trips'): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    && !value.includes('\\') && !value.startsWith('/login') && !value.startsWith('/register') ? value : fallback
}

export function localToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
