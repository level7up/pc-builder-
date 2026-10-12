import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { resolveBuild, sanitizeIds, totalPriceEgp, withPart } from './domain/build'
import { bottleneckForBuild, type BottleneckResult } from './domain/bottleneck'
import { checkBuild } from './domain/compatibility'
import { estimatedLoadW, recommendedPsuW } from './domain/power'
import { idsFromQuery, idsToQuery } from './domain/share'
import type { Build, BuildIds, Category, Issue } from './domain/types'

const STORAGE_KEY = 'pcb-build'

function adoptSharedLink(): BuildIds | undefined {
  const fromLink = idsFromQuery(window.location.search)
  if (Object.keys(fromLink).length === 0) return undefined
  save(fromLink)
  window.history.replaceState(null, '', window.location.pathname)
  return fromLink
}

function readSaved(): BuildIds {
  const shared = adoptSharedLink()
  if (shared) return shared
  try {
    return sanitizeIds(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'))
  } catch {
    return {}
  }
}

function save(ids: BuildIds): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    return
  }
}

export interface BuildState {
  ids: Ref<BuildIds>
  build: ComputedRef<Build>
  issues: ComputedRef<Issue[]>
  bottlenecks: ComputedRef<BottleneckResult[]>
  total: ComputedRef<number>
  loadW: ComputedRef<number>
  recommendedW: ComputedRef<number>
  setPart: (category: Category, id: string | undefined) => void
  replace: (next: BuildIds) => void
  shareUrl: () => string
}

export function useBuild(): BuildState {
  const ids = ref<BuildIds>(readSaved())
  const build = computed(() => resolveBuild(ids.value))
  watch(ids, save)
  return {
    ids,
    build,
    issues: computed(() => checkBuild(build.value)),
    bottlenecks: computed(() => bottleneckForBuild(build.value)),
    total: computed(() => totalPriceEgp(build.value)),
    loadW: computed(() => estimatedLoadW(build.value)),
    recommendedW: computed(() => recommendedPsuW(build.value)),
    setPart: (category, id) => { ids.value = withPart(ids.value, category, id) },
    replace: next => { ids.value = sanitizeIds(next) },
    shareUrl: () => `${window.location.origin}${window.location.pathname}?${idsToQuery(ids.value)}`
  }
}
