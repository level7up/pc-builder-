import { describe, expect, it } from 'vitest'
import { buildHash, partHash, routeFor } from '../src/useRoute'

describe('routes', () => {
  it('reads the builder, the price changes page and a part profile from the hash', () => {
    expect(routeFor('')).toEqual({ name: 'builder' })
    expect(routeFor('#')).toEqual({ name: 'builder' })
    expect(routeFor('#prices')).toEqual({ name: 'prices' })
    expect(routeFor('#parts')).toEqual({ name: 'parts' })
    expect(routeFor('#wishlist')).toEqual({ name: 'wishlist' })
    expect(routeFor('#compare')).toEqual({ name: 'compare' })
    expect(routeFor('#builds')).toEqual({ name: 'builds' })
    expect(routeFor(partHash('r5-7500f'))).toEqual({ name: 'part', id: 'r5-7500f' })
    expect(routeFor(buildHash('mk1 x'))).toEqual({ name: 'build', id: 'mk1 x' })
  })

  it('falls back to the builder for unknown or broken part links', () => {
    expect(routeFor('#part/nope')).toEqual({ name: 'builder' })
    expect(routeFor('#part/%E0%A4%A')).toEqual({ name: 'builder' })
    expect(routeFor('#build/')).toEqual({ name: 'builder' })
    expect(routeFor('#build/%E0%A4%A')).toEqual({ name: 'builder' })
  })
})
