import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let configured = false

function configureMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) throw new Error('Google Maps is not configured yet.')

  if (!configured) {
    setOptions({ key, v: 'weekly' })
    configured = true
  }
}

export async function loadGoogleMaps() {
  configureMaps()
  const [maps, marker, geocoding, routes] = await Promise.all([
    importLibrary('maps'),
    importLibrary('marker'),
    importLibrary('geocoding'),
    importLibrary('routes'),
  ])

  return { maps, marker, geocoding, routes }
}

export async function loadGooglePlaces() {
  configureMaps()
  return importLibrary('places')
}
