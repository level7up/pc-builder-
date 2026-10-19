import { describe, expect, it } from 'vitest'
import { catalog } from '../src/data/parts'
import { browseListings, browseParts, DEFAULT_FILTER, inStockCount } from '../src/domain/browse'

const all = Object.values(catalog).flat()

describe('browsing parts', () => {
  it('lists every part, cheapest first, by default', () => {
    const results = browseParts(DEFAULT_FILTER)
    expect(results).toHaveLength(all.length)
    results.slice(1).forEach((r, i) => expect(r.part.listing.priceEgp).toBeGreaterThanOrEqual(results[i].part.listing.priceEgp))
  })

  it('filters by category and name words', () => {
    const coolers = browseParts({ ...DEFAULT_FILTER, category: 'cooler' })
    expect(coolers).toHaveLength(catalog.cooler.length)
    expect(coolers.every(r => r.category === 'cooler')).toBe(true)
    expect(browseParts({ ...DEFAULT_FILTER, query: '7500F' }).map(r => r.part.id)).toContain('r5-7500f')
  })

  it('keeps only in-stock parts, or parts in stock at one store', () => {
    expect(browseParts({ ...DEFAULT_FILTER, inStockOnly: true }).every(r => r.part.listing.inStock)).toBe(true)
    const atSigma = browseParts({ ...DEFAULT_FILTER, storeId: 'sigma' })
    expect(atSigma.length).toBeGreaterThan(0)
    expect(atSigma.length).toBeLessThan(all.length)
    expect(atSigma.every(r => r.part.listing.offers.some(o => o.store === 'Sigma Computer' && o.inStock))).toBe(true)
  })

  it('sorts by price either way or by name, and limits to a list of ids', () => {
    const desc = browseParts({ ...DEFAULT_FILTER, sort: 'priceDesc' })
    expect(desc[0].part.listing.priceEgp).toBe(Math.max(...all.map(p => p.listing.priceEgp)))
    const names = browseParts({ ...DEFAULT_FILTER, category: 'cpu', sort: 'name' }).map(r => r.part.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
    expect(browseParts(DEFAULT_FILTER, ['r5-7500f', 'nope']).map(r => r.part.id)).toEqual(['r5-7500f'])
  })

  it('counts the stores that have a part in stock', () => {
    const ryzen = catalog.cpu.find(p => p.id === 'r5-7500f')!
    expect(inStockCount(ryzen)).toBe(new Set(ryzen.listing.offers.filter(o => o.inStock).map(o => o.store)).size)
  })
})

describe('browsing store products', () => {
  const offerCount = all.reduce((sum, p) => sum + p.listing.offers.length, 0)

  it('lists every store listing of every part, cheapest first', () => {
    const listings = browseListings(DEFAULT_FILTER)
    expect(listings).toHaveLength(offerCount)
    listings.slice(1).forEach((l, i) => expect(l.offer.priceEgp).toBeGreaterThanOrEqual(listings[i].offer.priceEgp))
    expect(new Set(listings.map(l => l.key)).size).toBe(listings.length)
  })

  it('filters by store, stock, category and the store title or part name', () => {
    const sigma = browseListings({ ...DEFAULT_FILTER, storeId: 'sigma', inStockOnly: true })
    expect(sigma.length).toBeGreaterThan(0)
    expect(sigma.every(l => l.offer.store === 'Sigma Computer' && l.offer.inStock)).toBe(true)
    const cpus = browseListings({ ...DEFAULT_FILTER, category: 'cpu', query: '7500F' })
    expect(cpus.length).toBeGreaterThan(1)
    expect(cpus.every(l => l.part.id === 'r5-7500f' || /7500F/i.test(l.offer.title))).toBe(true)
    const byTitle = browseListings({ ...DEFAULT_FILTER, query: 'GALAX' })
    expect(byTitle.some(l => !/galax/i.test(l.part.name))).toBe(true)
  })

  it('sorts by the store title', () => {
    const titles = browseListings({ ...DEFAULT_FILTER, category: 'cpu', sort: 'name' }).map(l => l.offer.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)))
  })
})

