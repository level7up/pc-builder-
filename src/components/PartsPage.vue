<script setup lang="ts">
import { computed, ref } from 'vue'
import { CATEGORIES } from '../domain/build'
import { browseListings, browseParts, DEFAULT_FILTER, SORT_ORDERS, type PartFilter } from '../domain/browse'
import { STORES } from '../domain/store'
import type { Locale, Messages } from '../i18n/messages'
import PartsGrid from './PartsGrid.vue'
import PartCard from './PartCard.vue'
import ListingCard from './ListingCard.vue'

type View = 'parts' | 'listings'
const VIEWS: readonly View[] = ['listings', 'parts']

const props = defineProps<{ t: Messages; locale: Locale }>()

const view = ref<View>('listings')
const filter = ref<PartFilter>({ ...DEFAULT_FILTER })
const parts = computed(() => (view.value === 'parts' ? browseParts(filter.value) : []))
const listings = computed(() => (view.value === 'listings' ? browseListings(filter.value) : []))
const count = computed(() => (view.value === 'parts' ? parts.value.length : listings.value.length))
const countText = computed(() => {
  const formatted = new Intl.NumberFormat(props.locale === 'ar' ? 'ar-EG' : 'en-EG').format(count.value)
  return view.value === 'parts' ? props.t.browse.count(formatted) : props.t.browse.listingCount(formatted)
})

const update = <K extends keyof PartFilter>(key: K, value: PartFilter[K]) => { filter.value = { ...filter.value, [key]: value } }
const optional = (value: string) => value || undefined
</script>

<template>
  <section class="parts-page" :aria-label="t.browse.title">
    <div class="head">
      <h2>{{ t.browse.title }}</h2>
      <span class="result-count" role="status">{{ countText }}</span>
    </div>

    <div class="views" role="group" :aria-label="t.browse.title">
      <button v-for="v in VIEWS" :key="v" type="button" class="view" :class="{ on: view === v }" :data-view="v" :aria-pressed="view === v" @click="view = v">{{ t.browse.views[v] }}</button>
    </div>

    <div class="filters">
      <input
        type="search"
        class="search"
        autocomplete="off"
        spellcheck="false"
        :value="filter.query"
        :placeholder="t.browse.search"
        :aria-label="t.browse.search"
        @input="update('query', ($event.target as HTMLInputElement).value)"
      />
      <select class="category" :value="filter.category ?? ''" :aria-label="t.browse.allCategories" @change="update('category', optional(($event.target as HTMLSelectElement).value) as PartFilter['category'])">
        <option value="">{{ t.browse.allCategories }}</option>
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ t.categories[c] }}</option>
      </select>
      <select class="store" :value="filter.storeId ?? ''" :aria-label="t.browse.allStores" @change="update('storeId', optional(($event.target as HTMLSelectElement).value))">
        <option value="">{{ t.browse.allStores }}</option>
        <option v-for="s in STORES" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <select class="sort" :value="filter.sort" :aria-label="t.browse.sorts.priceAsc" @change="update('sort', ($event.target as HTMLSelectElement).value as PartFilter['sort'])">
        <option v-for="s in SORT_ORDERS" :key="s" :value="s">{{ t.browse.sorts[s] }}</option>
      </select>
      <label class="check">
        <input type="checkbox" :checked="filter.inStockOnly" @change="update('inStockOnly', ($event.target as HTMLInputElement).checked)" />
        {{ t.browse.inStockOnly }}
      </label>
    </div>

    <PartsGrid v-if="view === 'parts' && parts.length" v-slot="{ item }" :items="parts" :item-key="found => found.part.id" :t="t">
      <PartCard :found="item" :t="t" :locale="locale" />
    </PartsGrid>
    <PartsGrid v-else-if="view === 'listings' && listings.length" v-slot="{ item }" :items="listings" :item-key="listing => listing.key" :t="t">
      <ListingCard :listing="item" :t="t" :locale="locale" />
    </PartsGrid>
    <p v-else class="empty">{{ t.browse.empty }}</p>
  </section>
</template>

<style scoped>
.parts-page { margin-top: 20px; }
.head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
h2 { margin: 0; font-size: 20px; }
.views { display: inline-flex; margin-top: 12px; padding: 3px; gap: 3px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); }
.view { border: 0; background: none; border-radius: 999px; padding: 6px 16px; font: inherit; font-size: 14px; font-weight: 700; color: var(--muted); cursor: pointer; }
.view.on { background: var(--accent); color: var(--accent-ink); }
.result-count { color: var(--muted); font-size: 14px; font-variant-numeric: tabular-nums; }
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 12px 0 16px; padding: 12px; border-radius: var(--radius); border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); }
.search, select { padding: 7px 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel2); color: inherit; font: inherit; font-size: 14px; }
.search { flex: 1 1 240px; min-width: 0; }
.search:focus, select:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
.check { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; white-space: nowrap; }
.check input { accent-color: var(--accent); }
.empty { padding: 32px; text-align: center; color: var(--muted); }
@media (max-width: 640px) {
  .filters select { flex: 1 1 40%; min-width: 0; }
}
</style>
