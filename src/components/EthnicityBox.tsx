import { useState } from 'react'
import { DeltaArrow } from './DeltaArrow'
import type { Ethnicity } from '../../../../shared/types/types'
import React from 'react'

type RowVM = {
  key: Ethnicity
  label: string
  pct: number
  mSplit: number
  fSplit: number
  delta: number | null
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round((v || 0) * 100)))

const computeSplits = (sex?: { male: number; female: number }, enabled = false) => {
  if (!enabled) return { mSplit: 0, fSplit: 0 }
  const m = Number(sex?.male ?? 0)
  const f = Number(sex?.female ?? 0)
  const denom = m + f
  if (denom <= 0) return { mSplit: 0, fSplit: 0 }
  const mSplit = Math.round((m / denom) * 100)
  return { mSplit, fSplit: 100 - mSplit }
}

const toRows = (
  ethnicityShares: Record<Ethnicity, number>,
  byRaceSex: Partial<Record<Ethnicity, { male: number; female: number }>> | undefined,
  ethnicityDeltas: Partial<Record<Ethnicity, number | null>> | undefined,
  showGender: boolean
): RowVM[] => {
  return (
    Object.entries(ethnicityShares)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .slice(0, 4) as Array<[Ethnicity, number]>
  ).map(([k, v]) => {
    const pct = clampPct(v)
    const { mSplit, fSplit } = computeSplits(byRaceSex?.[k], showGender)
    const delta = ethnicityDeltas?.[k] ?? null
    return { key: k, label: cap(k), pct, mSplit, fSplit, delta }
  })
}

type Props = {
  ethnicityShares: Record<string, number>
  byRaceSex?: Record<string, { male: number; female: number }>
  ethnicityDeltas?: Partial<Record<Ethnicity, number | null>>
  prefEthnicity?: Ethnicity
}

export const EthnicityBox = ({
  ethnicityShares,
  byRaceSex,
  ethnicityDeltas,
  prefEthnicity,
}: Props) => {
  const [showGender, setShowGender] = useState(true)
  const rows = React.useMemo(
    () =>
      toRows(ethnicityShares as Record<Ethnicity, number>, byRaceSex, ethnicityDeltas, showGender),
    [ethnicityShares, byRaceSex, ethnicityDeltas, showGender]
  )

  return (
    <div className="mini-card mt-8">
      <div className="k mini-card__head">
        <span>Ethnicity</span>
        <button
          type="button"
          onClick={() => setShowGender((s) => !s)}
          className="btn-toggle"
          aria-pressed={showGender}
          title={showGender ? 'Show totals' : 'Break down by gender'}
        >
          {showGender ? 'Totals' : 'By gender'}
        </button>
      </div>
      <div className="ethnicity">
        {rows.map((r) => (
          <div
            key={r.key}
            className="eth-row"
            data-pref={prefEthnicity && r.key === prefEthnicity ? '1' : '0'}
            style={
              prefEthnicity === r.key
                ? {
                    background: 'rgba(250, 204, 21, 0.08)',
                    border: '1px solid #fde68a',
                    borderRadius: 6,
                    padding: 4,
                  }
                : undefined
            }
          >
            <div className="eth-k" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{r.label}</span>
              <span className="delta-wrap">
                <DeltaArrow delta={r.delta} scale={0.6} precision={1} />
              </span>
            </div>
            <div>
              <div className="progress" title={`${r.pct}%`}>
                {showGender ? (
                  <div style={{ width: `${r.pct}%`, height: '100%' }}>
                    <div className="progress-split">
                      <div
                        className="progress__bar"
                        style={{ width: `${r.mSplit}%`, opacity: 0.95 }}
                      />
                      <div
                        className="progress__bar"
                        style={{ width: `${r.fSplit}%`, opacity: 0.6 }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="progress__bar" style={{ width: `${r.pct}%` }} />
                )}
              </div>
              {showGender && (
                <div className="eth-gender">
                  {r.mSplit}% M · {r.fSplit}% F
                </div>
              )}
            </div>
            <div className="progress__pct">
              <span>{`${r.pct}%`}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
