import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { resolveBuild, sanitizeIds, totalPriceEgp, withPart } from './domain/build'
import { bottleneckForBuild, type BottleneckResult } from './domain/bottleneck'
import { checkBuild } from './domain/compatibility'
import { estimatedLoadW, recommendedPsuW } from './domain/power'
import { idsFromQuery, idsToQuery, storeFromQuery } from './domain/share'
import { catalogAt, compareStores, storeById, unavailableAt, withStoreIssues, type StoreInfo, type StoreQuote } from './domain/store'
import type { Build, BuildIds, Catalog, Category, Issue } from './domain/types'

const STORAGE_KEY = 'pcb-build'
const STORE_KEY = 'pcb-store'

interface Saved {
  ids: BuildIds
  storeId: string | undefined
}

function adoptSharedLink(): Saved | undefined {
  const query = window.location.search
  const ids = idsFromQuery(query)
  if (Object.keys(ids).length === 0) return undefined
  const storeId = storeFromQuery(query)
  save(ids)
  saveStore(storeId)
  window.history.replaceState(null, '', window.location.pathname)
  return { ids, storeId }
}

function readIds(): BuildIds {
  try {
    return sanitizeIds(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'))
  } catch {
    return {}
  }
}

function readStore(): string | undefined {
  try {
    return storeById(localStorage.getItem(STORE_KEY) ?? undefined)?.id
  } catch {
    return undefined
  }
}

const readSaved = (): Saved => adoptSharedLink() ?? { ids: readIds(), storeId: readStore() }

function save(ids: BuildIds): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    return
  }
}

function saveStore(storeId: string | undefined): void {
  try {
    if (storeId) localStorage.setItem(STORE_KEY, storeId)
    else localStorage.removeItem(STORE_KEY)
  } catch {
    return
  }
}

export interface BuildState {
  ids: Ref<BuildIds>
  storeId: Ref<string | undefined>
  store: ComputedRef<StoreInfo | undefined>
  catalog: ComputedRef<Catalog>
  unavailable: ComputedRef<Category[]>
  quotes: ComputedRef<StoreQuote[]>
  build: ComputedRef<Build>
  issues: ComputedRef<Issue[]>
  bottlenecks: ComputedRef<BottleneckResult[]>
  total: ComputedRef<number>
  loadW: ComputedRef<number>
  recommendedW: ComputedRef<number>
  setPart: (category: Category, id: string | undefined) => void
  replace: (next: BuildIds) => void
  setStore: (storeId: string | undefined) => void
  shareUrl: () => string
}

export function useBuild(): BuildState {
  const saved = readSaved()
  const ids = ref<BuildIds>(saved.ids)
  const storeId = ref<string | undefined>(saved.storeId)
  const store = computed(() => storeById(storeId.value))
  const catalog = computed(() => catalogAt(storeId.value))
  const build = computed(() => resolveBuild(ids.value, catalog.value))
  const unavailable = computed(() => unavailableAt(ids.value, catalog.value))
  watch(ids, save)
  watch(storeId, saveStore)
  return {
    ids,
    storeId,
    store,
    catalog,
    unavailable,
    quotes: computed(() => compareStores(ids.value)),
    build,
    issues: computed(() => withStoreIssues(checkBuild(build.value), unavailable.value, store.value)),
    bottlenecks: computed(() => bottleneckForBuild(build.value)),
    total: computed(() => totalPriceEgp(build.value)),
    loadW: computed(() => estimatedLoadW(build.value)),
    recommendedW: computed(() => recommendedPsuW(build.value)),
    setPart: (category, id) => { ids.value = withPart(ids.value, category, id) },
    replace: next => { ids.value = sanitizeIds(next) },
    setStore: next => { storeId.value = storeById(next)?.id },
    shareUrl: () => `${window.location.origin}${window.location.pathname}?${idsToQuery(ids.value, storeId.value)}`
  }
}
