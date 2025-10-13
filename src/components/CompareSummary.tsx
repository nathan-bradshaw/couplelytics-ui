import React from 'react'
import type { ScoredCity } from '../../../../shared/types/types'

type Props = {
  compareMode: boolean
  selectedA: ScoredCity | null
  selectedB: ScoredCity | null
  onClear: () => void
}

export const CompareSummary = ({ compareMode, selectedA, selectedB, onClear }: Props) => {
  if (!compareMode) return null
  return (
    <div className="compare-summary">
      <span className="pill">A: {selectedA ? `${selectedA.city}, ${selectedA.state}` : '—'}</span>
      <span className="pill">B: {selectedB ? `${selectedB.city}, ${selectedB.state}` : '—'}</span>
      <button className="btn-link" onClick={onClear}>
        Clear
      </button>
    </div>
  )
}
