import { describe, expect, it } from 'vitest'
import { resolveBuild, totalPriceEgp } from '../src/domain/build'
import { fpsForBuild } from '../src/domain/fps'
import { PRESETS } from '../src/domain/presets'
import { catalogAt } from '../src/domain/store'
import {
  MAX_SAVED_BUILDS,
  MAX_NAME_LENGTH,
  addBuild,
  buildLines,
  inspectBuild,
  cleanName,
  compareBuilds,
  isSameBuild,
  removeBuild,
  renameBuild,
  sanitizeSavedBuilds,
  summarizeBuild,
  updateBuild,
  acceptPrices,
  currentPrices,
  priceMoves,
  totalMove,
  withPriceBaseline,
  type SavedBuild
} from '../src/domain/savedBuilds'

const preset = (id: string) => PRESETS.find(p => p.id === id)!.ids
const saved = (id: string, ids = preset('mainstream'), storeId?: string): SavedBuild => ({ id, name: id, ids, ...(storeId ? { storeId } : {}), savedAt: '2026-10-20T10:00:00.000Z' })

describe('saved build list', () => {
  it('adds a build at the top, then updates, renames and removes it without touching the old list', () => {
    const first = addBuild([], { name: 'Gaming', ids: preset('budget') }, 'a', '2026-10-20T10:00:00.000Z')
    const list = addBuild(first, { name: 'Work', ids: preset('high'), storeId: 'sigma' }, 'b', '2026-10-20T11:00:00.000Z')
    expect(list.map(b => b.id)).toEqual(['b', 'a'])
    expect(list[0]).toEqual({ id: 'b', name: 'Work', ids: preset('high'), storeId: 'sigma', savedAt: '2026-10-20T11:00:00.000Z', prices: currentPrices(preset('high'), 'sigma') })
    expect(first).toHaveLength(1)
    const updated = updateBuild(list, 'a', { ids: preset('enthusiast') }, '2026-10-20T12:00:00.000Z')
    expect(updated.find(b => b.id === 'a')).toMatchObject({ ids: preset('enthusiast'), savedAt: '2026-10-20T12:00:00.000Z' })
    expect(updated.find(b => b.id === 'a')!.storeId).toBeUndefined()
    expect(list.find(b => b.id === 'a')!.ids).toEqual(preset('budget'))
    expect(renameBuild(list, 'a', '  Cheap   one ')[1].name).toBe('Cheap one')
    expect(removeBuild(list, 'a').map(b => b.id)).toEqual(['b'])
  })

  it('keeps at most the limit, dropping the oldest', () => {
    const full = Array.from({ length: MAX_SAVED_BUILDS }, (_, i) => saved(`b${i}`))
    const next = addBuild(full, { name: 'new', ids: preset('budget') }, 'new', '2026-10-20T10:00:00.000Z')
    expect(next).toHaveLength(MAX_SAVED_BUILDS)
    expect(next[0].id).toBe('new')
    expect(next.some(b => b.id === `b${MAX_SAVED_BUILDS - 1}`)).toBe(false)
  })

  it('cleans names and falls back when one is empty', () => {
    expect(cleanName('  my   build ', 'Build 1')).toBe('my build')
    expect(cleanName('   ', 'Build 1')).toBe('Build 1')
    expect(cleanName('x'.repeat(MAX_NAME_LENGTH + 10), 'Build 1')).toHaveLength(MAX_NAME_LENGTH)
  })

  it('reads only valid builds back from storage', () => {
    const raw = [
      saved('a'),
      { ...saved('b'), ids: { cpu: 'r5-7500f', gpu: 'nope' }, storeId: 'evil' },
      saved('a'),
      { id: 3, name: 'bad' },
      'junk'
    ]
    const result = sanitizeSavedBuilds(raw)
    expect(result.map(b => b.id)).toEqual(['a', 'b'])
    expect(result[1].ids).toEqual({ cpu: 'r5-7500f' })
    expect(result[1].storeId).toBeUndefined()
    expect(sanitizeSavedBuilds('junk')).toEqual([])
  })

  it('tells whether the current build still matches a saved one', () => {
    const build = saved('a', preset('budget'), 'sigma')
    expect(isSameBuild(build, { ...preset('budget') }, 'sigma')).toBe(true)
    expect(isSameBuild(build, preset('budget'), undefined)).toBe(false)
    expect(isSameBuild(build, { ...preset('budget'), gpu: undefined }, 'sigma')).toBe(false)
  })
})

