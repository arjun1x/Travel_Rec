import { Link, NavLink } from 'react-router'
import { CircleUserRound, Compass } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useShortlist } from '../lib/shortlist'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
  }`

export default function Navbar() {
  const { ids } = useShortlist()
  const { user, isAuthed } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/80 backdrop-blur-md dark:border-gray-800/70 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <Compass aria-hidden className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          <span>
            Travel<span className="text-sky-600 dark:text-sky-400"> Rec</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          <NavLink to="/explore" className={linkClass}>
            Explore
          </NavLink>
          {isAuthed && (
            <NavLink to="/foryou" className={linkClass}>
              For you
            </NavLink>
          )}
          {isAuthed && (
            <NavLink to="/trips" className={linkClass}>
              Trips
            </NavLink>
          )}
          <NavLink to="/saved" className={linkClass}>
            Saved
            {ids.length > 0 && (
              <span className="ml-1.5 rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {ids.length}
              </span>
            )}
          </NavLink>
          <a href="/#faq" className={linkClass({ isActive: false })}>
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Link
              to="/profile"
              className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-2 text-sm font-semibold transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <CircleUserRound aria-hidden className="h-4 w-4" />
              {user ? user.name.split(' ')[0] : 'Profile'}
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/explore"
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Start exploring
          </Link>
        </div>
      </div>
    </header>
  )
}
