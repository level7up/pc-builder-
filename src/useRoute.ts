import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import { findPart } from './domain/lookup'

export type Route = { name: 'builder' } | { name: 'prices' } | { name: 'parts' } | { name: 'wishlist' } | { name: 'compare' } | { name: 'part'; id: string }

export const HOME_HASH = '#'
export const PRICES_HASH = '#prices'
export const PARTS_HASH = '#parts'
export const WISHLIST_HASH = '#wishlist'
export const COMPARE_HASH = '#compare'
const PART_PREFIX = '#part/'

export const partHash = (id: string): string => PART_PREFIX + encodeURIComponent(id)

function decodedId(hash: string): string | undefined {
  try {
    return decodeURIComponent(hash.slice(PART_PREFIX.length))
  } catch {
    return undefined
  }
}

export function routeFor(hash: string): Route {
  if (hash === PRICES_HASH) return { name: 'prices' }
  if (hash === PARTS_HASH) return { name: 'parts' }
  if (hash === WISHLIST_HASH) return { name: 'wishlist' }
  if (hash === COMPARE_HASH) return { name: 'compare' }
  if (!hash.startsWith(PART_PREFIX)) return { name: 'builder' }
  const id = decodedId(hash)
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
