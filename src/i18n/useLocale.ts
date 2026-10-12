import { computed, ref, watchEffect, type ComputedRef, type Ref } from 'vue'
import { BRAND, MESSAGES, type Locale, type Messages } from './messages'

const STORAGE_KEY = 'pcb-locale'

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    return
  }
}

const locale = ref<Locale>(readStoredLocale())

export interface LocaleState {
  locale: Ref<Locale>
  t: ComputedRef<Messages>
  toggle: () => void
}

export function useLocale(): LocaleState {
  const t = computed(() => MESSAGES[locale.value])
  watchEffect(() => {
    document.documentElement.lang = locale.value
    document.documentElement.dir = MESSAGES[locale.value].dir
    document.title = `${BRAND} · ${MESSAGES[locale.value].title}`
  })
  const toggle = () => {
    locale.value = locale.value === 'ar' ? 'en' : 'ar'
    storeLocale(locale.value)
  }
  return { locale, t, toggle }
}
