import { CATEGORIES, sanitizeIds } from './build'
import type { BuildIds } from './types'

export function idsToQuery(ids: BuildIds): string {
  const params = new URLSearchParams()
  CATEGORIES.forEach(category => {
    const id = ids[category]
    if (id) params.set(category, id)
  })
  return params.toString()
}

export function idsFromQuery(query: string): BuildIds {
  const params = new URLSearchParams(query)
  return sanitizeIds(Object.fromEntries(params.entries()))
}
