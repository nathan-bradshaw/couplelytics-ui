import React from 'react'
import type { ScoredCity } from '../../../../shared/types/types'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  visible: ScoredCity[]
  onPick: (c: ScoredCity) => void
}

export const SearchBar = ({ value, onChange, visible, onPick }: Props) => {
  const [suppress, setSuppress] = useState(false)

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (suppress || q.length < 2) return []
    const ranked = visible
      .map((c) => {
        const name = `${c.city}, ${c.state}`.toLowerCase()
        const starts = name.startsWith(q) ? 0 : 1
        const includes = name.includes(q) ? 0 : 2
        return { c, rank: starts + includes }
      })
      .filter((x) => x.rank < 3)
      .sort((a, b) => a.rank - b.rank || (b.c.population ?? 0) - (a.c.population ?? 0))
      .slice(0, 8)
      .map((x) => x.c)
    return ranked
  }, [value, visible, suppress])

  useEffect(() => setSuppress(false), [value])

  return (
    <div className="city-search">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setSuppress(false)}
        onBlur={() => setSuppress(true)}
        placeholder="Search city or state…"
        aria-label="Search cities"
      />
      {value && (
        <button
          type="button"
          className="btn-clear"
          onMouseDown={() => onChange('')}
          aria-label="Clear search"
          title="Clear"
        >
          ×
        </button>
      )}
      {suggestions.length > 0 && (
        <ul className="search-suggestions" role="listbox">
          {suggestions.map((s) => (
            <li key={s.geoId}>
              <button
                type="button"
                className="suggestion"
                onMouseDown={() => onPick(s)}
                aria-label={`Select ${s.city}, ${s.state}`}
              >
                <span className="s-city">{s.city}</span>
                <span className="s-state">{s.state}</span>
                {typeof s.population === 'number' && (
                  <span className="s-pop">{s.population.toLocaleString()}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
