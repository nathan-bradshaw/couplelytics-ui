import React from 'react'

type Props = {
  showHeatmap: boolean
  onHeatmap: (v: boolean) => void
  showDeltaArrows: boolean
  onDelta: (v: boolean) => void
  compareMode: boolean
  onCompare: (v: boolean) => void
}

export const TogglesBar = ({
  showHeatmap,
  onHeatmap,
  showDeltaArrows,
  onDelta,
  compareMode,
  onCompare,
}: Props) => (
  <div className="compare-toggle">
    <label>
      <input
        type="checkbox"
        checked={showDeltaArrows}
        onChange={(e) => onDelta(e.target.checked)}
      />
      Delta arrows (Ratio trend)
    </label>
    <label>
      <input type="checkbox" checked={showHeatmap} onChange={(e) => onHeatmap(e.target.checked)} />
      Heatmap
    </label>
    <label>
      <input type="checkbox" checked={compareMode} onChange={(e) => onCompare(e.target.checked)} />
      Compare cities
    </label>
  </div>
)
