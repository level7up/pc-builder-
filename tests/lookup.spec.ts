import { describe, expect, it } from 'vitest'
import { catalog } from '../src/data/parts'
import { findPart, searchParts, storePrices, MAX_RESULTS } from '../src/domain/lookup'
import { STORES } from '../src/domain/store'

const ryzen = catalog.cpu.find(p => p.id === 'r5-7500f')!

describe('finding parts', () => {
  it('finds any part by id with its category', () => {
    expect(findPart('r5-7500f')).toEqual({ category: 'cpu', part: ryzen })
    expect(findPart(catalog.cooler[0].id)?.category).toBe('cooler')
    expect(findPart('nope')).toBeUndefined()
  })

  it('searches every category by name words', () => {
    expect(searchParts('7500f').map(r => r.part.id)).toContain('r5-7500f')
    const categories = new Set(searchParts('corsair', 50).map(r => r.category))
    expect(categories.size).toBeGreaterThan(1)
    expect(searchParts('   ')).toEqual([])
    expect(searchParts('zzzz-no-such-part')).toEqual([])
  })

  it('caps the results and lists in-stock parts first', () => {
    const results = searchParts('ddr5')
    expect(results).toHaveLength(MAX_RESULTS)
    const all = searchParts('ddr5', 1000)
    const firstSold = all.findIndex(r => !r.part.listing.inStock)
    if (firstSold >= 0) expect(all.slice(firstSold).every(r => !r.part.listing.inStock)).toBe(true)
  })
})

describe('prices at each store', () => {
  it('has one row per store with its cheapest offer, in-stock cheapest first', () => {
    const rows = storePrices(ryzen)
    expect(rows.map(r => r.store.id).sort()).toEqual(STORES.map(s => s.id).sort())
    const listed = rows.filter(r => r.offer)
    expect(listed[0].offer).toMatchObject({ priceEgp: ryzen.listing.priceEgp, inStock: true })
    rows.forEach(row => {
      const sameStore = ryzen.listing.offers.filter(o => o.store === row.store.name)
      if (!row.offer) return expect(sameStore).toEqual([])
      const pool = sameStore.some(o => o.inStock) ? sameStore.filter(o => o.inStock) : sameStore
      expect(row.offer.priceEgp).toBe(Math.min(...pool.map(o => o.priceEgp)))
    })
    const rank = (r: (typeof rows)[number]) => (!r.offer ? 2 : r.offer.inStock ? 0 : 1)
    rows.slice(1).forEach((r, i) => expect(rank(r)).toBeGreaterThanOrEqual(rank(rows[i])))
  })
})
