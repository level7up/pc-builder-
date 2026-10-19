<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { CATEGORIES } from './domain/build'
import { PRESETS } from './domain/presets'
import { PRICES_CHECKED_ON, STORE_COUNT } from './data/parts'
import { STORES } from './domain/store'
import { useBuild } from './useBuild'
import { useLocale } from './i18n/useLocale'
import { useTheme } from './useTheme'
import { goTo, HOME_HASH, PRICES_HASH, useRoute } from './useRoute'
import { findPart } from './domain/lookup'
import { formatDate, formatEgp } from './format'
import PartRow from './components/PartRow.vue'
import IssuesPanel from './components/IssuesPanel.vue'
import PowerPanel from './components/PowerPanel.vue'
import BottleneckPanel from './components/BottleneckPanel.vue'
import BudgetPanel from './components/BudgetPanel.vue'
import BrandLogo from './components/BrandLogo.vue'
import FpsPanel from './components/FpsPanel.vue'
import ShareActions from './components/ShareActions.vue'
import StorePanel from './components/StorePanel.vue'
import BuildSheet from './components/BuildSheet.vue'
import NavSearch from './components/NavSearch.vue'
import PartProfile from './components/PartProfile.vue'
import { buildText } from './export'
import { fitsWith, needsSuggestion, suggestBoards, suggestCpus } from './domain/suggest'
import type { Category, PartBase, PartsByCategory } from './domain/types'
import type { RowSuggestion } from './components/PartRow.vue'

const PriceChanges = defineAsyncComponent(() => import('./components/PriceChanges.vue'))

const { locale, t, toggle } = useLocale()
const { theme, toggle: toggleTheme } = useTheme()
const state = useBuild()
const route = useRoute()
const profile = computed(() => (route.value.name === 'part' ? findPart(route.value.id) : undefined))
const isInBuild = computed(() => !!profile.value && state.ids.value[profile.value.category] === profile.value.part.id)

function addToBuild() {
  if (!profile.value) return
  state.setPart(profile.value.category, profile.value.part.id)
  goTo(HOME_HASH)
}
const link = computed(() => state.shareUrl())
const text = computed(() => buildText(state.build.value, state.total.value, link.value, t.value, locale.value))
const hasParts = computed(() => Object.keys(state.ids.value).length > 0)

const fitsIn = (category: Category) => (part: PartBase) =>
  fitsWith(state.build.value, category, part as PartsByCategory[typeof category])

const suggestionsFor = computed<Partial<Record<Category, RowSuggestion[]>>>(() => {
  const build = state.build.value
  const toRow = <R extends string>(reasons: Record<R, string>) => (s: { part: PartBase; reason: R }): RowSuggestion =>
    ({ id: s.part.id, name: s.part.name, priceEgp: s.part.listing.priceEgp, reason: reasons[s.reason] })
  return {
    cpu: build.motherboard && needsSuggestion(build, 'cpu') ? suggestCpus(build.motherboard, state.catalog.value).map(toRow(t.value.suggest.cpuReasons)) : [],
    motherboard: build.cpu && needsSuggestion(build, 'motherboard') ? suggestBoards(build.cpu, build, state.catalog.value).map(toRow(t.value.suggest.boardReasons)) : []
  }
})

const notHereFor = (category: Category): string | undefined =>
  state.store.value && state.unavailable.value.includes(category) ? t.value.store.notHere(state.store.value.name) : undefined

