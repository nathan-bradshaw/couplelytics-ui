import type { ScoredCity } from '../../../../shared/types/types'

export const deriveVisible = (cities: ScoredCity[], q: string) => {
  const query = q.trim().toLowerCase()
  const searched = query
    ? cities.filter((c) => `${c.city}, ${c.state}`.toLowerCase().includes(query))
    : cities
  return searched.sort((a, b) => (b.ratioPer100 ?? -1) - (a.ratioPer100 ?? -1))
}
