import { matchesQuery } from '../search'
import { ALL_PARTS, storePrices, type FoundPart } from './lookup'
import { storeById, STORES } from './store'
import type { Category, Offer, PartBase } from './types'

export type SortOrder = 'priceAsc' | 'priceDesc' | 'name'

export const SORT_ORDERS: readonly SortOrder[] = ['priceAsc', 'priceDesc', 'name']

export interface PartFilter {
  query: string
  category: Category | undefined
  storeId: string | undefined
  inStockOnly: boolean
  sort: SortOrder
}

export const DEFAULT_FILTER: PartFilter = { query: '', category: undefined, storeId: undefined, inStockOnly: false, sort: 'priceAsc' }

const COMPARE: Record<SortOrder, (a: FoundPart, b: FoundPart) => number> = {
  priceAsc: (a, b) => a.part.listing.priceEgp - b.part.listing.priceEgp,
  priceDesc: (a, b) => b.part.listing.priceEgp - a.part.listing.priceEgp,
  name: (a, b) => a.part.name.localeCompare(b.part.name)
}

export const inStockCount = (part: PartBase): number => new Set(part.listing.offers.filter(o => o.inStock).map(o => o.store)).size

const inStockAt = (part: PartBase, storeName: string): boolean => part.listing.offers.some(o => o.store === storeName && o.inStock)

export function browseParts(filter: PartFilter, onlyIds?: readonly string[]): FoundPart[] {
  const storeName = storeById(filter.storeId)?.name
  return ALL_PARTS.filter(({ category, part }) =>
    (!onlyIds || onlyIds.includes(part.id)) &&
    (!filter.category || category === filter.category) &&
    (!filter.inStockOnly || part.listing.inStock) &&
    (!storeName || inStockAt(part, storeName)) &&
    matchesQuery(part.name, filter.query)
  ).sort(COMPARE[filter.sort])
}

export interface StoreListing extends FoundPart {
  key: string
  storeId: string
  offer: Offer
}

const storeIdOf = (storeName: string): string => STORES.find(store => store.name === storeName)?.id ?? storeName

const toListing = (found: FoundPart, offer: Offer): StoreListing =>
  ({ ...found, offer, storeId: storeIdOf(offer.store), key: `${found.part.id}|${offer.store}|${offer.url}` })

export function listingAt(found: FoundPart, storeId: string): StoreListing | undefined {
  const offer = storePrices(found.part).find(row => row.store.id === storeId)?.offer
  return offer ? toListing(found, offer) : undefined
}

const LISTING_COMPARE: Record<SortOrder, (a: StoreListing, b: StoreListing) => number> = {
  priceAsc: (a, b) => a.offer.priceEgp - b.offer.priceEgp,
  priceDesc: (a, b) => b.offer.priceEgp - a.offer.priceEgp,
  name: (a, b) => a.offer.title.localeCompare(b.offer.title)
}

const ALL_LISTINGS: readonly StoreListing[] = ALL_PARTS.flatMap(found => found.part.listing.offers.map(offer => toListing(found, offer)))

export function browseListings(filter: PartFilter): StoreListing[] {
  const storeName = storeById(filter.storeId)?.name
  return ALL_LISTINGS.filter(({ category, part, offer }) =>
    (!filter.category || category === filter.category) &&
    (!filter.inStockOnly || offer.inStock) &&
    (!storeName || offer.store === storeName) &&
    (matchesQuery(offer.title, filter.query) || matchesQuery(part.name, filter.query))
  ).sort(LISTING_COMPARE[filter.sort])
}

export const CARDS_PER_PAGE = 24
