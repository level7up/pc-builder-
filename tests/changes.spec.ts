import { describe, expect, it } from 'vitest'
import { catalog, OFFER_SOURCE, type OfferSource } from '../src/data/parts'
import { countByStatus, priceChanges, storePriceChanges } from '../src/domain/changes'

const ID = 'r5-7500f'
const offersOf = (id: string) => OFFER_SOURCE.items[id]
const previousWith = (offers: OfferSource['items'][string]): OfferSource => ({ ...OFFER_SOURCE, items: { ...OFFER_SOURCE.items, [ID]: offers } })
const rowFor = (previous: OfferSource) => priceChanges(previous).find(r => r.part.id === ID)!

describe('price changes', () => {
  it('lists every part once, unchanged when nothing moved', () => {
    const rows = priceChanges(OFFER_SOURCE)
    expect(rows).toHaveLength(Object.values(catalog).flat().length)
    expect(rows.every(r => r.status === 'same' && r.delta === 0)).toBe(true)
  })

  it('reports how much a part went down since the last check', () => {
    const row = rowFor(previousWith(offersOf(ID).map(o => ({ ...o, priceEgp: o.priceEgp + 500 }))))
    expect(row).toMatchObject({ category: 'cpu', status: 'down', delta: -500 })
    expect(row.before.priceEgp - row.after.priceEgp).toBe(500)
    expect(row.percent).toBeCloseTo((-500 / row.before.priceEgp) * 100)
  })

  it('reports a part that came back in stock', () => {
    const row = rowFor(previousWith(offersOf(ID).map(o => ({ ...o, inStock: false }))))
    expect(row.status).toBe('back')
    expect(row.before.inStock).toBe(false)
  })

  it('puts sold-out and back-in-stock parts first, then the biggest moves, then unchanged', () => {
    const cheaper = priceChanges(previousWith(offersOf(ID).map(o => ({ ...o, priceEgp: o.priceEgp + 500 }))))
    expect(cheaper[0].part.id).toBe(ID)
    expect(cheaper.slice(1).every(r => r.status === 'same')).toBe(true)
  })

  it('counts parts by status', () => {
    const rows = priceChanges(previousWith(offersOf(ID).map(o => ({ ...o, priceEgp: o.priceEgp - 300 }))))
    expect(countByStatus(rows)).toMatchObject({ up: 1, down: 0, soldOut: 0, back: 0, same: rows.length - 1 })
  })
})

describe('price changes at one store', () => {
  const withOffers = (offers: OfferSource['items'][string]): OfferSource => ({ ...OFFER_SOURCE, items: { [ID]: offers } })
  const at = (store: string, priceEgp: number, inStock = true) => ({ store, title: 'Ryzen 5 7500F', priceEgp, inStock, url: 'https://shop.test/x' })
  const rowsAt = (store: string, previous: OfferSource, current: OfferSource) => storePriceChanges(store, previous, current)

  it('lists only the parts the store has, unchanged when nothing moved', () => {
    const rows = storePriceChanges('compumarts', OFFER_SOURCE, OFFER_SOURCE)
    const listed = Object.values(OFFER_SOURCE.items).filter(offers => offers.some(o => o.store === 'compumarts')).length
    expect(rows).toHaveLength(listed)
    expect(rows.every(r => r.status === 'same')).toBe(true)
  })

  it('compares the store\'s own price, even when another store is cheaper', () => {
    const [row] = rowsAt('compumarts', withOffers([at('elbadr', 6000), at('compumarts', 7000)]), withOffers([at('elbadr', 6000), at('compumarts', 7700)]))
    expect(row).toMatchObject({ status: 'up', delta: 700, before: { priceEgp: 7000 }, after: { priceEgp: 7700 } })
  })

  it('treats a dropped listing as sold out and a new one as back in stock', () => {
    expect(rowsAt('compumarts', withOffers([at('compumarts', 7000)]), withOffers([at('elbadr', 6000)]))[0]).toMatchObject({ status: 'soldOut', after: { priceEgp: 7000, inStock: false } })
    expect(rowsAt('compumarts', withOffers([at('elbadr', 6000)]), withOffers([at('compumarts', 7000)]))[0]).toMatchObject({ status: 'back', before: { priceEgp: 7000, inStock: false } })
  })

  it('skips parts the store never listed', () => {
    expect(rowsAt('compumarts', withOffers([at('elbadr', 6000)]), withOffers([at('elbadr', 6500)]))).toEqual([])
  })
})
