import type { Destination } from './destination'
import type { Listing } from './listing'

export type BookingStatus = 'held' | 'confirmed' | 'cancelled'

export interface Booking {
  id: number
  check_in: string
  check_out: string
  guests: number
  status: BookingStatus
  total_price: number
  created_at: string
}

export interface BookingDetail extends Booking {
  listing: Listing
  destination: Destination
}
