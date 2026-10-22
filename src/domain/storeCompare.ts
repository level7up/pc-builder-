import { CATEGORIES, resolveBuild } from './build'
import { markBest } from './compare'
import { findPart } from './lookup'
import { catalogAt, compareStores, type StoreInfo } from './store'
import type { BuildIds, Category, PartBase } from './types'

export interface StoreColumn {
  store: StoreInfo
  total: number
  missing: Category[]
  isCurrent: boolean
  isCheapest: boolean
}

export interface StorePriceCell {
  priceEgp: number | undefined
  best: boolean
}

export interface StorePriceRow {
  category: Category
  id: string
  name: string | undefined
  cells: StorePriceCell[]
}

export interface BuildAcrossStores {
  columns: StoreColumn[]
  rows: StorePriceRow[]
}

function cheapestCompleteId(quotes: ReturnType<typeof compareStores>): string | undefined {
  const complete = quotes.filter(q => q.missing.length === 0)
  if (complete.length === 0) return undefined
  return complete.reduce((best, q) => (q.total < best.total ? q : best)).store.id
}

export function buildAcrossStores(ids: BuildIds, currentStoreId?: string): BuildAcrossStores {
  const quotes = compareStores(ids)
  const cheapestId = cheapestCompleteId(quotes)
  const columns = quotes.map(q => ({ ...q, isCurrent: q.store.id === currentStoreId, isCheapest: q.store.id === cheapestId }))
  const builds = columns.map(c => resolveBuild(ids, catalogAt(c.store.id)))
  const rows = CATEGORIES.flatMap(category => {
    const id = ids[category]
    if (!id) return []
    const prices = builds.map(build => (build[category] as PartBase | undefined)?.listing.priceEgp)
    const best = markBest(prices, 'lower')
    return [{ category, id, name: findPart(id)?.part.name, cells: prices.map((priceEgp, i) => ({ priceEgp, best: best[i] })) }]
  })
  return { columns, rows }
}
