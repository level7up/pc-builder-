import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import { findPart } from './domain/lookup'
import { storeById } from './domain/store'

export type Route = { name: 'builder' } | { name: 'prices' } | { name: 'parts' } | { name: 'wishlist' } | { name: 'compare' } | { name: 'builds' } | { name: 'part'; id: string } | { name: 'build'; id: string } | { name: 'stores' } | { name: 'store'; id: string }

export const HOME_HASH = '#'
export const PRICES_HASH = '#prices'
export const PARTS_HASH = '#parts'
export const WISHLIST_HASH = '#wishlist'
export const COMPARE_HASH = '#compare'
export const BUILDS_HASH = '#builds'
export const STORES_HASH = '#stores'
const PART_PREFIX = '#part/'
const BUILD_PREFIX = '#build/'
const STORE_PREFIX = '#store/'

export const partHash = (id: string): string => PART_PREFIX + encodeURIComponent(id)
export const buildHash = (id: string): string => BUILD_PREFIX + encodeURIComponent(id)
export const storeHash = (id: string): string => STORE_PREFIX + encodeURIComponent(id)

function decodedId(hash: string, prefix: string): string | undefined {
  try {
    return decodeURIComponent(hash.slice(prefix.length))
  } catch {
    return undefined
  }
}

export function routeFor(hash: string): Route {
  if (hash === PRICES_HASH) return { name: 'prices' }
  if (hash === PARTS_HASH) return { name: 'parts' }
  if (hash === WISHLIST_HASH) return { name: 'wishlist' }
  if (hash === COMPARE_HASH) return { name: 'compare' }
  if (hash === BUILDS_HASH) return { name: 'builds' }
  if (hash === STORES_HASH) return { name: 'stores' }
  if (hash.startsWith(STORE_PREFIX)) {
    const storeId = decodedId(hash, STORE_PREFIX)
    return storeId && storeById(storeId) ? { name: 'store', id: storeId } : { name: 'stores' }
  }
  if (hash.startsWith(BUILD_PREFIX)) {
    const buildId = decodedId(hash, BUILD_PREFIX)
    return buildId ? { name: 'build', id: buildId } : { name: 'builder' }
  }
  if (!hash.startsWith(PART_PREFIX)) return { name: 'builder' }
  const id = decodedId(hash, PART_PREFIX)
  return id !== undefined && findPart(id) ? { name: 'part', id } : { name: 'builder' }
}

export const goTo = (hash: string): void => { window.location.hash = hash }

export function useRoute(): Ref<Route> {
  const route = ref<Route>(routeFor(window.location.hash))
  const update = () => { route.value = routeFor(window.location.hash) }
  onMounted(() => window.addEventListener('hashchange', update))
  onUnmounted(() => window.removeEventListener('hashchange', update))
  return route
}
