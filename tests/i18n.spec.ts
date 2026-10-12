import { describe, expect, it } from 'vitest'
import { MESSAGES, issueText } from '../src/i18n/messages'
import { checkBuild } from '../src/domain/compatibility'
import { resolveBuild } from '../src/domain/build'
import checkerSource from '../src/domain/compatibility.ts?raw'

const usedCodes = [...checkerSource.matchAll(/issue\('\w+', '(\w+)'/g)].map(m => m[1])

describe('translations', () => {
  it('finds the issue codes in the checker', () => {
    expect(usedCodes.length).toBeGreaterThan(10)
  })

  it.each(['ar', 'en'] as const)('has text for every issue code in %s', locale => {
    usedCodes.forEach(code => expect(MESSAGES[locale].issues[code], code).toBeTypeOf('function'))
  })

  it('has the same keys in both languages', () => {
    expect(Object.keys(MESSAGES.ar.issues).sort()).toEqual(Object.keys(MESSAGES.en.issues).sort())
    expect(Object.keys(MESSAGES.ar.categories).sort()).toEqual(Object.keys(MESSAGES.en.categories).sort())
  })

  it('fills in issue parameters', () => {
    const [mismatch] = checkBuild(resolveBuild({ cpu: 'i5-12400f', motherboard: 'mb-b650m-p' }))
    expect(issueText(MESSAGES.en, mismatch)).toBe('The CPU is LGA1700 and the motherboard is AM5: they will not fit.')
    expect(issueText(MESSAGES.ar, mismatch)).toContain('LGA1700')
  })

  it('falls back to the code for an unknown issue', () => {
    expect(issueText(MESSAGES.en, { severity: 'info', code: 'mystery' })).toBe('mystery')
  })
})
