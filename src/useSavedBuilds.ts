import { computed, readonly, ref, watch, type ComputedRef, type Ref } from 'vue'
import { acceptPrices, addBuild, removeBuild, renameBuild, sanitizeSavedBuilds, updateBuild, withPriceBaseline, type BuildContent, type SavedBuild } from './domain/savedBuilds'

const BUILDS_KEY = 'pcb-builds'
const ACTIVE_KEY = 'pcb-active-build'

function read<T>(key: string, fallback: T, parse: (raw: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : parse(JSON.parse(raw))
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

const stored = read(BUILDS_KEY, [], sanitizeSavedBuilds)
const builds = ref<SavedBuild[]>(withPriceBaseline(stored))
if (stored.some(build => !build.prices)) write(BUILDS_KEY, builds.value)
const activeId = ref<string | undefined>(read(ACTIVE_KEY, undefined, raw => (typeof raw === 'string' && builds.value.some(b => b.id === raw) ? raw : undefined)))

watch(builds, value => write(BUILDS_KEY, value))
watch(activeId, value => write(ACTIVE_KEY, value))

const newId = (): string => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
const now = (): string => new Date().toISOString()

export interface SavedBuilds {
  builds: Readonly<Ref<readonly SavedBuild[]>>
  active: ComputedRef<SavedBuild | undefined>
  save: (name: string, content: BuildContent) => string
  update: (id: string, content: BuildContent) => void
  rename: (id: string, name: string) => void
  remove: (id: string) => void
  acceptPrices: (ids?: readonly string[]) => void
  setActive: (id: string | undefined) => void
  clear: () => void
}

export function useSavedBuilds(): SavedBuilds {
  return {
    builds: readonly(builds),
    active: computed(() => builds.value.find(b => b.id === activeId.value)),
    save: (name, content) => {
      const id = newId()
      builds.value = addBuild(builds.value, { name, ...content }, id, now())
      activeId.value = id
      return id
    },
    update: (id, content) => { builds.value = updateBuild(builds.value, id, content, now()) },
    rename: (id, name) => { builds.value = renameBuild(builds.value, id, name) },
    remove: id => {
      builds.value = removeBuild(builds.value, id)
      if (activeId.value === id) activeId.value = undefined
    },
    acceptPrices: ids => { builds.value = acceptPrices(builds.value, ids) },
    setActive: id => { activeId.value = id },
    clear: () => {
      builds.value = []
      activeId.value = undefined
    }
  }
}
