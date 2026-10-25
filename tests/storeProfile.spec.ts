import { describe, expect, it } from 'vitest'
import { OFFER_SOURCE } from '../src/data/parts'
import { CATEGORIES } from '../src/domain/build'
import { browseListings, DEFAULT_FILTER } from '../src/domain/browse'
import { STORES } from '../src/domain/store'
import { storeProfile, storeSummaries } from '../src/domain/storeProfile'

const sigma = STORES.find(s => s.id === 'sigma')!
const listings = browseListings({ ...DEFAULT_FILTER, storeId: 'sigma' })

describe('store profile', () => {
  it('counts every product the store lists and how many are in stock', () => {
    const profile = storeProfile('sigma')!
    expect(profile.store).toEqual(sigma)
    expect(profile.url).toBe(OFFER_SOURCE.stores.find(s => s.id === 'sigma')!.url)
    expect(profile.products).toBe(listings.length)
    expect(profile.inStock).toBe(listings.filter(l => l.offer.inStock).length)
    expect(profile.products).toBeGreaterThan(profile.inStock)
  })

  it('breaks the products down by category, in category order, skipping empty ones', () => {
    const profile = storeProfile('sigma')!
    expect(profile.categories.map(c => c.category)).toEqual(CATEGORIES.filter(c => listings.some(l => l.category === c)))
    profile.categories.forEach(row => {
      const here = listings.filter(l => l.category === row.category)
      expect(row.products).toBe(here.length)
      expect(row.inStock).toBe(here.filter(l => l.offer.inStock).length)
    })
  })

  it('counts the in-stock parts where no other store is cheaper', () => {
    const profile = storeProfile('sigma')!
    const cheapest = listings.filter(l => l.offer.inStock && l.offer.priceEgp <= l.part.listing.priceEgp)
    expect(profile.cheapest).toBe(new Set(cheapest.map(l => l.part.id)).size)
    expect(profile.cheapest).toBeLessThanOrEqual(profile.inStock)
  })

  it('is undefined for an unknown store', () => {
    expect(storeProfile('nope')).toBeUndefined()
  })

  it('summarises every store, most products in stock first', () => {
    const all = storeSummaries()
    expect(all.map(s => s.store.id).sort()).toEqual(STORES.map(s => s.id).sort())
    expect(all.map(s => s.inStock)).toEqual([...all.map(s => s.inStock)].sort((a, b) => b - a))
  })
})
