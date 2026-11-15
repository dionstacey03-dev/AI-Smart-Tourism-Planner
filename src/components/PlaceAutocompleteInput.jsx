import { useEffect, useRef, useState } from 'react'
import { loadGooglePlaces } from '../lib/mapsLoader'
import './PlaceAutocompleteInput.css'

export default function PlaceAutocompleteInput({ onSelect }) {
  const host = useRef(null)
  const onSelectRef = useRef(onSelect)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    let disposed = false
    let autocomplete
    let selectHandler

    async function mountAutocomplete() {
      try {
        const places = await loadGooglePlaces()
        if (disposed || !host.current) return

        autocomplete = new places.PlaceAutocompleteElement({
          includedRegionCodes: ['lk'],
        })
        autocomplete.placeholder = 'Search a Sri Lankan city or attraction'
        autocomplete.style.width = '100%'

        selectHandler = async (event) => {
          try {
            const place = event.placePrediction.toPlace()
            await place.fetchFields({
              fields: ['displayName', 'formattedAddress', 'location'],
            })
            const selectedName = place.formattedAddress || place.displayName
            if (selectedName) onSelectRef.current?.(selectedName)
          } catch (error) {
            console.error('Place selection failed:', error)
          }
        }

        autocomplete.addEventListener('gmp-select', selectHandler)
        host.current.replaceChildren(autocomplete)
        setStatus('ready')
      } catch {
        if (!disposed) setStatus('unavailable')
      }
    }

    mountAutocomplete()
    return () => {
      disposed = true
      if (autocomplete && selectHandler) {
        autocomplete.removeEventListener('gmp-select', selectHandler)
      }
      host.current?.replaceChildren()
    }
  }, [])

  return (
    <div className="placeAutocomplete">
      <div ref={host} />
      {status === 'loading' && <span>Preparing place search…</span>}
      {status === 'unavailable' && (
        <span>Place search becomes available after Google Maps is configured.</span>
      )}
    </div>
  )
}
