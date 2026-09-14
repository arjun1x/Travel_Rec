import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  name: string
  lat: number
  lng: number
}

const pin = divIcon({
  html: '<span style="display:block;width:20px;height:20px;background:#c54d31;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px #0004"></span>',
  className: '', // suppress default divIcon box styles
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

export default function DestinationMap({ name, lat, lng }: Props) {
  return (
    <MapContainer
      key={`${lat},${lng}`}
      center={[lat, lng]}
      zoom={11}
      scrollWheelZoom={false}
      className="z-0 h-72 w-full rounded-2xl border border-gray-200 dark:border-gray-800"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={pin}>
        <Popup>{name}</Popup>
      </Marker>
    </MapContainer>
  )
}
