import { useEffect } from 'react'
import { Link } from 'react-router'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { divIcon, latLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Destination } from '../types/destination'

const pin = divIcon({
  html: '<span style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">📍</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

function FitBounds({ destinations }: { destinations: Destination[] }) {
  const map = useMap()
  useEffect(() => {
    if (destinations.length === 0) return
    const bounds = latLngBounds(destinations.map((d) => [d.lat, d.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
  }, [map, destinations])
  return null
}

export default function ExploreMap({ destinations }: { destinations: Destination[] }) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      scrollWheelZoom={false}
      className="z-0 h-full w-full rounded-2xl border border-gray-200 dark:border-gray-800"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds destinations={destinations} />
      {destinations.map((d) => (
        <Marker key={d.id} position={[d.lat, d.lng]} icon={pin}>
          <Popup>
            <span className="font-semibold">{d.name}</span>, {d.country}
            <br />
            <Link to={`/destinations/${d.id}`}>View destination →</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
