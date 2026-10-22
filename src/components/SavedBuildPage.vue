<script setup lang="ts">
import { computed, ref } from 'vue'
import { CATEGORIES } from '../domain/build'
import { buildLines, inspectBuild, type SavedBuild } from '../domain/savedBuilds'
import { idsToQuery } from '../domain/share'
import type { Locale, Messages } from '../i18n/messages'
import { buildText } from '../export'
import { formatEgp } from '../format'
import { BUILDS_HASH, partHash } from '../useRoute'
import { useSavedBuilds } from '../useSavedBuilds'
import IssuesPanel from './IssuesPanel.vue'
import BottleneckPanel from './BottleneckPanel.vue'
import PowerPanel from './PowerPanel.vue'
import FpsPanel from './FpsPanel.vue'
import ShareActions from './ShareActions.vue'
import InstallmentPanel from './InstallmentPanel.vue'

const props = defineProps<{ id: string; t: Messages; locale: Locale }>()
const emit = defineEmits<{ open: [build: SavedBuild] }>()

const saved = useSavedBuilds()
const brokenImages = ref<string[]>([])

const build = computed(() => saved.builds.value.find(b => b.id === props.id))
const details = computed(() => (build.value ? inspectBuild(build.value) : undefined))
const lines = computed(() => (build.value && details.value ? buildLines(build.value, details.value) : []))
const partCount = computed(() => lines.value.filter(line => line.id).length)
const savedOn = computed(() =>
  build.value ? new Intl.DateTimeFormat(props.locale === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(build.value.savedAt)) : ''
)
const link = computed(() => (build.value ? `${window.location.origin}${window.location.pathname}?${idsToQuery(build.value.ids, build.value.storeId)}` : ''))
const text = computed(() => (details.value ? buildText(details.value.build, details.value.total, link.value, props.t, props.locale) : ''))
const hasLoad = computed(() => !!details.value && details.value.loadW > 0)
const imageOf = (url: string | undefined) => (url && !brokenImages.value.includes(url) ? url : undefined)
const markBroken = (url: string) => { brokenImages.value = [...brokenImages.value, url] }
</script>

