import { describe, expect, it } from 'vitest'
import { INSTALLMENT_PLANS, planById, quoteInstallment, cleanRate, cleanDown } from '../src/domain/installments'

describe('installments', () => {
  it('splits the price evenly with no interest on a 0% plan', () => {
    const quote = quoteInstallment({ price: 12000, down: 0, months: 12, monthlyRatePct: 0, adminFeePct: 0 })
    expect(quote).toEqual({ financed: 12000, monthly: 1000, interest: 0, adminFee: 0, totalPaid: 12000, extra: 0 })
  })

  it('adds flat monthly interest and an upfront fee on the financed amount after the down payment', () => {
    const quote = quoteInstallment({ price: 20000, down: 2000, months: 12, monthlyRatePct: 2, adminFeePct: 3 })
    expect(quote.financed).toBe(18000)
    expect(quote.interest).toBe(4320)
    expect(quote.adminFee).toBe(540)
    expect(quote.monthly).toBe(1860)
    expect(quote.totalPaid).toBe(2000 + 540 + 1860 * 12)
    expect(quote.extra).toBe(quote.totalPaid - 20000)
  })

  it('rounds the monthly payment up to a whole pound without counting that as extra cost', () => {
    expect(quoteInstallment({ price: 1000, down: 0, months: 3, monthlyRatePct: 0, adminFeePct: 0 })).toMatchObject({ monthly: 334, totalPaid: 1000, extra: 0 })
  })

  it('never finances more than the price or less than nothing', () => {
    const quote = quoteInstallment({ price: 5000, down: 9000, months: 6, monthlyRatePct: 2, adminFeePct: 1 })
    expect(quote).toMatchObject({ financed: 0, monthly: 0, interest: 0, adminFee: 0, totalPaid: 5000, extra: 0 })
  })

  it('cleans typed rates and down payments, Arabic digits included', () => {
    expect(cleanRate('٢٫٥')).toBe(2.5)
    expect(cleanRate('2,5')).toBe(2.5)
    expect(cleanRate('-1')).toBe(0)
    expect(cleanRate('99')).toBe(10)
    expect(cleanRate('abc')).toBe(0)
    expect(cleanDown('٥٠٠٠', 3000)).toBe(3000)
    expect(cleanDown('1,500', 3000)).toBe(1500)
    expect(cleanDown('', 3000)).toBe(0)
  })

  it('offers plans whose month options are all positive', () => {
    expect(INSTALLMENT_PLANS.length).toBeGreaterThan(1)
    INSTALLMENT_PLANS.forEach(plan => expect(plan.months.every(m => m > 0)).toBe(true))
    expect(planById('nope')).toBe(INSTALLMENT_PLANS[0])
  })
})
