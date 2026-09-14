export type ListingType = 'hotel' | 'apartment' | 'hostel' | 'villa'
export type ListingSort = 'rating' | 'price_asc' | 'price_desc'

export interface Listing {
  id: number
  destination_id: number
  type: ListingType
  title: string
  description: string
  price_per_night: number
  capacity: number
  amenities: string[]
  images: string[]
  rating: number
}

export interface ListingsPage {
  items: Listing[]
  total: number
}

export interface ListingFilters {
  type?: ListingType
  sort?: ListingSort
  guests?: number
  max_price?: number
  min_price?: number
  amenities?: string[]
}
