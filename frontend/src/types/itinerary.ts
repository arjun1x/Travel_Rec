export interface Activity {
  time: string
  name: string
  description: string
  estimated_cost_usd: number
  lat?: number | null
  lng?: number | null
}

export interface DayPlan {
  date: string
  title: string
  activities: Activity[]
}

export interface ItineraryPlan {
  days: DayPlan[]
  budget_total_usd: number
  budget_tips: string[]
}

export interface Itinerary {
  id: number
  destination_id: number
  start_date: string
  end_date: string
  days: ItineraryPlan
  budget_total: number | null
  llm_model: string | null
  prompt_version: string | null
  status: string
  created_at: string
}
