import { readonly, ref, watch, type Ref } from 'vue'
import { sanitizeWishlist } from './domain/wishlist'

const WISHLIST_KEY = 'pcb-wishlist'

function readWishlist(): string[] {
  try {
    return sanitizeWishlist(JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function saveWishlist(ids: string[]): void {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids))
  } catch {
    return
  }
}

const wished = ref<string[]>(readWishlist())
watch(wished, saveWishlist)

export interface Wishlist {
  keys: Readonly<Ref<readonly string[]>>
  has: (key: string) => boolean
  toggle: (key: string) => void
  clear: () => void
}

const has = (key: string): boolean => wished.value.includes(key)

export function useWishlist(): Wishlist {
  return {
    keys: readonly(wished),
    has,
    toggle: key => { wished.value = has(key) ? wished.value.filter(other => other !== key) : [key, ...wished.value] },
    clear: () => { wished.value = [] }
  }
}
