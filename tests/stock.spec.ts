import { describe, expect, it } from 'vitest'
import { catalog, cpus, listingFor, OFFER_SOURCE, type OfferSource } from '../src/data/parts'
import { totalPriceEgp } from '../src/domain/build'
import { buildForBudget } from '../src/domain/budget'
import { checkBuild } from '../src/domain/compatibility'
import { inStockOnly } from '../src/domain/stock'
import { suggestBoards, suggestCpus } from '../src/domain/suggest'
import type { Catalog, PartBase } from '../src/domain/types'

const soldOut = <P extends PartBase>(part: P): P => ({ ...part, listing: { ...part.listing, inStock: false } })
const ryzen = cpus.find(c => c.id === 'r5-7500f')!
const board = catalog.motherboard.find(b => b.socket === ryzen.socket && b.memory === 'DDR5')!

describe('sold-out parts', () => {
  it('marks a part sold out when no store has it in stock and keeps its last price', () => {
    const everywhereGone: OfferSource = {
      ...OFFER_SOURCE,
      items: { ...OFFER_SOURCE.items, [ryzen.id]: OFFER_SOURCE.items[ryzen.id].map(o => ({ ...o, inStock: false })) }
    }
    const listing = listingFor(ryzen.id, undefined, everywhereGone)
    expect(listing.inStock).toBe(false)
    expect(listing.priceEgp).toBeGreaterThan(100)
    expect(listingFor(ryzen.id).inStock).toBe(true)
  })

  it('leaves sold-out parts out of the total', () => {
    expect(totalPriceEgp({ cpu: ryzen, motherboard: soldOut(board) })).toBe(ryzen.listing.priceEgp)
  })

  it('warns about a sold-out pick', () => {
    expect(checkBuild({ cpu: ryzen, motherboard: soldOut(board) })).toContainEqual({ severity: 'warning', code: 'soldOut', params: { category: 'motherboard' } })
    expect(checkBuild({ cpu: ryzen, motherboard: board }).some(i => i.code === 'soldOut')).toBe(false)
  })

  it('keeps only in-stock parts for building and suggesting', () => {
    const withSoldBoard: Catalog = { ...catalog, motherboard: [soldOut(board), ...catalog.motherboard.filter(b => b.id !== board.id)] }
    const buyable = inStockOnly(withSoldBoard)
    expect(buyable.motherboard.some(b => b.id === board.id)).toBe(false)
    expect(inStockOnly(withSoldBoard)).toBe(buyable)
    expect(suggestBoards(ryzen, {}, withSoldBoard).some(s => s.part.id === board.id)).toBe(false)
    expect(suggestCpus(board, { ...catalog, cpu: [soldOut(ryzen)] })).toEqual([])
  })

  it('never builds a budget system from sold-out parts', () => {
    const noCases: Catalog = { ...catalog, case: catalog.case.map(soldOut) }
    expect(buildForBudget(80000, '1080p', noCases)).toEqual({ kind: 'unavailable' })
  })
})
