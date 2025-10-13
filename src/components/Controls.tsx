import type { Prefs, ScoredCity, Filters } from '../../../../shared/types/types'
import React, { useState, useRef, useCallback, startTransition } from 'react'
import { DualRange } from './DualRange'

export type Props = {
  cities: ScoredCity[]
  prefs: Prefs
  onChange: (next: Prefs) => void
  filters: Filters
  onFiltersChange: (next: Filters) => void
}

export const Controls = ({ cities, prefs, onChange, filters, onFiltersChange }: Props) => {
  const [ageMin, setAgeMin] = useState(prefs.ageMin ?? 24)
  const [ageMax, setAgeMax] = useState(prefs.ageMax ?? 32)

  const pending = useRef<number | null>(null)

  const schedule = useCallback(
    (next: Prefs) => {
      if (pending.current) window.clearTimeout(pending.current)
      pending.current = window.setTimeout(() => {
        startTransition(() => onChange(next))
      }, 100)
    },
    [onChange]
  )

  const commit = useCallback(
    (next: Prefs) => {
      if (pending.current) window.clearTimeout(pending.current)
      onChange(next)
    },
    [onChange]
  )

  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => onChange({ ...prefs, [k]: v })

  const F = { ...(filters as Filters) }
  const setF = (patch: Partial<Filters>) => onFiltersChange({ ...filters, ...patch })
  const chip = {
    pop50: () => setF({ popMin: 50000 }),
    pop100: () => setF({ popMin: 100000 }),
    pop250: () => setF({ popMin: 250000 }),
    inc75: () => setF({ incomeMin: 75000 }),
  }

  return (
    <div className="controls-dark controls">
      <p className="hint-text tip tip--compact">Tip: Click a city for details</p>
      {/* Filters */}
      <div className="section">
        <p className="legend-text">Filters</p>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="label-text">Age window</span>
          <span className="legend-text" style={{ fontSize: 12 }}>
            {ageMin}–{ageMax}
          </span>
        </div>
        <div onPointerUp={() => commit({ ...prefs, ageMin, ageMax })}>
          <DualRange
            min={18}
            max={60}
            minValue={ageMin}
            maxValue={ageMax}
            onChangeMin={(v) => {
              setAgeMin(v)
              schedule({ ...prefs, ageMin: v, ageMax })
            }}
            onChangeMax={(v) => {
              setAgeMax(v)
              schedule({ ...prefs, ageMin, ageMax: v })
            }}
          />
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="label-text">Seeking</span>
          <label className="row">
            <input
              type="radio"
              name="seek"
              checked={prefs.targetGender === 'male'}
              onChange={() => set('targetGender', 'male')}
            />
            <span className="label-text">Men</span>
          </label>
          <label className="row">
            <input
              type="radio"
              name="seek"
              checked={prefs.targetGender === 'female'}
              onChange={() => set('targetGender', 'female')}
            />
            <span className="label-text">Women</span>
          </label>
        </div>
      </div>

      {/* Ethnicity */}
      <div className="section">
        <p className="legend-text">Ethnicity (US Census)</p>
        <div className="row">
          <select
            value={prefs.ethnicity ?? 'none'}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const next = e.target.value as Prefs['ethnicity']
              onChange({ ...prefs, ethnicity: next })
            }}
          >
            <option value="none">No preference</option>
            <option value="white">White</option>
            <option value="black">Black/African American</option>
            <option value="hispanic">Hispanic/Latino</option>
            <option value="asian">Asian</option>
            <option value="native">American Indian/Alaska Native</option>
            <option value="pacific">Native Hawaiian/Pacific Islander</option>
            <option value="mixed">Multiracial</option>
          </select>
        </div>
      </div>

      {/* Smart Filters (no new weighting) */}
      <div className="section">
        <div className="smart-head">
          <p className="legend-text">Smart filters</p>
          <span className="count-pill">{cities?.length ?? 0} cities</span>
        </div>
        <span className="hint-text">Configure thresholds</span>
        {/* Population min–max with quick chips */}
        <div className="smart-row">
          <span className="label-text smart-label">Population</span>
          <input
            className="smart-input"
            type="number"
            placeholder="min"
            value={F.popMin ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined
              if (val !== undefined && val < 10000) {
                setF({ popMin: 10000 })
              } else {
                setF({ popMin: val })
              }
            }}
          />
          <input
            className="smart-input"
            type="number"
            placeholder="max"
            value={F.popMax ?? ''}
            onChange={(e) => setF({ popMax: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="hint-text" style={{ marginTop: 4, marginBottom: 8 }}>
          Min ≥ 10,000
        </div>
        <div className="smart-chips">
          <button type="button" className="preset-btn" onClick={chip.pop50}>
            ≥ 50k
          </button>
          <button type="button" className="preset-btn" onClick={chip.pop100}>
            ≥ 100k
          </button>
          <button type="button" className="preset-btn" onClick={chip.pop250}>
            ≥ 250k
          </button>
        </div>

        {/* Ratio per 100 (min and max) */}
        <div className="smart-row">
          <span className="label-text smart-label">Ratio /100</span>
          <input
            className="smart-input"
            type="number"
            placeholder="min"
            value={F.ratioMin ?? ''}
            onChange={(e) =>
              setF({ ratioMin: e.target.value ? Number(e.target.value) : undefined })
            }
          />
          <input
            className="smart-input"
            type="number"
            placeholder="max"
            value={F.ratioMax ?? ''}
            onChange={(e) =>
              setF({ ratioMax: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>

        {/* Delta (rate of change) min and max */}
        <div className="smart-row">
          <span className="label-text smart-label">Delta</span>
          <input
            className="smart-input"
            type="number"
            placeholder="min Δ"
            value={F.deltaMin ?? ''}
            onChange={(e) =>
              setF({ deltaMin: e.target.value ? Number(e.target.value) : undefined })
            }
          />
          <input
            className="smart-input"
            type="number"
            placeholder="max Δ"
            value={F.deltaMax ?? ''}
            onChange={(e) =>
              setF({ deltaMax: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>

        {/* Singles % min and max */}
        <div className="smart-row">
          <span className="label-text smart-label">Singles %</span>
          <input
            className="smart-input"
            type="number"
            placeholder="min %"
            value={F.singlesMin != null ? Math.round((F.singlesMin ?? 0) * 100) : ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) / 100 : undefined
              setF({ singlesMin: v })
            }}
          />
          <input
            className="smart-input"
            type="number"
            placeholder="max %"
            value={F.singlesMax != null ? Math.round((F.singlesMax ?? 0) * 100) : ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) / 100 : undefined
              setF({ singlesMax: v })
            }}
          />
        </div>

        {/* Bachelor’s+ % min and max */}
        <div className="smart-row">
          <span className="label-text smart-label">B.A./B.S.+%</span>
          <input
            className="smart-input"
            type="number"
            placeholder="min %"
            value={F.degreeMin != null ? Math.round((F.degreeMin ?? 0) * 100) : ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) / 100 : undefined
              setF({ degreeMin: v })
            }}
          />
          <input
            className="smart-input"
            type="number"
            placeholder="max %"
            value={F.degreeMax != null ? Math.round((F.degreeMax ?? 0) * 100) : ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) / 100 : undefined
              setF({ degreeMax: v })
            }}
          />
        </div>

        {/* Median age range */}
        <div className="smart-row">
          <span className="label-text smart-label">Median age</span>
          <input
            className="smart-input"
            type="number"
            placeholder="min"
            value={F.ageMin ?? ''}
            onChange={(e) => setF({ ageMin: e.target.value ? Number(e.target.value) : undefined })}
          />
          <input
            className="smart-input"
            type="number"
            placeholder="max"
            value={F.ageMax ?? ''}
            onChange={(e) => setF({ ageMax: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        {/* Median income min–max with quick chip */}
        <div className="smart-row">
          <span className="label-text smart-label">Income ($)</span>
          <input
            className="smart-input"
            type="number"
            placeholder="min"
            value={F.incomeMin ?? ''}
            onChange={(e) =>
              setF({ incomeMin: e.target.value ? Number(e.target.value) : undefined })
            }
          />
          <input
            className="smart-input"
            type="number"
            placeholder="max"
            value={F.incomeMax ?? ''}
            onChange={(e) =>
              setF({ incomeMax: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div className="smart-chips">
          <button type="button" className="preset-btn" onClick={chip.inc75}>
            ≥ $75k
          </button>
        </div>

        {/* Median rent min and max */}
        <div className="smart-row">
          <span className="label-text smart-label">Rent ($)</span>
          <input
            className="smart-input"
            type="number"
            placeholder="min"
            value={F.rentMin ?? ''}
            onChange={(e) => setF({ rentMin: e.target.value ? Number(e.target.value) : undefined })}
          />
          <input
            className="smart-input"
            type="number"
            placeholder="max"
            value={F.rentMax ?? ''}
            onChange={(e) => setF({ rentMax: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="smart-row smart-row--end">
          <button
            type="button"
            className="reset-btn"
            onClick={() => onFiltersChange({ popMin: 10000 })}
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>
  )
}
