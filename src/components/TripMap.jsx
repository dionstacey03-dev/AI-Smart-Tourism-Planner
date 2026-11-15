import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../lib/mapsLoader'
import './TripMap.css'

const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 }

export default function TripMap({ itinerary = [] }) {
  const mapElement = useRef(null)
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    let map

    async function initialize() {
      if (!mapElement.current) return
      try {
        const { maps, geocoding } = await loadGoogleMaps()
        if (cancelled) return

        map = new maps.Map(mapElement.current, {
          center: SRI_LANKA_CENTER,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative',
        })

        const geocoder = new geocoding.Geocoder()
        const bounds = new google.maps.LatLngBounds()
        const places = itinerary
          .map((item) => item.place)
          .filter((place, index, all) => place && all.indexOf(place) === index)

        const locations = await Promise.all(places.map(async (place) => {
          try {
            const result = await geocoder.geocode({ address: `${place}, Sri Lanka` })
            const location = result.results?.[0]?.geometry?.location
            return location ? { place, location } : null
          } catch {
            return null
          }
        }))

        if (cancelled) return
        locations.filter(Boolean).forEach(({ place, location }, index) => {
          new google.maps.Marker({
            map,
            position: location,
            title: `${index + 1}. ${place}`,
            label: String(index + 1),
          })
          bounds.extend(location)
        })

        if (locations.filter(Boolean).length > 1) map.fitBounds(bounds)
        else if (locations.filter(Boolean).length === 1) {
          map.setCenter(locations.find(Boolean).location)
          map.setZoom(10)
        }
        setStatus('ready')
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || 'Unable to load Google Maps.')
          setStatus('error')
        }
      }
    }

    initialize()
    return () => { cancelled = true }
  }, [itinerary])

  return (
    <section className="tripMapSection" aria-label="Itinerary map">
      <div className="tripMapHeading">
        <div>
          <span>EXPLORE YOUR ROUTE</span>
          <h4>Journey map</h4>
        </div>
        <span className="tripMapCount">{itinerary.length} planned days</span>
      </div>
      <div className="tripMapCanvas" ref={mapElement}>
        {status !== 'ready' && (
          <div className="tripMapOverlay" role="status">
            {status === 'loading' ? 'Loading your map…' : message}
          </div>
        )}
      </div>
      {status === 'error' && (
        <p className="tripMapHint">Add a restricted Google Maps API key to enable the interactive map.</p>
      )}
    </section>
  )
}
