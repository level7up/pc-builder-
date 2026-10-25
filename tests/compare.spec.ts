import { describe, expect, it } from 'vitest'
import { catalog } from '../src/data/parts'
import { compareParts, MAX_COMPARE, sanitizeCompare, withCompared, type CompareRow } from '../src/domain/compare'
import type { PartBase, Storage } from '../src/domain/types'

const gpus = [...catalog.gpu].sort((a, b) => a.listing.priceEgp - b.listing.priceEgp)
const cheapGpu = gpus.find(g => g.listing.inStock)!
const bigGpu = [...gpus].reverse().find(g => g.listing.inStock && g.vramGb > cheapGpu.vramGb)!
const row = (rows: CompareRow[], id: string) => rows.find(r => r.id === id)!
const soldOut = <P extends PartBase>(part: P): P => ({ ...part, listing: { ...part.listing, inStock: false } })

describe('choosing parts to compare', () => {
  it('adds parts of one category up to the limit', () => {
    const ids = catalog.gpu.slice(0, MAX_COMPARE).map(g => g.id)
    const filled = ids.reduce((list, id) => withCompared(list, id).ids, [] as string[])
    expect(filled).toEqual(ids)
    expect(withCompared(filled, catalog.gpu[MAX_COMPARE].id)).toEqual({ ids: filled, outcome: 'full' })
  })

  it('removes a part that is already compared', () => {
    expect(withCompared([cheapGpu.id, bigGpu.id], cheapGpu.id)).toEqual({ ids: [bigGpu.id], outcome: 'removed' })
  })

  it('starts over when a part of another category is added', () => {
    expect(withCompared([cheapGpu.id, bigGpu.id], 'r5-7500f')).toEqual({ ids: ['r5-7500f'], outcome: 'replaced' })
    expect(withCompared([cheapGpu.id], bigGpu.id)).toEqual({ ids: [cheapGpu.id, bigGpu.id], outcome: 'added' })
  })

  it('keeps only known parts of the first part category, up to the limit', () => {
    const tooMany = catalog.gpu.slice(0, MAX_COMPARE + 1).map(g => g.id)
    expect(sanitizeCompare([cheapGpu.id, 'nope', 'r5-7500f', cheapGpu.id, bigGpu.id])).toEqual([cheapGpu.id, bigGpu.id])
    expect(sanitizeCompare(tooMany)).toHaveLength(MAX_COMPARE)
    expect(sanitizeCompare('junk')).toEqual([])
  })
})

describe('comparing parts', () => {
  it('marks the cheapest price and the most VRAM as best', () => {
    const rows = compareParts('gpu', [cheapGpu, bigGpu])
    expect(row(rows, 'price').cells.map(c => c.best)).toEqual([true, false])
    expect(row(rows, 'vram').cells.map(c => c.best)).toEqual([false, true])
    expect(row(rows, 'vram').cells[1].value).toEqual({ kind: 'number', value: bigGpu.vramGb, unit: 'gb' })
  })

  it('rates performance and value against the best of the compared parts', () => {
    const rows = compareParts('gpu', [cheapGpu, bigGpu])
    const performance = row(rows, 'performance').cells.map(c => c.value)
    const strongest = Math.max(cheapGpu.gamingScore, bigGpu.gamingScore)
    expect(performance).toEqual([cheapGpu, bigGpu].map(g => ({ kind: 'number', value: Math.round((g.gamingScore / strongest) * 100), unit: 'percent' })))
    expect(row(rows, 'value').cells.some(c => c.best)).toBe(true)
  })

  it('marks nothing as best when the parts tie or a sold-out part is cheapest', () => {
    expect(row(compareParts('gpu', [cheapGpu, cheapGpu]), 'price').cells.every(c => !c.best)).toBe(true)
    expect(row(compareParts('gpu', [soldOut(cheapGpu), bigGpu]), 'price').cells.map(c => c.best)).toEqual([false, true])
  })

  it('has rows for the specs of every category', () => {
    const ids = (category: Parameters<typeof compareParts>[0]) => compareParts(category, catalog[category].slice(0, 2)).map(r => r.id)
    expect(ids('cpu')).toEqual(expect.arrayContaining(['price', 'performance', 'value', 'cores', 'threads', 'power', 'socket']))
    expect(ids('memory')).toEqual(expect.arrayContaining(['capacity', 'speed', 'pricePerGb']))
    expect(ids('storage')).toEqual(expect.arrayContaining(['capacity', 'interface', 'pricePerTb']))
    expect(ids('psu')).toEqual(expect.arrayContaining(['watts', 'rating']))
    expect(ids('case')).toEqual(expect.arrayContaining(['formFactors', 'maxGpu']))
    expect(ids('cooler')).toEqual(expect.arrayContaining(['kind', 'rated']))
    expect(ids('motherboard')).toEqual(expect.arrayContaining(['chipset', 'wifi', 'overclock', 'maxCpuPower']))
  })

  it('ranks NVMe drives above SATA SSDs and SATA SSDs above hard drives', () => {
    const drive = (kind: Storage['kind'], pcieGen?: Storage['pcieGen']) => ({ ...catalog.storage[0], id: kind, kind, pcieGen })
    const cells = row(compareParts('storage', [drive('hdd'), drive('sata'), drive('nvme', 4)]), 'interface').cells
    expect(cells.map(c => c.value.kind === 'text' && c.value.value)).toEqual(['HDD', 'SATA SSD', 'NVMe PCIe 4'])
    expect(cells.map(c => c.best)).toEqual([false, false, true])
  })

  it('treats a yes as better than a no', () => {
    const [withWifi, withoutWifi] = [catalog.motherboard.find(b => b.wifi)!, catalog.motherboard.find(b => !b.wifi)!]
    expect(row(compareParts('motherboard', [withoutWifi, withWifi]), 'wifi').cells.map(c => c.best)).toEqual([false, true])
  })
})
