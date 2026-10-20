<script setup lang="ts">
import { computed, ref } from 'vue'
import { RESOLUTIONS } from '../domain/bottleneck'
import { CATEGORIES } from '../domain/build'
import { findPart } from '../domain/lookup'
import { summarizeBuild, type SavedBuild } from '../domain/savedBuilds'
import { storeById } from '../domain/store'
import type { Locale, Messages } from '../i18n/messages'
import { formatEgp } from '../format'
import { buildHash } from '../useRoute'
import { useSavedBuilds } from '../useSavedBuilds'

const props = defineProps<{ build: SavedBuild; t: Messages; locale: Locale; picked: boolean; canPick: boolean; isActive: boolean }>()
const emit = defineEmits<{ open: []; pick: [picked: boolean] }>()

const saved = useSavedBuilds()
const isRenaming = ref(false)
const isConfirming = ref(false)
const draft = ref('')

const summary = computed(() => summarizeBuild(props.build))
const store = computed(() => storeById(props.build.storeId))
const partNames = computed(() => CATEGORIES.flatMap(c => (props.build.ids[c] ? [findPart(props.build.ids[c]!)?.part.name ?? ''] : [])))
const savedOn = computed(() => new Intl.DateTimeFormat(props.locale === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(props.build.savedAt)))
const fpsText = computed(() => {
  const plain = new Intl.NumberFormat(props.locale === 'ar' ? 'ar-EG' : 'en-EG')
  return RESOLUTIONS.flatMap(res => (summary.value.fps[res] === undefined ? [] : [props.t.builds.fps(res, plain.format(summary.value.fps[res]!))]))
})
const problems = computed(() => (summary.value.errors || summary.value.warnings ? props.t.builds.problems(summary.value.errors, summary.value.warnings) : ''))

function startRename() {
  draft.value = props.build.name
  isRenaming.value = true
}

function finishRename() {
  saved.rename(props.build.id, draft.value)
  isRenaming.value = false
}
</script>

<template>
  <article class="build-card" :class="{ picked, active: isActive }" :data-build="build.id">
    <div class="head">
      <form v-if="isRenaming" class="rename-form" @submit.prevent="finishRename">
        <input v-model="draft" class="name" type="text" :maxlength="40" :aria-label="t.builds.rename" />
        <button type="submit" class="small primary">✓</button>
        <button type="button" class="small" :aria-label="t.builds.cancel" @click="isRenaming = false">×</button>
      </form>
      <h3 v-else><a :href="buildHash(build.id)">{{ build.name }}</a></h3>
      <label class="pick-label" :class="{ disabled: !canPick && !picked }">
        <input class="pick" type="checkbox" :checked="picked" :disabled="!canPick && !picked" @change="emit('pick', ($event.target as HTMLInputElement).checked)" />
        {{ t.builds.pick }}
      </label>
    </div>
    <p class="meta">
      <span>{{ t.builds.savedOn(savedOn) }}</span>
      <span v-if="store">{{ t.builds.from(store.name) }}</span>
      <span>{{ t.builds.parts(summary.partCount, CATEGORIES.length) }}</span>
    </p>
    <strong class="total">{{ formatEgp(summary.total, locale) }}</strong>
    <p class="fps">
      <template v-if="fpsText.length"><span v-for="f in fpsText" :key="f" class="chip">{{ f }}</span></template>
      <span v-else class="muted">{{ t.builds.noFps }}</span>
    </p>
    <p class="health" :class="{ bad: summary.errors > 0, warn: !summary.errors && summary.warnings > 0 }">{{ problems || t.builds.ok }}</p>
    <ul class="parts">
      <li v-for="name in partNames" :key="name">{{ name }}</li>
    </ul>
    <div v-if="isConfirming" class="actions">
      <button type="button" class="confirm danger" @click="saved.remove(build.id)">{{ t.builds.confirm }}</button>
      <button type="button" class="cancel" @click="isConfirming = false">{{ t.builds.cancel }}</button>
    </div>
    <div v-else class="actions">
      <button type="button" class="open primary" @click="emit('open')">{{ t.builds.open }}</button>
      <button type="button" class="rename" @click="startRename">{{ t.builds.rename }}</button>
      <button type="button" class="delete" @click="isConfirming = true">{{ t.builds.remove }}</button>
    </div>
  </article>
</template>

<style scoped>
.build-card { display: flex; flex-direction: column; gap: 8px; padding: 16px; border-radius: var(--radius); border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); }
.build-card.active { border-inline-start: 4px solid var(--accent); }
.build-card.picked { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), var(--shadow); }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
h3 { margin: 0; font-size: 18px; overflow-wrap: anywhere; }
h3 a { color: inherit; text-decoration: none; }
h3 a:hover { color: var(--accent); text-decoration: underline; }
.rename-form { display: flex; gap: 6px; flex: 1 1 auto; min-width: 0; }
.rename-form input { flex: 1 1 auto; min-width: 0; padding: 6px 10px; border-radius: 10px; border: 1px solid var(--accent); background: var(--panel2); color: inherit; font: inherit; }
.pick-label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; white-space: nowrap; cursor: pointer; }
.pick-label.disabled { opacity: 0.45; cursor: not-allowed; }
.pick { accent-color: var(--accent); inline-size: 16px; block-size: 16px; }
.meta { margin: 0; display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: var(--muted); }
.total { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; }
.fps { margin: 0; display: flex; flex-wrap: wrap; gap: 4px; }
.chip { font-size: 12px; background: var(--panel2); border: 1px solid var(--line); border-radius: 999px; padding: 1px 8px; color: var(--muted); font-variant-numeric: tabular-nums; }
.health { margin: 0; font-size: 13px; font-weight: 700; color: var(--ok); }
.health.warn { color: var(--warn); }
.health.bad { color: var(--bad); }
.parts { margin: 0; padding-inline-start: 18px; font-size: 13px; color: var(--muted); display: grid; gap: 2px; }
.parts li { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; text-align: start; }
:global([dir='rtl'] .build-card .parts li) { text-align: right; }
.actions { margin-top: auto; padding-top: 6px; display: flex; flex-wrap: wrap; gap: 6px; }
button { border-radius: 999px; padding: 7px 14px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid var(--line); background: var(--panel); color: inherit; }
button:hover { border-color: var(--accent); color: var(--accent); }
.small { padding: 4px 10px; }
.primary { border-color: var(--accent); background: var(--accent); color: var(--accent-ink); }
.primary:hover { color: var(--accent-ink); filter: brightness(1.05); }
.delete:hover { border-color: var(--bad); color: var(--bad); }
.danger { border-color: var(--bad); background: var(--bad); color: #fff; }
.danger:hover { color: #fff; border-color: var(--bad); filter: brightness(1.05); }
.muted { color: var(--muted); font-size: 12px; }
</style>
