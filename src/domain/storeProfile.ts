import { OFFER_SOURCE } from '../data/parts'
import { CATEGORIES } from './build'
import { browseListings, DEFAULT_FILTER, type StoreListing } from './browse'
import { storeById, STORES, type StoreInfo } from './store'
import type { Category } from './types'

export interface CategoryCount {
  category: Category
  products: number
  inStock: number
}

export interface StoreSummary {
  store: StoreInfo
  url: string | undefined
  products: number
  inStock: number
  cheapest: number
  categories: CategoryCount[]
}

const inStockOf = (listings: readonly StoreListing[]): number => listings.filter(l => l.offer.inStock).length

const isCheapestHere = (listing: StoreListing): boolean => listing.offer.inStock && listing.offer.priceEgp <= listing.part.listing.priceEgp

function categoryCounts(listings: readonly StoreListing[]): CategoryCount[] {
  return CATEGORIES.flatMap(category => {
    const here = listings.filter(l => l.category === category)
    return here.length ? [{ category, products: here.length, inStock: inStockOf(here) }] : []
  })
}

function summarise(store: StoreInfo): StoreSummary {
  const listings = browseListings({ ...DEFAULT_FILTER, storeId: store.id })
  return {
    store,
    url: OFFER_SOURCE.stores.find(s => s.id === store.id)?.url,
    products: listings.length,
    inStock: inStockOf(listings),
    cheapest: new Set(listings.filter(isCheapestHere).map(l => l.part.id)).size,
    categories: categoryCounts(listings)
  }
}

export function storeProfile(storeId: string): StoreSummary | undefined {
  const store = storeById(storeId)
  return store ? summarise(store) : undefined
}

export const storeSummaries = (): StoreSummary[] => STORES.map(summarise).sort((a, b) => b.inStock - a.inStock)
