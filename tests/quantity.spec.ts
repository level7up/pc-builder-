import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { addQuantities, mainSectionId, readInventoryQuantity, retryWhenBusy, withSection } from '../scripts/lib/quantity.mjs'
import ListingCard from '../src/components/ListingCard.vue'
import PartProfile from '../src/components/PartProfile.vue'
import { ALL_PARTS } from '../src/domain/lookup'
import type { StoreListing } from '../src/domain/browse'
import type { Offer } from '../src/domain/types'
import { en } from '../src/i18n/en'

describe('stock quantity from a Shopify product page', () => {
  it('reads the variant inventory JSON', () => {
    expect(readInventoryQuantity('<script type="application/json">{"inventory_quantity":5,"available":true}</script>')).toBe(5)
  })

  it('falls back to the inventory data attribute', () => {
    expect(readInventoryQuantity('<div data-variant-available="true" data-inventory-quantity="12">')).toBe(12)
  })

  it('counts an oversold variant as none left and an absent count as unknown', () => {
    expect(readInventoryQuantity('{"inventory_quantity":-2}')).toBe(0)
    expect(readInventoryQuantity('<html></html>')).toBeUndefined()
  })

  it('has no count for a listing the store keeps selling past zero', () => {
    expect(readInventoryQuantity('{"inventory_quantity":0,"available":true,"inventory_policy":"continue"}')).toBeUndefined()
    expect(readInventoryQuantity('<div data-inventory-quantity="0" data-inventory-policy="continue">')).toBeUndefined()
  })

  it('finds the main product section and asks only for it', () => {
    expect(mainSectionId('<div id="shopify-section-sections--1__header"></div><div id="shopify-section-template--2123__main">')).toBe('template--2123__main')
    expect(mainSectionId('<html></html>')).toBeUndefined()
    expect(withSection('https://cm.test/products/nv3?variant=7', 'template--1__main')).toBe('https://cm.test/products/nv3?variant=7&section_id=template--1__main')
  })
})

describe('adding quantities to offers', () => {
  const offer = (url: string, inStock = true) => ({ store: 'compumarts', priceEgp: 100, inStock, url, title: url })

  it('adds the count to in-stock offers and leaves the rest as they were', async () => {
    const offers = { a: offer('a'), b: offer('b', false), c: offer('c') }
    const counts: Record<string, number | undefined> = { a: 3, c: undefined }
    const { offers: result, errors } = await addQuantities(offers, async (url: string) => counts[url])
    expect(result).toEqual({ a: { ...offers.a, quantity: 3 }, b: offers.b, c: offers.c })
    expect(offers.a).not.toHaveProperty('quantity')
    expect(errors).toEqual([])
  })

  it('keeps an offer without a count when its page fails', async () => {
    const offers = { a: offer('a') }
    const { offers: result, errors } = await addQuantities(offers, async () => { throw new Error('HTTP 503') })
    expect(result).toEqual(offers)
    expect(errors).toEqual(['a: HTTP 503'])
  })
})

describe('retrying a busy store', () => {
  const noWait = async () => {}

  it('waits and tries again after HTTP 429', async () => {
    let calls = 0
    const flaky = async () => { calls += 1; if (calls < 3) throw new Error('HTTP 429 for x'); return 7 }
    await expect(retryWhenBusy(flaky, { wait: noWait })()).resolves.toBe(7)
    expect(calls).toBe(3)
  })

  it('gives up after the last try and does not retry other errors', async () => {
    let calls = 0
    const busy = async () => { calls += 1; throw new Error('HTTP 429 for x') }
    await expect(retryWhenBusy(busy, { tries: 3, wait: noWait })()).rejects.toThrow('HTTP 429')
    expect(calls).toBe(3)
    const broken = async () => { calls += 1; throw new Error('HTTP 500 for x') }
    calls = 0
    await expect(retryWhenBusy(broken, { wait: noWait })()).rejects.toThrow('HTTP 500')
    expect(calls).toBe(1)
  })
})

describe('showing the stock count', () => {
  const found = ALL_PARTS[0]
  const counted = (quantity?: number): Offer => ({ store: 'Compumarts', priceEgp: 1000, inStock: true, url: 'https://cm.test/x', title: 'X', ...(quantity === undefined ? {} : { quantity }) })
  const listing = (offer: Offer): StoreListing => ({ ...found, offer, storeId: 'compumarts', key: 'k' })

  it('shows how many are left on a store product card', () => {
    const card = mount(ListingCard, { props: { listing: listing(counted(4)), t: en, locale: 'en' } })
    expect(card.find('.qty').text()).toBe(en.offers.quantity('4'))
    expect(mount(ListingCard, { props: { listing: listing(counted()), t: en, locale: 'en' } }).find('.qty').exists()).toBe(false)
  })

  it('shows the count in the store row of a part page', () => {
    const part = { ...found.part, listing: { ...found.part.listing, offers: [counted(2)] } }
    const page = mount(PartProfile, { props: { found: { ...found, part }, t: en, locale: 'en', inBuild: false } })
    expect(page.find('td.status .qty').text()).toBe(en.offers.quantity('2'))
  })
})
