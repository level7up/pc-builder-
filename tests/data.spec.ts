import { describe, expect, it } from 'vitest'
import { OFFER_SOURCE, PRICE_SOURCE, catalog, listingFor } from '../src/data/parts'
import searchTerms from '../src/data/search-terms.json'
import { sanitizeIds, withPart } from '../src/domain/build'

const all = Object.values(catalog).flat()

describe('catalog data', () => {
  it('has unique ids', () => {
    const ids = all.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has a real store price and link for every part', () => {
    all.forEach(part => {
      expect(part.listing.priceEgp, part.id).toBeGreaterThan(100)
      expect(part.listing.url, part.id).toMatch(/^https:\/\/[^\s]+$/)
      expect(part.listing.offers.length, part.id).toBeGreaterThan(0)
    })
  })

  it('shows the cheapest in-stock offer as the part price', () => {
    all.forEach(part => {
      const inStock = part.listing.offers.filter(o => o.inStock).map(o => o.priceEgp)
      expect(part.listing.priceEgp, part.id).toBe(Math.min(...inStock))
    })
  })

  it('has search terms for every part and nothing else', () => {
    expect(Object.keys(searchTerms).sort()).toEqual(all.map(p => p.id).sort())
  })

  it('only stores offers for known parts and stores', () => {
    const ids = new Set(all.map(p => p.id))
    const stores = new Set(OFFER_SOURCE.stores.map(s => s.id))
    Object.entries(OFFER_SOURCE.items).forEach(([id, offers]) => {
      expect(ids.has(id), id).toBe(true)
      offers.forEach(o => expect(stores.has(o.store), `${id} ${o.store}`).toBe(true))
    })
  })

  it('uses every listing it stores', () => {
    expect(Object.keys(PRICE_SOURCE.items).sort()).toEqual(all.map(p => p.id).sort())
  })

  it('records when prices were checked', () => {
    expect(PRICE_SOURCE.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('throws for a part with no listing', () => {
    expect(() => listingFor('nope')).toThrow(/nope/)
  })
})

describe('build ids', () => {
  it('drops unknown categories and parts from saved data', () => {
    expect(sanitizeIds({ cpu: 'r5-7500f', gpu: 'fake', hack: 'x', memory: 4 })).toEqual({ cpu: 'r5-7500f' })
    expect(sanitizeIds(null)).toEqual({})
    expect(sanitizeIds('cpu')).toEqual({})
  })

  it('sets and clears a part without touching the original', () => {
    const ids = { cpu: 'r5-7500f' }
    expect(withPart(ids, 'gpu', 'rtx5060')).toEqual({ cpu: 'r5-7500f', gpu: 'rtx5060' })
    expect(withPart(ids, 'cpu', undefined)).toEqual({})
    expect(ids).toEqual({ cpu: 'r5-7500f' })
  })
})
