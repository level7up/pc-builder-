<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORIES } from '../domain/build'
import { RESOLUTIONS } from '../domain/bottleneck'
import { fpsForBuild } from '../domain/fps'
import { PRICES_CHECKED_ON } from '../data/parts'
import { BRAND, type Locale, type Messages } from '../i18n/messages'
import { formatDate, formatEgp } from '../format'
import type { Build } from '../domain/types'

const props = defineProps<{ build: Build; total: number; link: string; t: Messages; locale: Locale }>()

const rows = computed(() => CATEGORIES.flatMap(category => {
  const part = props.build[category]
  return part ? [{ category, part }] : []
}))

const fpsRows = computed(() => {
  const byResolution = RESOLUTIONS.map(resolution => fpsForBuild(props.build, resolution))
  return (byResolution[0] ?? []).map((first, index) => ({ game: first.game, fps: byResolution.map(list => list[index].fps) }))
})
</script>

<template>
  <section class="sheet">
    <h1>{{ BRAND }} · {{ t.title }}</h1>
    <p class="date">{{ t.exportBuild.pricesOn(formatDate(PRICES_CHECKED_ON, locale)) }}</p>
    <table>
      <thead><tr><th>{{ t.exportBuild.part }}</th><th /><th>{{ t.exportBuild.store }}</th><th class="num">{{ t.exportBuild.price }}</th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row.category">
          <td>{{ t.categories[row.category] }}</td>
          <td>{{ row.part.name }}</td>
          <td>{{ row.part.listing.store }}</td>
          <td class="num">{{ formatEgp(row.part.listing.priceEgp, locale) }}</td>
        </tr>
      </tbody>
      <tfoot><tr><th colspan="3">{{ t.total }}</th><th class="num">{{ formatEgp(total, locale) }}</th></tr></tfoot>
    </table>
    <template v-if="fpsRows.length">
      <h2>{{ t.fps.title }}</h2>
      <table>
        <thead><tr><th>{{ t.exportBuild.game }}</th><th v-for="r in RESOLUTIONS" :key="r" class="num">{{ r }}</th></tr></thead>
        <tbody>
          <tr v-for="row in fpsRows" :key="row.game.id">
            <td>{{ row.game.name }} <small>({{ row.game.preset }})</small></td>
            <td v-for="(fps, i) in row.fps" :key="RESOLUTIONS[i]" class="num">{{ fps }}</td>
          </tr>
        </tbody>
      </table>
    </template>
    <p class="link">{{ t.exportBuild.link }}: <span>{{ link }}</span></p>
    <p class="note">{{ t.footer }}</p>
  </section>
</template>

<style scoped>
.sheet { display: none; color: #000; background: #fff; font-size: 12pt; }
h1 { font-size: 18pt; margin: 0; }
h2 { font-size: 13pt; margin: 18pt 0 6pt; }
.date { margin: 2pt 0 12pt; color: #444; }
table { inline-size: 100%; border-collapse: collapse; }
th, td { border-block-end: 1px solid #ccc; padding: 5pt 6pt; text-align: start; vertical-align: top; }
thead th { border-block-end: 2px solid #000; }
tfoot th { border-block-end: 0; border-block-start: 2px solid #000; font-size: 13pt; }
.num { text-align: end; white-space: nowrap; font-variant-numeric: tabular-nums; }
small { color: #555; }
.link { margin-top: 14pt; word-break: break-all; }
.link span { direction: ltr; unicode-bidi: embed; }
.note { color: #555; font-size: 10pt; }
@media print {
  .sheet { display: block; }
}
</style>
