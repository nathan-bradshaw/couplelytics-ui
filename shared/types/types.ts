import type * as L from 'leaflet'

export type Prefs = {
  ageMin: number
  ageMax: number
  targetGender: Gender
  ethnicity?: 'none' | Ethnicity
}

export type City = {
  geoId: string
  city: string
  state: string
  lat: number
  lon: number
  educationBAPlus?: number
  neverMarried?: number
  byAge?: AgeBin[]
  byAgeByRace?: Record<Ethnicity, RaceAgeBin[]>
  ethnicityShares?: EthnicityShareList
  byRaceSex?: Record<Ethnicity, { male: number; female: number }>
  population: number
  medianAge?: number
  medianHHIncome?: number
  medianRent?: number
  medianHomeValue?: number
}

export type EthnicityShareList = {
  white: number
  black: number
  hispanic: number
  asian: number
  native: number
  pacific: number
  mixed: number
}

export type RaceAgeBin = {
  lo: number
  hi: number
  male: number
  female: number
}

type AgeBin = {
  age: number
  male: number
  female: number
}

type Gender = 'male' | 'female'

export type EthnicityShareDeltaPctPt =
  | {
      white?: number | null
      black?: number | null
      hispanic?: number | null
      asian?: number | null
      native?: number | null
      pacific?: number | null
      mixed?: number | null
    }
  | undefined

export type Ethnicity = 'white' | 'black' | 'hispanic' | 'asian' | 'native' | 'pacific' | 'mixed'

export type EthnicityShareDeltas = Partial<Record<Ethnicity, number | null>>

export type HeatColor = 'green' | 'yellow' | 'red'
export type PopBin = 'S' | 'M' | 'L' | 'XL'

export type ScoredCity = City & {
  intensity: number
  ratioPer100: number
  presence: number
  ratioDelta?: number | null
  colorHex?: string
  // additional year-over-year deltas (current vs previous year)
  populationDeltaPct?: number | null // % change
  neverMarriedDeltaPctPt?: number | null // percentage points (0-100 scale)
  educationBAPlusDeltaPctPt?: number | null // percentage points (0-100 scale)
  medianAgeDeltaYears?: number | null // years
  medianHHIncomeDeltaPct?: number | null // % change
  medianRentDeltaPct?: number | null // % change
  medianHomeValueDeltaPct?: number | null // % change,
  ethnicityShareDeltaPctPt?: EthnicityShareDeltas
  mapUrl?: string
  walkScoreUrl?: string
  popBin?: PopBin
  heatColor?: HeatColor
  heatIntensity?: number
  largest?: number
}

export type Filters = {
  popMin?: number
  popMax?: number
  ratioMin?: number
  ratioMax?: number
  deltaMin?: number
  deltaMax?: number
  singlesMin?: number // fraction 0..1
  singlesMax?: number // fraction 0..1
  degreeMin?: number // fraction 0..1
  degreeMax?: number // fraction 0..1
  ageMin?: number
  ageMax?: number
  incomeMin?: number
  incomeMax?: number
  rentMin?: number
  rentMax?: number
}

export type MaybeCity = ScoredCity | null

export type WikiSummary = {
  title: string
  extract: string
  thumbnail?: { source: string }
}

export type RawWiki = {
  title?: string
  extract?: string
  thumbnail?: { source?: string }
}

export type WeatherPeriod = {
  temperature: number
  temperatureUnit: string
  shortForecast: string
  icon: string
  name: string
}

export type NWSPoints = { properties?: { forecast?: string } }

export type NWSForecast = { properties?: { periods?: WeatherPeriod[] } }

export type HeatPoint = [number, number, number]
export type HeatOptions = {
  radius?: number
  blur?: number
  minOpacity?: number
  maxZoom?: number
  max?: number
  gradient?: Record<number, string>
  pane?: string
}

export interface HeatLayer extends L.Layer {
  setLatLngs(latlngs: HeatPoint[]): this
  addLatLng(latlng: HeatPoint): this
  setOptions(options: HeatOptions): this
  redraw(): this
}

export type FlyToTarget = {
  lat: number
  lon: number
  zoom?: number
  durationSec?: number
  seq?: number
}
