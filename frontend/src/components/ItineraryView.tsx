import { Clock, Lightbulb, Wallet } from 'lucide-react'
import type { DayPlan, ItineraryPlan } from '../types/itinerary'

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

/** One day of a plan; also rendered on its own while a plan is still streaming in. */
export function DayCard({ day, index }: { day: DayPlan; index: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-bold tracking-tight">
          <span className="mr-2 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            Day {index + 1}
          </span>
          {day.title}
        </h3>
        <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
          {formatDay(day.date)}
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {day.activities.map((activity) => (
          <li key={`${day.date}-${activity.time}-${activity.name}`} className="flex gap-3">
            <span className="flex h-6 shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2 font-mono text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <Clock className="h-3 w-3" aria-hidden />
              {activity.time}
            </span>
            <div className="min-w-0">
              <p className="font-semibold leading-snug">
                {activity.name}
                {activity.estimated_cost_usd > 0 && (
                  <span className="ml-2 text-sm font-medium text-gray-400">
                    ~${Math.round(activity.estimated_cost_usd)}
                  </span>
                )}
              </p>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {activity.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ItineraryView({ plan }: { plan: ItineraryPlan }) {
  return (
    <div className="space-y-5">
      {plan.days.map((day, i) => (
        <DayCard key={day.date} day={day} index={i} />
      ))}

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="flex items-center gap-2 font-bold tracking-tight text-emerald-900 dark:text-emerald-200">
          <Wallet className="h-4 w-4" aria-hidden />
          Estimated total: ${Math.round(plan.budget_total_usd)} per person
        </p>
        <ul className="mt-3 space-y-1.5">
          {plan.budget_tips.map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-2 text-sm leading-relaxed text-emerald-800 dark:text-emerald-300"
            >
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
