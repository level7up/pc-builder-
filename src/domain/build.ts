import { catalog as fullCatalog } from '../data/parts'
import type { Build, BuildIds, Catalog, Category, PartBase } from './types'

export const CATEGORIES: Category[] = ['cpu', 'motherboard', 'memory', 'gpu', 'storage', 'psu', 'case', 'cooler']

export const REQUIRED: Category[] = ['cpu', 'motherboard', 'memory', 'storage', 'psu', 'case', 'cooler']

const findIn = <T extends PartBase>(list: readonly T[], id: string | undefined): T | undefined =>
  id === undefined ? undefined : list.find(part => part.id === id)

export function resolveBuild(ids: BuildIds, catalog: Catalog = fullCatalog): Build {
  return {
    cpu: findIn(catalog.cpu, ids.cpu),
    gpu: findIn(catalog.gpu, ids.gpu),
    motherboard: findIn(catalog.motherboard, ids.motherboard),
    memory: findIn(catalog.memory, ids.memory),
    storage: findIn(catalog.storage, ids.storage),
    psu: findIn(catalog.psu, ids.psu),
    case: findIn(catalog.case, ids.case),
    cooler: findIn(catalog.cooler, ids.cooler)
  }
}

export function totalPriceEgp(build: Build): number {
  return CATEGORIES.reduce((sum, category) => sum + (build[category]?.listing.inStock ? build[category]!.listing.priceEgp : 0), 0)
}

export function withPart(ids: BuildIds, category: Category, id: string | undefined): BuildIds {
  const rest = Object.fromEntries(Object.entries(ids).filter(([key]) => key !== category)) as BuildIds
  return id === undefined ? rest : { ...rest, [category]: id }
}

export function sanitizeIds(raw: unknown): BuildIds {
  if (typeof raw !== 'object' || raw === null) return {}
  const entries = Object.entries(raw as Record<string, unknown>)
    .filter((entry): entry is [Category, string] => CATEGORIES.includes(entry[0] as Category) && typeof entry[1] === 'string')
    .filter(([category, id]) => fullCatalog[category].some(part => part.id === id))
  return Object.fromEntries(entries) as BuildIds
}
