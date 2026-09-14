import { Plus } from 'lucide-react'
const questions = [
  ['What can I do without an account?', 'Browse destinations, filter by region or interests, view destination details, and save places to a shortlist in this browser. Saved places are stored on this device; they are not synced between devices.'],
  ['How do I plan a trip?', 'Open a destination and choose Plan your days. Add your dates, interests, and optional budget. Sign in to generate a day-by-day itinerary and save it to My trips. The planning service must be configured for generation to work.'],
  ['Are these real bookings?', 'Bookings in Travel Rec are simulated. You can try placing a hold, confirming it, or cancelling it, but no payment is taken and no property is actually reserved. Listing prices and ratings in the seeded catalog are demonstration data.'],
  ['Where does the weather come from?', 'Weather is supplied by Open-Meteo through the connected backend. If the service is unavailable, we show that clearly. Preview mode does not display invented weather readings.'],
  ['How do filters work?', 'Search matches place names, countries, descriptions, and interests. Regions narrow the location; multiple interest filters must all match. You can sort by catalog popularity, alphabetically, or by less-discovered places.'],
  ['What is the preview collection?', 'It is a small sample catalog you can explore while the backend is not running. Search, filters, saving, comparisons, and navigation work locally. Accounts, stays, live weather, and itinerary generation require the connected services.'],
  ['How do I take my shortlist with me?', 'Open Saved and choose Export list to download your places as a JSON file. You can also compare up to three saved destinations side by side.'],
]
export default function HelpPage() {
  return <main className="help-page page-width"><div className="page-intro"><span className="eyebrow">BEFORE YOU GO</span><h1>A little <em>good to know.</em></h1><p>The details, without the detour.</p></div>{questions.map(([q,a]) => <details key={q}><summary>{q}<Plus size={18} /></summary><p>{a}</p></details>)}</main>
}
