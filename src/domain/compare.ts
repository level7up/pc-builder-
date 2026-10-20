import { inStockCount } from './browse'
import { findPart } from './lookup'
import { PSU_RATINGS, type Case, type Category, type Cooler, type Cpu, type Gpu, type Memory, type Motherboard, type PartBase, type Psu, type Storage } from './types'

export const MAX_COMPARE = 4

const PERCENT = 100
const GB_PER_TB = 1000

export type CompareOutcome = 'added' | 'removed' | 'replaced' | 'full'

export function withCompared(ids: readonly string[], id: string): { ids: string[]; outcome: CompareOutcome } {
  if (ids.includes(id)) return { ids: ids.filter(other => other !== id), outcome: 'removed' }
  const category = findPart(id)?.category
  if (ids.length > 0 && findPart(ids[0])?.category !== category) return { ids: [id], outcome: 'replaced' }
  if (ids.length >= MAX_COMPARE) return { ids: [...ids], outcome: 'full' }
  return { ids: [...ids, id], outcome: 'added' }
}

export function sanitizeCompare(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const known = [...new Set(raw.filter((id): id is string => typeof id === 'string' && findPart(id) !== undefined))]
  const category = known.length > 0 ? findPart(known[0])!.category : undefined
  return known.filter(id => findPart(id)!.category === category).slice(0, MAX_COMPARE)
}

export type Unit = 'egp' | 'percent' | 'gb' | 'watts' | 'mm' | 'mts' | 'stores' | 'count' | 'pcie' | 'fps'

export type CellValue =
  | { kind: 'number'; value: number; unit: Unit }
  | { kind: 'text'; value: string; rank?: number }
  | { kind: 'flag'; value: boolean }

export type RowId =
  | 'price' | 'stores' | 'performance' | 'value' | 'cores' | 'threads' | 'power' | 'socket' | 'memoryType' | 'igpu'
  | 'vram' | 'length' | 'chipset' | 'formFactor' | 'maxCpuPower' | 'overclock' | 'wifi' | 'capacity' | 'sticks'
  | 'speed' | 'pricePerGb' | 'pcie' | 'pricePerTb' | 'watts' | 'rating' | 'formFactors' | 'maxGpu' | 'kind' | 'rated'

export interface CompareCell {
  value: CellValue
  best: boolean
}

export interface CompareRow {
  id: RowId
  cells: CompareCell[]
}

interface RowSpec<P extends PartBase> {
  id: RowId
  read: (part: P, all: readonly P[]) => CellValue
  better?: 'higher' | 'lower'
  buyableOnly?: boolean
}

const num = (value: number, unit: Unit): CellValue => ({ kind: 'number', value, unit })
const text = (value: string, rank?: number): CellValue => ({ kind: 'text', value, ...(rank === undefined ? {} : { rank }) })
const flag = (value: boolean): CellValue => ({ kind: 'flag', value })

const priceOf = (part: PartBase): number => part.listing.priceEgp
const relative = (score: number, best: number): number => Math.round((score / best) * PERCENT)

type Scored = PartBase & { gamingScore: number }

const scoreRows = <P extends Scored>(): RowSpec<P>[] => [
  { id: 'performance', better: 'higher', read: (p, all) => num(relative(p.gamingScore, Math.max(...all.map(o => o.gamingScore))), 'percent') },
  {
    id: 'value',
    better: 'higher',
    buyableOnly: true,
    read: (p, all) => num(relative(p.gamingScore / priceOf(p), Math.max(...all.map(o => o.gamingScore / priceOf(o)))), 'percent')
  }
]

const COMMON: RowSpec<PartBase>[] = [
  { id: 'price', better: 'lower', buyableOnly: true, read: p => num(priceOf(p), 'egp') },
  { id: 'stores', better: 'higher', read: p => num(inStockCount(p), 'stores') }
]

