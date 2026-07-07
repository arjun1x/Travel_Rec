import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authFetch, logout, useAuth } from '../lib/auth'
import type { Preferences } from '../types/preferences'

const TRIP_STYLES = [
  'city', 'culture', 'food', 'romance', 'adventure', 'mountains', 'hiking',
  'nature', 'beach', 'island', 'skiing', 'surfing', 'wildlife', 'nightlife',
  'history', 'temples',
]
const CLIMATES = ['tropical', 'mediterranean', 'temperate', 'alpine', 'desert', 'cold']

async function fetchPreferences(): Promise<Preferences> {
  const res = await authFetch('/api/users/me/preferences')
  if (!res.ok) throw new Error('Could not load preferences')
  return res.json()
}

async function savePreferences(prefs: Preferences): Promise<Preferences> {
  const res = await authFetch('/api/users/me/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  })
  if (!res.ok) throw new Error('Could not save preferences')
  return res.json()
}

function Chip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition ${
        active
          ? 'bg-sky-600 text-white ring-sky-600'
          : 'bg-white text-gray-700 ring-gray-200 hover:bg-sky-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800'
      }`}
    >
      {label}
    </button>
  )
}

export default function ProfilePage() {
  const { user, isAuthed } = useAuth()
  const queryClient = useQueryClient()

  const { data: saved } = useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
    enabled: isAuthed,
  })

  const [form, setForm] = useState<Preferences>({
    trip_styles: [],
    budget_min: null,
    budget_max: null,
    preferred_climates: [],
    notes: null,
  })
  useEffect(() => {
    if (saved) setForm(saved)
  }, [saved])

  const mutation = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => queryClient.setQueryData(['preferences'], data),
  })

  if (!isAuthed) return <Navigate to="/login" replace />

  const toggleIn = (key: 'trip_styles' | 'preferred_climates', value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hi, <span className="text-sky-600 dark:text-sky-400">{user?.name ?? 'traveler'}</span>
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Sign out
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate(form)
        }}
        className="mt-8 space-y-8 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div>
          <h2 className="font-bold tracking-tight">Trip styles</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Used to personalize your recommendations.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRIP_STYLES.map((style) => (
              <Chip
                key={style}
                label={style}
                active={form.trip_styles.includes(style)}
                onToggle={() => toggleIn('trip_styles', style)}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bold tracking-tight">Preferred climates</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CLIMATES.map((climate) => (
              <Chip
                key={climate}
                label={climate}
                active={form.preferred_climates.includes(climate)}
                onToggle={() => toggleIn('preferred_climates', climate)}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bold tracking-tight">Budget per night (USD)</h2>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={form.budget_min ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, budget_min: e.target.value === '' ? null : +e.target.value }))
              }
              className="w-32 rounded-xl border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900"
            />
            <span className="text-gray-400">—</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={form.budget_max ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, budget_max: e.target.value === '' ? null : +e.target.value }))
              }
              className="w-32 rounded-xl border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900"
            />
          </div>
        </div>

        <div>
          <h2 className="font-bold tracking-tight">Notes</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Dietary needs, accessibility, anything the AI planner should know.
          </p>
          <textarea
            rows={3}
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
            className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-full bg-gray-900 px-7 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {mutation.isPending ? 'Saving…' : 'Save preferences'}
          </button>
          {mutation.isSuccess && (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✓ Saved</span>
          )}
          {mutation.isError && (
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              {mutation.error.message}
            </span>
          )}
        </div>
      </form>
    </main>
  )
}
