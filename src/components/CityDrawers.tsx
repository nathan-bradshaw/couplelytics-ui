import React from 'react'
import type { Prefs, ScoredCity } from '../../../../shared/types/types'
import { DetailsDrawer } from './DetailsDrawer'

type Props = {
  compareMode: boolean
  selectedCity: ScoredCity | null
  selectedA: ScoredCity | null
  selectedB: ScoredCity | null
  onCloseSingle: () => void
  onCloseA: () => void
  onCloseB: () => void
  prefs: Prefs
}

export const CityDrawers = ({
  compareMode,
  selectedCity,
  selectedA,
  selectedB,
  onCloseSingle,
  onCloseA,
  onCloseB,
  prefs,
}: Props) => {
  if (!compareMode) {
    return (
      <>
        {!compareMode && (
          <DetailsDrawer city={selectedCity} onClose={onCloseSingle} prefs={prefs} />
        )}
      </>
    )
  }
  return (
    <>
      {selectedA && (
        <DetailsDrawer city={selectedA} onClose={onCloseA} side="right" prefs={prefs} />
      )}
      {selectedB && (
        <DetailsDrawer city={selectedB} onClose={onCloseB} side="right-2" prefs={prefs} />
      )}
    </>
  )
}
