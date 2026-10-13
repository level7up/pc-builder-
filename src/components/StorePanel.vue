<script setup lang="ts">
import { computed } from 'vue'
import type { StoreInfo, StoreQuote } from '../domain/store'
import type { Category } from '../domain/types'
import type { Locale, Messages } from '../i18n/messages'
import { formatEgp } from '../format'

const props = defineProps<{
  stores: readonly StoreInfo[]
  storeId: string | undefined
  quotes: readonly StoreQuote[]
  t: Messages
  locale: Locale
}>()

const emit = defineEmits<{ select: [storeId: string | undefined] }>()

const current = computed(() => props.stores.find(s => s.id === props.storeId))
const separator = computed(() => (props.locale === 'ar' ? '، ' : ', '))
const missingText = (missing: Category[]) => props.t.store.missing(missing.map(c => props.t.categories[c]).join(separator.value))
</script>

<template>
  <section class="store-panel" :aria-label="t.store.title">
    <h2>{{ t.store.title }}</h2>
    <p class="hint">{{ current ? t.store.hintOne(current.name) : t.store.hintAll }}</p>
    <div class="chips" role="radiogroup" :aria-label="t.store.title">
      <button type="button" role="radio" class="chip" :class="{ on: !storeId }" :aria-checked="!storeId" @click="emit('select', undefined)">{{ t.store.all }}</button>
      <button
        v-for="s in stores"
        :key="s.id"
        type="button"
        role="radio"
        class="chip"
        :class="{ on: s.id === storeId }"
        :aria-checked="s.id === storeId"
        :data-store="s.id"
        @click="emit('select', s.id)"
      >{{ s.name }}</button>
    </div>
    <template v-if="quotes.length">
      <h3>{{ t.store.compareTitle }}</h3>
      <ul class="quotes">
        <li v-for="q in quotes" :key="q.store.id">
          <button
            type="button"
            class="quote"
            :class="{ on: q.store.id === storeId, complete: q.missing.length === 0 }"
            :data-store="q.store.id"
            :aria-pressed="q.store.id === storeId"
            @click="emit('select', q.store.id)"
          >
            <b class="name">{{ q.store.name }}</b>
            <span class="sum">{{ formatEgp(q.total, locale) }}</span>
            <span class="status">{{ q.missing.length === 0 ? `✓ ${t.store.complete}` : missingText(q.missing) }}</span>
          </button>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.store-panel { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); margin-bottom: 16px; }
h2 { margin: 0; font-size: 17px; }
.hint { margin: 4px 0 12px; font-size: 13px; color: var(--muted); }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { border: 1px solid var(--line); background: var(--panel2); border-radius: 999px; padding: 6px 14px; cursor: pointer; font-weight: 600; font-size: 13px; color: inherit; }
.chip:hover { border-color: var(--accent); }
.chip.on { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
h3 { margin: 16px 0 8px; font-size: 14px; }
.quotes { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
.quote { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 10px; inline-size: 100%; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel2); color: inherit; font: inherit; text-align: start; cursor: pointer; }
.quote:hover { border-color: var(--accent); }
.quote.on { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sum { font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
.status { grid-column: 1 / -1; font-size: 12px; color: var(--warn); }
.quote.complete .status { color: var(--ok); }
</style>
