<script setup lang="ts">
import { computed } from 'vue'
import { compareBuilds, type SavedBuild } from '../domain/savedBuilds'
import type { Locale, Messages } from '../i18n/messages'
import { formatCell } from '../compareFormat'
import { formatEgp } from '../format'
import { buildHash, partHash } from '../useRoute'

const props = defineProps<{ builds: readonly SavedBuild[]; t: Messages; locale: Locale }>()

const comparison = computed(() => compareBuilds(props.builds))
</script>

<template>
  <section class="builds-compare" :aria-label="t.builds.compareTitle">
    <h3>{{ t.builds.compareTitle }}</h3>
    <div class="scroll">
      <table>
        <thead>
          <tr>
            <td class="corner"></td>
            <th v-for="build in builds" :key="build.id" scope="col" class="build"><a :href="buildHash(build.id)">{{ build.name }}</a></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in comparison.metrics" :key="row.id" :data-row="row.id">
            <th scope="row">{{ t.builds.metrics[row.id] }}</th>
            <td v-for="(cell, i) in row.cells" :key="builds[i].id" :class="{ best: cell.best }">{{ formatCell(cell.value, t, locale) }}</td>
          </tr>
          <tr v-for="(row, r) in comparison.parts" :key="row.category" :data-part="row.category" class="part-row" :class="{ differs: row.differs, first: r === 0 }">
            <th scope="row">{{ t.categories[row.category] }}</th>
            <td v-for="(cell, i) in row.cells" :key="builds[i].id">
              <template v-if="cell.id">
                <a class="name" :href="partHash(cell.id)">{{ cell.name }}</a>
                <small v-if="cell.unavailable" class="warn">{{ t.builds.notAtStore }}</small>
                <small v-else-if="cell.priceEgp !== undefined" :class="{ gone: !cell.inStock }">{{ formatEgp(cell.priceEgp, locale) }}</small>
              </template>
              <span v-else class="muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.builds-compare { margin-top: 20px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); }
h3 { margin: 0 0 10px; font-size: 17px; }
.scroll { overflow-x: auto; overscroll-behavior-x: contain; }
table { inline-size: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 9px 10px; border-block-end: 1px solid var(--line); text-align: start; vertical-align: top; }
thead th { font-size: 15px; font-weight: 800; }
thead th a { color: inherit; text-decoration: none; }
thead th a:hover { color: var(--accent); text-decoration: underline; }
tbody th { position: sticky; inset-inline-start: 0; z-index: 1; background: var(--panel); color: var(--muted); font-size: 13px; font-weight: 700; white-space: nowrap; }
td { min-inline-size: 170px; font-variant-numeric: tabular-nums; }
.corner { background: var(--panel); }
td.best { font-weight: 800; color: var(--ok); background: color-mix(in srgb, var(--ok) 10%, var(--panel)); }
td.best::after { content: ' ★'; font-size: 11px; }
.part-row.first th, .part-row.first td { border-block-start: 2px solid var(--line); }
.part-row.differs td { background: color-mix(in srgb, var(--accent) 6%, var(--panel)); }
.part-row.differs th { color: var(--accent); }
.name { display: block; color: inherit; font-weight: 600; text-decoration: none; direction: ltr; unicode-bidi: plaintext; text-align: start; }
:global([dir='rtl'] .builds-compare .name) { text-align: right; }
.name:hover { color: var(--accent); }
small { color: var(--muted); }
small.gone { text-decoration: line-through; }
small.warn { color: var(--warn); font-weight: 600; }
.muted { color: var(--muted); }
</style>
