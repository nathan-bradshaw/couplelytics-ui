import { useEffect, useMemo, useRef, useState } from 'react'
import { CityMap } from './components/CityMap'
import { Controls } from './components/Controls'
import type { ScoredCity, Prefs, Filters, MaybeCity } from '../../../shared/types/types'
import { ResultsList } from './components/ResultsList'
import React from 'react'
import { useScoredCities } from './hooks/useScoredCities'
import { SearchBar } from './components/SearchBar'
import { TogglesBar } from './components/TogglesBar'
import { CompareSummary } from './components/CompareSummary'
import { CityDrawers } from './components/CityDrawers'
import { deriveVisible } from './utils/deriveVisible'
import './index.css'
import { LoadingDots } from './components/LoadingDots'
import { Analytics } from '@vercel/analytics/react'

const initialPrefs: Prefs = {
  ageMin: 24,
  ageMax: 32,
  targetGender: 'female',
}

// localStorage helpers
const readLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const writeLS = (key: string, val: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (err) {
    console.log(`[localStorage] Failed to set ${key}: ${err}`)
  }
}

export const App = () => {
  const mobileQuery = '(max-width: 768px), (max-height: 500px)'
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(mobileQuery).matches)
  useEffect(() => {
    const mql = window.matchMedia(mobileQuery)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  // orientation (portrait vs. landscape) — hide Filters button in landscape
  const [isPortrait, setIsPortrait] = useState(
    () => window.matchMedia('(orientation: portrait)').matches
  )
  useEffect(() => {
    const mql = window.matchMedia('(orientation: portrait)')
    const onChange = (e: MediaQueryListEvent) => setIsPortrait(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  // Preferred data year
  const [year] = useState<number>(() => readLS('year', 2024))
  const [prefs, setPrefs] = useState<Prefs>(() => readLS<Prefs>('prefs', initialPrefs))

  const [selectedCity, setSelectedCity] = useState<ScoredCity | null>(null)
  const [filters, setFilters] = useState<Filters>(() => readLS<Filters>('filters', {}))
  const { cities, initialLoading } = useScoredCities(year, prefs, filters)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [compareMode, setCompareMode] = useState<boolean>(() => readLS('compareMode', false))
  const [selectedA, setSelectedA] = useState<MaybeCity>(null)
  const [selectedB, setSelectedB] = useState<MaybeCity>(null)
  const [lastEdited, setLastEdited] = useState<'A' | 'B'>('B')
  const [showHeatmap, setShowHeatmap] = useState<boolean>(() => readLS('showHeatmap', false))

  const [showDeltaArrows, setShowDeltaArrows] = useState<boolean>(() =>
    readLS('showDeltaArrows', false)
  )
  const [citySearch, setCitySearch] = useState<string>(() => readLS('citySearch', ''))
  const [flyTo, setFlyTo] = useState<{
    lat: number
    lon: number
    zoom?: number
    durationSec?: number
    seq?: number
  } | null>(null)
  const flySeqRef = useRef(0)

  const handlePickSuggestion = (c: ScoredCity) => {
    // select city and zoom
    handleCityPick(c)
    setCitySearch(`${c.city}, ${c.state}`)
    const zoom = 7
    const next = ++flySeqRef.current
    setFlyTo({ lat: c.lat, lon: c.lon, zoom, seq: next })
  }

  // useEffect(() => {
  //   console.log('Preferences updated:', prefs)
  // }, [prefs])

  useEffect(() => {
    writeLS('prefs', prefs)
    writeLS('filters', filters)
    writeLS('compareMode', compareMode)
    writeLS('showHeatmap', showHeatmap)
    writeLS('showDeltaArrows', showDeltaArrows)
    writeLS('citySearch', citySearch)
  }, [prefs, filters, compareMode, showHeatmap, showDeltaArrows, citySearch])

  const visible: ScoredCity[] = useMemo(() => {
    return deriveVisible(cities, citySearch)
  }, [cities, filters, citySearch])

  const handleCityPick = (c: ScoredCity) => {
    if (compareMode) {
      // fill A then B. after both are set, alternate replacements
      if (!selectedA) {
        setSelectedA(c)
        setLastEdited('A')
        return
      }
      if (!selectedB) {
        setSelectedB(c)
        setLastEdited('B')
        return
      }
      if (lastEdited === 'A') {
        setSelectedB(c)
        setLastEdited('B')
      } else {
        setSelectedA(c)
        setLastEdited('A')
      }
    } else {
      // Normal single-drawer behavior
      setSelectedCity(c)
    }
  }

  const drawersOpen = useMemo(
    () => (compareMode ? Number(!!selectedA) + Number(!!selectedB) : Number(!!selectedCity)),
    [compareMode, selectedA, selectedB, selectedCity]
  )

  return (
    <div>
      {isMobile && isPortrait && (
        <button onClick={() => setSidebarOpen((v) => !v)} className="mobile-toggle">
          {sidebarOpen ? 'Close Filters' : 'Filters'}
        </button>
      )}
      <div className="mapWrap">
        {initialLoading ? (
          <LoadingDots />
        ) : (
          <CityMap
            cities={visible}
            onCityClick={handleCityPick}
            showHeatmap={showHeatmap}
            showDeltaArrows={showDeltaArrows}
            flyTo={flyTo}
          />
        )}

        <div className="map-legend">
          <div className="map-legend-item">
            <span className="legend-swatch" style={{ background: '#ef4444' }} /> Unfavorable
          </div>
          <div className="map-legend-item">
            <span className="legend-swatch" style={{ background: '#facc15' }} /> Balanced
          </div>
          <div className="map-legend-item">
            <span className="legend-swatch" style={{ background: '#34d399' }} /> Favorable
          </div>
        </div>
      </div>

      <aside
        className="overlay-sidebar controls-dark"
        data-open={isMobile ? (sidebarOpen ? 'true' : undefined) : undefined}
      >
        <div className="brand-header">
          <img
            src="/couplelytics.png"
            alt="Couplelytics logo"
            className="brand-logo"
            style={{ width: 64, height: 64 }}
          />
          <h2 className="brand-title">Couplelytics</h2>
        </div>
        <SearchBar
          value={citySearch}
          onChange={(v) => setCitySearch(v)}
          visible={visible}
          onPick={handlePickSuggestion}
        />
        <TogglesBar
          showHeatmap={showHeatmap}
          onHeatmap={setShowHeatmap}
          showDeltaArrows={showDeltaArrows}
          onDelta={setShowDeltaArrows}
          compareMode={compareMode}
          onCompare={(on) => {
            setCompareMode(on)
            if (on) {
              setSelectedCity(null)
              setLastEdited('B')
            }
          }}
        />
        <CompareSummary
          compareMode={compareMode}
          selectedA={selectedA}
          selectedB={selectedB}
          onClear={() => {
            setSelectedA(null)
            setSelectedB(null)
            setLastEdited('B')
          }}
        />
        <Controls
          cities={visible}
          prefs={prefs}
          onChange={setPrefs}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </aside>

      {!compareMode && <ResultsList cities={visible} prefs={prefs} shift={drawersOpen} />}

      <CityDrawers
        compareMode={compareMode}
        selectedCity={selectedCity}
        selectedA={selectedA}
        selectedB={selectedB}
        onCloseSingle={() => setSelectedCity(null)}
        onCloseA={() => setSelectedA(null)}
        onCloseB={() => setSelectedB(null)}
        prefs={prefs}
      />
      <Analytics />
    </div>
  )
}
