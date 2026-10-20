import { bottleneckForBuild, RESOLUTIONS, type BottleneckResult } from './bottleneck'
import { CATEGORIES, resolveBuild, sanitizeIds, totalPriceEgp } from './build'
import { checkBuild } from './compatibility'
import { markBest, type CompareCell } from './compare'
import { findPart } from './lookup'
import { fpsForBuild } from './fps'
import { estimatedLoadW, recommendedPsuW } from './power'
import { catalogAt, storeById, unavailableAt, withStoreIssues, type StoreInfo } from './store'
import type { Build, BuildIds, Category, Issue, PartBase, Resolution } from './types'

export const MAX_SAVED_BUILDS = 30
export const MAX_NAME_LENGTH = 40

export interface SavedBuild {
  id: string
  name: string
  ids: BuildIds
  storeId?: string
  savedAt: string
}

export interface BuildContent {
  ids: BuildIds
  storeId?: string
}

export const cleanName = (raw: string, fallback: string): string => raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH) || fallback

const withStore = (storeId: string | undefined) => (storeById(storeId) ? { storeId } : {})

export function addBuild(list: readonly SavedBuild[], content: BuildContent & { name: string }, id: string, savedAt: string): SavedBuild[] {
  const build: SavedBuild = { id, name: content.name, ids: { ...content.ids }, ...withStore(content.storeId), savedAt }
  return [build, ...list].slice(0, MAX_SAVED_BUILDS)
}

export const updateBuild = (list: readonly SavedBuild[], id: string, content: BuildContent, savedAt: string): SavedBuild[] =>
  list.map(build => (build.id === id ? { id: build.id, name: build.name, ids: { ...content.ids }, ...withStore(content.storeId), savedAt } : build))

export const renameBuild = (list: readonly SavedBuild[], id: string, name: string): SavedBuild[] =>
  list.map(build => (build.id === id ? { ...build, name: cleanName(name, build.name) } : build))

export const removeBuild = (list: readonly SavedBuild[], id: string): SavedBuild[] => list.filter(build => build.id !== id)

const definedIds = (ids: BuildIds): BuildIds => Object.fromEntries(Object.entries(ids).filter(([, id]) => id !== undefined)) as BuildIds

export function isSameBuild(saved: SavedBuild, ids: BuildIds, storeId: string | undefined): boolean {
  const current = definedIds(ids)
  const keys = new Set([...Object.keys(saved.ids), ...Object.keys(current)]) as Set<Category>
  return saved.storeId === storeById(storeId)?.id && [...keys].every(key => saved.ids[key] === current[key])
}

function readSaved(raw: unknown): SavedBuild | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const item = raw as Record<string, unknown>
  if (typeof item.id !== 'string' || typeof item.name !== 'string') return undefined
  const savedAt = typeof item.savedAt === 'string' ? item.savedAt : new Date(0).toISOString()
  const storeId = typeof item.storeId === 'string' ? item.storeId : undefined
  return { id: item.id, name: cleanName(item.name, item.id), ids: sanitizeIds(item.ids), ...withStore(storeId), savedAt }
}

export function sanitizeSavedBuilds(raw: unknown): SavedBuild[] {
  if (!Array.isArray(raw)) return []
  const builds = raw.map(readSaved).filter((build): build is SavedBuild => build !== undefined)
  return builds.filter((build, index) => builds.findIndex(other => other.id === build.id) === index).slice(0, MAX_SAVED_BUILDS)
}

export interface BuildSummary {
  total: number
  partCount: number
  fps: Record<Resolution, number | undefined>
  loadW: number
  errors: number
  warnings: number
  missing: number
}

const average = (values: number[]): number | undefined => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : undefined)

export interface BuildDetails {
  build: Build
  store: StoreInfo | undefined
  unavailable: Category[]
  issues: Issue[]
  bottlenecks: BottleneckResult[]
  total: number
  loadW: number
  recommendedW: number
}

export function inspectBuild(saved: SavedBuild): BuildDetails {
  const catalog = catalogAt(saved.storeId)
  const build = resolveBuild(saved.ids, catalog)
  const store = storeById(saved.storeId)
  const unavailable = unavailableAt(saved.ids, catalog)
  const hasLoad = !!(build.cpu || build.gpu)
  return {
    build,
    store,
    unavailable,
    issues: withStoreIssues(checkBuild(build), unavailable, store),
    bottlenecks: bottleneckForBuild(build),
    total: totalPriceEgp(build),
    loadW: hasLoad ? estimatedLoadW(build) : 0,
    recommendedW: hasLoad ? recommendedPsuW(build) : 0
  }
}

