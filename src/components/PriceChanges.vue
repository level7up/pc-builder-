<script setup lang="ts">
import { computed, ref } from 'vue'
import { PRICES_CHECKED_ON } from '../data/parts'
import { PREVIOUS_OFFER_SOURCE } from '../data/previous'
import { CATEGORIES } from '../domain/build'
import { CHANGE_STATUSES, countByStatus, priceChanges, type ChangeStatus, type PricePoint } from '../domain/changes'
import type { Category } from '../domain/types'
import type { Locale, Messages } from '../i18n/messages'
import { formatDate, formatEgp, formatEgpChange, formatPercentChange } from '../format'
import { matchesQuery } from '../search'

const props = defineProps<{ t: Messages; locale: Locale }>()

const changes = priceChanges(PREVIOUS_OFFER_SOURCE)
const counts = countByStatus(changes)

const query = ref('')
const status = ref<ChangeStatus | undefined>(undefined)
const category = ref<Category | ''>('')

const shown = computed(() =>
  changes.filter(c => (!status.value || c.status === status.value) && (!category.value || c.category === category.value) && matchesQuery(c.part.name, query.value))
)
const period = computed(() => props.t.changes.period(formatDate(PREVIOUS_OFFER_SOURCE.checkedOn, props.locale), formatDate(PRICES_CHECKED_ON, props.locale)))
const priceText = (point: PricePoint) => formatEgp(point.priceEgp, props.locale)
</script>

<template>
  <section class="price-changes" :aria-label="t.changes.title">
    <div class="head">
      <div>
        <h2>{{ t.changes.title }}</h2>
        <p class="period">{{ period }}</p>
      </div>
      <a class="back" href="#">{{ t.changes.back }}</a>
    </div>

    <div class="filters">
      <div class="chips" role="radiogroup" :aria-label="t.changes.title">
        <button type="button" role="radio" class="chip" :class="{ on: !status }" :aria-checked="!status" @click="status = undefined">
          {{ t.changes.all }} <span class="count">{{ changes.length }}</span>
        </button>
        <button
          v-for="s in CHANGE_STATUSES"
          :key="s"
          type="button"
          role="radio"
          class="chip"
          :class="[s, { on: status === s }]"
          :aria-checked="status === s"
          :disabled="counts[s] === 0"
          @click="status = s"
        >{{ t.changes.statuses[s] }} <span class="count">{{ counts[s] }}</span></button>
      </div>
      <div class="narrow">
        <input v-model="query" type="search" class="search" :placeholder="t.changes.search" :aria-label="t.changes.search" autocomplete="off" spellcheck="false" />
        <select v-model="category" :aria-label="t.changes.part">
          <option value="">{{ t.changes.all }}</option>
          <option v-for="c in CATEGORIES" :key="c" :value="c">{{ t.categories[c] }}</option>
        </select>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th scope="col">{{ t.changes.part }}</th>
          <th scope="col" class="num">{{ t.changes.before }}</th>
          <th scope="col" class="num">{{ t.changes.after }}</th>
          <th scope="col" class="num">{{ t.changes.change }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in shown" :key="c.part.id" :class="c.status">
          <td class="part">
            <span class="name">{{ c.part.name }}</span>
            <small>{{ t.categories[c.category] }}</small>
          </td>
          <td class="num" :data-label="t.changes.before">
            <span :class="{ gone: !c.before.inStock }">{{ priceText(c.before) }}</span>
          </td>
          <td class="num" :data-label="t.changes.after">
            <span :class="{ gone: !c.after.inStock }">{{ priceText(c.after) }}</span>
          </td>
          <td class="num delta" :data-label="t.changes.change">
            <span v-if="c.status === 'soldOut' || c.status === 'back'" class="tag">{{ t.changes.statuses[c.status] }}</span>
            <template v-else-if="c.delta !== 0">
              <b>{{ formatEgpChange(c.delta, locale) }}</b>
              <small>{{ formatPercentChange(c.percent, locale) }}</small>
            </template>
            <span v-else class="muted">—</span>
          </td>
        </tr>
        <tr v-if="shown.length === 0" class="empty">
          <td colspan="4">{{ t.changes.empty }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.price-changes { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); margin-top: 20px; }
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
h2 { margin: 0; font-size: 19px; }
.period { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
.back { white-space: nowrap; font-weight: 700; color: var(--accent); text-decoration: none; }
.back:hover { text-decoration: underline; }
.filters { display: flex; flex-direction: column; gap: 10px; margin: 16px 0 12px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { border: 1px solid var(--line); background: var(--panel2); border-radius: 999px; padding: 5px 12px; cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; color: inherit; }
.chip:hover:not(:disabled) { border-color: var(--accent); }
.chip:disabled { opacity: 0.45; cursor: default; }
.chip.on { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.count { font-variant-numeric: tabular-nums; opacity: 0.75; }
.narrow { display: flex; flex-wrap: wrap; gap: 8px; }
.search, select { padding: 7px 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel2); color: inherit; font: inherit; }
.search { flex: 1 1 240px; min-width: 0; }
table { inline-size: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: start; font-size: 12px; color: var(--muted); font-weight: 700; padding: 8px; border-block-end: 1px solid var(--line); }
td { padding: 8px; border-block-end: 1px solid var(--line); vertical-align: top; }
.num { text-align: end; white-space: nowrap; font-variant-numeric: tabular-nums; }
.part { min-width: 0; }
.part .name { display: block; direction: ltr; unicode-bidi: plaintext; text-align: start; }
.part small { color: var(--muted); font-size: 12px; }
:global([dir='rtl'] .price-changes .part .name) { text-align: right; }
.gone { color: var(--muted); text-decoration: line-through; }
.delta b { display: block; }
.delta small { color: var(--muted); }
tr.up .delta b { color: var(--bad); }
tr.down .delta b { color: var(--ok); }
.tag { font-size: 12px; font-weight: 700; padding: 1px 8px; border-radius: 999px; border: 1px solid currentColor; }
tr.soldOut .tag { color: var(--bad); }
tr.back .tag { color: var(--ok); }
.muted { color: var(--muted); }
.empty td { text-align: center; color: var(--muted); padding: 20px; }
@media (max-width: 640px) {
  thead { display: none; }
  tr { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px 8px; padding: 10px 0; border-block-end: 1px solid var(--line); }
  td { padding: 0; border: 0; }
  td.part { grid-column: 1 / -1; }
  td.num { text-align: start; white-space: normal; }
  td.num::before { content: attr(data-label); display: block; font-size: 11px; color: var(--muted); }
  .empty td { grid-column: 1 / -1; }
}
</style>
