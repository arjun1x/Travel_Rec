import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Loader2, Sparkles } from 'lucide-react'
import { streamSSE } from '../lib/sse'
import { useAuth } from '../lib/auth'
import { useQueryClient } from '@tanstack/react-query'
import { DEMO_MODE } from '../lib/config'
import { localToday } from '../lib/discovery'
import type { Destination } from '../types/destination'
import type { ItineraryPlan } from '../types/itinerary'
import ItineraryView from './ItineraryView'

const INTEREST_OPTIONS = [
  'food', 'culture', 'history', 'nature', 'adventure', 'nightlife',
  'shopping', 'relaxation', 'photography', 'family-friendly',
]

const inputClass =
  'rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900'

type Phase = 'form' | 'generating' | 'done'

export default function ItineraryBuilder({ destination }: { destination: Destination }) {
  const { isAuthed } = useAuth()
  const navigate = useNavigate()
  const today = localToday()
  const queryClient = useQueryClient()
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])

  const [phase, setPhase] = useState<Phase>('form')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [interests, setInterests] = useState<Set<string>>(new Set())
  const [budget, setBudget] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [daysStarted, setDaysStarted] = useState(0)
  const [plan, setPlan] = useState<ItineraryPlan | null>(null)

  const toggleInterest = (interest: string) =>
    setInterests((prev) => {
      const next = new Set(prev)
      if (next.has(interest)) next.delete(interest)
      else if (next.size < 10) next.add(interest)
      return next
    })

  const generate = async () => {
    if (!isAuthed) {
      navigate('/login', { state: { from: `/destinations/${destination.id}` } })
      return
    }
    if (DEMO_MODE) { setError('Connect the backend to generate an itinerary.'); return }
    if (!startDate || !endDate || startDate < today || endDate < startDate || (budget !== '' && (!Number.isFinite(+budget) || +budget < 0))) { setError('Choose valid future dates and a non-negative budget.'); return }
    const dayCount = (Date.parse(endDate) - Date.parse(startDate)) / 86400000 + 1
    if (dayCount > 14) { setError('Plan up to 14 days at a time.'); return }
    controller.current?.abort()
    controller.current = new AbortController()
    const active = controller.current
    setPhase('generating')
    setError(null)
    setDaysStarted(0)
    let accumulated = ''
    let completed = false
    try {
      for await (const event of streamSSE('/api/itineraries/generate', {
        destination_id: destination.id,
        start_date: startDate,
        end_date: endDate,
        interests: [...interests],
        budget_usd: budget ? +budget : null,
      }, active.signal)) {
        if (event.type === 'delta') {
          accumulated += event.text as string
          setDaysStarted((accumulated.match(/"date"/g) ?? []).length)
        } else if (event.type === 'done') {
          completed = true
          if (!event.plan || !Array.isArray((event.plan as ItineraryPlan).days)) throw new Error('The itinerary was incomplete. Please try again.')
          void queryClient.invalidateQueries({ queryKey: ['itineraries'] })
          setPlan(event.plan as ItineraryPlan)
          setPhase('done')
        } else if (event.type === 'error') {
          throw new Error(String(event.detail))
        }
      }
      if (!completed) throw new Error('The connection ended before your itinerary was ready. Please try again.')
    } catch (err) {
      if (active.signal.aborted) return
      setError(err instanceof Error ? err.message : 'Generation failed')
      setPhase('form')
    }
  }

  if (phase === 'done' && plan) {
    return (
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Sparkles className="h-5 w-5 text-sky-500" aria-hidden />
            Your {destination.name} itinerary
          </h2>
          <div className="flex gap-2 text-sm font-semibold">
            <Link to="/trips" className="text-sky-600 hover:text-sky-700 dark:text-sky-400">
              Saved to your trips →
            </Link>
            <button
              onClick={() => setPhase('form')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Plan another
            </button>
          </div>
        </div>
        <div className="mt-5">
          <ItineraryView plan={plan} />
        </div>
      </section>
    )
  }

  return (
    <section className="mt-12 rounded-3xl border border-sky-200 bg-sky-50/60 p-6 dark:border-sky-900 dark:bg-sky-950/30">
      <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
        <Sparkles className="h-5 w-5 text-sky-500" aria-hidden />
        Make the days your own.
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Build a day-by-day plan around your dates, interests, and budget, with weather when available.
      </p>

      {DEMO_MODE && <p className="service-note mt-4">Itinerary generation is available with the connected backend. You can explore the planning options here.</p>}
      {phase === 'generating' ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-sky-200 bg-white p-10 text-center dark:border-sky-900 dark:bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" aria-hidden />
          <p className="font-semibold">
            {daysStarted > 0 ? `Planning day ${daysStarted}…` : 'Thinking about your trip…'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Weaving in the weather forecast and your interests.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">From</span>
              <input
                type="date" min={today} value={startDate}
                onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate('') }}
                className={`${inputClass} block`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">To</span>
              <input
                type="date" min={startDate || today} value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputClass} block`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Budget (USD, optional)
              </span>
              <input
                type="number" min={0} placeholder="e.g. 900" value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={`${inputClass} block w-36`}
              />
            </label>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Interests · choose up to 10</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...new Set([...destination.tags, ...INTEREST_OPTIONS])].slice(0, 12).map((interest) => {
                const active = interests.has(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    aria-pressed={active}
                    disabled={!active && interests.size >= 10}
                    className={`rounded-full px-3 py-1 text-sm font-medium ring-1 transition ${
                      active
                        ? 'bg-sky-600 text-white ring-sky-600'
                        : 'bg-white text-gray-700 ring-gray-200 hover:bg-sky-100 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700'
                    }`}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            onClick={generate}
            disabled={DEMO_MODE || (isAuthed && (!startDate || !endDate || endDate < startDate || startDate < today))}
            className="rounded-full bg-gray-900 px-7 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {isAuthed ? 'Generate itinerary' : 'Sign in to generate'}
          </button>
        </div>
      )}
    </section>
  )
}
