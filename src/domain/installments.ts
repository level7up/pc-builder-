import { toWesternDigits } from '../search'

export const MAX_MONTHLY_RATE_PCT = 10

export type PlanId = 'bank' | 'finance'

export interface InstallmentPlan {
  id: PlanId
  months: readonly number[]
  monthlyRatePct: number
  adminFeePct: number
}

export const INSTALLMENT_PLANS: readonly InstallmentPlan[] = [
  { id: 'bank', months: [6, 12], monthlyRatePct: 0, adminFeePct: 0 },
  { id: 'finance', months: [6, 12, 18, 24], monthlyRatePct: 2.5, adminFeePct: 3 }
]

export const planById = (id: string): InstallmentPlan => INSTALLMENT_PLANS.find(plan => plan.id === id) ?? INSTALLMENT_PLANS[0]

export interface InstallmentInput {
  price: number
  down: number
  months: number
  monthlyRatePct: number
  adminFeePct: number
}

export interface InstallmentQuote {
  financed: number
  monthly: number
  interest: number
  adminFee: number
  totalPaid: number
  extra: number
}

export function quoteInstallment({ price, down, months, monthlyRatePct, adminFeePct }: InstallmentInput): InstallmentQuote {
  const paidNow = Math.min(Math.max(down, 0), price)
  const financed = price - paidNow
  if (financed === 0 || months <= 0) return { financed: 0, monthly: 0, interest: 0, adminFee: 0, totalPaid: price, extra: 0 }
  const interest = Math.round(financed * (monthlyRatePct / 100) * months)
  const adminFee = Math.round(financed * (adminFeePct / 100))
  const monthly = Math.ceil((financed + interest) / months)
  const extra = interest + adminFee
  return { financed, monthly, interest, adminFee, totalPaid: price + extra, extra }
}

const toNumber = (raw: string): number => Number(toWesternDigits(raw).trim().replace('٫', '.'))

export function cleanRate(raw: string): number {
  const value = toNumber(raw.replace(',', '.'))
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), MAX_MONTHLY_RATE_PCT) : 0
}

export function cleanDown(raw: string, price: number): number {
  const value = Number(toWesternDigits(raw).replace(/[\s,٬]/g, ''))
  return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), price) : 0
}
