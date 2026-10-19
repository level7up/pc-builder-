import { describe, expect, it } from 'vitest'
import { partHash, routeFor } from '../src/useRoute'

describe('routes', () => {
  it('reads the builder, the price changes page and a part profile from the hash', () => {
    expect(routeFor('')).toEqual({ name: 'builder' })
    expect(routeFor('#')).toEqual({ name: 'builder' })
    expect(routeFor('#prices')).toEqual({ name: 'prices' })
    expect(routeFor(partHash('r5-7500f'))).toEqual({ name: 'part', id: 'r5-7500f' })
  })

  it('falls back to the builder for unknown or broken part links', () => {
    expect(routeFor('#part/nope')).toEqual({ name: 'builder' })
    expect(routeFor('#part/%E0%A4%A')).toEqual({ name: 'builder' })
  })
})
