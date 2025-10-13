import React from 'react'

export const DualRange = ({
  min,
  max,
  step = 1,
  minValue,
  maxValue,
  onChangeMin,
  onChangeMax,
}: {
  min: number
  max: number
  step?: number
  minValue: number
  maxValue: number
  onChangeMin: (v: number) => void
  onChangeMax: (v: number) => void
}) => {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const left = pct(minValue)
  const right = pct(maxValue)

  return (
    <div className="dual-range" role="group" aria-label="Dual range slider">
      <div className="track" />
      <div className="active" style={{ left: `${left}%`, width: `${right - left}%` }} />

      <span className="bubble" style={{ left: `${left}%` }} aria-hidden>
        {minValue}
      </span>
      <span className="bubble" style={{ left: `${right}%` }} aria-hidden>
        {maxValue}
      </span>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minValue}
        aria-label="Minimum value"
        onChange={(e) => onChangeMin(clamp(Number(e.target.value), min, maxValue))}
        style={{ zIndex: 2 }}
      />

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxValue}
        aria-label="Maximum value"
        onChange={(e) => onChangeMax(clamp(Number(e.target.value), minValue, max))}
        style={{ zIndex: 3 }}
      />
    </div>
  )
}
