import { MapContainer, TileLayer, LayersControl, useMap } from 'react-leaflet'
import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet.heat'
import type {
  HeatOptions,
  HeatPoint,
  ScoredCity,
  HeatLayer,
  FlyToTarget,
} from '../../../../shared/types/types'
import { AutoResize } from './AutoResize'
import { CityCircles } from './CityCircles'
import React from 'react'

// factory accessor
const heatFactory = (
  L as unknown as { heatLayer: (pts: HeatPoint[], opts?: HeatOptions) => HeatLayer }
).heatLayer

type Props = {
  cities: ScoredCity[]
  onCityClick?: (c: ScoredCity) => void
  showHeatmap?: boolean
  showDeltaArrows?: boolean
  flyTo?: FlyToTarget | null
}

// Split heatmap into three layers to avoid green points fading into red halos.
// Each layer uses a transparent low-end and a single hue gradient.
const MultiHeatOverlay = ({ points }: { points: ScoredCity[] }) => {
  const map = useMap()

  // Prepare three heat point sets
  const {
    greenS,
    greenM,
    greenL,
    greenXL,
    yellowS,
    yellowM,
    yellowL,
    yellowXL,
    redS,
    redM,
    redL,
    redXL,
  } = useMemo(() => {
    const mk = (): HeatPoint[] => []
    const buckets = {
      greenS: mk(),
      greenM: mk(),
      greenL: mk(),
      greenXL: mk(),
      yellowS: mk(),
      yellowM: mk(),
      yellowL: mk(),
      yellowXL: mk(),
      redS: mk(),
      redM: mk(),
      redL: mk(),
      redXL: mk(),
    }

    for (const p of points) {
      const lat = p.lat
      const lon = p.lon
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue

      const bin = p.popBin ?? 'S'
      const color = p.heatColor ?? 'yellow'
      const intensity = p.heatIntensity ?? 0.5

      buckets[`${color}${bin}` as keyof typeof buckets].push([lat, lon, intensity])
    }
    return buckets
  }, [points])

  useEffect(() => {
    if (!map) return
    // Ensure separate panes so we can control visual priority (z-index)
    const ensurePane = (name: string, z: number) => {
      if (!map.getPane(name)) {
        map.createPane(name)
        const paneEl = map.getPane(name) as HTMLElement
        paneEl.style.zIndex = String(z)
      }
      return name
    }
    const PANE_RED = ensurePane('heat-red', 410)
    const PANE_YELLOW = ensurePane('heat-yellow', 420)
    const PANE_GREEN = ensurePane('heat-green', 430) // highest priority

    const zToRadius = (z: number, base: number) => {
      // stronger zoom scaling to accentuate size differences
      return base * (z <= 4 ? 1.0 : z <= 6 ? 1.25 : 1.55)
    }

    const mkLayer = (
      pts: HeatPoint[],
      color: 'green' | 'yellow' | 'red',
      base: number,
      paneName: string
    ): HeatLayer => {
      const gradient: Record<number, string> =
        color === 'green'
          ? { 0: 'rgba(52,211,153,0.03)', 0.3: '#34d399', 1: '#065f46' }
          : color === 'yellow'
            ? { 0: 'rgba(250,204,21,0.03)', 0.4: '#fde047', 1: '#facc15' }
            : { 0: 'rgba(239,68,68,0.03)', 0.3: '#ef4444', 1: '#7f1d1d' }

      const layer = heatFactory(pts, {
        radius: zToRadius(map.getZoom(), base),
        blur: 24,
        minOpacity: 0.18,
        maxZoom: 12,
        max: 1.0,
        gradient,
        pane: paneName,
      })
      layer.addTo(map)
      return layer
    }

    // Base radii per population bin (S, M, L, XL)
    const R_S = 10,
      R_M = 18,
      R_L = 36,
      R_XL = 58

    const layers: HeatLayer[] = [
      // RED (lowest priority / bottom)
      mkLayer(redS, 'red', R_S, PANE_RED),
      mkLayer(redM, 'red', R_M, PANE_RED),
      mkLayer(redL, 'red', R_L, PANE_RED),
      mkLayer(redXL, 'red', R_XL, PANE_RED),
      // YELLOW (middle)
      mkLayer(yellowS, 'yellow', R_S, PANE_YELLOW),
      mkLayer(yellowM, 'yellow', R_M, PANE_YELLOW),
      mkLayer(yellowL, 'yellow', R_L, PANE_YELLOW),
      mkLayer(yellowXL, 'yellow', R_XL, PANE_YELLOW),
      // GREEN (highest priority / top)
      mkLayer(greenS, 'green', R_S, PANE_GREEN),
      mkLayer(greenM, 'green', R_M, PANE_GREEN),
      mkLayer(greenL, 'green', R_L, PANE_GREEN),
      mkLayer(greenXL, 'green', R_XL, PANE_GREEN),
    ]

    const handleZoom = () => {
      const z = map.getZoom()
      // update radii on zoom
      const bases: number[] = [R_S, R_M, R_L, R_XL, R_S, R_M, R_L, R_XL, R_S, R_M, R_L, R_XL]
      layers.forEach((ly, i) => ly.setOptions({ radius: zToRadius(z, bases[i]) }))
    }
    map.on('zoomend', handleZoom)

    return () => {
      map.off('zoomend', handleZoom)
      layers.forEach((ly) => map.removeLayer(ly))
      ;['heat-green', 'heat-yellow', 'heat-red'].forEach((name) => {
        const pane: HTMLElement | undefined = map.getPane(name)
        if (pane && pane.parentElement) pane.parentElement.removeChild(pane)
      })
    }
  }, [
    map,
    greenS,
    greenM,
    greenL,
    greenXL,
    yellowS,
    yellowM,
    yellowL,
    yellowXL,
    redS,
    redM,
    redL,
    redXL,
  ])

  return null
}

const FlyToEffect = ({ to }: { to?: FlyToTarget | null }) => {
  const map = useMap()

  useEffect(() => {
    if (!map || !to) return
    const { lat, lon, zoom, durationSec } = to
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    const targetZoom = typeof zoom === 'number' ? zoom : map.getZoom()
    const duration = typeof durationSec === 'number' ? durationSec : 0.9
    map.flyTo([lat, lon], targetZoom, { animate: true, duration })
  }, [map, to?.lat, to?.lon, to?.zoom, to?.durationSec, to?.seq])

  return null
}

export const CityMap = ({ cities, onCityClick, showHeatmap, showDeltaArrows, flyTo }: Props) => (
  <MapContainer center={[39.5, -98.35]} zoom={4} className="mapPane">
    <AutoResize />
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked name="Dark Mode">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="OSM Standard">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="OSM Humanitarian">
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors, Humanitarian style"
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="OpenTopoMap">
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution="Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap"
        />
      </LayersControl.BaseLayer>

      {showHeatmap && (
        <LayersControl.Overlay checked name="Heatmap">
          {/* Mounts three single-hue layers (red/yellow/green) to avoid color bleed */}
          <MultiHeatOverlay points={cities} />
        </LayersControl.Overlay>
      )}
    </LayersControl>
    <CityCircles cities={cities} onCityClick={onCityClick} showDeltaArrows={showDeltaArrows} />
    <FlyToEffect to={flyTo} />
  </MapContainer>
)
