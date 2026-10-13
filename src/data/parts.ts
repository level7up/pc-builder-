import type { Case, Cooler, Cpu, Gpu, Listing, Memory, Motherboard, Offer, PartBase, Psu, Spec, Storage } from '../domain/types'
import { CPU_SPECS } from './catalog/cpus'
import { GPU_SPECS } from './catalog/gpus'
import { MOTHERBOARD_SPECS } from './catalog/motherboards'
import { MEMORY_SPECS } from './catalog/memory'
import { STORAGE_SPECS } from './catalog/storage'
import { PSU_SPECS } from './catalog/psus'
import { CASE_SPECS } from './catalog/cases'
import { COOLER_SPECS } from './catalog/coolers'
import listings from './listings.json'
import scraped from './offers.json'

interface CompumartsReference {
  priceEgp: number
  title: string
  handle: string
  variant: string
}

interface StoreReference {
  priceEgp: number
  title: string
  store: string
  url: string
}

export type ReferenceItem = CompumartsReference | StoreReference

export interface ListingSource {
  checkedOn: string
  store: string
  storeUrl: string
  items: Record<string, ReferenceItem>
}

export interface OfferSource {
  checkedOn: string
  stores: { id: string; name: string; url: string }[]
  items: Record<string, Offer[]>
}

export const PRICE_SOURCE: ListingSource = listings
export const OFFER_SOURCE: OfferSource = scraped

export const PRICES_CHECKED_ON = OFFER_SOURCE.checkedOn || PRICE_SOURCE.checkedOn
export const STORE_COUNT = Math.max(OFFER_SOURCE.stores.length, 1)

const byPrice = (a: Offer, b: Offer): number => a.priceEgp - b.priceEgp

const isHttpsUrl = (url: string | undefined): url is string => typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(url)

function referenceOffer(id: string, source: ListingSource, storeName: (storeId: string) => string): Offer {
  const item = source.items[id]
  if (!item) throw new Error(`No store listing for part "${id}"`)
  const base = { priceEgp: item.priceEgp, inStock: true, title: item.title }
  return 'handle' in item
    ? { ...base, store: source.store, url: `${source.storeUrl}/products/${encodeURIComponent(item.handle)}` }
    : { ...base, store: storeName(item.store), url: item.url }
}

export function listingFor(id: string, source: ListingSource = PRICE_SOURCE, offerSource: OfferSource = OFFER_SOURCE): Listing {
  const storeName = (storeId: string) => offerSource.stores.find(s => s.id === storeId)?.name ?? storeId
  const reference = referenceOffer(id, source, storeName)
  const found = (offerSource.items[id] ?? []).map(offer => ({ ...offer, store: storeName(offer.store) }))
  const hasReferenceStore = found.some(offer => offer.store === reference.store)
  const offers = [...found, ...(hasReferenceStore ? [] : [reference])].sort(byPrice)
  const best = offers.find(offer => offer.inStock) ?? reference
  const image = [best, ...offers].map(offer => offer.image).find(isHttpsUrl)
  return { priceEgp: best.priceEgp, store: best.store, url: best.url, ...(image ? { image } : {}), offers }
}

const withListing = <T extends PartBase>(specs: readonly Spec<T>[]): T[] =>
  specs.map(spec => ({ ...spec, listing: listingFor(spec.id) }) as T)

export const cpus: Cpu[] = withListing(CPU_SPECS)

export const gpus: Gpu[] = withListing(GPU_SPECS)

export const motherboards: Motherboard[] = withListing(MOTHERBOARD_SPECS)

export const memories: Memory[] = withListing(MEMORY_SPECS)

export const storages: Storage[] = withListing(STORAGE_SPECS)

export const psus: Psu[] = withListing(PSU_SPECS)

export const cases: Case[] = withListing(CASE_SPECS)

export const coolers: Cooler[] = withListing(COOLER_SPECS)

export const catalog = {
  cpu: cpus,
  gpu: gpus,
  motherboard: motherboards,
  memory: memories,
  storage: storages,
  psu: psus,
  case: cases,
  cooler: coolers
} as const
