import { CATEGORIES, sanitizeIds } from './build'
import { storeById } from './store'
import type { BuildIds } from './types'

export function idsToQuery(ids: BuildIds, storeId?: string): string {
  const params = new URLSearchParams()
  CATEGORIES.forEach(category => {
    const id = ids[category]
    if (id) params.set(category, id)
  })
  if (storeById(storeId)) params.set('store', storeId!)
  return params.toString()
}

export function idsFromQuery(query: string): BuildIds {
  const params = new URLSearchParams(query)
  return sanitizeIds(Object.fromEntries(params.entries()))
}

export const storeFromQuery = (query: string): string | undefined => storeById(new URLSearchParams(query).get('store') ?? undefined)?.id
