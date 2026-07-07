import { useMemo } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { getDestinations } from '../lib/api'
import CardSkeleton from '../components/CardSkeleton'
import DestinationCard from '../components/DestinationCard'
import DestinationImage from '../components/DestinationImage'
import { GlobeLive, type GlobeMarker } from '@/components/ui/globe-live'

const FEATURES = [
  {
    emoji: '⚡',
    title: 'Instant discovery',
    body: 'Search by name, country, or vibe and filter by tags — mountains, food, beaches — with results in milliseconds.',
    example: 'Example: type “mountains” and toggle the skiing chip to shortlist alpine trips.',
    tint: 'bg-sky-50 dark:bg-sky-950/40',
  },
  {
    emoji: '🌦️',
    title: 'Live weather intel',
    body: 'Every destination shows real current conditions and a 7-day forecast, so you plan around the weather — not against it.',
    example: 'Example: Reykjavik showing snow next week? Maybe Lisbon first.',
    tint: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    emoji: '❤️',
    title: 'Save & shortlist',
    body: 'Heart the places that catch your eye and build a shortlist you can come back to anytime — no account needed.',
    example: 'Example: save Kyoto and Banff, then compare their forecasts side by side.',
    tint: 'bg-rose-50 dark:bg-rose-950/30',
  },
  {
    emoji: '✨',
    title: 'AI itineraries',
    body: 'Coming soon: Claude plans your days around your dates, interests, and the live forecast — with a budget summary and smart tips.',
    example: 'Example: “4 days in Kyoto in November, temples + food, under $900.”',
    tint: 'bg-violet-50 dark:bg-violet-950/30',
    soon: true,
  },
]

const TRIP_TYPES = [
  {
    emoji: '👨‍👩‍👧‍👦',
    title: 'Family getaways',
    body: 'Balanced days for all ages — nature, easy walks, and food everyone will actually eat.',
  },
  {
    emoji: '💞',
    title: 'Couples trips',
    body: 'Romantic escapes without the stress: sunset spots, quiet districts, memorable dinners.',
  },
  {
    emoji: '🚗',
    title: 'Road trips',
    body: 'Scenic routes optimized as you go — with the map view built into every destination.',
  },
  {
    emoji: '🌏',
    title: 'Multi-city',
    body: 'Chain destinations with tag-based similarity: if you loved Banff, meet Queenstown.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Priya',
    role: 'Weekend traveler',
    quote:
      'The weather panel alone sold me — I moved my Reykjavik trip a week and dodged three days of rain.',
  },
  {
    name: 'Marco',
    role: 'Backpacker',
    quote:
      'Tag chips are how my brain already works. “Mountains + hiking” and I had a shortlist in ten seconds.',
  },
  {
    name: 'Dana',
    role: 'Trip organizer',
    quote:
      'Clean, fast, and no account walls. I sent my group three saved links and we picked a winner that night.',
  },
]

const FAQS = [
  {
    q: 'What is Travel Rec?',
    a: 'An AI-powered travel discovery platform. Today you can search destinations, filter by travel style, check live weather, and save a shortlist. AI-generated itineraries and a Claude travel assistant are next on the roadmap.',
  },
  {
    q: 'Is it free to use?',
    a: 'Yes. Exploring destinations, weather forecasts, and shortlists are free. No account is required for any current feature.',
  },
  {
    q: 'Where does the weather data come from?',
    a: 'Live conditions and 7-day forecasts come from Open-Meteo, refreshed roughly every 30 minutes per destination.',
  },
  {
    q: 'How will the AI itinerary planner work?',
    a: 'You pick a destination, dates, interests, and budget. Claude then drafts a day-by-day plan — timed activities, map pins, estimated costs, and a budget summary with tips — which you can edit or regenerate one day at a time.',
  },
  {
    q: 'How are “similar destinations” chosen?',
    a: 'By travel-style overlap: destinations sharing the most tags (and, soon, embedding similarity) rank highest. It is how you hop from Banff to Queenstown.',
  },
  {
    q: 'Is my shortlist stored on a server?',
    a: 'Not yet — it lives in your browser (localStorage). When accounts arrive, you will be able to sync and share it.',
  },
]

