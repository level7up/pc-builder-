<script setup lang="ts">
import { computed, ref } from 'vue'
import { INSTALLMENT_PLANS, cleanDown, cleanRate, planById, quoteInstallment, type PlanId } from '../domain/installments'
import type { Locale, Messages } from '../i18n/messages'
import { formatEgp } from '../format'

const props = defineProps<{ price: number; t: Messages; locale: Locale }>()

const DEFAULT_MONTHS = 12

const planId = ref<PlanId>(INSTALLMENT_PLANS[0].id)
const months = ref(DEFAULT_MONTHS)
const rateText = ref(String(INSTALLMENT_PLANS[0].monthlyRatePct))
const feeText = ref(String(INSTALLMENT_PLANS[0].adminFeePct))
const downText = ref('')

const plan = computed(() => planById(planId.value))
const quote = computed(() =>
  quoteInstallment({
    price: props.price,
    down: cleanDown(downText.value, props.price),
    months: months.value,
    monthlyRatePct: cleanRate(rateText.value),
    adminFeePct: cleanRate(feeText.value)
  })
)
const plain = computed(() => new Intl.NumberFormat(props.locale === 'ar' ? 'ar-EG' : 'en-EG'))
const egp = (amount: number) => formatEgp(amount, props.locale)

function choosePlan(id: PlanId) {
  const next = planById(id)
  planId.value = next.id
  rateText.value = String(next.monthlyRatePct)
  feeText.value = String(next.adminFeePct)
  if (!next.months.includes(months.value)) months.value = next.months[next.months.length - 1]
}
</script>

<template>
  <details class="card installments" open>
    <summary>
      <span class="title">💳 {{ t.installments.title }}</span>
      <span v-if="quote.monthly" class="from">{{ t.installments.perMonth(egp(quote.monthly)) }}</span>
    </summary>

    <div class="body">
      <div class="segmented" role="group" :aria-label="t.installments.planLabel">
        <button
          v-for="p in INSTALLMENT_PLANS"
          :key="p.id"
          type="button"
          :data-plan="p.id"
          :aria-pressed="planId === p.id"
          @click="choosePlan(p.id)"
        >{{ t.installments.plans[p.id] }}</button>
      </div>
      <p class="plan-note">{{ t.installments.planNotes[plan.id] }}</p>

      <div class="segmented months" role="group" :aria-label="t.installments.monthsLabel">
        <button
          v-for="m in plan.months"
          :key="m"
          type="button"
          :data-months="m"
          :aria-pressed="months === m"
          @click="months = m"
        >{{ t.installments.months(plain.format(m)) }}</button>
      </div>

      <div class="fields">
        <label>
          <span>{{ t.installments.down }}</span>
          <input v-model="downText" class="down" type="text" inputmode="numeric" placeholder="0" />
        </label>
        <label>
          <span>{{ t.installments.rate }}</span>
          <input v-model="rateText" class="rate" type="text" inputmode="decimal" />
        </label>
        <label>
          <span>{{ t.installments.fee }}</span>
          <input v-model="feeText" class="fee" type="text" inputmode="decimal" />
        </label>
      </div>

      <template v-if="quote.monthly">
        <p class="result">
          <strong class="monthly">{{ egp(quote.monthly) }}</strong>
          <span>{{ t.installments.forMonths(plain.format(months)) }}</span>
        </p>
        <dl>
          <div v-if="quote.adminFee"><dt>{{ t.installments.adminFee }}</dt><dd>{{ egp(quote.adminFee) }}</dd></div>
          <div v-if="quote.interest"><dt>{{ t.installments.interest }}</dt><dd>{{ egp(quote.interest) }}</dd></div>
          <div><dt>{{ t.installments.totalPaid }}</dt><dd>{{ egp(quote.totalPaid) }}</dd></div>
        </dl>
        <p v-if="quote.extra" class="extra">{{ t.installments.extra(egp(quote.extra)) }}</p>
      </template>
      <p v-else class="muted">{{ t.installments.nothing }}</p>

      <p class="note">{{ t.installments.note }}</p>
    </div>
  </details>
</template>

<style scoped>
.card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); }
summary { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 10px; cursor: pointer; list-style: none; }
summary::-webkit-details-marker { display: none; }
.title { font-weight: 800; }
.from { font-size: 13px; font-weight: 700; color: var(--accent); }
.installments[open] .from { display: none; }
.body { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.segmented { display: flex; flex-wrap: wrap; gap: 6px; }
.segmented button { flex: 1 1 auto; border: 1px solid var(--line); background: var(--panel2); color: inherit; border-radius: 10px; padding: 6px 10px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.segmented button[aria-pressed='true'] { border-color: var(--accent); background: var(--accent); color: var(--accent-ink); }
.months button { flex: 1 1 0; }
.plan-note { margin: -4px 0 0; font-size: 12px; color: var(--muted); }
.fields { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 8px; }
label { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 12px; font-weight: 600; color: var(--muted); }
input { inline-size: 100%; min-width: 0; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel2); color: var(--text); font: inherit; font-size: 14px; font-variant-numeric: tabular-nums; }
input:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
.result { margin: 4px 0 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
.monthly { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
.result span { color: var(--muted); font-weight: 600; }
dl { margin: 0; display: grid; gap: 4px; font-size: 14px; }
dl div { display: flex; justify-content: space-between; gap: 10px; }
dt { color: var(--muted); }
dd { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
.extra { margin: 0; font-size: 13px; font-weight: 700; color: var(--warn); }
.muted { margin: 0; color: var(--muted); font-size: 13px; }
.note { margin: 0; font-size: 12px; color: var(--muted); }
</style>
