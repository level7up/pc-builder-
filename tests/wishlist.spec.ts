import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { catalog } from '../src/data/parts'
import { STORES } from '../src/domain/store'
import { parseWishKey, resolveWish, sanitizeWishlist, wishKey, wishTotal } from '../src/domain/wishlist'
import { useWishlist } from '../src/useWishlist'

const ryzen = catalog.cpu.find(p => p.id === 'r5-7500f')!
const pricier = [...ryzen.listing.offers].filter(o => o.inStock).sort((a, b) => b.priceEgp - a.priceEgp)[0]
const pricierStore = STORES.find(s => s.name === pricier.store)!
const missingStore = STORES.find(s => !ryzen.listing.offers.some(o => o.store === s.name))

beforeEach(() => {
  localStorage.clear()
  useWishlist().clear()
})

describe('wishlist entries', () => {
  it('names a whole part or one store listing of it', () => {
    expect(wishKey('r5-7500f')).toBe('r5-7500f')
    expect(wishKey('r5-7500f', 'sigma')).toBe('r5-7500f@sigma')
    expect(parseWishKey('r5-7500f@sigma')).toEqual({ partId: 'r5-7500f', storeId: 'sigma' })
    expect(parseWishKey('r5-7500f')).toEqual({ partId: 'r5-7500f', storeId: undefined })
  })

  it('keeps only known, unique parts and stores', () => {
    expect(sanitizeWishlist(['r5-7500f', 'nope', 'r5-7500f', 'r5-7500f@sigma', 'r5-7500f@evil', 3])).toEqual(['r5-7500f', 'r5-7500f@sigma'])
    expect(sanitizeWishlist('junk')).toEqual([])
  })

  it('resolves a store entry to that store listing, not the cheapest one', () => {
    const item = resolveWish(wishKey(ryzen.id, pricierStore.id))!
    expect(item.kind).toBe('listing')
    if (item.kind !== 'listing') return
    expect(item.listing.offer.store).toBe(pricier.store)
    expect(item.listing.offer.priceEgp).toBe(pricier.priceEgp)
    expect(item.listing.storeId).toBe(pricierStore.id)
    expect(resolveWish('r5-7500f')).toMatchObject({ kind: 'part', found: { category: 'cpu', part: ryzen } })
    expect(resolveWish('nope')).toBeUndefined()
  })

  it.skipIf(!missingStore)('keeps a store entry the store no longer lists, marked gone', () => {
    expect(resolveWish(wishKey(ryzen.id, missingStore!.id))).toMatchObject({ kind: 'gone', store: missingStore })
  })

  it('adds up in-stock prices, each at its own store', () => {
    const items = [resolveWish('r5-7500f')!, resolveWish(wishKey(ryzen.id, pricierStore.id))!]
    expect(wishTotal(items)).toBe(ryzen.listing.priceEgp + pricier.priceEgp)
  })
})

describe('wishlist store', () => {
  it('adds and removes favorites, shared and saved in the browser', async () => {
    const first = useWishlist()
    const second = useWishlist()
    first.toggle('r5-7500f@sigma')
    expect(second.has('r5-7500f@sigma')).toBe(true)
    expect(second.has('r5-7500f')).toBe(false)
    await nextTick()
    expect(JSON.parse(localStorage.getItem('pcb-wishlist')!)).toEqual(['r5-7500f@sigma'])
    second.toggle('r5-7500f@sigma')
    expect(first.has('r5-7500f@sigma')).toBe(false)
  })
})
