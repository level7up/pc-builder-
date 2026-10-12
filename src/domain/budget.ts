import { catalog } from '../data/parts'
import { cpuCapacity, gpuCapacity } from './bottleneck'
import { totalPriceEgp } from './build'
import { checkBuild } from './compatibility'
import type { Build, BuildIds, Case, Cooler, Cpu, Gpu, Memory, Motherboard, PartBase, Psu, Resolution } from './types'
import { recommendedPsuW } from './power'

export const MIN_DUAL_CHANNEL_GB = 16
export const PERFORMANCE_TOLERANCE = 0.97
export const MAX_BUDGET_EGP = 1_000_000
export const POWER_HUNGRY_GPU_W = 200
const GPU_FIT_MARGIN_MM = 15

export type BudgetResult =
  | { kind: 'ok'; ids: BuildIds; total: number; performance: number }
  | { kind: 'tooLow'; minimum: number }

interface Candidate {
  build: Build
  total: number
  performance: number
  comfort: number
}

const byPrice = <P extends PartBase>(a: P, b: P): number => a.listing.priceEgp - b.listing.priceEgp

const cheapest = <P extends PartBase>(parts: readonly P[], accept: (p: P) => boolean): P | undefined =>
  [...parts].sort(byPrice).find(accept)

const boardFor = (cpu: Cpu, memory: Memory['type']): Motherboard | undefined =>
  cheapest(catalog.motherboard, b => b.socket === cpu.socket && b.memory === memory && b.maxCpuPowerW >= cpu.powerW)

const memoryOptions = (type: Memory['type']): Memory[] =>
  catalog.memory.filter(m => m.type === type && m.sticks >= 2 && m.totalGb >= MIN_DUAL_CHANNEL_GB)

const psuFor = (cpu: Cpu, gpu: Gpu, preferGold: boolean): Psu | undefined => {
  const needed = recommendedPsuW({ cpu, gpu })
  const ok = (p: Psu) => p.watts >= needed && (gpu.boardPowerW < POWER_HUNGRY_GPU_W || p.rating !== 'Standard')
  return (preferGold ? cheapest(catalog.psu, p => ok(p) && p.rating === 'Gold') : undefined) ?? cheapest(catalog.psu, ok)
}

const caseFor = (board: Motherboard, gpu: Gpu): Case | undefined =>
  cheapest(catalog.case, c => c.formFactors.includes(board.formFactor) && gpu.lengthMm <= c.maxGpuMm - GPU_FIT_MARGIN_MM)

const coolerFor = (cpu: Cpu): Cooler | undefined => cheapest(catalog.cooler, c => c.ratedW >= cpu.powerW)

export const performanceOf = (cpu: Cpu, gpu: Gpu, memory: Memory, resolution: Resolution): number =>
  Math.min(cpuCapacity(cpu, memory), gpuCapacity(gpu, resolution))

const comfortOf = (build: Build): number =>
  (build.memory!.totalGb >= 32 ? 2 : 0) + (build.storage!.capacityGb >= 1000 ? 1 : 0) + (build.storage!.capacityGb >= 2000 ? 1 : 0) + (build.psu!.rating === 'Gold' ? 1 : 0)

const isClean = (build: Build): boolean => checkBuild(build).every(i => i.severity === 'info')

function candidatesFor(cpu: Cpu, gpu: Gpu, resolution: Resolution): Candidate[] {
  return cpu.memory.flatMap(type => {
    const board = boardFor(cpu, type)
    const cooler = coolerFor(cpu)
    if (!board || !cooler) return []
    const pcCase = caseFor(board, gpu)
    if (!pcCase) return []
    return memoryOptions(type).flatMap(memory => catalog.storage.flatMap(storage => [false, true].flatMap(preferGold => {
      const psu = psuFor(cpu, gpu, preferGold)
      if (!psu) return []
      const build: Build = { cpu, gpu, motherboard: board, memory, storage, psu, case: pcCase, cooler }
      if (!isClean(build)) return []
      return [{ build, total: totalPriceEgp(build), performance: performanceOf(cpu, gpu, memory, resolution), comfort: comfortOf(build) }]
    })))
  })
}

const allCandidates = (resolution: Resolution): Candidate[] =>
  catalog.cpu.flatMap(cpu => catalog.gpu.flatMap(gpu => candidatesFor(cpu, gpu, resolution)))

const idsOf = (build: Build): BuildIds =>
  Object.fromEntries(Object.entries(build).filter(([, part]) => part).map(([category, part]) => [category, (part as PartBase).id]))

export function buildForBudget(budgetEgp: number, resolution: Resolution): BudgetResult {
  const candidates = allCandidates(resolution)
  const affordable = candidates.filter(c => c.total <= budgetEgp)
  if (affordable.length === 0) return { kind: 'tooLow', minimum: Math.min(...candidates.map(c => c.total)) }
  const best = Math.max(...affordable.map(c => c.performance))
  const pick = affordable
    .filter(c => c.performance >= best * PERFORMANCE_TOLERANCE)
    .sort((a, b) => b.comfort - a.comfort || b.performance - a.performance || a.total - b.total)[0]
  return { kind: 'ok', ids: idsOf(pick.build), total: pick.total, performance: pick.performance }
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export function parseBudget(raw: string): number | undefined {
  const western = [...raw].map(ch => (ARABIC_DIGITS.includes(ch) ? String(ARABIC_DIGITS.indexOf(ch)) : ch)).join('')
  const cleaned = western.replace(/[\s,٬.،]/g, '').replace(/(ج\.?م|جنيه|le|egp)/gi, '')
  if (!/^\d+$/.test(cleaned)) return undefined
  const value = Number(cleaned)
  return value > 0 && value <= MAX_BUDGET_EGP ? value : undefined
}
