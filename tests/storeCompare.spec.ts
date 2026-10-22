import { describe, expect, it } from 'vitest'
import { resolveBuild, totalPriceEgp } from '../src/domain/build'
import { PRESETS } from '../src/domain/presets'
import { catalogAt, compareStores } from '../src/domain/store'
import { buildAcrossStores } from '../src/domain/storeCompare'

const ids = PRESETS[1].ids

describe('one build across every store', () => {
  it('has a column per store with stock, in the same order and totals as the store quotes', () => {
    const { columns } = buildAcrossStores(ids)
    const quotes = compareStores(ids)
    expect(columns.map(c => c.store.id)).toEqual(quotes.map(q => q.store.id))
    expect(columns.map(c => c.total)).toEqual(quotes.map(q => q.total))
    expect(columns.map(c => c.missing)).toEqual(quotes.map(q => q.missing))
  })

  it('has a row per picked part with that store\'s price, or none when it is not in stock there', () => {
    const { columns, rows } = buildAcrossStores(ids)
    expect(rows.map(r => r.category)).toEqual(Object.keys(ids))
    columns.forEach((column, i) => {
      const there = resolveBuild(ids, catalogAt(column.store.id))
      rows.forEach(row => expect(row.cells[i].priceEgp).toBe(there[row.category]?.listing.priceEgp))
    })
    expect(columns.reduce((sum, c, i) => sum + rows.reduce((s, r) => s + (r.cells[i].priceEgp ?? 0), 0) - c.total, 0)).toBe(0)
  })

  it('stars the cheapest price in each row', () => {
    const { rows } = buildAcrossStores(ids)
    rows.forEach(row => {
      const prices = row.cells.flatMap(c => (c.priceEgp === undefined ? [] : [c.priceEgp]))
      const starred = row.cells.filter(c => c.best).map(c => c.priceEgp)
      if (new Set(prices).size > 1) expect(starred.every(p => p === Math.min(...prices))).toBe(true)
      else expect(starred).toEqual([])
    })
  })

  it('marks the build\'s own store and the cheapest store that has every part', () => {
    const { columns } = buildAcrossStores(ids, 'sigma')
    expect(columns.filter(c => c.isCurrent).map(c => c.store.id)).toEqual(columns.some(c => c.store.id === 'sigma') ? ['sigma'] : [])
    const complete = columns.filter(c => c.missing.length === 0)
    const cheapest = columns.filter(c => c.isCheapest)
    expect(cheapest).toHaveLength(complete.length ? 1 : 0)
    if (complete.length) expect(cheapest[0].total).toBe(Math.min(...complete.map(c => c.total)))
  })

  it('is empty for an empty build', () => {
    expect(buildAcrossStores({})).toEqual({ columns: [], rows: [] })
  })

  it('totals match a build resolved at that store', () => {
    const { columns } = buildAcrossStores(ids)
    columns.forEach(c => expect(c.total).toBe(totalPriceEgp(resolveBuild(ids, catalogAt(c.store.id)))))
  })
})
