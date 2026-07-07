import { Link, Outlet } from 'react-router'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/80 backdrop-blur dark:border-gray-800/70 dark:bg-gray-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <span aria-hidden>🧭</span> Travel Rec
          </Link>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            AI-powered trip discovery
          </span>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
