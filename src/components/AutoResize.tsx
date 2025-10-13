import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export const AutoResize = () => {
  // Get the Leaflet map instance from context
  const map = useMap()

  useEffect(() => {
    // Function to invalidate the map size, forcing it to recalculate layout
    const invalidate = () => map.invalidateSize()

    // Use setTimeout with 0 delay to run invalidateSize after the first paint,
    // ensuring the map container has been rendered and sized correctly
    // schedules one call of invalidate() right after the component has rendered once.
    // setTimeout(..., 0) is a trick to wait until the browser finishes laying out the DOM -> ensures the map container has its real size.
    const id = setTimeout(invalidate, 0)

    // Add event listener to window resize to call invalidateSize when window size changes
    window.addEventListener('resize', invalidate)

    // Cleanup function to clear the timeout and remove the event listener when component unmounts or map changes
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', invalidate)
    }
  }, [map]) // Re-run effect if the map instance changes

  return null // This component does not render anything visible
}
