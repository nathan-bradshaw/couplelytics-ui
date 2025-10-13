import { useEffect, useState, useRef } from 'react'
import type { Filters, HeatColor, Prefs, ScoredCity } from '../../../../shared/types/types'
import { useDebouncedValue } from './useDebouncedValue'
import { API } from '../../../../shared/config'

type FetchArgs = {
  year: number
  prefs: Prefs
  filters: Filters
  isInitial: boolean
  signal: AbortSignal
}

type CompactRow = {
  geoId: string
  presence: number
  ratioPer100: number
  ratioDelta: number
  largest: number
  colorHex: string
  heatColor: HeatColor
  heatIntensity: number
}

function decodeInitial(cities: any[]): ScoredCity[] {
  return cities.filter((c) => c.lat != null && c.lon != null)
}

function fetchCities(args: FetchArgs & { isInitial: true }): Promise<ScoredCity[]>
function fetchCities(args: FetchArgs & { isInitial: false }): Promise<CompactRow[]>
async function fetchCities({
  year,
  prefs,
  filters,
  isInitial,
  signal,
}: FetchArgs): Promise<ScoredCity[] | CompactRow[]> {
  const r = await fetch(`${API}/api/cities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, prefs, filters, initial: isInitial }),
    signal,
  })
  if (!r.ok) throw new Error(`status ${r.status}`)
  const out = (await r.json()) as { cities: any[] }
  return out.cities
}

function warmCache(cache: Map<string, ScoredCity>, list: ScoredCity[]) {
  for (const c of list) cache.set(c.geoId, c)
}

function mergeCompact(
  baseList: ScoredCity[],
  compact: CompactRow[],
  cache: Map<string, ScoredCity>
): ScoredCity[] {
  const baseById = new Map(baseList.map((c) => [c.geoId, c]))
  return compact.reduce((acc, n) => {
    const base = baseById.get(n.geoId) ?? cache.get(n.geoId)
    if (!base) return acc
    acc.push({ ...base, ...n })
    return acc
  }, [] as ScoredCity[])
}

export const useScoredCities = (year: number, prefs: Prefs, filters: Filters) => {
  const [cities, setCities] = useState<ScoredCity[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const firstLoadRef = useRef(true)
  const infoCacheRef = useRef(new Map<string, ScoredCity>())
  const debouncedPrefs = useDebouncedValue(prefs, 500)
  const debouncedFilters = useDebouncedValue(filters, 500)
  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()

    const run = async () => {
      if (firstLoadRef.current) setInitialLoading(true)

      if (firstLoadRef.current) {
        // 1) initial full payload for fast map render
        const initialCities = await fetchCities({
          year,
          prefs,
          filters,
          isInitial: true,
          signal: ctrl.signal,
        })
        if (ctrl.signal.aborted || cancelled) return
        warmCache(infoCacheRef.current, initialCities)
        setCities(initialCities)

        // 2) follow-up compact payload w/ prefs/filters
        const filteredCompact = await fetchCities({
          year,
          prefs,
          filters,
          isInitial: false,
          signal: ctrl.signal,
        })
        if (ctrl.signal.aborted || cancelled) return
        const merged = mergeCompact(initialCities, filteredCompact, infoCacheRef.current)
        setCities(merged)

        setInitialLoading(false)
        firstLoadRef.current = false
        return
      }

      // subsequent loads: compact only + merge into existing base
      const compactNext = await fetchCities({
        year,
        prefs: debouncedPrefs,
        filters: debouncedFilters,
        isInitial: false,
        signal: ctrl.signal,
      })
      if (ctrl.signal.aborted || cancelled) return
      const merged = mergeCompact(cities, compactNext, infoCacheRef.current)
      setCities(merged)
    }

    run()
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [year, debouncedPrefs, debouncedFilters])

  return { cities, initialLoading }
}
