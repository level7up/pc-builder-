<script setup lang="ts">
import { computed, ref } from 'vue'
import { CATEGORIES } from './domain/build'
import { PRESETS } from './domain/presets'
import { PRICES_CHECKED_ON, STORE_COUNT, catalog } from './data/parts'
import { useBuild } from './useBuild'
import { useLocale } from './i18n/useLocale'
import { useTheme } from './useTheme'
import { formatDate, formatEgp } from './format'
import PartRow from './components/PartRow.vue'
import IssuesPanel from './components/IssuesPanel.vue'
import PowerPanel from './components/PowerPanel.vue'
import BottleneckPanel from './components/BottleneckPanel.vue'
import BudgetPanel from './components/BudgetPanel.vue'
import BrandLogo from './components/BrandLogo.vue'
import { fitsWith, needsSuggestion, suggestBoards, suggestCpus } from './domain/suggest'
import type { Category, PartBase, PartsByCategory } from './domain/types'
import type { RowSuggestion } from './components/PartRow.vue'

const { locale, t, toggle } = useLocale()
const { theme, toggle: toggleTheme } = useTheme()
const state = useBuild()
const copied = ref(false)

const fitsIn = (category: Category) => (part: PartBase) =>
  fitsWith(state.build.value, category, part as PartsByCategory[typeof category])

const suggestionsFor = computed<Partial<Record<Category, RowSuggestion[]>>>(() => {
  const build = state.build.value
  const toRow = <R extends string>(reasons: Record<R, string>) => (s: { part: PartBase; reason: R }): RowSuggestion =>
    ({ id: s.part.id, name: s.part.name, priceEgp: s.part.listing.priceEgp, reason: reasons[s.reason] })
  return {
    cpu: build.motherboard && needsSuggestion(build, 'cpu') ? suggestCpus(build.motherboard).map(toRow(t.value.suggest.cpuReasons)) : [],
    motherboard: build.cpu && needsSuggestion(build, 'motherboard') ? suggestBoards(build.cpu, build).map(toRow(t.value.suggest.boardReasons)) : []
  }
})

const suggestTitle: Partial<Record<Category, 'forBoard' | 'forCpu'>> = { cpu: 'forBoard', motherboard: 'forCpu' }
const COPIED_MS = 1800

async function copyLink() {
  try {
    await navigator.clipboard.writeText(state.shareUrl())
    copied.value = true
    setTimeout(() => { copied.value = false }, COPIED_MS)
  } catch {
    window.prompt(t.value.copyLink, state.shareUrl())
  }
}
</script>

<template>
  <div class="page">
    <header class="top">
      <div>
        <BrandLogo />
        <h1>{{ t.title }}</h1>
        <p class="tagline">{{ t.tagline }}</p>
      </div>
      <div class="toggles">
        <button
          class="pill theme"
          type="button"
          :aria-label="theme === 'dark' ? t.theme.toLight : t.theme.toDark"
          :title="theme === 'dark' ? t.theme.toLight : t.theme.toDark"
          @click="toggleTheme"
        >{{ theme === 'dark' ? '☀️' : '🌙' }}</button>
        <button class="pill lang" type="button" @click="toggle">{{ t.switchTo }}</button>
      </div>
    </header>

    <section class="presets" :aria-label="t.presetsTitle">
      <span class="presets-title">{{ t.presetsTitle }}</span>
      <button v-for="p in PRESETS" :key="p.id" type="button" class="preset" @click="state.replace(p.ids)">
        <b>{{ t.presets[p.id].name }}</b>
        <small>{{ t.presets[p.id].note }}</small>
      </button>
    </section>

    <BudgetPanel :t="t" :locale="locale" @apply="ids => state.replace(ids)" />

    <main class="layout">
      <section class="parts">
        <PartRow
          v-for="category in CATEGORIES"
          :key="category"
          :category="category"
          :options="catalog[category]"
          :selected="state.ids.value[category]"
          :t="t"
          :locale="locale"
          :fits="fitsIn(category)"
          :suggestions="suggestionsFor[category]"
          :suggest-title="suggestTitle[category] ? t.suggest[suggestTitle[category]!] : undefined"
          @change="id => state.setPart(category, id)"
        />
      </section>

      <aside class="summary">
        <div class="card total">
          <span>{{ t.total }}</span>
          <strong>{{ formatEgp(state.total.value, locale) }}</strong>
          <div class="actions">
            <button type="button" class="btn primary" @click="copyLink">{{ copied ? t.copied : t.copyLink }}</button>
            <button type="button" class="btn" @click="state.replace({})">{{ t.resetBuild }}</button>
          </div>
        </div>
        <IssuesPanel :issues="state.issues.value" :t="t" />
        <BottleneckPanel :results="state.bottlenecks.value" :t="t" />
        <PowerPanel v-if="state.build.value.cpu || state.build.value.gpu" :load="state.loadW.value" :recommended="state.recommendedW.value" :psu="state.build.value.psu?.watts" :t="t" />
      </aside>
    </main>

    <footer class="foot">
      <p>{{ t.pricesNote(STORE_COUNT, formatDate(PRICES_CHECKED_ON, locale)) }}</p>
      <p>{{ t.footer }}</p>
    </footer>
  </div>
</template>

<style scoped>
.page { max-width: 1180px; margin: 0 auto; padding: 24px 16px 40px; }
.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
h1 { margin: 12px 0 0; font-size: 22px; font-weight: 800; letter-spacing: -.01em; }
.tagline { margin: 4px 0 0; color: var(--muted); max-width: 640px; }
.toggles { display: flex; gap: 8px; }
.theme { padding-inline: 12px; }
.pill { border: 1px solid var(--line); background: var(--panel); border-radius: 999px; padding: 6px 16px; cursor: pointer; white-space: nowrap; }
.presets { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 20px 0; }
.presets-title { color: var(--muted); font-weight: 600; margin-inline-end: 4px; }
.preset { display: flex; flex-direction: column; align-items: flex-start; border: 1px solid var(--line); background: var(--panel); border-radius: 12px; padding: 6px 14px; cursor: pointer; text-align: start; }
.preset:hover { border-color: var(--accent); }
.preset small { color: var(--muted); font-size: 12px; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
.parts { display: flex; flex-direction: column; gap: 10px; }
.summary { position: sticky; top: 16px; display: flex; flex-direction: column; gap: 12px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); }
.total span { color: var(--muted); font-weight: 600; }
.total strong { display: block; font-size: 30px; font-weight: 800; margin: 2px 0 12px; font-variant-numeric: tabular-nums; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn { border: 1px solid var(--line); background: var(--panel2); border-radius: 10px; padding: 7px 14px; cursor: pointer; font-weight: 600; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.foot { margin-top: 28px; color: var(--muted); font-size: 13px; }
.foot p { margin: 4px 0; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .summary { position: static; }
  h1 { font-size: 19px; }
}
</style>
