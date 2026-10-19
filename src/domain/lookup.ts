import { catalog as fullCatalog } from '../data/parts'
import { matchesQuery } from '../search'
import { CATEGORIES } from './build'
import { STORES, type StoreInfo } from './store'
import type { Category, Offer, PartBase } from './types'

export const MAX_RESULTS = 8

export interface FoundPart {
  category: Category
  part: PartBase
}

export interface StorePrice {
  store: StoreInfo
  offer: Offer | undefined
}

const ALL_PARTS: FoundPart[] = CATEGORIES.flatMap(category => fullCatalog[category].map(part => ({ category, part })))

export const findPart = (id: string): FoundPart | undefined => ALL_PARTS.find(found => found.part.id === id)

const soldLast = (a: FoundPart, b: FoundPart): number => Number(!a.part.listing.inStock) - Number(!b.part.listing.inStock)

export function searchParts(query: string, limit: number = MAX_RESULTS): FoundPart[] {
  if (!query.trim()) return []
  return ALL_PARTS.filter(found => matchesQuery(found.part.name, query))
    .sort((a, b) => soldLast(a, b) || a.part.listing.priceEgp - b.part.listing.priceEgp)
    .slice(0, limit)
}

const byStock = (a: Offer, b: Offer): number => Number(!a.inStock) - Number(!b.inStock) || a.priceEgp - b.priceEgp

const rankOf = (row: StorePrice): number => (!row.offer ? 2 : row.offer.inStock ? 0 : 1)

export function storePrices(part: PartBase): StorePrice[] {
  return STORES.map(store => ({ store, offer: part.listing.offers.filter(o => o.store === store.name).sort(byStock)[0] }))
    .sort((a, b) => rankOf(a) - rankOf(b) || (a.offer?.priceEgp ?? 0) - (b.offer?.priceEgp ?? 0))
}
