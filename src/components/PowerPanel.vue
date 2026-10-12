<script setup lang="ts">
import { computed } from 'vue'
import type { Messages } from '../i18n/messages'

const props = defineProps<{ load: number; recommended: number; psu: number | undefined; t: Messages }>()

const METER_MAX_SHARE = 1
const fill = computed(() => (props.psu ? Math.min(METER_MAX_SHARE, props.load / props.psu) * 100 : 0))
const tone = computed(() => (!props.psu ? '' : props.psu < props.load ? 'bad' : props.psu < props.recommended ? 'warn' : 'ok'))
</script>

<template>
  <div class="card">
    <h2>{{ t.power.title }}</h2>
    <dl>
      <div><dt>{{ t.power.load }}</dt><dd>{{ load }} W</dd></div>
      <div><dt>{{ t.power.recommended }}</dt><dd>{{ recommended }} W</dd></div>
      <div v-if="psu"><dt>{{ t.power.psu }}</dt><dd :class="tone">{{ psu }} W</dd></div>
    </dl>
    <div v-if="psu" class="meter" role="meter" :aria-valuenow="load" :aria-valuemax="psu" aria-valuemin="0">
      <span :class="tone" :style="{ inlineSize: fill + '%' }" />
    </div>
  </div>
</template>

<style scoped>
.card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); }
h2 { margin: 0 0 8px; font-size: 16px; }
dl { margin: 0; display: flex; flex-direction: column; gap: 4px; }
dl div { display: flex; justify-content: space-between; }
dt { color: var(--muted); }
dd { margin: 0; font-weight: 700; direction: ltr; font-variant-numeric: tabular-nums; }
.meter { margin-top: 10px; height: 8px; border-radius: 999px; background: var(--panel2); overflow: hidden; }
.meter span { display: block; height: 100%; border-radius: inherit; }
.ok { color: var(--ok); }
.warn { color: var(--warn); }
.bad { color: var(--bad); }
.meter .ok { background: var(--ok); }
.meter .warn { background: var(--warn); }
.meter .bad { background: var(--bad); }
</style>
