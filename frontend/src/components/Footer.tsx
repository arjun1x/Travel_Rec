import { Link } from 'react-router'
import { Compass } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-20 bg-gray-950 text-gray-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
            <Compass aria-hidden className="h-5 w-5 text-sky-400" /> Travel Rec
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
            AI-powered trip discovery — search destinations, check live weather, and
            (soon) let Claude plan your days.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Product</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/explore" className="hover:text-white">Explore destinations</Link></li>
            <li><Link to="/saved" className="hover:text-white">Saved trips</Link></li>
            <li>
              <span className="text-gray-500">AI itineraries</span>{' '}
              <span className="rounded-full bg-sky-950 px-2 py-0.5 text-[10px] font-semibold text-sky-300">soon</span>
            </li>
            <li>
              <span className="text-gray-500">Travel assistant</span>{' '}
              <span className="rounded-full bg-sky-950 px-2 py-0.5 text-[10px] font-semibold text-sky-300">soon</span>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Resources</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-white">
                API docs
              </a>
            </li>
            <li><a href="/#faq" className="hover:text-white">FAQ</a></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Data</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="hover:text-white">
                Weather by Open-Meteo
              </a>
            </li>
            <li>
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:text-white">
                Maps © OpenStreetMap
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-gray-500">
          © 2026 Travel Rec. Built with FastAPI, React, and Claude.
        </p>
      </div>
    </footer>
  )
}
