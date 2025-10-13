import { useState } from 'react'
import type { Prefs, ScoredCity } from '../../../../shared/types/types'
import { DeltaArrow } from './DeltaArrow'
import React from 'react'

type RankMode = 'ratio' | 'presence' | 'ratioPresence' | 'largest' | 'delta'

type ResultsListProps = {
  cities: ScoredCity[]
  prefs: Prefs
  shift?: boolean | number
}

export const ResultsList = ({ cities, prefs, shift }: ResultsListProps) => {
  const [rankMode, setRankMode] = useState<RankMode>('ratio')

  const fmt = (value: number) => {
    switch (rankMode) {
      case 'ratio':
        return value.toFixed(2)
      case 'presence':
        return `${(value * 100).toFixed(1)}%`
      case 'ratioPresence':
        return value.toFixed(2)
      case 'largest':
        return Math.round(value).toLocaleString()
      case 'delta':
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
      default:
        return value.toString()
    }
  }

  const metric = (c: ScoredCity) => {
    switch (rankMode) {
      case 'ratio':
        return c.ratioPer100 ?? 0
      case 'presence':
        return c.presence ?? 0
      case 'ratioPresence':
        return (c.ratioPer100 ?? 0) * (c.presence ?? 0)
      case 'largest':
        return c.largest ?? 0
      case 'delta':
        return c.ratioDelta ?? 0
      default:
        return 0
    }
  }

  const sortedCities = [...cities].sort((a, b) => metric(b) - metric(a))

  const shiftLevel = typeof shift === 'number' ? shift : shift ? 1 : 0

  return (
    <div className="resultsBox" data-shift={String(shiftLevel)}>
      <div className="results-header">
        <h4>Rankings</h4>
        <label className="rank-select">
          <span>Order by</span>
          <select value={rankMode} onChange={(e) => setRankMode(e.target.value as RankMode)}>
            <option value="ratio">Best ratio</option>
            <option value="largest">Largest amount</option>
            <option value="delta">Rate of change (Δ)</option>
            <option value="presence">Best presence</option>
            <option value="ratioPresence">Ratio × Presence</option>
          </select>
        </label>
      </div>
      <p className="results-units">
        {rankMode === 'ratio' ? (
          <>
            Units:{' '}
            {prefs.targetGender === 'female'
              ? 'women per 100 men'
              : prefs.targetGender === 'male'
                ? 'men / 100 women'
                : 'per 100'}
          </>
        ) : rankMode === 'presence' ? (
          <>Units: % of population</>
        ) : rankMode === 'ratioPresence' ? (
          <>Units: ratio × presence</>
        ) : rankMode === 'delta' ? (
          <>Units: Δ ratio per 100 (latest vs previous year)</>
        ) : rankMode === 'largest' ? (
          <>Units: people</>
        ) : null}
      </p>

      <div className="results-scroll">
        <ul>
          {sortedCities.map((c, i) => (
            <li key={c.geoId} className="results-item">
              <span className="rank">#{i + 1}</span>
              <span className="city">
                {c.city}, {c.state}
              </span>
              <span className="metric">
                {rankMode === 'delta' ? (
                  <>
                    <DeltaArrow delta={metric(c)} />
                  </>
                ) : (
                  fmt(metric(c))
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
