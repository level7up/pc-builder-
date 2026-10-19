import { describe, expect, it } from 'vitest'
import { catalog, OFFER_SOURCE, type OfferSource } from '../src/data/parts'
import { countByStatus, priceChanges } from '../src/domain/changes'

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
