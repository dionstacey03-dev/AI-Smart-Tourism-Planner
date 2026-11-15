import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let configured = false

export async function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) throw new Error('Google Maps is not configured yet.')

  if (!configured) {
    setOptions({ key, v: 'weekly' })
    configured = true
  }

  const [maps, marker, geocoding, routes] = await Promise.all([
    importLibrary('maps'),
    importLibrary('marker'),
    importLibrary('geocoding'),
    importLibrary('routes'),
  ])

  return { maps, marker, geocoding, routes }
}
