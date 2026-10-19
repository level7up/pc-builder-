<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { searchParts, type FoundPart } from '../domain/lookup'
import type { Locale, Messages } from '../i18n/messages'
import { formatEgp } from '../format'
import { goTo, partHash } from '../useRoute'

const props = defineProps<{ t: Messages; locale: Locale }>()

const LIST_ID = 'nav-search-list'
const optionId = (index: number) => `nav-search-option-${index}`

const root = ref<HTMLElement | null>(null)
const query = ref('')
const isOpen = ref(false)
const active = ref(0)

const results = computed(() => searchParts(query.value))
const showList = computed(() => isOpen.value && query.value.trim() !== '')

watch(query, () => {
  active.value = 0
  isOpen.value = true
})

function onOutside(event: Event) {
  if (!root.value?.contains(event.target as Node)) isOpen.value = false
}

onMounted(() => document.addEventListener('pointerdown', onOutside))
onUnmounted(() => document.removeEventListener('pointerdown', onOutside))

function choose(found: FoundPart) {
  query.value = ''
  isOpen.value = false
  goTo(partHash(found.part.id))
}

function move(step: number) {
  const count = results.value.length
  if (count > 0) active.value = (active.value + step + count) % count
}

function onKey(event: KeyboardEvent) {
  const actions: Record<string, () => void> = {
    ArrowDown: () => move(1),
    ArrowUp: () => move(-1),
    Enter: () => {
      const found = results.value[active.value]
      if (found) choose(found)
    },
    Escape: () => { isOpen.value = false }
  }
  const action = actions[event.key]
  if (!action) return
  event.preventDefault()
  action()
}

const categoryOf = (found: FoundPart) => props.t.categories[found.category]
</script>

<template>
  <div ref="root" class="nav-search">
    <input
      v-model="query"
      type="search"
      role="combobox"
      autocomplete="off"
      spellcheck="false"
      aria-autocomplete="list"
      :aria-expanded="showList"
      :aria-controls="LIST_ID"
      :aria-activedescendant="showList && results.length ? optionId(active) : undefined"
      :aria-label="t.search.label"
      :placeholder="t.search.label"
      @focus="isOpen = true"
      @keydown="onKey"
    />
    <ul v-if="showList" :id="LIST_ID" role="listbox" :aria-label="t.search.label">
      <li
        v-for="(found, i) in results"
        :id="optionId(i)"
        :key="found.part.id"
        role="option"
        class="option"
        :class="{ active: i === active }"
        :aria-selected="i === active"
        @mousedown.prevent
        @mousemove="active = i"
        @click="choose(found)"
      >
        <span class="text">
          <span class="name">{{ found.part.name }}</span>
          <small>{{ categoryOf(found) }}</small>
        </span>
        <span v-if="!found.part.listing.inStock" class="sold">{{ t.soldOut.badge }}</span>
        <span class="price">{{ formatEgp(found.part.listing.priceEgp, locale) }}</span>
      </li>
      <li v-if="results.length === 0" class="empty" role="presentation">{{ t.search.empty }}</li>
    </ul>
  </div>
</template>

<style scoped>
.nav-search { position: relative; flex: 0 1 300px; min-width: 0; }
input { inline-size: 100%; box-sizing: border-box; padding: 6px 14px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: inherit; font: inherit; font-size: 14px; }
input:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
ul { position: absolute; z-index: 40; inset-inline: 0; inset-block-start: calc(100% + 6px); min-inline-size: min(380px, calc(100vw - 32px)); margin: 0; padding: 6px; list-style: none; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); box-shadow: 0 12px 32px rgb(0 0 0 / 0.18); max-block-size: min(420px, 60vh); overflow-y: auto; }
.option { display: flex; align-items: center; gap: 10px; padding: 7px 8px; border-radius: 8px; cursor: pointer; }
.option.active { background: color-mix(in srgb, var(--accent) 14%, var(--panel)); }
.text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.name { direction: ltr; unicode-bidi: plaintext; text-align: start; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:global([dir='rtl'] .nav-search .name) { text-align: right; }
small { font-size: 12px; color: var(--muted); }
.price { flex: 0 0 auto; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.sold { flex: 0 0 auto; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 999px; color: var(--bad); border: 1px solid color-mix(in srgb, var(--bad) 45%, var(--line)); }
.empty { padding: 10px 8px; color: var(--muted); text-align: center; }
</style>