const suggestTitle: Partial<Record<Category, 'forBoard' | 'forCpu'>> = { cpu: 'forBoard', motherboard: 'forCpu' }
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
        <NavSearch :t="t" :locale="locale" />
        <a class="pill home-link" :href="HOME_HASH" :aria-current="route.name === 'builder' ? 'page' : undefined">{{ t.home }}</a>
        <a class="pill changes-link" :href="PRICES_HASH" :aria-current="route.name === 'prices' ? 'page' : undefined">{{ t.changes.link }}</a>
        <button class="pill lang" type="button" @click="toggle">{{ t.switchTo }}</button>
      </div>
    </header>

    <PriceChanges v-if="route.name === 'prices'" :t="t" :locale="locale" />

    <PartProfile
      v-else-if="profile"
      :key="profile.part.id"
      :found="profile"
      :t="t"
      :locale="locale"
      :in-build="isInBuild"
      :store-name="state.store.value?.name"
      @add="addToBuild"
    />

    <template v-else>
      <section class="presets" :aria-label="t.presetsTitle">
        <span class="presets-title">{{ t.presetsTitle }}</span>
        <button v-for="p in PRESETS" :key="p.id" type="button" class="preset" @click="state.replace(p.ids)">
          <b>{{ t.presets[p.id].name }}</b>
          <small>{{ t.presets[p.id].note }}</small>
        </button>
      </section>

      <StorePanel :stores="STORES" :store-id="state.storeId.value" :quotes="state.quotes.value" :t="t" :locale="locale" @select="id => state.setStore(id)" />

      <BudgetPanel :t="t" :locale="locale" :catalog="state.catalog.value" :store-name="state.store.value?.name" @apply="ids => state.replace(ids)" />

      <main class="layout">
        <section class="parts">
          <PartRow
            v-for="category in CATEGORIES"
            :key="category"
            :category="category"
            :options="state.catalog.value[category]"
            :selected="state.ids.value[category]"
            :t="t"
            :locale="locale"
            :fits="fitsIn(category)"
            :not-here="notHereFor(category)"
            :suggestions="suggestionsFor[category]"
            :suggest-title="suggestTitle[category] ? t.suggest[suggestTitle[category]!] : undefined"
            @change="id => state.setPart(category, id)"
          />
          <FpsPanel :build="state.build.value" :t="t" />
        </section>

        <aside class="summary">
          <div class="card total">
            <span>{{ t.total }}</span>
            <strong>{{ formatEgp(state.total.value, locale) }}</strong>
            <ShareActions :link="link" :text="text" :t="t" @reset="state.replace({})" />
          </div>
          <IssuesPanel :issues="state.issues.value" :t="t" />
          <BottleneckPanel :results="state.bottlenecks.value" :t="t" />
          <PowerPanel v-if="state.build.value.cpu || state.build.value.gpu" :load="state.loadW.value" :recommended="state.recommendedW.value" :psu="state.build.value.psu?.watts" :t="t" />
        </aside>
      </main>

    </template>

    <footer class="foot">
      <p>{{ t.pricesNote(STORE_COUNT, formatDate(PRICES_CHECKED_ON, locale)) }}</p>
      <p>{{ t.footer }}</p>
    </footer>

    <BuildSheet v-if="route.name === 'builder' && hasParts" :build="state.build.value" :total="state.total.value" :link="link" :t="t" :locale="locale" />
  </div>
</template>

<style scoped>
.page { max-width: 1180px; margin: 0 auto; padding: 24px 16px 40px; }
.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
h1 { margin: 12px 0 0; font-size: 22px; font-weight: 800; letter-spacing: -.01em; }
.tagline { margin: 4px 0 0; color: var(--muted); max-width: 640px; }
.toggles { flex: 0 0 auto; display: flex; flex-wrap: nowrap; align-items: center; justify-content: flex-end; gap: 8px; }
.theme { padding-inline: 12px; }
.home-link, .changes-link { color: inherit; text-decoration: none; font-size: 14px; }
.home-link:hover, .changes-link:hover, .home-link[aria-current], .changes-link[aria-current] { border-color: var(--accent); color: var(--accent); }
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
.foot { margin-top: 28px; color: var(--muted); font-size: 13px; }
.foot p { margin: 4px 0; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .summary { position: static; }
  h1 { font-size: 19px; }
  .toggles { flex-shrink: 1; flex-wrap: wrap; }
}
@media (max-width: 640px) {
  .top { flex-direction: column; }
  .toggles { justify-content: flex-start; inline-size: 100%; }
  .toggles :deep(.nav-search) { flex: 1 1 100%; order: -1; }
}
</style>
