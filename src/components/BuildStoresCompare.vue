<script setup lang="ts">
import { computed } from 'vue'
import { summarizeBuild, type SavedBuild } from '../domain/savedBuilds'
import { buildAcrossStores, type StoreColumn } from '../domain/storeCompare'
import type { Category } from '../domain/types'
import type { Locale, Messages } from '../i18n/messages'
import { formatEgp, formatEgpChange } from '../format'
import { partHash } from '../useRoute'
import { useSavedBuilds } from '../useSavedBuilds'

const props = defineProps<{ build: SavedBuild; t: Messages; locale: Locale }>()
const emit = defineEmits<{ close: [] }>()

const saved = useSavedBuilds()
const across = computed(() => buildAcrossStores(props.build.ids, props.build.storeId))
const currentTotal = computed(() => summarizeBuild(props.build).total)
const separator = computed(() => (props.locale === 'ar' ? '، ' : ', '))
const missingText = (missing: Category[]) => props.t.store.missing(missing.map(c => props.t.categories[c]).join(separator.value))
const difference = (column: StoreColumn) => column.total - currentTotal.value

function useStore(column: StoreColumn) {
  saved.update(props.build.id, { ids: props.build.ids, storeId: column.store.id })
}
</script>

<template>
  <section class="build-stores" :aria-label="t.builds.storesTitle(build.name)" :data-build="build.id">
    <div class="head">
      <div>
        <h3>{{ t.builds.storesTitle(build.name) }}</h3>
        <p class="hint">{{ t.builds.storesHint }}</p>
      </div>
      <button type="button" class="close" @click="emit('close')">{{ t.builds.close }}</button>
    </div>

    <p v-if="across.columns.length === 0" class="empty">{{ t.builds.storesNone }}</p>
    <div v-else class="scroll">
      <table>
        <thead>
          <tr>
            <td class="corner"></td>
            <th
              v-for="column in across.columns"
              :key="column.store.id"
              scope="col"
              :data-store="column.store.id"
              :class="{ current: column.isCurrent, cheapest: column.isCheapest }"
            >
              <span class="store">{{ column.store.name }}</span>
              <span v-if="column.isCurrent" class="tag current-tag">{{ t.builds.currentStore }}</span>
              <span v-else-if="column.isCheapest" class="tag cheapest-tag">{{ t.builds.cheapestStore }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in across.rows" :key="row.category" :data-part="row.category">
            <th scope="row">
              <span class="category">{{ t.categories[row.category] }}</span>
              <a class="name" :href="partHash(row.id)">{{ row.name }}</a>
            </th>
            <td v-for="(cell, i) in row.cells" :key="across.columns[i].store.id" :class="{ best: cell.best, current: across.columns[i].isCurrent }">
              <template v-if="cell.priceEgp !== undefined">{{ formatEgp(cell.priceEgp, locale) }}</template>
              <small v-else class="warn">{{ t.builds.notStocked }}</small>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="totals">
            <th scope="row">{{ t.total }}</th>
            <td v-for="column in across.columns" :key="column.store.id" :data-store="column.store.id" :class="{ current: column.isCurrent }">
              <strong class="sum">{{ formatEgp(column.total, locale) }}</strong>
              <small v-if="column.missing.length" class="warn" :title="missingText(column.missing)">{{ t.builds.missingCount(column.missing.length) }}</small>
              <template v-else>
                <small class="ok">✓ {{ t.store.complete }}</small>
                <small v-if="!column.isCurrent && difference(column) !== 0" class="diff" :class="difference(column) < 0 ? 'down' : 'up'">
                  {{ t.builds.vsNow(formatEgpChange(difference(column), locale)) }}
                </small>
              </template>
              <button v-if="!column.isCurrent" type="button" class="use" @click="useStore(column)">{{ t.builds.useStore }}</button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>

<style scoped>
.build-stores { margin-top: 20px; background: var(--panel); border: 1px solid var(--accent); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); scroll-margin-top: 16px; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
h3 { margin: 0; font-size: 17px; overflow-wrap: anywhere; }
.hint { margin: 4px 0 0; font-size: 13px; color: var(--muted); }
.close, .use { border-radius: 999px; padding: 6px 14px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid var(--line); background: var(--panel); color: inherit; white-space: nowrap; }
.close:hover, .use:hover { border-color: var(--accent); color: var(--accent); }
.use { margin-top: 6px; padding: 4px 10px; font-size: 12px; }
.empty { margin: 0; padding: 24px; text-align: center; color: var(--muted); }
.scroll { overflow-x: auto; overscroll-behavior-x: contain; }
table { inline-size: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 9px 10px; border-block-end: 1px solid var(--line); text-align: start; vertical-align: top; }
thead th { font-size: 14px; font-weight: 800; white-space: nowrap; }
thead th .store { display: block; }
tbody th, tfoot th { position: sticky; inset-inline-start: 0; z-index: 1; background: var(--panel); min-inline-size: 150px; max-inline-size: 220px; font-weight: 700; }
.category { display: block; color: var(--muted); font-size: 12px; }
.name { display: block; color: inherit; font-size: 13px; text-decoration: none; direction: ltr; unicode-bidi: plaintext; text-align: start; overflow-wrap: anywhere; }
:global([dir='rtl'] .build-stores .name) { text-align: right; }
.name:hover { color: var(--accent); }
td { min-inline-size: 120px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.corner { background: var(--panel); }
th.current, td.current { background: color-mix(in srgb, var(--accent) 7%, var(--panel)); }
td.best { font-weight: 800; color: var(--ok); }
td.best::after { content: ' ★'; font-size: 11px; }
.tag { display: inline-block; margin-top: 3px; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 999px; border: 1px solid currentColor; }
.current-tag { color: var(--accent); }
.cheapest-tag { color: var(--ok); }
tfoot th, tfoot td { border-block-start: 2px solid var(--line); border-block-end: 0; }
.totals td { white-space: normal; }
.sum { display: block; font-size: 16px; font-weight: 800; white-space: nowrap; }
.totals small { display: block; font-size: 12px; }
.ok { color: var(--ok); }
.warn { color: var(--warn); font-weight: 600; }
.diff.up { color: var(--bad); font-weight: 700; }
.diff.down { color: var(--ok); font-weight: 700; }
</style>
