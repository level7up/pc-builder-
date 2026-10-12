import { computed, ref, watchEffect, type ComputedRef } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'pcb-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    return
  }
}

const systemPrefersDark = (): boolean => typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches

const chosen = ref<Theme | null>(readStoredTheme())

export interface ThemeState {
  theme: ComputedRef<Theme>
  toggle: () => void
}

export function useTheme(): ThemeState {
  const theme = computed<Theme>(() => chosen.value ?? (systemPrefersDark() ? 'dark' : 'light'))
  watchEffect(() => {
    if (chosen.value) document.documentElement.dataset.theme = chosen.value
    else delete document.documentElement.dataset.theme
  })
  const toggle = () => {
    chosen.value = theme.value === 'dark' ? 'light' : 'dark'
    storeTheme(chosen.value)
  }
  return { theme, toggle }
}
