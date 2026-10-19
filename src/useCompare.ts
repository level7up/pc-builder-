import { readonly, ref, watch, type Ref } from 'vue'
import { sanitizeCompare, withCompared, type CompareOutcome } from './domain/compare'

const COMPARE_KEY = 'pcb-compare'

function readCompare(): string[] {
  try {
    return sanitizeCompare(JSON.parse(localStorage.getItem(COMPARE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function saveCompare(ids: string[]): void {
  try {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(ids))
  } catch {
    return
  }
}

const compared = ref<string[]>(readCompare())
watch(compared, saveCompare)

export interface CompareList {
  ids: Readonly<Ref<readonly string[]>>
  toggle: (id: string) => CompareOutcome
  clear: () => void
}

export function useCompare(): CompareList {
  return {
    ids: readonly(compared),
    toggle: id => {
      const next = withCompared(compared.value, id)
      compared.value = next.ids
      return next.outcome
    },
    clear: () => { compared.value = [] }
  }
}
