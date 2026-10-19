import { listingAt, type StoreListing } from './browse'
import { findPart, type FoundPart } from './lookup'
import { storeById, type StoreInfo } from './store'

export type WishItem =
  | { key: string; kind: 'part'; found: FoundPart }
  | { key: string; kind: 'listing'; listing: StoreListing }
  | { key: string; kind: 'gone'; found: FoundPart; store: StoreInfo }

const STORE_SEPARATOR = '@'

export const wishKey = (partId: string, storeId?: string): string => (storeId ? `${partId}${STORE_SEPARATOR}${storeId}` : partId)

export function parseWishKey(key: string): { partId: string; storeId: string | undefined } {
  const [partId, storeId] = key.split(STORE_SEPARATOR)
  return { partId, storeId }
}

const isKnown = (key: unknown): key is string => {
  if (typeof key !== 'string') return false
  const { partId, storeId } = parseWishKey(key)
  return findPart(partId) !== undefined && (storeId === undefined || storeById(storeId) !== undefined)
}

export const sanitizeWishlist = (raw: unknown): string[] => (Array.isArray(raw) ? [...new Set(raw.filter(isKnown))] : [])

export function resolveWish(key: string): WishItem | undefined {
  const { partId, storeId } = parseWishKey(key)
  const found = findPart(partId)
  if (!found) return undefined
  const store = storeById(storeId)
  if (!store) return storeId ? undefined : { key, kind: 'part', found }
  const listing = listingAt(found, store.id)
  return listing ? { key, kind: 'listing', listing } : { key, kind: 'gone', found, store }
}

const inStockPrice = (item: WishItem): number => {
  if (item.kind === 'listing') return item.listing.offer.inStock ? item.listing.offer.priceEgp : 0
  if (item.kind === 'part') return item.found.part.listing.inStock ? item.found.part.listing.priceEgp : 0
  return 0
}

export const wishTotal = (items: readonly WishItem[]): number => items.reduce((sum, item) => sum + inStockPrice(item), 0)
