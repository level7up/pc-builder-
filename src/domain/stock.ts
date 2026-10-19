import type { Catalog, PartBase } from './types'

const inStock = <P extends PartBase>(parts: readonly P[]): P[] => parts.filter(part => part.listing.inStock)

const buyable = new WeakMap<Catalog, Catalog>()

export function inStockOnly(catalog: Catalog): Catalog {
  const cached = buyable.get(catalog)
  if (cached) return cached
  const fresh: Catalog = {
    cpu: inStock(catalog.cpu),
    gpu: inStock(catalog.gpu),
    motherboard: inStock(catalog.motherboard),
    memory: inStock(catalog.memory),
    storage: inStock(catalog.storage),
    psu: inStock(catalog.psu),
    case: inStock(catalog.case),
    cooler: inStock(catalog.cooler)
  }
  buyable.set(catalog, fresh)
  return fresh
}
