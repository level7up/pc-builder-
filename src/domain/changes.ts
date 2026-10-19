import { catalog as fullCatalog, listingFor, PRICE_SOURCE, type OfferSource } from '../data/parts'
import { CATEGORIES } from './build'
import type { Catalog, Category, PartBase } from './types'

export type ChangeStatus = 'soldOut' | 'back' | 'up' | 'down' | 'same'

export interface PricePoint {
  priceEgp: number
  inStock: boolean
}

export interface PriceChange {
  part: PartBase
  category: Category
  before: PricePoint
  after: PricePoint
  delta: number
  percent: number
  status: ChangeStatus
}

export const CHANGE_STATUSES: readonly ChangeStatus[] = ['soldOut', 'back', 'up', 'down', 'same']

function statusOf(before: PricePoint, after: PricePoint): ChangeStatus {
  if (before.inStock && !after.inStock) return 'soldOut'
  if (!before.inStock && after.inStock) return 'back'
  if (after.priceEgp > before.priceEgp) return 'up'
  return after.priceEgp < before.priceEgp ? 'down' : 'same'
}

function changeFor(part: PartBase, category: Category, previous: OfferSource): PriceChange {
  const old = listingFor(part.id, PRICE_SOURCE, previous)
  const before = { priceEgp: old.priceEgp, inStock: old.inStock }
  const after = { priceEgp: part.listing.priceEgp, inStock: part.listing.inStock }
  const delta = after.priceEgp - before.priceEgp
  return { part, category, before, after, delta, percent: (delta / before.priceEgp) * 100, status: statusOf(before, after) }
}

const rank = (change: PriceChange): number => (change.status === 'soldOut' || change.status === 'back' ? 0 : change.status === 'same' ? 2 : 1)

export function priceChanges(previous: OfferSource, catalog: Catalog = fullCatalog): PriceChange[] {
  return CATEGORIES.flatMap(category => catalog[category].map(part => changeFor(part, category, previous)))
    .sort((a, b) => rank(a) - rank(b) || Math.abs(b.percent) - Math.abs(a.percent))
}

export const countByStatus = (changes: readonly PriceChange[]): Record<ChangeStatus, number> =>
  Object.fromEntries(CHANGE_STATUSES.map(status => [status, changes.filter(c => c.status === status).length])) as Record<ChangeStatus, number>
