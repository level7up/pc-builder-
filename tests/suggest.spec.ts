import { describe, expect, it } from 'vitest'
import { catalog } from '../src/data/parts'
import { resolveBuild } from '../src/domain/build'
import { fitsWith, needsSuggestion, suggestBoards, suggestCpus } from '../src/domain/suggest'

const cpu = (id: string) => catalog.cpu.find(c => c.id === id)!
const board = (id: string) => catalog.motherboard.find(b => b.id === id)!

describe('processor suggestions for a motherboard', () => {
  it('suggests only CPUs for the board socket that the board can power', () => {
    const picks = suggestCpus(board('mb-h610m-k-d4'))
    expect(picks.length).toBeGreaterThan(0)
    picks.forEach(({ part }) => {
      expect(part.socket).toBe('LGA1700')
      expect(part.powerW).toBeLessThanOrEqual(150)
    })
  })

  it('labels the cheapest, best value and strongest picks without repeats', () => {
    const picks = suggestCpus(board('mb-b850-tomahawk'))
    expect(picks.map(p => p.reason)).toEqual(['cheapest', 'bestValue', 'strongest'])
    expect(new Set(picks.map(p => p.part.id)).size).toBe(3)
    expect(picks[0].part.id).toBe('r5-8400f')
    expect(picks[2].part.id).toBe('r7-9850x3d')
  })
})

describe('motherboard suggestions for a processor', () => {
  it('suggests matching boards with the cheapest first', () => {
    const picks = suggestBoards(cpu('r5-7500f'))
    expect(picks[0]).toEqual({ part: board('mb-a620m-h'), reason: 'cheapest' })
    picks.forEach(({ part }) => expect(part.socket).toBe('AM5'))
  })

  it('offers an overclocking board only for unlocked CPUs', () => {
    expect(suggestBoards(cpu('i7-14700k')).map(p => p.reason)).toContain('overclock')
    expect(suggestBoards(cpu('i5-12400f')).map(p => p.reason)).not.toContain('overclock')
  })

  it('prefers boards that take the memory already picked', () => {
    const ddr4 = suggestBoards(cpu('i5-12400f'), resolveBuild({ memory: 'ram-d4-16' }))
    ddr4.forEach(({ part }) => expect(part.memory).toBe('DDR4'))
    const ddr5 = suggestBoards(cpu('i5-12400f'), resolveBuild({ memory: 'ram-d5-32' }))
    ddr5.forEach(({ part }) => expect(part.memory).toBe('DDR5'))
  })

  it('skips boards too weak for a hot CPU', () => {
    suggestBoards(cpu('i9-14900k')).forEach(({ part }) => expect(part.maxCpuPowerW).toBeGreaterThanOrEqual(253))
  })
})

describe('when to suggest', () => {
  it('suggests the missing half of the pair', () => {
    expect(needsSuggestion(resolveBuild({ motherboard: 'mb-b650m-p' }), 'cpu')).toBe(true)
    expect(needsSuggestion(resolveBuild({ motherboard: 'mb-b650m-p' }), 'motherboard')).toBe(false)
    expect(needsSuggestion(resolveBuild({ cpu: 'r5-7500f' }), 'motherboard')).toBe(true)
  })

  it('suggests again when the pair does not match, and not when it does', () => {
    expect(needsSuggestion(resolveBuild({ cpu: 'r5-7500f', motherboard: 'mb-h610m-k-d4' }), 'cpu')).toBe(true)
    expect(needsSuggestion(resolveBuild({ cpu: 'r5-7500f', motherboard: 'mb-b650m-p' }), 'cpu')).toBe(false)
  })
})

describe('fits with the current build', () => {
  it('marks parts that would add a compatibility error', () => {
    const build = resolveBuild({ motherboard: 'mb-b650m-p' })
    expect(fitsWith(build, 'cpu', cpu('r5-7500f'))).toBe(true)
    expect(fitsWith(build, 'cpu', cpu('i5-12400f'))).toBe(false)
    expect(fitsWith(build, 'memory', catalog.memory.find(m => m.id === 'ram-d4-16')!)).toBe(false)
  })

  it('does not blame a part for errors that were already there', () => {
    const broken = resolveBuild({ cpu: 'i5-12400f', motherboard: 'mb-b650m-p' })
    expect(fitsWith(broken, 'gpu', catalog.gpu[0])).toBe(true)
  })
})
