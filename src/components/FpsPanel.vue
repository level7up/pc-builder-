<script setup lang="ts">
import { computed, ref } from 'vue'
import { RESOLUTIONS } from '../domain/bottleneck'
import { fpsForBuild, type FpsEstimate } from '../domain/fps'
import type { Build, Resolution } from '../domain/types'
import type { Messages } from '../i18n/messages'

const props = defineProps<{ build: Build; t: Messages }>()

const BAR_FULL_FPS = 240
const resolution = ref<Resolution>('1080p')
const results = computed(() => fpsForBuild(props.build, resolution.value))
const hasGameLoop = computed(() => results.value.some(r => r.game.id === 'pubg-mobile'))

const fill = (r: FpsEstimate): number => Math.min(r.fps / BAR_FULL_FPS, 1) * 100

const note = (r: FpsEstimate, t: Messages): string =>
  r.limitedBy === 'cap' ? t.fps.capped : r.limitedBy === 'cpu' ? t.fps.cpuLimited : ''
</script>

<template>
  <section class="fps">
    <div class="head">
      <h2>{{ t.fps.title }}</h2>
      <div class="seg" role="radiogroup" :aria-label="t.fps.resolution">
        <button v-for="r in RESOLUTIONS" :key="r" type="button" role="radio" :aria-checked="resolution === r" :class="{ on: resolution === r }" @click="resolution = r">{{ r }}</button>
      </div>
    </div>
    <p v-if="results.length === 0" class="muted">{{ t.fps.needBoth }}</p>
    <ul v-else>
      <li v-for="r in results" :key="r.game.id" :data-game="r.game.id">
        <div class="game">
          <b>{{ r.game.name }}</b>
          <small>{{ r.game.preset }}<template v-if="note(r, t)"> · {{ note(r, t) }}</template></small>
        </div>
        <div class="bar"><span :class="r.tier" :style="{ inlineSize: fill(r) + '%' }" /></div>
        <div class="score">
          <span class="value">{{ r.fps }}</span>
          <small :class="r.tier">{{ t.fps.tiers[r.tier] }}</small>
        </div>
      </li>
    </ul>
    <p v-if="hasGameLoop" class="muted small">{{ t.fps.gameLoopNote }}</p>
    <p v-if="results.length" class="muted small">{{ t.fps.disclaimer }}</p>
  </section>
</template>

<style scoped>
.fps { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); }
.head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
h2 { margin: 0; font-size: 16px; }
.seg { display: inline-flex; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; direction: ltr; }
.seg button { border: 0; background: var(--panel2); padding: 6px 12px; cursor: pointer; font-weight: 600; font-size: 13px; }
.seg button.on { background: var(--text); color: var(--panel); }
ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
li { display: grid; grid-template-columns: minmax(0, 220px) minmax(0, 1fr) 88px; align-items: center; gap: 12px; }
.game { display: flex; flex-direction: column; min-inline-size: 0; }
.game b { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.game small { color: var(--muted); font-size: 12px; }
.bar { height: 10px; border-radius: 5px; background: var(--panel2); overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: inherit; }
.score { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2; }
.value { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; direction: ltr; }
.score small { font-size: 11px; font-weight: 700; }
.bar .low { background: var(--bad); }
.bar .playable { background: var(--warn); }
.bar .smooth, .bar .high { background: var(--ok); }
small.low { color: var(--bad); }
small.playable { color: var(--warn); }
small.smooth, small.high { color: var(--ok); }
.muted { color: var(--muted); margin: 0; }
.small { font-size: 12px; margin-top: 10px; }
@media (max-width: 640px) {
  li { grid-template-columns: minmax(0, 1fr) 72px; row-gap: 4px; }
  .bar { grid-column: 1 / -1; grid-row: 2; }
}
</style>
