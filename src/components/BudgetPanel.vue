<script setup lang="ts">
import { ref } from 'vue'
import { buildForBudget, parseBudget } from '../domain/budget'
import { RESOLUTIONS } from '../domain/bottleneck'
import type { BuildIds, Catalog, Resolution } from '../domain/types'
import type { Locale, Messages } from '../i18n/messages'
import { formatEgp } from '../format'

const props = defineProps<{ t: Messages; locale: Locale; catalog: Catalog; storeName?: string }>()
const emit = defineEmits<{ apply: [ids: BuildIds] }>()

const raw = ref('')
const resolution = ref<Resolution>('1080p')
const message = ref<{ tone: 'ok' | 'bad'; text: string } | null>(null)

function run() {
  const budget = parseBudget(raw.value)
  if (budget === undefined) {
    message.value = { tone: 'bad', text: props.t.budget.invalid }
    return
  }
  const result = buildForBudget(budget, resolution.value, props.catalog)
  if (result.kind === 'unavailable') {
    message.value = { tone: 'bad', text: props.t.budget.unavailable(props.storeName ?? '') }
    return
  }
  if (result.kind === 'tooLow') {
    message.value = { tone: 'bad', text: props.t.budget.tooLow(formatEgp(result.minimum, props.locale)) }
    return
  }
  emit('apply', result.ids)
  message.value = { tone: 'ok', text: props.t.budget.done(formatEgp(result.total, props.locale), formatEgp(budget, props.locale)) }
}
</script>

<template>
  <form class="budget" @submit.prevent="run">
    <h2>{{ t.budget.title }}</h2>
    <p v-if="storeName" class="from">{{ t.store.hintOne(storeName) }}</p>
    <div class="fields">
      <label class="field">
        <span>{{ t.budget.label }}</span>
        <input v-model="raw" type="text" inputmode="numeric" autocomplete="off" :placeholder="t.budget.placeholder" />
      </label>
      <div class="field">
        <span>{{ t.budget.resolution }}</span>
        <div class="seg" role="radiogroup" :aria-label="t.budget.resolution">
          <button v-for="r in RESOLUTIONS" :key="r" type="button" role="radio" :aria-checked="resolution === r" :class="{ on: resolution === r }" @click="resolution = r">{{ r }}</button>
        </div>
      </div>
      <button type="submit" class="go">{{ t.budget.go }}</button>
    </div>
    <p v-if="message" :class="['msg', message.tone]" role="status">{{ message.text }}</p>
  </form>
</template>

<style scoped>
.budget { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); margin-bottom: 16px; }
h2 { margin: 0 0 10px; font-size: 17px; }
.from { margin: -4px 0 10px; font-size: 13px; color: var(--accent); font-weight: 600; }
.fields { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--muted); font-weight: 600; }
input { inline-size: 200px; max-inline-size: 100%; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel2); color: var(--text); font: inherit; font-size: 16px; }
.seg { display: inline-flex; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; direction: ltr; }
.seg button { border: 0; background: var(--panel2); padding: 8px 14px; cursor: pointer; font-weight: 600; }
.seg button.on { background: var(--text); color: var(--panel); }
.go { border: 0; background: var(--accent); color: var(--accent-ink); border-radius: 10px; padding: 9px 22px; font-weight: 800; cursor: pointer; }
.msg { margin: 10px 0 0; font-weight: 600; }
.msg.ok { color: var(--ok); }
.msg.bad { color: var(--bad); }
@media (max-width: 640px) {
  input { inline-size: 100%; }
  .field:first-child { flex: 1 1 100%; }
}
</style>