const ROWS: { [K in Category]: RowSpec<never>[] } = {
  cpu: [
    ...scoreRows<Cpu>(),
    { id: 'cores', better: 'higher', read: (p: Cpu) => num(p.cores, 'count') },
    { id: 'threads', better: 'higher', read: (p: Cpu) => num(p.threads, 'count') },
    { id: 'power', better: 'lower', read: (p: Cpu) => num(p.powerW, 'watts') },
    { id: 'socket', read: (p: Cpu) => text(p.socket) },
    { id: 'memoryType', read: (p: Cpu) => text(p.memory.join(' / ')) },
    { id: 'igpu', better: 'higher', read: (p: Cpu) => flag(p.hasIgpu) }
  ],
  gpu: [
    ...scoreRows<Gpu>(),
    { id: 'vram', better: 'higher', read: (p: Gpu) => num(p.vramGb, 'gb') },
    { id: 'power', better: 'lower', read: (p: Gpu) => num(p.boardPowerW, 'watts') },
    { id: 'length', read: (p: Gpu) => num(p.lengthMm, 'mm') }
  ],
  motherboard: [
    { id: 'socket', read: (p: Motherboard) => text(p.socket) },
    { id: 'chipset', read: (p: Motherboard) => text(p.chipset) },
    { id: 'memoryType', read: (p: Motherboard) => text(p.memory) },
    { id: 'formFactor', read: (p: Motherboard) => text(p.formFactor) },
    { id: 'maxCpuPower', better: 'higher', read: (p: Motherboard) => num(p.maxCpuPowerW, 'watts') },
    { id: 'overclock', better: 'higher', read: (p: Motherboard) => flag(p.canOverclock) },
    { id: 'wifi', better: 'higher', read: (p: Motherboard) => flag(p.wifi) }
  ],
  memory: [
    { id: 'memoryType', read: (p: Memory) => text(p.type) },
    { id: 'capacity', better: 'higher', read: (p: Memory) => num(p.totalGb, 'gb') },
    { id: 'sticks', read: (p: Memory) => num(p.sticks, 'count') },
    { id: 'speed', better: 'higher', read: (p: Memory) => num(p.speedMts, 'mts') },
    { id: 'pricePerGb', better: 'lower', buyableOnly: true, read: (p: Memory) => num(Math.round(priceOf(p) / p.totalGb), 'egp') }
  ],
  storage: [
    { id: 'capacity', better: 'higher', read: (p: Storage) => num(p.capacityGb, 'gb') },
    { id: 'pcie', better: 'higher', read: (p: Storage) => num(p.pcieGen, 'pcie') },
    { id: 'pricePerTb', better: 'lower', buyableOnly: true, read: (p: Storage) => num(Math.round((priceOf(p) * GB_PER_TB) / p.capacityGb), 'egp') }
  ],
  psu: [
    { id: 'watts', better: 'higher', read: (p: Psu) => num(p.watts, 'watts') },
    { id: 'rating', better: 'higher', read: (p: Psu) => text(p.rating === 'Standard' ? '80 Plus' : `80 Plus ${p.rating}`, PSU_RATINGS.indexOf(p.rating)) }
  ],
  case: [
    { id: 'formFactors', read: (p: Case) => text(p.formFactors.join(' / ')) },
    { id: 'maxGpu', better: 'higher', read: (p: Case) => num(p.maxGpuMm, 'mm') }
  ],
  cooler: [
    { id: 'kind', read: (p: Cooler) => text(p.kind === 'air' ? 'Air' : 'AIO') },
    { id: 'rated', better: 'higher', read: (p: Cooler) => num(p.ratedW, 'watts') }
  ]
}

function rankOf(value: CellValue): number | undefined {
  if (value.kind === 'number') return value.value
  if (value.kind === 'flag') return Number(value.value)
  return value.rank
}

export function markBest(ranks: readonly (number | undefined)[], better: 'higher' | 'lower', eligible: readonly boolean[] = ranks.map(() => true)): boolean[] {
  const defined = ranks.filter((rank): rank is number => rank !== undefined)
  if (new Set(defined).size < 2) return ranks.map(() => false)
  const candidates = ranks.filter((rank, i): rank is number => rank !== undefined && eligible[i])
  if (candidates.length === 0) return ranks.map(() => false)
  const target = better === 'higher' ? Math.max(...candidates) : Math.min(...candidates)
  return ranks.map((rank, i) => eligible[i] && rank === target)
}

function bestFlags(values: CellValue[], parts: readonly PartBase[], spec: RowSpec<PartBase>): boolean[] {
  if (!spec.better) return values.map(() => false)
  return markBest(values.map(rankOf), spec.better, parts.map(part => !spec.buyableOnly || part.listing.inStock))
}

export function compareParts(category: Category, parts: readonly PartBase[]): CompareRow[] {
  const specs = [...COMMON, ...(ROWS[category] as unknown as RowSpec<PartBase>[])]
  return specs.map(spec => {
    const values = parts.map(part => spec.read(part, parts))
    const best = bestFlags(values, parts, spec)
    return { id: spec.id, cells: values.map((value, i) => ({ value, best: best[i] })) }
  })
}
