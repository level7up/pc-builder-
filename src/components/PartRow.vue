<script setup lang="ts">
import { computed } from 'vue'
import type { Category, PartBase } from '../domain/types'
import type { Locale, Messages } from '../i18n/messages'
import { describePart } from '../specs'
import { formatEgp } from '../format'

export interface RowSuggestion {
  id: string
  name: string
  priceEgp: number
  reason: string
}

const props = defineProps<{
  category: Category
  options: readonly PartBase[]
  selected: string | undefined
  t: Messages
  locale: Locale
  fits: (part: PartBase) => boolean
  suggestTitle?: string
  suggestions?: RowSuggestion[]
}>()

const emit = defineEmits<{ change: [id: string | undefined] }>()

const sorted = computed(() => [...props.options].sort((a, b) => a.listing.priceEgp - b.listing.priceEgp))
const fitting = computed(() => sorted.value.filter(p => props.fits(p)))
const notFitting = computed(() => sorted.value.filter(p => !props.fits(p)))
const part = computed(() => props.options.find(p => p.id === props.selected))
const specs = computed(() => (part.value ? describePart(props.category, part.value, props.t) : []))
const selectId = computed(() => 'pick-' + props.category)

function onSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('change', value === '' ? undefined : value)
}
</script>

<template>
  <div class="row" :class="{ filled: part }">
    <label class="label" :for="selectId">{{ t.categories[category] }}</label>
    <div class="body">
      <select :id="selectId" :value="selected ?? ''" @change="onSelect">
        <option value="">{{ t.choose }}</option>
        <template v-if="notFitting.length === 0">
          <option v-for="o in sorted" :key="o.id" :value="o.id">{{ o.name }} — {{ formatEgp(o.listing.priceEgp, locale) }}</option>
        </template>
        <template v-else>
          <optgroup :label="t.groups.fits">
            <option v-for="o in fitting" :key="o.id" :value="o.id">{{ o.name }} — {{ formatEgp(o.listing.priceEgp, locale) }}</option>
          </optgroup>
          <optgroup :label="t.groups.other">
            <option v-for="o in notFitting" :key="o.id" :value="o.id">{{ o.name }} — {{ formatEgp(o.listing.priceEgp, locale) }}</option>
          </optgroup>
        </template>
      </select>
      <div v-if="suggestions && suggestions.length" class="suggest">
        <span class="suggest-title">{{ suggestTitle }}</span>
        <button v-for="s in suggestions" :key="s.id" type="button" class="pick" @click="emit('change', s.id)">
          <small>{{ s.reason }}</small>
          <b>{{ s.name }}</b>
          <span>{{ formatEgp(s.priceEgp, locale) }}</span>
        </button>
      </div>
      <div v-if="part" class="details">
        <span v-for="s in specs" :key="s" class="chip">{{ s }}</span>
      </div>
      <details v-if="part && part.listing.offers.length > 1" class="offers">
        <summary>{{ t.offers.compare(part.listing.offers.length) }}</summary>
        <ul>
          <li v-for="o in part.listing.offers" :key="o.store + o.url" :class="{ gone: !o.inStock }">
            <a :href="o.url" target="_blank" rel="noopener" :title="o.title">
              <b>{{ o.store }}</b>
              <span class="offer-title">{{ o.title }}</span>
            </a>
            <span class="offer-price">{{ o.inStock ? formatEgp(o.priceEgp, locale) : t.offers.outOfStock }}</span>
          </li>
        </ul>
      </details>
    </div>
    <div v-if="part" class="price">
      <a :href="part.listing.url" target="_blank" rel="noopener" :title="t.viewAtStore">{{ formatEgp(part.listing.priceEgp, locale) }} ↗</a>
      <small class="store">{{ t.offers.cheapestAt(part.listing.store) }}</small>
      <button type="button" class="clear" @click="emit('change', undefined)">{{ t.clear }}</button>
    </div>
  </div>
</template>

<style scoped>
.row { display: grid; grid-template-columns: 150px minmax(0, 1fr) auto; gap: 12px; align-items: start; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 14px; box-shadow: var(--shadow); }
.row.filled { border-inline-start: 4px solid var(--accent); }
.body { min-width: 0; }
.label { font-weight: 700; padding-top: 7px; }
select { width: 100%; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel2); direction: ltr; text-align: start; }
.details { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip { font-size: 12px; background: var(--panel2); border: 1px solid var(--line); border-radius: 999px; padding: 1px 10px; color: var(--muted); unicode-bidi: plaintext; }
.price { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; padding-top: 6px; white-space: nowrap; }
.price a { font-weight: 800; text-decoration: none; font-variant-numeric: tabular-nums; }
.price a:hover { color: var(--accent); }
.suggest { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; margin-top: 10px; padding: 10px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 8%, var(--panel)); border: 1px dashed color-mix(in srgb, var(--accent) 45%, var(--line)); }
.suggest-title { flex: 1 1 100%; font-size: 13px; font-weight: 700; }
.pick { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; border: 1px solid var(--line); background: var(--panel); border-radius: 10px; padding: 6px 12px; cursor: pointer; text-align: start; }
.pick:hover { border-color: var(--accent); }
.pick small { font-size: 11px; font-weight: 700; color: var(--accent); }
.pick b { font-size: 13px; }
.pick span { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.store { font-size: 11px; color: var(--muted); }
.offers { margin-top: 8px; font-size: 13px; min-width: 0; }
.offers summary { cursor: pointer; color: var(--accent); font-weight: 700; }
.offers ul { list-style: none; margin: 6px 0 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; }
.offers li { min-width: 0; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 5px 10px; border-radius: 8px; background: var(--panel2); border: 1px solid var(--line); }
.offers li a { flex: 1 1 auto; display: flex; gap: 8px; min-width: 0; overflow: hidden; color: inherit; text-decoration: none; }
.offers li a:hover b { color: var(--accent); }
.offers li b { white-space: nowrap; }
.offer-title { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; unicode-bidi: plaintext; }
.offer-price { font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
.offers li.gone { opacity: 0.55; }
.offers li.gone .offer-price { font-weight: 400; color: var(--muted); }
.clear { border: 0; background: none; color: var(--muted); cursor: pointer; font-size: 12px; padding: 0; }
.clear:hover { color: var(--bad); }
@media (max-width: 640px) {
  .row { grid-template-columns: 1fr; gap: 6px; }
  .label { padding-top: 0; }
  .price { flex-direction: row; justify-content: space-between; align-items: center; }
}
</style>
