<script setup lang="ts">
import type { BottleneckResult } from '../domain/bottleneck'
import type { Messages } from '../i18n/messages'

defineProps<{ results: BottleneckResult[]; t: Messages }>()

const share = (r: BottleneckResult, side: 'cpu' | 'gpu'): number => {
  const value = side === 'cpu' ? r.cpuCapacity : r.gpuCapacity
  return (value / Math.max(r.cpuCapacity, r.gpuCapacity)) * 100
}

const explain = (r: BottleneckResult, t: Messages): string =>
  r.limitedBy === 'cpu' ? t.bottleneck.explainCpu : r.limitedBy === 'gpu' ? t.bottleneck.explainGpu : t.bottleneck.explainBalanced
</script>

<template>
  <div class="card">
    <h2>{{ t.bottleneck.title }}</h2>
    <p v-if="results.length === 0" class="muted">{{ t.bottleneck.needBoth }}</p>
    <div v-for="r in results" :key="r.resolution" class="res">
      <div class="head">
        <b class="tag">{{ r.resolution }}</b>
        <span :class="['verdict', r.limitedBy, r.strength]">{{ t.bottleneck.limiter[r.limitedBy](r.percent) }}</span>
      </div>
      <div class="line"><em>{{ t.bottleneck.cpu }}</em><div class="bar"><span class="cpu" :style="{ inlineSize: share(r, 'cpu') + '%' }" /></div></div>
      <div class="line"><em>{{ t.bottleneck.gpu }}</em><div class="bar"><span class="gpu" :style="{ inlineSize: share(r, 'gpu') + '%' }" /></div></div>
      <p class="why">{{ explain(r, t) }}</p>
    </div>
    <p v-if="results.length" class="muted small">{{ t.bottleneck.disclaimer }}</p>
  </div>
</template>

<style scoped>
.card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); }
h2 { margin: 0 0 8px; font-size: 16px; }
.res { padding: 10px 0; border-top: 1px solid var(--line); }
.res:first-of-type { border-top: 0; padding-top: 0; }
.head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
.tag { direction: ltr; }
.verdict { font-size: 13px; font-weight: 700; }
.verdict.cpu.mild { color: var(--warn); }
.verdict.cpu.strong { color: var(--bad); }
.verdict.gpu, .verdict.balanced { color: var(--ok); }
.line { display: grid; grid-template-columns: 76px minmax(0, 1fr); align-items: center; gap: 8px; margin: 4px 0; }
.line em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--muted); }
.bar { position: relative; height: 12px; border-radius: 6px; background: var(--panel2); overflow: hidden; }
.bar span { position: absolute; inset-block: 0; inset-inline-start: 0; border-radius: inherit; }
.bar .cpu { background: var(--cpu); }
.bar .gpu { background: var(--gpu); }
.why { margin: 6px 0 0; font-size: 13px; color: var(--muted); }
.muted { color: var(--muted); margin: 0; }
.small { font-size: 12px; margin-top: 8px; }
</style>
