import { describe, expect, it } from 'vitest'
import { buildText, whatsappUrl } from '../src/export'
import { resolveBuild, totalPriceEgp } from '../src/domain/build'
import { MESSAGES } from '../src/i18n/messages'
import { formatEgp } from '../src/format'

const LINK = 'https://example.test/?cpu=r5-7500f'

describe('build export text', () => {
  const build = resolveBuild({ cpu: 'r5-7500f', gpu: 'rtx5060', memory: 'ram-d5-32' })
  const total = totalPriceEgp(build)

  it('lists each picked part with its price and store, then the total and link', () => {
    const text = buildText(build, total, LINK, MESSAGES.en, 'en')
    const lines = text.split('\n')
    expect(lines[0]).toContain('levelxup')
    expect(text).toContain(`CPU: ${build.cpu!.name} — ${formatEgp(build.cpu!.listing.priceEgp, 'en')} (${build.cpu!.listing.store})`)
    expect(text).toContain(`Graphics card: ${build.gpu!.name}`)
    expect(text).toContain(`Total: ${formatEgp(total, 'en')}`)
    expect(lines.at(-1)).toBe(LINK)
  })

  it('leaves out categories that are not picked', () => {
    expect(buildText(build, total, LINK, MESSAGES.en, 'en')).not.toContain('Power supply')
  })

  it('writes Arabic labels in Arabic', () => {
    const text = buildText(build, total, LINK, MESSAGES.ar, 'ar')
    expect(text).toContain('البروسيسور: ')
    expect(text).toContain('الإجمالي: ')
  })

  it('makes a WhatsApp share link with the text encoded', () => {
    expect(whatsappUrl('a & b\nc')).toBe('https://wa.me/?text=a%20%26%20b%0Ac')
  })
})