describe('summarizing and comparing builds', () => {
  it('summarizes price, FPS, power and problems at the saved store', () => {
    const summary = summarizeBuild(saved('a', preset('mainstream'), 'compumarts'))
    const build = resolveBuild(preset('mainstream'), catalogAt('compumarts'))
    expect(summary.total).toBe(totalPriceEgp(build))
    const fps = fpsForBuild(build, '1080p').map(e => e.fps)
    expect(summary.fps['1080p']).toBe(Math.round(fps.reduce((a, b) => a + b, 0) / fps.length))
    expect(summary.partCount).toBe(Object.keys(preset('mainstream')).length)
    expect(summary.errors).toBe(0)
    expect(summarizeBuild(saved('b', { cpu: 'r5-7500f' })).fps['1080p']).toBeUndefined()
  })

  it('stars the cheaper and faster build and lists the parts that differ', () => {
    const cheap = saved('cheap', preset('budget'))
    const fast = saved('fast', preset('enthusiast'))
    const { metrics, parts } = compareBuilds([cheap, fast])
    const metric = (id: string) => metrics.find(m => m.id === id)!.cells.map(c => c.best)
    expect(metric('total')).toEqual([true, false])
    expect(metric('fps1440p')).toEqual([false, true])
    const gpuRow = parts.find(p => p.category === 'gpu')!
    expect(gpuRow.differs).toBe(true)
    expect(gpuRow.cells.map(c => c.id)).toEqual([preset('budget').gpu, preset('enthusiast').gpu])
    const same = compareBuilds([cheap, saved('copy', preset('budget'))])
    expect(same.parts.every(p => !p.differs)).toBe(true)
    expect(same.metrics.every(m => m.cells.every(c => !c.best))).toBe(true)
  })

  it('lists every category of a saved build with its price at the saved store', () => {
    const ids = { ...preset('mainstream') }
    const there = catalogAt('compumarts')
    const missingHere = catalogAt(undefined).gpu.find(g => !there.gpu.some(p => p.id === g.id))!
    const build = saved('a', { ...ids, gpu: missingHere.id }, 'compumarts')
    const details = inspectBuild(build)
    const lines = buildLines(build, details)
    expect(lines.map(l => l.category)).toEqual(['cpu', 'motherboard', 'memory', 'gpu', 'storage', 'psu', 'case', 'cooler'])
    const cpu = lines.find(l => l.category === 'cpu')!
    expect(cpu.part?.listing.priceEgp).toBe(there.cpu.find(p => p.id === ids.cpu)!.listing.priceEgp)
    expect(details.total).toBe(totalPriceEgp(resolveBuild(build.ids, there)))
    expect(details.store?.id).toBe('compumarts')
    expect(lines.find(l => l.category === 'gpu')).toMatchObject({ id: missingHere.id, name: missingHere.name, part: undefined, unavailable: true })
    expect(details.issues.some(i => i.code === 'notAtStore')).toBe(true)
    expect(inspectBuild(saved('b', {})).loadW).toBe(0)
  })
})

describe('price changes since saving', () => {
  const ids = preset('mainstream')
  const build = resolveBuild(ids)
  const withPrices = (prices: SavedBuild['prices']): SavedBuild => ({ ...saved('p', ids), prices })

  it('records the price of every part at the saved store', () => {
    const prices = currentPrices(ids, undefined)
    expect(prices.cpu).toBe(build.cpu!.listing.priceEgp)
    expect(Object.keys(prices).sort()).toEqual(Object.keys(ids).sort())
    expect(updateBuild([saved('a')], 'a', { ids }, '2026-10-21T10:00:00.000Z')[0].prices).toEqual(prices)
  })

  it('reports no moves while prices are the same', () => {
    expect(priceMoves(withPrices(currentPrices(ids, undefined)))).toEqual([])
    expect(priceMoves(saved('old', ids))).toEqual([])
  })

  it('reports each part whose price moved, and the total move', () => {
    const now = currentPrices(ids, undefined)
    const moves = priceMoves(withPrices({ ...now, cpu: now.cpu! - 500, gpu: now.gpu! + 1000 }))
    expect(moves).toEqual([
      { category: 'cpu', before: now.cpu! - 500, after: now.cpu, delta: 500 },
      { category: 'gpu', before: now.gpu! + 1000, after: now.gpu, delta: -1000 }
    ])
    expect(totalMove(moves)).toBe(-500)
  })

  it('reads saved prices back, dropping anything invalid', () => {
    const [read] = sanitizeSavedBuilds([{ id: 'x', name: 'X', ids, prices: { cpu: 7000, gpu: 'cheap', ram: 5, case: -1 } }])
    expect(read.prices).toEqual({ cpu: 7000 })
    expect(sanitizeSavedBuilds([{ id: 'y', name: 'Y', ids }])[0].prices).toBeUndefined()
  })

  it('gives builds saved before price tracking today\'s prices as their starting point', () => {
    const tracked = withPrices({ cpu: 1 })
    const [old, kept] = withPriceBaseline([saved('old', ids), tracked])
    expect(old.prices).toEqual(currentPrices(ids, undefined))
    expect(kept).toBe(tracked)
  })

  it('accepts the new prices for chosen builds only', () => {
    const list = [withPrices({ cpu: 1 }), { ...withPrices({ cpu: 1 }), id: 'q' }]
    const accepted = acceptPrices(list, ['p'])
    expect(priceMoves(accepted[0])).toEqual([])
    expect(accepted[1]).toBe(list[1])
    expect(acceptPrices(list).every(b => priceMoves(b).length === 0)).toBe(true)
  })

  it('carries the saved price on each build line', () => {
    const tracked = withPrices({ cpu: 1234 })
    expect(buildLines(tracked, inspectBuild(tracked)).find(l => l.category === 'cpu')!.savedPrice).toBe(1234)
  })
})
