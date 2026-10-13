import { catalog as fullCatalog } from '../data/parts'
import { cpuCapacity, gpuCapacity } from './bottleneck'
import { totalPriceEgp } from './build'
import { checkBuild } from './compatibility'
import { PSU_RATINGS, type Build, type BuildIds, type Case, type Catalog, type Cooler, type Cpu, type Gpu, type Memory, type Motherboard, type PartBase, type Psu, type Resolution } from './types'
import { recommendedPsuW } from './power'
import { toWesternDigits } from '../search'

export const MIN_DUAL_CHANNEL_GB = 16
export const PERFORMANCE_TOLERANCE = 0.97
export const MAX_BUDGET_EGP = 1_000_000
export const POWER_HUNGRY_GPU_W = 200
const GPU_FIT_MARGIN_MM = 15

export type BudgetResult =
  | { kind: 'ok'; ids: BuildIds; total: number; performance: number }
  | { kind: 'tooLow'; minimum: number }
  | { kind: 'unavailable' }

interface Candidate {
  build: Build
  total: number
  performance: number
  comfort: number
}

const byPrice = <P extends PartBase>(a: P, b: P): number => a.listing.priceEgp - b.listing.priceEgp

const cheapest = <P extends PartBase>(parts: readonly P[], accept: (p: P) => boolean): P | undefined =>
  [...parts].sort(byPrice).find(accept)

const boardFor = (catalog: Catalog, cpu: Cpu, memory: Memory['type']): Motherboard | undefined =>
  cheapest(catalog.motherboard, b => b.socket === cpu.socket && b.memory === memory && b.maxCpuPowerW >= cpu.powerW)

const cheapestPerSize = (kits: Memory[]): Memory[] => {
  const sorted = [...kits].sort(byPrice)
  return sorted.filter((kit, index) => sorted.findIndex(other => other.totalGb === kit.totalGb) === index)
}

const memoryOptions = (catalog: Catalog, type: Memory['type']): Memory[] =>
  cheapestPerSize(catalog.memory.filter(m => m.type === type && m.sticks >= 2 && m.totalGb >= MIN_DUAL_CHANNEL_GB))

const isGoldOrBetter = (psu: Psu): boolean => PSU_RATINGS.indexOf(psu.rating) >= PSU_RATINGS.indexOf('Gold')

const psuFor = (catalog: Catalog, cpu: Cpu, gpu: Gpu, preferGold: boolean): Psu | undefined => {
  const needed = recommendedPsuW({ cpu, gpu })
  const ok = (p: Psu) => p.watts >= needed && (gpu.boardPowerW < POWER_HUNGRY_GPU_W || p.rating !== 'Standard')
  return (preferGold ? cheapest(catalog.psu, p => ok(p) && isGoldOrBetter(p)) : undefined) ?? cheapest(catalog.psu, ok)
}

const caseFor = (catalog: Catalog, board: Motherboard, gpu: Gpu): Case | undefined =>
  cheapest(catalog.case, c => c.formFactors.includes(board.formFactor) && gpu.lengthMm <= c.maxGpuMm - GPU_FIT_MARGIN_MM)

const coolerFor = (catalog: Catalog, cpu: Cpu): Cooler | undefined => cheapest(catalog.cooler, c => c.ratedW >= cpu.powerW)

export const performanceOf = (cpu: Cpu, gpu: Gpu, memory: Memory, resolution: Resolution): number =>
  Math.min(cpuCapacity(cpu, memory), gpuCapacity(gpu, resolution))

const comfortOf = (build: Build): number =>
  (build.memory!.totalGb >= 32 ? 2 : 0) + (build.storage!.capacityGb >= 1000 ? 1 : 0) + (build.storage!.capacityGb >= 2000 ? 1 : 0) + (isGoldOrBetter(build.psu!) ? 1 : 0)

const isClean = (build: Build): boolean => checkBuild(build).every(i => i.severity === 'info')

function candidatesFor(catalog: Catalog, cpu: Cpu, gpu: Gpu, resolution: Resolution): Candidate[] {
  return cpu.memory.flatMap(type => {
    const board = boardFor(catalog, cpu, type)
    const cooler = coolerFor(catalog, cpu)
    if (!board || !cooler) return []
    const pcCase = caseFor(catalog, board, gpu)
    if (!pcCase) return []
    return memoryOptions(catalog, type).flatMap(memory => catalog.storage.flatMap(storage => [false, true].flatMap(preferGold => {
      const psu = psuFor(catalog, cpu, gpu, preferGold)
      if (!psu) return []
      const build: Build = { cpu, gpu, motherboard: board, memory, storage, psu, case: pcCase, cooler }
      if (!isClean(build)) return []
      return [{ build, total: totalPriceEgp(build), performance: performanceOf(cpu, gpu, memory, resolution), comfort: comfortOf(build) }]
    })))
  })
}

const candidateCache = new WeakMap<Catalog, Map<Resolution, Candidate[]>>()

function allCandidates(catalog: Catalog, resolution: Resolution): Candidate[] {
  const byResolution = candidateCache.get(catalog) ?? new Map<Resolution, Candidate[]>()
  candidateCache.set(catalog, byResolution)
  const cached = byResolution.get(resolution)
  if (cached) return cached
  const fresh = catalog.cpu.flatMap(cpu => catalog.gpu.flatMap(gpu => candidatesFor(catalog, cpu, gpu, resolution)))
  byResolution.set(resolution, fresh)
  return fresh
}

const idsOf = (build: Build): BuildIds =>
  Object.fromEntries(Object.entries(build).filter(([, part]) => part).map(([category, part]) => [category, (part as PartBase).id]))

export function buildForBudget(budgetEgp: number, resolution: Resolution, catalog: Catalog = fullCatalog): BudgetResult {
  const candidates = allCandidates(catalog, resolution)
  if (candidates.length === 0) return { kind: 'unavailable' }
  const affordable = candidates.filter(c => c.total <= budgetEgp)
  if (affordable.length === 0) return { kind: 'tooLow', minimum: Math.min(...candidates.map(c => c.total)) }
  const best = Math.max(...affordable.map(c => c.performance))
  const pick = affordable
    .filter(c => c.performance >= best * PERFORMANCE_TOLERANCE)
    .sort((a, b) => b.comfort - a.comfort || b.performance - a.performance || a.total - b.total)[0]
  return { kind: 'ok', ids: idsOf(pick.build), total: pick.total, performance: pick.performance }
}

export function parseBudget(raw: string): number | undefined {
  const cleaned = toWesternDigits(raw).replace(/[\s,٬.،]/g, '').replace(/(ج\.?م|جنيه|le|egp)/gi, '')
  if (!/^\d+$/.test(cleaned)) return undefined
  const value = Number(cleaned)
  return value > 0 && value <= MAX_BUDGET_EGP ? value : undefined
}
