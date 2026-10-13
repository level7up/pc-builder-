import { describe, expect, it } from 'vitest'
import { matchesQuery, toWesternDigits } from '../src/search'

describe('part search', () => {
  it('matches every word of the query in any order, ignoring case', () => {
    expect(matchesQuery('MSI MAG B650 Tomahawk WiFi', 'tomahawk b650')).toBe(true)
    expect(matchesQuery('MSI MAG B650 Tomahawk WiFi', 'tomahawk b850')).toBe(false)
  })

  it('ignores spaces and punctuation inside model names', () => {
    expect(matchesQuery('NVIDIA RTX 5060 Ti 16GB', 'rtx5060ti')).toBe(true)
    expect(matchesQuery('Intel Core i5-12400F', 'i5 12400f')).toBe(true)
    expect(matchesQuery('G.Skill Trident Z5 RGB 32GB', 'gskill')).toBe(true)
  })

  it('treats an empty query as matching everything', () => {
    expect(matchesQuery('Anything', '   ')).toBe(true)
  })

  it('reads Arabic digits typed in the search box', () => {
    expect(toWesternDigits('٧٥٠٠ف')).toBe('7500ف')
    expect(matchesQuery('AMD Ryzen 5 7500F', '٧٥٠٠')).toBe(true)
  })
})
