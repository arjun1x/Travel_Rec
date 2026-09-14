import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/auth'
import { Outlet, ScrollRestoration } from 'react-router'
import AssistantWidget from './AssistantWidget'
import Footer from './Footer'
import Navbar from './Navbar'
import { DEMO_MODE } from '../lib/config'

export default function Layout() {
  const { isAuthed } = useAuth()
  const client = useQueryClient()
  useEffect(() => {
    if (!isAuthed) client.removeQueries({ predicate: (q) => ['bookings', 'itineraries', 'preferences', 'recommendations', 'admin-metrics'].includes(String(q.queryKey[0])) })
  }, [isAuthed, client])
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {/* every fresh page load shares location.key "default", so one page's saved offset could be
          restored on a different page; key initial entries by URL instead (in-app navigations keep
          their unique keys, so back/forward still restore and new pages start at the top) */}
      <ScrollRestoration getKey={(location) => location.key === 'default' ? location.pathname + location.search : location.key} />
      <Navbar />
      {DEMO_MODE && <div className="preview-note"><span /> Preview collection · Sample destinations. Accounts, stays, and live services require the backend.</div>}
      <div className="app-content" id="main-content" tabIndex={-1}>
        <Outlet />
      </div>
      <Footer />
      <AssistantWidget />
    </div>
  )
}
