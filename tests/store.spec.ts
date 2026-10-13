import { describe, expect, it } from 'vitest'
import { catalog, cpus } from '../src/data/parts'
import { CATEGORIES, resolveBuild } from '../src/domain/build'
import { buildForBudget } from '../src/domain/budget'
import { atStore, catalogAt, compareStores, storeById, STORES, unavailableAt, withStoreIssues } from '../src/domain/store'
import { suggestBoards } from '../src/domain/suggest'

const compumarts = storeById('compumarts')!
const ryzen = cpus.find(c => c.id === 'r5-7500f')!

describe('one store', () => {
  it('lists the eight stores by id and name', () => {
    expect(STORES).toHaveLength(8)
    expect(compumarts.name).toBe('Compumarts')
    expect(storeById('nope')).toBeUndefined()
  })

  it('prices a part at one store from its in-stock offer there', () => {
    const offer = ryzen.listing.offers.find(o => o.store === 'Compumarts' && o.inStock)!
    const there = atStore(ryzen, 'Compumarts')!
    expect(there.listing).toMatchObject({ priceEgp: offer.priceEgp, store: 'Compumarts', url: offer.url })
    expect(there.listing.offers).toBe(ryzen.listing.offers)
    expect(ryzen.listing.store).not.toBe('Compumarts')
  })

  it('has no price at a store that only lists the part out of stock', () => {
    const pairs = cpus.flatMap(c => [...new Set(c.listing.offers.map(o => o.store))].map(store => ({ part: c, store })))
    const { part, store } = pairs.find(({ part, store }) => part.listing.offers.filter(o => o.store === store).every(o => !o.inStock))!
    expect(atStore(part, store)).toBeUndefined()
  })

  it('narrows the catalogue to the parts a store has in stock, priced there', () => {
    const full = catalogAt(undefined)
    expect(full).toBe(catalog)
    const there = catalogAt('compumarts')
    CATEGORIES.forEach(category => {
      expect(there[category].length).toBeGreaterThan(0)
      expect(there[category].length).toBeLessThanOrEqual(catalog[category].length)
      expect(there[category].every(p => p.listing.store === 'Compumarts')).toBe(true)
    })
    expect(catalogAt('compumarts')).toBe(there)
  })

  it('names the picked parts a store does not have', () => {
    const there = catalogAt('compumarts')
    const missingCpu = catalog.cpu.find(c => !there.cpu.some(p => p.id === c.id))!
    const ids = { cpu: missingCpu.id, gpu: there.gpu[0].id }
    expect(unavailableAt(ids, there)).toEqual(['cpu'])
    expect(unavailableAt(ids, catalog)).toEqual([])
  })

  it('warns about picks the store lacks instead of calling them not picked', () => {
    const missing = { severity: 'info' as const, code: 'missing', params: { category: 'cpu' } }
    const other = { severity: 'info' as const, code: 'missing', params: { category: 'case' } }
    const error = { severity: 'error' as const, code: 'socketMismatch' }
    expect(withStoreIssues([error, missing, other], ['cpu'], compumarts)).toEqual([
      error,
      { severity: 'warning', code: 'notAtStore', params: { category: 'cpu', store: 'Compumarts' } },
      other
    ])
    expect(withStoreIssues([missing], ['cpu'], undefined)).toEqual([missing])
  })

  it('compares what the build costs at each store, complete stores first then cheapest', () => {
    const ids = { cpu: 'r5-7500f', gpu: catalogAt('compumarts').gpu[0].id }
    const quotes = compareStores(ids)
    expect(quotes.length).toBeGreaterThan(1)
    const fullQuotes = quotes.filter(q => q.missing.length === 0)
    expect(quotes.slice(0, fullQuotes.length)).toEqual(fullQuotes)
    fullQuotes.slice(1).forEach((q, i) => expect(q.total).toBeGreaterThanOrEqual(fullQuotes[i].total))
    const atCompumarts = quotes.find(q => q.store.id === 'compumarts')!
    const build = resolveBuild(ids, catalogAt('compumarts'))
    expect(atCompumarts.total).toBe(build.cpu!.listing.priceEgp + build.gpu!.listing.priceEgp)
    expect(compareStores({})).toEqual([])
  })

  it('builds a budget system entirely from one store', () => {
    const there = catalogAt('compumarts')
    const result = buildForBudget(80000, '1080p', there)
    expect(result.kind).toBe('ok')
    if (result.kind !== 'ok') return
    const build = resolveBuild(result.ids, there)
    CATEGORIES.filter(c => result.ids[c]).forEach(c => expect(build[c]?.listing.store).toBe('Compumarts'))
  })

  it('says so when a store cannot make any complete build', () => {
    const noCases = { ...catalogAt('compumarts'), case: [] }
    expect(buildForBudget(80000, '1080p', noCases)).toEqual({ kind: 'unavailable' })
  })

  it('suggests only boards the store has', () => {
    const there = catalogAt('compumarts')
    suggestBoards(ryzen, {}, there).forEach(s => expect(there.motherboard).toContain(s.part))
  })
})
