import { catalog as fullCatalog } from '../data/parts'
import { checkBuild, isUnlocked } from './compatibility'
import { inStockOnly } from './stock'
import type { Build, Catalog, Category, Cpu, Motherboard, PartBase, PartsByCategory } from './types'

export type CpuReason = 'cheapest' | 'bestValue' | 'strongest'
export type BoardReason = 'cheapest' | 'overclock' | 'wifi'

export interface Suggestion<P, R> {
  part: P
  reason: R
}

export const MAX_SUGGESTIONS = 3

const NOT_A_FIT_PROBLEM = ['noVideoOutput']

const errorCount = (build: Build): number =>
  checkBuild(build).filter(i => i.severity === 'error' && !NOT_A_FIT_PROBLEM.includes(i.code)).length

export function fitsWith<C extends Category>(build: Build, category: C, part: PartsByCategory[C]): boolean {
  return errorCount({ ...build, [category]: part }) <= errorCount({ ...build, [category]: undefined })
}

const PAIR_PROBLEMS = ['socketMismatch', 'boardPowerLimited']

const isCleanPair = (pair: Build): boolean => checkBuild(pair).every(i => !PAIR_PROBLEMS.includes(i.code))

const byPrice = <P extends PartBase>(a: P, b: P): number => a.listing.priceEgp - b.listing.priceEgp

function pickDistinct<P extends PartBase, R>(rankings: [R, P[]][]): Suggestion<P, R>[] {
  return rankings.reduce<Suggestion<P, R>[]>((picked, [reason, ranked]) => {
    const part = ranked.find(p => !picked.some(s => s.part.id === p.id))
    return part ? [...picked, { part, reason }] : picked
  }, []).slice(0, MAX_SUGGESTIONS)
}

export function suggestCpus(board: Motherboard, catalog: Catalog = fullCatalog): Suggestion<Cpu, CpuReason>[] {
  const fitting = inStockOnly(catalog).cpu.filter(cpu => isCleanPair({ cpu, motherboard: board })).sort(byPrice)
  const value = (cpu: Cpu) => cpu.gamingScore / cpu.listing.priceEgp
  const byValue = [...fitting].sort((a, b) => value(b) - value(a))
  const byStrength = [...fitting].sort((a, b) => b.gamingScore - a.gamingScore || byPrice(a, b))
  return pickDistinct<Cpu, CpuReason>([['cheapest', fitting], ['bestValue', byValue], ['strongest', byStrength]])
}

export function suggestBoards(cpu: Cpu, build: Build = {}, catalog: Catalog = fullCatalog): Suggestion<Motherboard, BoardReason>[] {
  const pairs = inStockOnly(catalog).motherboard.filter(board => isCleanPair({ cpu, motherboard: board }))
  const matchingMemory = build.memory ? pairs.filter(board => board.memory === build.memory!.type) : []
  const fitting = (matchingMemory.length > 0 ? matchingMemory : pairs).sort(byPrice)
  const overclock = isUnlocked(cpu) ? fitting.filter(b => b.canOverclock) : []
  return pickDistinct<Motherboard, BoardReason>([['cheapest', fitting], ['overclock', overclock], ['wifi', fitting.filter(b => b.wifi)]])
}

export function needsSuggestion(build: Build, category: 'cpu' | 'motherboard'): boolean {
  const { cpu, motherboard } = build
  if (cpu && motherboard) return !isCleanPair({ cpu, motherboard })
  return category === 'cpu' ? !!motherboard : !!cpu
}
