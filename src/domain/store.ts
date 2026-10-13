import { OFFER_SOURCE, catalog as fullCatalog } from '../data/parts'
import { CATEGORIES, resolveBuild, totalPriceEgp } from './build'
import type { BuildIds, Catalog, Category, Issue, PartBase } from './types'

export interface StoreInfo {
  id: string
  name: string
}

export interface StoreQuote {
  store: StoreInfo
  total: number
  missing: Category[]
}

export const STORES: readonly StoreInfo[] = OFFER_SOURCE.stores.map(({ id, name }) => ({ id, name }))

export const storeById = (id: string | undefined): StoreInfo | undefined => STORES.find(store => store.id === id)

export function atStore<P extends PartBase>(part: P, storeName: string): P | undefined {
  const offer = part.listing.offers.filter(o => o.store === storeName && o.inStock).sort((a, b) => a.priceEgp - b.priceEgp)[0]
  if (!offer) return undefined
  const image = offer.image ?? part.listing.image
  return { ...part, listing: { ...part.listing, priceEgp: offer.priceEgp, store: offer.store, url: offer.url, ...(image ? { image } : {}) } }
}

const onlyAt = <P extends PartBase>(parts: readonly P[], storeName: string): P[] =>
  parts.flatMap(part => {
    const there = atStore(part, storeName)
    return there ? [there] : []
  })

const storeCatalogs = new Map<string, Catalog>()

export function catalogAt(storeId: string | undefined): Catalog {
  const store = storeById(storeId)
  if (!store) return fullCatalog
  const cached = storeCatalogs.get(store.id)
  if (cached) return cached
  const fresh: Catalog = {
    cpu: onlyAt(fullCatalog.cpu, store.name),
    gpu: onlyAt(fullCatalog.gpu, store.name),
    motherboard: onlyAt(fullCatalog.motherboard, store.name),
    memory: onlyAt(fullCatalog.memory, store.name),
    storage: onlyAt(fullCatalog.storage, store.name),
    psu: onlyAt(fullCatalog.psu, store.name),
    case: onlyAt(fullCatalog.case, store.name),
    cooler: onlyAt(fullCatalog.cooler, store.name)
  }
  storeCatalogs.set(store.id, fresh)
  return fresh
}

export const unavailableAt = (ids: BuildIds, catalog: Catalog): Category[] =>
  CATEGORIES.filter(category => ids[category] !== undefined && !catalog[category].some(part => part.id === ids[category]))

function quoteFor(ids: BuildIds, store: StoreInfo): StoreQuote {
  const there = catalogAt(store.id)
  return { store, total: totalPriceEgp(resolveBuild(ids, there)), missing: unavailableAt(ids, there) }
}

export function compareStores(ids: BuildIds): StoreQuote[] {
  const picked = CATEGORIES.filter(category => ids[category] !== undefined).length
  if (picked === 0) return []
  return STORES.map(store => quoteFor(ids, store))
    .filter(quote => quote.missing.length < picked)
    .sort((a, b) => a.missing.length - b.missing.length || a.total - b.total)
}

export function withStoreIssues(issues: Issue[], unavailable: Category[], store: StoreInfo | undefined): Issue[] {
  if (!store || unavailable.length === 0) return issues
  const kept = issues.filter(issue => !(issue.code === 'missing' && unavailable.includes(issue.params?.category as Category)))
  const notHere: Issue[] = unavailable.map(category => ({ severity: 'warning', code: 'notAtStore', params: { category, store: store.name } }))
  return [...kept.filter(i => i.severity === 'error'), ...notHere, ...kept.filter(i => i.severity !== 'error')]
}