export interface BuildLine {
  category: Category
  id: string | undefined
  part: PartBase | undefined
  name: string | undefined
  unavailable: boolean
}

export const buildLines = (saved: SavedBuild, details: BuildDetails): BuildLine[] =>
  CATEGORIES.map(category => {
    const id = saved.ids[category]
    const part: PartBase | undefined = details.build[category]
    return { category, id, part, name: part?.name ?? (id ? findPart(id)?.part.name : undefined), unavailable: details.unavailable.includes(category) }
  })

export function summarizeBuild(saved: SavedBuild): BuildSummary {
  const { build, issues, total, loadW } = inspectBuild(saved)
  const count = (test: (code: string, severity: string) => boolean) => issues.filter(i => test(i.code, i.severity)).length
  return {
    total,
    partCount: Object.keys(saved.ids).length,
    fps: Object.fromEntries(RESOLUTIONS.map(res => [res, average(fpsForBuild(build, res).map(e => e.fps))])) as Record<Resolution, number | undefined>,
    loadW,
    errors: count((_, severity) => severity === 'error'),
    warnings: count((_, severity) => severity === 'warning'),
    missing: count(code => code === 'missing')
  }
}

export type BuildMetricId = 'total' | 'fps1080p' | 'fps1440p' | 'fps4K' | 'power' | 'errors' | 'warnings' | 'missing'

export interface BuildMetricRow {
  id: BuildMetricId
  cells: CompareCell[]
}

export interface BuildPartCell {
  id: string | undefined
  name: string | undefined
  priceEgp: number | undefined
  inStock: boolean
  unavailable: boolean
}

export interface BuildPartRow {
  category: Category
  cells: BuildPartCell[]
  differs: boolean
}

interface MetricSpec {
  id: BuildMetricId
  better: 'higher' | 'lower'
  read: (summary: BuildSummary) => number | undefined
  unit: 'egp' | 'fps' | 'watts' | 'count'
}

const METRICS: MetricSpec[] = [
  { id: 'total', better: 'lower', unit: 'egp', read: s => s.total },
  { id: 'fps1080p', better: 'higher', unit: 'fps', read: s => s.fps['1080p'] },
  { id: 'fps1440p', better: 'higher', unit: 'fps', read: s => s.fps['1440p'] },
  { id: 'fps4K', better: 'higher', unit: 'fps', read: s => s.fps['4K'] },
  { id: 'power', better: 'lower', unit: 'watts', read: s => (s.loadW > 0 ? s.loadW : undefined) },
  { id: 'errors', better: 'lower', unit: 'count', read: s => s.errors },
  { id: 'warnings', better: 'lower', unit: 'count', read: s => s.warnings },
  { id: 'missing', better: 'lower', unit: 'count', read: s => s.missing }
]

function metricRow(spec: MetricSpec, summaries: BuildSummary[]): BuildMetricRow {
  const values = summaries.map(spec.read)
  const best = markBest(values, spec.better)
  return {
    id: spec.id,
    cells: values.map((value, i) => ({ value: value === undefined ? { kind: 'text', value: '—' } : { kind: 'number', value, unit: spec.unit }, best: best[i] }))
  }
}

function partRow(category: Category, builds: readonly SavedBuild[]): BuildPartRow {
  const cells = builds.map(saved => {
    const id = saved.ids[category]
    const part = resolveBuild(saved.ids, catalogAt(saved.storeId))[category]
    const name = part?.name ?? (id ? findPart(id)?.part.name : undefined)
    return { id, name, priceEgp: part?.listing.priceEgp, inStock: part?.listing.inStock ?? false, unavailable: id !== undefined && part === undefined }
  })
  return { category, cells, differs: new Set(cells.map(c => c.id)).size > 1 }
}

export function compareBuilds(builds: readonly SavedBuild[]): { metrics: BuildMetricRow[]; parts: BuildPartRow[] } {
  const summaries = builds.map(summarizeBuild)
  return { metrics: METRICS.map(spec => metricRow(spec, summaries)), parts: CATEGORIES.map(category => partRow(category, builds)) }
}