<template>
  <section class="saved-build" :aria-label="build?.name ?? t.builds.title">
    <a class="back" :href="BUILDS_HASH">{{ t.builds.back }}</a>

    <p v-if="!build || !details" class="not-found">
      {{ t.builds.notFound }}
      <a :href="BUILDS_HASH">{{ t.builds.viewAll }}</a>
    </p>

    <template v-else>
      <div class="intro card">
        <div class="title">
          <h2>{{ build.name }}</h2>
          <p class="meta">
            <span>{{ t.builds.savedOn(savedOn) }}</span>
            <span>{{ details.store ? t.builds.from(details.store.name) : t.builds.cheapestAnywhere }}</span>
            <span>{{ t.builds.parts(partCount, CATEGORIES.length) }}</span>
          </p>
        </div>
        <div class="price">
          <span>{{ t.total }}</span>
          <strong class="total">{{ formatEgp(details.total, locale) }}</strong>
        </div>
        <div class="actions">
          <button type="button" class="open" @click="emit('open', build)">{{ t.builds.openInBuilder }}</button>
          <ShareActions :link="link" :text="text" :t="t" sharing-only />
        </div>
      </div>

      <div class="layout">
        <div class="main">
          <div class="card lines">
            <table>
              <tbody>
                <tr v-for="line in lines" :key="line.category" :data-line="line.category" :class="{ empty: !line.id }">
                  <th scope="row">{{ t.categories[line.category] }}</th>
                  <td class="thumb">
                    <img
                      v-if="imageOf(line.part?.listing.image)"
                      :src="imageOf(line.part?.listing.image)"
                      alt=""
                      loading="lazy"
                      referrerpolicy="no-referrer"
                      width="48"
                      height="48"
                      @error="markBroken(line.part!.listing.image!)"
                    />
                  </td>
                  <td class="part">
                    <a v-if="line.id && line.name" class="name" :href="partHash(line.id)">{{ line.name }}</a>
                    <span v-else class="muted">{{ t.builds.notChosen }}</span>
                    <small v-if="line.part" class="store">{{ line.part.listing.store }}</small>
                  </td>
                  <td class="cost">
                    <template v-if="line.part">
                      <span class="price" :class="{ gone: !line.part.listing.inStock }">{{ formatEgp(line.part.listing.priceEgp, locale) }}</span>
                      <small v-if="!line.part.listing.inStock" class="sold">{{ t.soldOut.badge }}</small>
                    </template>
                    <small v-else-if="line.unavailable" class="warn">{{ t.builds.notAtStore }}</small>
                    <span v-else class="muted">—</span>
                  </td>
                  <td class="link">
                    <a v-if="line.part?.listing.url" :href="line.part.listing.url" target="_blank" rel="noopener">{{ t.profile.open }} ↗</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <FpsPanel :build="details.build" :t="t" />
        </div>
        <aside class="checks">
          <InstallmentPanel v-if="details.total > 0" :price="details.total" :t="t" :locale="locale" />
          <IssuesPanel :issues="details.issues" :t="t" />
          <BottleneckPanel :results="details.bottlenecks" :t="t" />
          <PowerPanel v-if="hasLoad" :load="details.loadW" :recommended="details.recommendedW" :psu="details.build.psu?.watts" :t="t" />
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
.saved-build { margin-top: 20px; display: flex; flex-direction: column; gap: 14px; }
.back { align-self: flex-start; font-weight: 700; color: var(--accent); text-decoration: none; }
.back:hover { text-decoration: underline; }
.not-found { margin: 0; padding: 32px 16px; text-align: center; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
.not-found a { display: block; margin-top: 8px; font-weight: 700; color: var(--accent); }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); }
.intro { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px 20px; align-items: start; }
h2 { margin: 0; font-size: 24px; overflow-wrap: anywhere; }
.meta { margin: 6px 0 0; display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13px; color: var(--muted); }
.intro .price { display: flex; flex-direction: column; align-items: flex-end; }
.intro .price span { color: var(--muted); font-weight: 600; font-size: 13px; }
.total { font-size: 30px; font-weight: 800; font-variant-numeric: tabular-nums; }
.actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; }
.open { border: 1px solid var(--accent); background: var(--accent); color: var(--accent-ink); border-radius: 10px; padding: 7px 16px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.open:hover { filter: brightness(1.05); }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
.main { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.checks { display: flex; flex-direction: column; gap: 12px; }
.lines { padding: 6px 16px; }
table { inline-size: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 10px 6px; border-block-end: 1px solid var(--line); text-align: start; vertical-align: middle; }
tr:last-child th, tr:last-child td { border-block-end: 0; }
th { inline-size: 1%; white-space: nowrap; color: var(--muted); font-size: 13px; font-weight: 700; }
.thumb { inline-size: 48px; }
.thumb img { display: block; inline-size: 48px; block-size: 48px; object-fit: contain; background: #fff; border-radius: 8px; border: 1px solid var(--line); }
.part { min-width: 0; }
.name { display: block; color: inherit; font-weight: 700; text-decoration: none; direction: ltr; unicode-bidi: plaintext; text-align: start; overflow-wrap: anywhere; }
:global([dir='rtl'] .saved-build .name) { text-align: right; }
.name:hover { color: var(--accent); }
.store { color: var(--muted); font-size: 12px; }
.cost { white-space: nowrap; text-align: end; font-variant-numeric: tabular-nums; }
.cost .price { display: block; font-weight: 800; }
.cost .price.gone { color: var(--muted); font-weight: 400; text-decoration: line-through; }
.sold { color: var(--bad); font-weight: 700; }
.warn { color: var(--warn); font-weight: 700; }
.muted { color: var(--muted); }
tr.empty th { opacity: 0.7; }
.link { inline-size: 1%; white-space: nowrap; }
.link a { color: var(--accent); font-weight: 700; text-decoration: none; }
.link a:hover { text-decoration: underline; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .intro { grid-template-columns: 1fr; }
  .intro .price { align-items: flex-start; }
  tr { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; gap: 4px 10px; align-items: center; padding: 10px 0; border-block-end: 1px solid var(--line); }
  tr:last-child { border-block-end: 0; }
  th, td { padding: 0; border: 0; inline-size: auto; }
  th { grid-column: 1 / -1; }
  .thumb { grid-row: 2 / span 2; }
  .link { grid-column: 2 / -1; }
  .cost { grid-column: 3; grid-row: 2; }
}
</style>