export default function LandingPage() {
  const { data: destinations, isPending } = useQuery({
    queryKey: ['destinations', ''],
    queryFn: () => getDestinations(100),
  })

  const guides = (destinations ?? []).slice(0, 4)
  const inspirations = (destinations ?? []).slice(0, 20)
  const aspects = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/2]']

  const globeMarkers = useMemo<GlobeMarker[] | undefined>(
    () =>
      destinations?.map((d) => ({
        id: String(d.id),
        location: [d.lat, d.lng] as [number, number],
        size: 0.03 + 0.05 * d.popularity_score,
      })),
    [destinations],
  )

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-100/80 via-transparent to-transparent dark:from-sky-950/40"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-14 pt-14 lg:grid-cols-2 lg:gap-8 lg:pb-20 lg:pt-16">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-sm font-medium text-sky-700 shadow-sm dark:border-sky-800 dark:bg-gray-900 dark:text-sky-300">
              ✨ AI-powered trip discovery
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              The{' '}
              <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                AI trip planner
              </span>{' '}
              for your next adventure
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600 dark:text-gray-300 lg:mx-0">
              Smarter than endless tabs: search destinations by vibe, check live weather at
              a glance, shortlist favorites — and soon, let Claude plan your days.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/explore"
                className="rounded-full bg-gray-900 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                ⛰️ Start exploring
              </Link>
              <a
                href="#features"
                className="rounded-full border border-gray-300 bg-white px-7 py-3.5 font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                How it works
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              <span aria-hidden className="text-amber-400">★★★★★</span> Live weather · 50
              curated destinations · Zero sign-up
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-lg">
            <div
              aria-hidden
              className="absolute inset-4 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/15"
            />
            <GlobeLive markers={globeMarkers} className="relative" />
            <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
              Every dot is a destination you can book today — drag to spin.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          What makes our{' '}
          <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
            AI trip planner
          </span>{' '}
          different
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className={`rounded-3xl p-7 ${f.tint}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-gray-900" aria-hidden>
                  {f.emoji}
                </span>
                <h3 className="text-lg font-bold tracking-tight">
                  {f.title}
                  {f.soon && (
                    <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 align-middle text-[10px] font-bold uppercase text-white">
                      soon
                    </span>
                  )}
                </h3>
              </div>
              <p className="mt-3 leading-relaxed text-gray-700 dark:text-gray-300">{f.body}</p>
              <p className="mt-3 text-sm italic text-gray-500 dark:text-gray-400">{f.example}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trip types ───────────────────────────────────────── */}
      <section className="bg-white py-16 dark:bg-gray-900/50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Built for <span className="text-sky-600 dark:text-sky-400">every trip type</span>
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRIP_TYPES.map((t) => (
              <div
                key={t.title}
                className="rounded-3xl border border-gray-200 bg-gray-50 p-6 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <span className="text-3xl" aria-hidden>{t.emoji}</span>
                <h3 className="mt-3 font-bold tracking-tight">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{t.body}</p>
                <Link
                  to="/explore"
                  className="mt-3 inline-block text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                >
                  Explore →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Guides (live data) ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Plan your <span className="text-sky-600 dark:text-sky-400">next adventure</span>
          </h2>
          <Link to="/explore" className="text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400">
            See all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isPending && Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
          {guides.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      </section>

      {/* ── Inspirations masonry ─────────────────────────────── */}
      {inspirations.length > 0 && (
        <section className="bg-white py-16 dark:bg-gray-900/50">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              Journey <span className="text-sky-600 dark:text-sky-400">inspirations</span>
            </h2>
            <div className="mt-10 columns-2 gap-4 lg:columns-3 [&>*]:mb-4">
              {inspirations.map((d, i) => (
                <Link
                  key={d.id}
                  to={`/destinations/${d.id}`}
                  className="group relative block break-inside-avoid overflow-hidden rounded-3xl"
                >
                  <DestinationImage
                    destination={d}
                    className={`w-full ${aspects[i % aspects.length]} transition duration-300 group-hover:scale-105`}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="font-bold text-white">Trip to {d.name}</p>
                    <p className="text-xs text-gray-200">{d.country}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Don't take <span className="text-sky-600 dark:text-sky-400">our word</span> for it
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <p aria-hidden className="text-amber-400">★★★★★</p>
              <blockquote className="mt-3 leading-relaxed text-gray-700 dark:text-gray-300">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{t.name}</span>{' '}
                <span className="text-gray-500 dark:text-gray-400">· {t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">FAQs</h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-gray-200 bg-white p-5 open:shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="ml-4 text-gray-400 transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 to-indigo-700 px-8 py-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready for your next adventure?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sky-100">
            Browse destinations with live weather now — and be first in line when AI
            itineraries land.
          </p>
          <Link
            to="/explore"
            className="mt-7 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-sky-700 shadow-lg transition hover:-translate-y-0.5"
          >
            Start exploring — it's free
          </Link>
        </div>
      </section>
    </main>
  )
}
