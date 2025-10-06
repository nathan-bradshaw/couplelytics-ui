import { useEffect, useState } from 'react'
import type { ScoredCity, Prefs, WikiSummary, WeatherPeriod } from '../../../../shared/types/types'
import { DeltaArrow } from './DeltaArrow'
import { EthnicityBox } from './EthnicityBox'
import React from 'react'
import { API } from '../../../../shared/config'

const numOr0 = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0)

type Props = {
  city: ScoredCity | null
  prefs: Prefs
  onClose: () => void
  side?: 'right' | 'right-2'
}

export const DetailsDrawer = ({ city, prefs, onClose, side = 'right' }: Props) => {
  const [fullCity, setFullCity] = useState<ScoredCity | null>(null)
  const [loading, setLoading] = useState(false)
  const [wiki, setWiki] = useState<WikiSummary | null>(null)
  const [wx, setWx] = useState<WeatherPeriod[] | null>(null)

  const fmtPct = (n?: number) => (n ? `${(n * 100).toFixed(1)}%` : 'n/a')
  const open = !!city
  const populationDelta = numOr0(fullCity?.populationDeltaPct ?? null)

  const population = fullCity?.population ?? 0
  const ratio = fullCity?.ratioPer100 ?? 0
  type WithLinks = { mapUrl?: string; walkScoreUrl?: string }
  const mapUrl = (fullCity as (ScoredCity & WithLinks) | null)?.mapUrl ?? ''
  const walkScoreUrl = (fullCity as (ScoredCity & WithLinks) | null)?.walkScoreUrl ?? ''

  const ratioDelta = numOr0(fullCity?.ratioDelta ?? null)
  const singlesDelta = numOr0(fullCity?.neverMarriedDeltaPctPt ?? null)
  const baPlusDelta = numOr0(fullCity?.educationBAPlusDeltaPctPt ?? null)
  const medianAgeDelta = numOr0(fullCity?.medianAgeDeltaYears ?? null)
  const medianIncomeDelta = numOr0(fullCity?.medianHHIncomeDeltaPct ?? null)
  const medianRentDelta = numOr0(fullCity?.medianRentDeltaPct ?? null)
  const medianHomeDelta = numOr0(fullCity?.medianHomeValueDeltaPct ?? null)

  useEffect(() => {
    // setFullCity(null)  // Don't clear while loading
    if (!city?.geoId) return
    setLoading(true)
    const ac = new AbortController()
    const run = async () => {
      try {
        const r = await fetch(
          `${API}/api/city/${city.geoId}?prefs=${encodeURIComponent(JSON.stringify(prefs))}`,
          { signal: ac.signal }
        )
        if (!r.ok) return
        const data = await r.json()
        // Support both { city: ScoredCity } and raw ScoredCity responses
        const payload = data?.city ?? data
        if (payload && payload.geoId) setFullCity(payload as ScoredCity)
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch city details:', err)
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => ac.abort()
  }, [city?.geoId, JSON.stringify(prefs)])

  useEffect(() => {
    if (!fullCity?.geoId) return
    setWiki(null)
    setWx(null)
    const ac = new AbortController()
    const run = async () => {
      try {
        const wikiP = fetch(`${API}/api/city/${fullCity.geoId}/wiki`, { signal: ac.signal }).then(
          (r) => (r.ok ? (r.json() as Promise<{ wiki: WikiSummary }>) : null)
        )

        const wxP = fetch(`${API}/api/city/${fullCity.geoId}/weather`, { signal: ac.signal }).then(
          (r) => (r.ok ? (r.json() as Promise<{ wx: WeatherPeriod[] }>) : null)
        )

        const [w1, w2] = await Promise.all([wikiP, wxP])
        if (w1?.wiki) setWiki(w1.wiki)
        if (w2?.wx) setWx(w2.wx)
      } catch (err) {
        console.error('Failed to fetch wiki/weather:', err)
      }
    }
    run()
    return () => ac.abort()
  }, [fullCity?.geoId])

  return (
    <div
      className="details-drawer"
      data-open={open}
      data-side={side}
      data-loading={loading ? '1' : '0'}
    >
      {fullCity && (
        <>
          <div className="drawer-header">
            <h3>
              {fullCity.city}, {fullCity.state}
            </h3>
            <button onClick={onClose} className="close-btn" aria-label="Close">
              ✕
            </button>
          </div>
          <div className="drawer-body">
            <div className="stat-grid">
              <div className="chip">
                <div className="chip-k">Population</div>
                <div className="chip-v chip-v--right">
                  <span>{population.toLocaleString()}</span>
                  <span className="delta-wrap">
                    <DeltaArrow delta={populationDelta} scale={0.6} />
                  </span>
                </div>
              </div>
              <div className="chip">
                <div className="chip-k">Ratio</div>
                <div className="chip-v">
                  <span>{ratio.toLocaleString()}/100</span>
                  <DeltaArrow delta={ratioDelta} scale={0.9} />
                </div>
              </div>
              <div className="chip">
                <div className="chip-k">Singles</div>
                <div className="chip-v chip-v--right">
                  <span>{fmtPct(fullCity.neverMarried)}</span>
                  <span className="delta-wrap">
                    <DeltaArrow delta={singlesDelta} scale={0.7} />
                  </span>
                </div>
              </div>
              <div className="chip">
                <div className="chip-k">B.A./B.S.+</div>
                <div className="chip-v chip-v--right">
                  <span>{fmtPct(fullCity.educationBAPlus)}</span>
                  <span className="delta-wrap">
                    <DeltaArrow delta={baPlusDelta} scale={0.7} />
                  </span>
                </div>
              </div>
              <div className="chip">
                <div className="chip-k">Median Age</div>
                <div className="chip-v chip-v--right">
                  <span>{fullCity.medianAge ?? 'n/a'}</span>
                  <span className="delta-wrap">
                    <DeltaArrow delta={medianAgeDelta} scale={0.7} />
                  </span>
                </div>
              </div>
              <div className="chip">
                <div className="chip-k">Median Income</div>
                <div className="chip-v chip-v--right">
                  <span>${fullCity.medianHHIncome?.toLocaleString() ?? 'n/a'}</span>
                  <span className="delta-wrap">
                    <DeltaArrow delta={medianIncomeDelta} scale={0.7} />
                  </span>
                </div>
              </div>
              <div className="chip">
                <div className="chip-k">Median Rent</div>
                <div className="chip-v chip-v--right">
                  <span>${fullCity.medianRent?.toLocaleString() ?? 'n/a'}</span>
                  <span className="delta-wrap">
                    <DeltaArrow delta={medianRentDelta} scale={0.7} />
                  </span>
                </div>
              </div>
              <div className="chip">
                <div className="chip-k">Median Home</div>
                <div className="chip-v chip-v--right">
                  <span>${fullCity.medianHomeValue?.toLocaleString() ?? 'n/a'}</span>
                  <span className="delta-wrap">
                    <DeltaArrow delta={medianHomeDelta} scale={0.6} />
                  </span>
                </div>
              </div>
            </div>

            {fullCity?.ethnicityShares && (
              <EthnicityBox
                ethnicityShares={fullCity.ethnicityShares}
                byRaceSex={fullCity.byRaceSex}
                ethnicityDeltas={fullCity.ethnicityShareDeltaPctPt}
                prefEthnicity={prefs.ethnicity === 'none' ? undefined : prefs.ethnicity}
              />
            )}

            {fullCity && (
              <div className="mini-card mt-8">
                <div className="k k--row">
                  Walk Score
                  {walkScoreUrl && (
                    <a
                      href={walkScoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="quicklink-icon"
                      title="Open Walk Score"
                    >
                      🔗
                    </a>
                  )}
                </div>
                <div className="embed">
                  <iframe src={walkScoreUrl} className="embed-frame" height="220" loading="lazy" />
                </div>
              </div>
            )}

            {/* wikipedia */}
            {wiki?.extract && (
              <div className="mini-card mt-8">
                <div className="k k--row">
                  About
                  {wiki && (
                    <a
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.title ?? `${fullCity.city}, ${fullCity.state}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="quicklink-icon"
                      title="Read About"
                    >
                      📘
                    </a>
                  )}
                </div>
                <div className="about">
                  {wiki.thumbnail?.source && (
                    <img src={wiki.thumbnail.source} alt="" width={48} height={48} />
                  )}
                  <div className="about-text">{wiki.extract}</div>
                </div>
              </div>
            )}

            {/* map */}
            {fullCity && (
              <div className="mini-card mt-8">
                <div className="k k--row">
                  Map
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="quicklink-icon"
                      title="Open Map"
                    >
                      🗺️
                    </a>
                  )}
                </div>
                <div className="embed">
                  <iframe src={mapUrl} className="embed-frame" height="120" loading="lazy" />
                </div>
              </div>
            )}

            {/* weather */}
            {fullCity && (
              <div className="mini-card mt-8">
                <div className="k">Weather</div>
                {wx && (
                  <div className="weather-brief">
                    {wx[0]?.icon && <img src={wx[0].icon} alt="" width={36} height={36} />}
                    <div className="wx-main">
                      <div className="wx-now">
                        <div className="wx-temp">
                          {wx[0]?.temperature}
                          {wx[0].temperatureUnit}
                        </div>
                        <div className="wx-desc">{wx[0]?.shortForecast}</div>
                      </div>
                      {wx[1] && (
                        <div className="wx-next">
                          {wx[1].name}: {wx[1].temperature}
                          {wx[1].temperatureUnit} · {wx[1].shortForecast}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
