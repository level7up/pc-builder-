import { describe, expect, it } from 'vitest'
import { argList, mergeOffers, pickStores } from '../scripts/lib/select.mjs'

const STORES = [{ id: 'compumarts' }, { id: 'sigma' }, { id: 'elbadr' }]
const idsOf = (stores: { id: string }[]) => stores.map(store => store.id)

describe('choosing stores to scrape', () => {
  it('reads a comma list from --name=value, --name value or npm config', () => {
    expect(argList(['--stores=sigma,elbadr'], {}, 'stores')).toEqual(['sigma', 'elbadr'])
    expect(argList(['--stores', 'Sigma, ElBadr'], {}, 'stores')).toEqual(['sigma', 'elbadr'])
    expect(argList([], { npm_config_skip: 'elbadr' }, 'skip')).toEqual(['elbadr'])
    expect(argList([], {}, 'skip')).toEqual([])
  })

  it('keeps every store when nothing is chosen', () => {
    expect(idsOf(pickStores(STORES, [], []))).toEqual(['compumarts', 'sigma', 'elbadr'])
  })

  it('keeps only the listed stores, or all but the skipped ones', () => {
    expect(idsOf(pickStores(STORES, ['sigma', 'elbadr'], []))).toEqual(['sigma', 'elbadr'])
    expect(idsOf(pickStores(STORES, [], ['elbadr']))).toEqual(['compumarts', 'sigma'])
    expect(idsOf(pickStores(STORES, ['sigma', 'elbadr'], ['elbadr']))).toEqual(['sigma'])
  })

  it('rejects unknown store ids and an empty selection', () => {
    expect(() => pickStores(STORES, ['sigmaa'], [])).toThrow(/Unknown store: sigmaa.*compumarts, sigma, elbadr/)
    expect(() => pickStores(STORES, [], ['compumarts', 'sigma', 'elbadr'])).toThrow(/No stores left/)
  })
})

describe('merging scraped offers', () => {
  const offer = (store: string, priceEgp: number) => ({ store, priceEgp, inStock: true })
  const idsOfOffers = (offers: { store: string }[]) => offers.map(o => o.store)
  const previous = { items: { cpu: [offer('compumarts', 900), offer('sigma', 1000), offer('elbadr', 1100)] } }

  it('replaces scraped stores and keeps failed and unscraped stores, cheapest first', () => {
    const results = [
      { store: { id: 'compumarts' }, offers: { cpu: offer('compumarts', 1200) }, failed: false },
      { store: { id: 'sigma' }, offers: {}, failed: true }
    ]
    expect(mergeOffers(['cpu'], results, previous)).toEqual({
      cpu: [offer('sigma', 1000), offer('elbadr', 1100), offer('compumarts', 1200)]
    })
  })

  it('drops an offer a scraped store no longer has', () => {
    const results = [{ store: { id: 'compumarts' }, offers: {}, failed: false }]
    expect(idsOfOffers(mergeOffers(['cpu'], results, previous).cpu)).toEqual(['sigma', 'elbadr'])
  })
})
