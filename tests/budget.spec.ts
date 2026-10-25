import { describe, expect, it } from 'vitest'
import { MAX_BUDGET_EGP, buildForBudget, parseBudget } from '../src/domain/budget'
import { resolveBuild } from '../src/domain/build'
import { checkBuild } from '../src/domain/compatibility'

const ok = (budget: number, res: '1080p' | '1440p' | '4K' = '1080p') => {
  const result = buildForBudget(budget, res)
  if (result.kind !== 'ok') throw new Error('expected a build for ' + budget)
  return result
}

describe('budget builder', () => {
  it.each([40_000, 60_000, 90_000, 130_000, 200_000, 400_000])('stays within %i EGP with a complete, clean build', budget => {
    const result = ok(budget)
    expect(result.total).toBeLessThanOrEqual(budget)
    const build = resolveBuild(result.ids)
    expect(Object.keys(result.ids).sort()).toEqual(['case', 'cooler', 'cpu', 'gpu', 'memory', 'motherboard', 'psu', 'storage'])
    expect(checkBuild(build).filter(i => i.severity !== 'info')).toEqual([])
  })

  it.each([40_000, 130_000])('boots from an NVMe drive at %i EGP', budget => {
    expect(resolveBuild(ok(budget).ids).storage!.kind).toBe('nvme')
  })

  it('gets faster as the budget grows', () => {
    const perf = [50_000, 80_000, 120_000, 200_000].map(b => ok(b, '1440p').performance)
    expect([...perf].sort((a, b) => a - b)).toEqual(perf)
  })

  it('uses most of a mid-range budget', () => {
    expect(ok(100_000).total).toBeGreaterThan(85_000)
  })

  it('puts more of a 4K budget into the graphics card than a 1080p one', () => {
    const at1080 = resolveBuild(ok(120_000, '1080p').ids)
    const at4k = resolveBuild(ok(120_000, '4K').ids)
    expect(at4k.gpu!.gamingScore).toBeGreaterThanOrEqual(at1080.gpu!.gamingScore)
    expect(at4k.cpu!.listing.priceEgp).toBeLessThanOrEqual(at1080.cpu!.listing.priceEgp)
  })

  it('reports the minimum when the budget is too low', () => {
    const result = buildForBudget(10_000, '1080p')
    expect(result.kind).toBe('tooLow')
    if (result.kind === 'tooLow') {
      expect(result.minimum).toBeGreaterThan(10_000)
      expect(buildForBudget(result.minimum, '1080p').kind).toBe('ok')
    }
  })
})

describe('budget input', () => {
  it.each([
    ['50000', 50000],
    ['50,000', 50000],
    ['٥٠٠٠٠', 50000],
    ['٥٠٬٠٠٠ ج.م', 50000],
    [' 75 000 EGP ', 75000],
    ['60000 جنيه', 60000]
  ])('reads %s', (raw, expected) => {
    expect(parseBudget(raw)).toBe(expected)
  })

  it.each(['', 'abc', '-5', '0', '1e6', String(MAX_BUDGET_EGP + 1)])('rejects %s', raw => {
    expect(parseBudget(raw)).toBeUndefined()
  })
})
