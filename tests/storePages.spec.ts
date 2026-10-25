import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import App from '../src/App.vue'
import { browseListings, CARDS_PER_PAGE, DEFAULT_FILTER } from '../src/domain/browse'
import { STORES } from '../src/domain/store'
import { storeProfile } from '../src/domain/storeProfile'
import { formatCount } from '../src/format'

enableAutoUnmount(afterEach)

async function openAt(hash: string) {
  window.history.replaceState(null, '', '/' + hash)
  const wrapper = mount(App)
  await flushPromises()
  return wrapper
}

const sigma = storeProfile('sigma')!

beforeEach(() => localStorage.clear())

describe('store pages', () => {
  it('lists every store with its stock and a link to its profile', async () => {
    const wrapper = await openAt('#stores')
    const cards = wrapper.findAll('.store-summary')
    expect(cards).toHaveLength(STORES.length)
    const card = wrapper.find('.store-summary[data-store="sigma"]')
    expect(card.text()).toContain('Sigma Computer')
    expect(card.find('a.open').attributes('href')).toBe('#store/sigma')
  })

  it('shows all of a store\'s products, and only that store\'s', async () => {
    const wrapper = await openAt('#store/sigma')
    const page = wrapper.find('.store-profile')
    expect(page.find('h2').text()).toBe('Sigma Computer')
    expect(page.find('a.visit').attributes('href')).toBe(sigma.url)
    const cards = page.findAll('.listing-card')
    expect(cards).toHaveLength(Math.min(CARDS_PER_PAGE, sigma.products))
    cards.forEach(card => expect(card.find('.store').text()).toBe('Sigma Computer'))
  })

  it('filters a store\'s products by category, stock and search', async () => {
    const wrapper = await openAt('#store/sigma')
    const page = wrapper.find('.store-profile')
    const gpus = sigma.categories.find(c => c.category === 'gpu')!
    await page.find('button.chip[data-category="gpu"]').trigger('click')
    expect(page.find('.result-count').text()).toContain(formatCount(gpus.products, 'ar'))
    await page.find('input.in-stock').setValue(true)
    expect(page.find('.result-count').text()).toContain(formatCount(gpus.inStock, 'ar'))
    await page.find('input.search').setValue('5070')
    const expected = browseListings({ ...DEFAULT_FILTER, storeId: 'sigma', category: 'gpu', inStockOnly: true, query: '5070' })
    expect(page.findAll('.listing-card')).toHaveLength(Math.min(CARDS_PER_PAGE, expected.length))
  })

  it('links store names on product cards to the store profile', async () => {
    const wrapper = await openAt('#parts')
    const store = wrapper.find('.listing-card a.store')
    const id = STORES.find(s => s.name === store.text())!.id
    expect(store.attributes('href')).toBe(`#store/${id}`)
  })
})
