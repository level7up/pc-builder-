import { describe, expect, it } from 'vitest'
import { checkBuild, hasErrors, isUnlocked } from '../src/domain/compatibility'
import { resolveBuild, totalPriceEgp } from '../src/domain/build'
import { estimatedLoadW, recommendedPsuW } from '../src/domain/power'
import { PRESETS } from '../src/domain/presets'
import { cases, cpus, gpus, psus } from '../src/data/parts'
import type { BuildIds } from '../src/domain/types'

const BASE: BuildIds = { cpu: 'r5-7500f', motherboard: 'mb-b650m-p', memory: 'ram-d5-32', gpu: 'rx9060xt-16', storage: 'ssd-1t', psu: 'psu-750g', case: 'case-danb4', cooler: 'cool-a450' }

const codes = (ids: BuildIds) => checkBuild(resolveBuild(ids)).map(i => i.code)

describe('compatibility', () => {
  it('passes a sensible AM5 build cleanly', () => {
    expect(checkBuild(resolveBuild(BASE)).filter(i => i.severity !== 'info')).toEqual([])
  })

  it('rejects a CPU on the wrong socket', () => {
    expect(codes({ ...BASE, cpu: 'i5-12400f' })).toContain('socketMismatch')
  })

  it('rejects DDR4 memory on a DDR5 board', () => {
    const found = codes({ ...BASE, memory: 'ram-d4-16' })
    expect(found).toContain('memoryMismatch')
    expect(found).toContain('cpuMemoryMismatch')
  })

  it('rejects an ATX board in a micro-ATX case', () => {
    expect(codes({ ...BASE, motherboard: 'mb-x870-eagle' })).toContain('formFactorMismatch')
  })

  it('flags a card that only just fits', () => {
    expect(codes({ ...BASE, gpu: 'rx9070gre', case: 'case-danb4' })).not.toContain('gpuTooLong')
    expect(codes({ ...BASE, gpu: 'rtx5090', case: 'case-danb4', psu: 'psu-1200g', motherboard: 'mb-b650m-p' })).toEqual(expect.not.arrayContaining(['gpuTooLong']))
  })

  it('only warns when a card is longer than an estimated case clearance', () => {
    const gpu = gpus.find(g => g.id === 'rtx5090')!
    const measured = { ...cases[0], maxGpuMm: 300 }
    const estimated = { ...measured, gpuClearanceEstimated: true }
    expect(checkBuild({ gpu, case: measured }).find(i => i.code === 'gpuTooLong')?.severity).toBe('error')
    const issue = checkBuild({ gpu, case: estimated }).find(i => i.code === 'gpuMaybeTooLong')
    expect(issue?.severity).toBe('warning')
    expect(issue?.params).toEqual({ gpu: gpu.lengthMm, max: 300 })
  })

  it('accepts any rated supply above Bronze for a power-hungry card', () => {
    const gpu = gpus.find(g => g.id === 'rtx5080')!
    const base = psus.find(p => p.watts >= 1000)!
    const rated = (rating: typeof base.rating) => checkBuild({ gpu, psu: { ...base, rating } }).map(i => i.code)
    expect(rated('Standard')).toContain('psuRatingLow')
    ;(['Bronze', 'Silver', 'Gold', 'Platinum', 'Titanium'] as const).forEach(r => expect(rated(r)).not.toContain('psuRatingLow'))
  })

  it('rejects a power supply below the estimated load', () => {
    expect(codes({ ...BASE, gpu: 'rtx5090', psu: 'psu-650' })).toContain('psuTooWeak')
  })

  it('warns when the supply has no headroom', () => {
    expect(codes({ ...BASE, cpu: 'r7-9800x3d', gpu: 'rtx5080', psu: 'psu-650' })).toContain('psuLowHeadroom')
  })

  it('warns about a weak cooler and a weak board for a hot CPU', () => {
    const found = codes({ ...BASE, cpu: 'r9-9950x3d', cooler: 'cool-se903', motherboard: 'mb-b650m-p' })
    expect(found).toContain('coolerUnderrated')
    expect(codes({ cpu: 'i7-14700k', motherboard: 'mb-h610m-k-d4' })).toContain('boardPowerLimited')
  })

  it('needs a graphics card when the CPU has no integrated graphics', () => {
    expect(codes({ ...BASE, gpu: undefined })).toContain('noVideoOutput')
    expect(codes({ ...BASE, cpu: 'r5-7600', gpu: undefined })).not.toContain('noVideoOutput')
  })

  it('warns about single-channel and small memory', () => {
    const found = codes({ ...BASE, motherboard: 'mb-h610m-k-d4', cpu: 'i5-12400f', memory: 'ram-d4-8' })
    expect(found).toContain('singleChannel')
    expect(found).toContain('lowRam')
  })

  it('notes overclocking and BIOS limits', () => {
    expect(codes({ cpu: 'i7-14700k', motherboard: 'mb-b760m-ds3h-d5' })).toEqual(expect.arrayContaining(['noOverclock', 'biosUpdate']))
    expect(codes({ cpu: 'i5-12400f', motherboard: 'mb-b760m-ds3h-d5' })).not.toContain('noOverclock')
  })

  it.each([
    ['r5-5600', 'mb-asus-prime-b450m-k-ii'],
    ['r7-9800x3d', 'mb-asus-b650e-max-wifi'],
    ['r9-9950x', 'mb-msi-x670e-tomahawk-wifi'],
    ['r5-8600g', 'mb-asus-prime-x670-p-wifi']
  ])('notes a possible BIOS update for %s on %s', (cpu, motherboard) => {
    expect(codes({ cpu, motherboard })).toContain('biosUpdate')
  })

  it('needs no BIOS note for a CPU on a board of its own generation', () => {
    expect(codes({ cpu: 'r7-9800x3d', motherboard: 'mb-b850m-ds3h' })).not.toContain('biosUpdate')
    expect(codes({ cpu: 'r5-5600', motherboard: 'mb-b550m-vdh' })).not.toContain('biosUpdate')
  })

  it('lists missing parts and puts errors first', () => {
    const issues = checkBuild(resolveBuild({ cpu: 'i5-12400f', motherboard: 'mb-a620m-h' }))
    expect(issues[0].severity).toBe('error')
    expect(issues.filter(i => i.code === 'missing').map(i => i.params?.category)).toEqual(['memory', 'storage', 'psu', 'case', 'cooler'])
  })

  it('knows which CPUs are unlocked', () => {
    const unlocked = cpus.filter(isUnlocked).map(c => c.id)
    expect(unlocked).toContain('i7-14700k')
    expect(unlocked).toContain('u7-265k')
    expect(unlocked).not.toContain('i5-12400f')
    expect(unlocked).not.toContain('u5-225f')
  })
})

describe('power', () => {
  it('adds CPU, GPU and platform power and rounds the recommendation up', () => {
    const build = resolveBuild({ cpu: 'r7-9800x3d', gpu: 'rtx5080' })
    expect(estimatedLoadW(build)).toBe(162 + 360 + 50)
    expect(recommendedPsuW(build)).toBe(750)
  })
})

describe('presets', () => {
  it.each(PRESETS.map(p => [p.id, p] as const))('%s build is complete and has no errors or warnings', (_id, preset) => {
    const issues = checkBuild(resolveBuild(preset.ids))
    expect(hasErrors(issues)).toBe(false)
    expect(issues.filter(i => i.severity === 'warning')).toEqual([])
  })

  it('climbs in price from budget to enthusiast', () => {
    const totals = PRESETS.map(p => totalPriceEgp(resolveBuild(p.ids)))
    expect([...totals].sort((a, b) => a - b)).toEqual(totals)
  })
})
