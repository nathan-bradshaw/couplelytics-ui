import { useEffect, useState, useRef } from 'react'
import type { Filters, Prefs, ScoredCity } from '../../../../shared/types/types'
import { useDebouncedValue } from './useDebouncedValue'
import { API } from '../../../../shared/config'

export const useScoredCities = (year: number, prefs: Prefs, filters: Filters) => {
  const [cities, setCities] = useState<ScoredCity[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const firstLoadRef = useRef(true)
  const debouncedPrefs = useDebouncedValue(prefs, 50)
  const debouncedFilters = useDebouncedValue(filters, 50)
  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()

    const run = async () => {
      if (firstLoadRef.current) setInitialLoading(true)
      try {
        const r = await fetch(`${API}/api/cities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year, prefs: debouncedPrefs, filters: debouncedFilters }),
          signal: ctrl.signal,
        })
        if (!r.ok) throw new Error(`status ${r.status}`)
        const out = (await r.json()) as { cities: ScoredCity[] }
        if (!cancelled) setCities(out.cities)
      } catch {
        if (ctrl.signal.aborted) return
        if (!cancelled) setCities([])
      } finally {
        if (!cancelled && firstLoadRef.current) {
          setInitialLoading(false)
          firstLoadRef.current = false
        }
      }
    }

    run()
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [year, debouncedPrefs, debouncedFilters])

  return { cities, initialLoading }
}
