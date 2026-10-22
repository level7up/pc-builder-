import { catalog as fullCatalog, listingFor, OFFER_SOURCE, PRICE_SOURCE, type OfferSource } from '../data/parts'
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

function changeBetween(part: PartBase, category: Category, before: PricePoint, after: PricePoint): PriceChange {
  const delta = after.priceEgp - before.priceEgp
  return { part, category, before, after, delta, percent: (delta / before.priceEgp) * 100, status: statusOf(before, after) }
}

function changeFor(part: PartBase, category: Category, previous: OfferSource): PriceChange {
  const old = listingFor(part.id, PRICE_SOURCE, previous)
  return changeBetween(part, category, { priceEgp: old.priceEgp, inStock: old.inStock }, { priceEgp: part.listing.priceEgp, inStock: part.listing.inStock })
}

function pointAt(source: OfferSource, partId: string, storeId: string): PricePoint | undefined {
  const offers = (source.items[partId] ?? []).filter(o => o.store === storeId).sort((a, b) => a.priceEgp - b.priceEgp)
  const best = offers.find(o => o.inStock) ?? offers[0]
  return best ? { priceEgp: best.priceEgp, inStock: best.inStock } : undefined
}

function storeChangeFor(part: PartBase, category: Category, storeId: string, previous: OfferSource, current: OfferSource): PriceChange[] {
  const before = pointAt(previous, part.id, storeId)
  const after = pointAt(current, part.id, storeId)
  if (!before && !after) return []
  const gone = (point: PricePoint): PricePoint => ({ priceEgp: point.priceEgp, inStock: false })
  return [changeBetween(part, category, before ?? gone(after!), after ?? gone(before!))]
}

const rank = (change: PriceChange): number => (change.status === 'soldOut' || change.status === 'back' ? 0 : change.status === 'same' ? 2 : 1)
const byImportance = (a: PriceChange, b: PriceChange): number => rank(a) - rank(b) || Math.abs(b.percent) - Math.abs(a.percent)

export function priceChanges(previous: OfferSource, catalog: Catalog = fullCatalog): PriceChange[] {
  return CATEGORIES.flatMap(category => catalog[category].map(part => changeFor(part, category, previous))).sort(byImportance)
}

export function storePriceChanges(storeId: string, previous: OfferSource, current: OfferSource = OFFER_SOURCE, catalog: Catalog = fullCatalog): PriceChange[] {
  return CATEGORIES.flatMap(category => catalog[category].flatMap(part => storeChangeFor(part, category, storeId, previous, current))).sort(byImportance)
}

export const countByStatus = (changes: readonly PriceChange[]): Record<ChangeStatus, number> =>
  Object.fromEntries(CHANGE_STATUSES.map(status => [status, changes.filter(c => c.status === status).length])) as Record<ChangeStatus, number>
