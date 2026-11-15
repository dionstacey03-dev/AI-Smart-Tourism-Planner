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
        const { maps, marker, geocoding, routes } = await loadGoogleMaps()
        if (cancelled) return

        map = new maps.Map(mapElement.current, {
          center: SRI_LANKA_CENTER,
          zoom: 7,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative',
        })

        const geocoder = new geocoding.Geocoder()
        const bounds = new maps.LatLngBounds()
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
          new marker.AdvancedMarkerElement({
            map,
            position: location,
            title: `${index + 1}. ${place}`,
          })
          bounds.extend(location)
        })

        const validLocations = locations.filter(Boolean)
        if (validLocations.length > 1) {
          const directionsService = new routes.DirectionsService()
          const directionsRenderer = new routes.DirectionsRenderer({
            map,
            suppressMarkers: true,
            preserveViewport: false,
            polylineOptions: { strokeColor: '#16a36a', strokeOpacity: 0.85, strokeWeight: 5 },
          })
          const route = await new Promise((resolve) => {
            directionsService.route({
              origin: validLocations[0].location,
              destination: validLocations[validLocations.length - 1].location,
              waypoints: validLocations.slice(1, -1).map(({ location }) => ({
                location,
                stopover: true,
              })),
              optimizeWaypoints: false,
              travelMode: 'DRIVING',
            }, (result, routeStatus) => {
              if (routeStatus === 'OK' && result) {
                directionsRenderer.setDirections(result)
              }
              resolve(routeStatus)
            })
          })
          if (route !== 'OK') map.fitBounds(bounds)
        } else if (validLocations.length === 1) {
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
