import { CircleMarker, Tooltip, useMap, Marker } from 'react-leaflet'
import * as L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import type { ScoredCity } from '../../../../shared/types/types'
import { DeltaArrow } from './DeltaArrow'
import React from 'react'

type Props = {
  cities: ScoredCity[]
  onCityClick?: (c: ScoredCity) => void
  showDeltaArrows?: boolean
}

export const CityCircles = ({ cities, onCityClick, showDeltaArrows }: Props) => {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom())
    map.on('zoomend', onZoom)
    return () => {
      map.off('zoomend', onZoom)
    }
  }, [map])

  const items = useMemo(
    () =>
      (cities as ScoredCity[]).map((c) => {
        const pop = c.population ?? 0
        const base = 2 + Math.sqrt(pop) / 120
        const radius = Math.min(24, base * Math.pow(1.15, zoom - 4))
        const color = c.colorHex ?? '#9ca3af'
        const offsetPx = Math.round(radius + 2)

        // Only compute deltaIcon if showDeltaArrows is true
        let deltaIcon: L.DivIcon | null = null
        if (showDeltaArrows) {
          const d = Number(c.ratioDelta)
          const absVal = Math.abs(d)
          let arrowScale = 1
          if (absVal < 1) arrowScale = 0.8
          else if (absVal < 3) arrowScale = 1
          else if (absVal < 5) arrowScale = 1.3
          else arrowScale = 1.6
          if (Number.isFinite(d)) {
            const isUp = d > 0
            const isDown = d < 0
            const sym = isUp ? '↑' : isDown ? '↓' : '•'
            const col = isUp ? '#22c55e' : isDown ? '#ef4444' : '#e5e7eb'
            const html = `
            <div style="
              position: relative;
              left: 100%;
              top: 50%;
              transform: translate(${offsetPx}px, -50%);
              font-size: ${11 * arrowScale}px;
              line-height: 1;
              font-weight: 700;
              color: ${col};
              text-shadow: 0 1px 2px rgba(0,0,0,.6);
              pointer-events: none;
              user-select: none;
            ">${sym}</div>`
            deltaIcon = L.divIcon({
              className: 'delta-icon',
              html,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            })
          }
        }

        return { c, radius, color, pop, deltaIcon }
      }),
    [cities, zoom, showDeltaArrows]
  )

  return (
    <>
      {items.map(({ c, radius, color, deltaIcon }) => (
        <>
          <CircleMarker
            className="city-circle"
            key={c.geoId}
            center={[c.lat, c.lon]}
            radius={radius}
            pathOptions={{ color, fillColor: color, weight: 1, fillOpacity: 0.75 }}
            eventHandlers={{ click: () => onCityClick?.(c) }}
          >
            <Tooltip>
              <strong>
                {c.city}, {c.state}
              </strong>
              <div>
                ratio {Math.round(c.ratioPer100 as number)} / 100{' '}
                <DeltaArrow delta={c.ratioDelta} precision={1} />
              </div>
              <div>pop {c.population?.toLocaleString?.() ?? 'n/a'}</div>
            </Tooltip>
          </CircleMarker>

          {deltaIcon && (
            <Marker
              key={`${c.geoId}-delta`}
              position={[c.lat, c.lon]}
              icon={deltaIcon}
              interactive={false}
              zIndexOffset={1000}
            />
          )}
        </>
      ))}
    </>
  )
}
