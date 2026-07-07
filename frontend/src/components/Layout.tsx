import { Outlet, ScrollRestoration } from 'react-router'
import AssistantWidget from './AssistantWidget'
import Footer from './Footer'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
      <ScrollRestoration />
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <AssistantWidget />
    </div>
  )
}
