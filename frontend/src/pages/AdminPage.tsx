import { Navigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth, authFetch } from '../lib/auth'

// Chart colors follow the validated dataviz reference palette:
// series blue #2a78d6 (light) / #3987e5 (dark) — single series, no legend needed.

interface Metrics {
  totals: { users: number; destinations: number; listings: number; itineraries: number }
  interactions_by_type: Record<string, number>
  interactions_per_day: { date: string; count: number }[]
  rec_quality: { click_rate: number; save_rate: number; book_rate: number }
  top_destinations: { name: string; country: string; interactions: number }[]
  bookings_by_status: Record<string, { count: number; revenue: number }>
  llm: {
    by_endpoint: {
      model: string
      endpoint: string
      requests: number
      input_tokens: number
      output_tokens: number
      estimated_cost_usd: number
    }[]
    tokens_per_day: { date: string; tokens: number }[]
    total_cost_usd: number
  }
}

async function fetchMetrics(): Promise<Metrics> {
  const res = await authFetch('/api/admin/metrics')
  if (res.status === 403) throw new Error('forbidden')
  if (!res.ok) throw new Error(`Could not load metrics (${res.status})`)
  return res.json()
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-sm font-bold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

/** Horizontal bars: thin marks, rounded data end, direct labels, hover tooltip. */
function HBarChart({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label} className="group" title={`${row.label}: ${row.value}`}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="truncate text-gray-700 dark:text-gray-300">{row.label}</span>
            <span className="ml-3 font-semibold tabular-nums">{row.value.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-2 rounded-full bg-[#2a78d6] transition group-hover:opacity-80 dark:bg-[#3987e5]"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Vertical columns for the per-day trend, hover tooltip via title. */
function ColumnChart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No data yet.</p>
  }
  const max = Math.max(...points.map((p) => p.value), 1)
  return (
    <div className="flex h-36 items-end gap-1.5">
      {points.map((point) => (
        <div
          key={point.date}
          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
          title={`${point.date}: ${point.value.toLocaleString()} ${unit}`}
        >
          <div
            className="w-full max-w-8 rounded-t bg-[#2a78d6] transition group-hover:opacity-80 dark:bg-[#3987e5]"
            style={{ height: `${Math.max((point.value / max) * 100, 3)}%` }}
          />
          <span className="mt-1.5 truncate text-[10px] text-gray-400">
            {point.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const { isAuthed, user } = useAuth()
  const { data, isPending, error } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: fetchMetrics,
    enabled: isAuthed,
  })

  if (!isAuthed) return <Navigate to="/login" replace />
  if (user && !user.is_admin) return <Navigate to="/" replace />
  if (error?.message === 'forbidden') return <Navigate to="/" replace />

  const bookings = data
    ? Object.entries(data.bookings_by_status).map(([status, v]) => ({
        label: status,
        value: v.count,
      }))
    : []
  const revenue = data
    ? Object.values(data.bookings_by_status).reduce((sum, v) => sum + v.revenue, 0)
    : 0

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Admin <span className="text-sky-600 dark:text-sky-400">dashboard</span>
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Engagement, recommendation quality, bookings, and LLM spend.
      </p>

      {isPending && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Users" value={data.totals.users.toLocaleString()} />
            <StatTile
              label="Listings"
              value={data.totals.listings.toLocaleString()}
              hint={`across ${data.totals.destinations} destinations`}
            />
            <StatTile label="Booking revenue" value={`$${Math.round(revenue).toLocaleString()}`} />
            <StatTile
              label="LLM spend (est.)"
              value={`$${data.llm.total_cost_usd.toFixed(2)}`}
              hint={`${data.llm.by_endpoint.reduce((sum, e) => sum + e.requests, 0)} requests · ${data.totals.itineraries} itineraries`}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Click rate"
              value={`${(data.rec_quality.click_rate * 100).toFixed(1)}%`}
              hint="clicks / views"
            />
            <StatTile
              label="Save rate"
              value={`${(data.rec_quality.save_rate * 100).toFixed(1)}%`}
              hint="saves / views"
            />
            <StatTile
              label="Book rate"
              value={`${(data.rec_quality.book_rate * 100).toFixed(1)}%`}
              hint="bookings / views"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Interactions — last 14 days">
              <ColumnChart
                points={data.interactions_per_day.map((d) => ({ date: d.date, value: d.count }))}
                unit="interactions"
              />
            </ChartCard>
            <ChartCard title="Interactions by type">
              <HBarChart
                rows={Object.entries(data.interactions_by_type)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => ({ label, value }))}
              />
            </ChartCard>
            <ChartCard title="Top destinations by engagement">
              <HBarChart
                rows={data.top_destinations.map((d) => ({
                  label: `${d.name}, ${d.country}`,
                  value: d.interactions,
                }))}
              />
            </ChartCard>
            <ChartCard title="Bookings by status">
              {bookings.length > 0 ? (
                <HBarChart rows={bookings} />
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">No bookings yet.</p>
              )}
            </ChartCard>
            <ChartCard title="LLM tokens — last 14 days">
              <ColumnChart
                points={data.llm.tokens_per_day.map((d) => ({ date: d.date, value: d.tokens }))}
                unit="tokens"
              />
            </ChartCard>
            <ChartCard title="LLM usage by endpoint">
              {data.llm.by_endpoint.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="pb-2 font-semibold">Endpoint</th>
                      <th className="pb-2 font-semibold">Requests</th>
                      <th className="pb-2 font-semibold">Tokens in/out</th>
                      <th className="pb-2 text-right font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.llm.by_endpoint.map((row) => (
                      <tr key={`${row.model}-${row.endpoint}`}>
                        <td className="py-2">{row.endpoint}</td>
                        <td className="py-2 tabular-nums">{row.requests}</td>
                        <td className="py-2 tabular-nums">
                          {row.input_tokens.toLocaleString()} / {row.output_tokens.toLocaleString()}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          ${row.estimated_cost_usd.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">
                  No LLM calls yet — generate an itinerary or chat with the assistant.
                </p>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </main>
  )
}
