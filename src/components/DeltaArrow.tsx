import React from 'react'

type Props = {
  delta?: number | null
  muted?: boolean
  scale?: number
  precision?: number
}

export const DeltaArrow = ({ delta, muted, scale, precision }: Props) => {
  const fmtDelta = (d?: number | null) => {
    if (d == null || !Number.isFinite(d)) return { arrow: '', text: '—', color: '#94a3b8' }
    let r = precision != null ? Number(d.toFixed(precision)) : Math.round(d)
    if (Object.is(r, -0)) r = 0
    const textVal = precision != null ? r.toFixed(precision) : String(r)
    if (r > 0) return { arrow: '↑', text: `+${textVal}`, color: '#22c55e' }
    if (r < 0) return { arrow: '↓', text: `${textVal}`, color: '#ef4444' }
    return { arrow: '–', text: precision != null ? (0).toFixed(precision) : '0', color: '#94a3b8' }
  }

  const d = fmtDelta(delta)
  const color = muted ? '#94a3b8' : d.color
  const fontSize = scale ? `${scale}em` : undefined

  // Arrow scaling based on magnitude
  const absVal = Math.abs(delta ?? 0)
  let arrowScale = 1
  if (absVal < 1) arrowScale = 0.8
  else if (absVal < 3) arrowScale = 1
  else if (absVal < 5) arrowScale = 1.3
  else arrowScale = 1.6

  return (
    <span style={{ color, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <span
        style={{ fontSize: fontSize ? `calc(${fontSize} * ${arrowScale})` : `${arrowScale}em` }}
      >
        {d.arrow}
      </span>
      <span style={{ fontSize }}>{d.text}</span>
    </span>
  )
}
