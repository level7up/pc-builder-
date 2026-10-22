import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import App from '../src/App.vue'
import '../src/components/PriceChanges.vue'
import { catalog, cpus } from '../src/data/parts'
import { CATEGORIES, resolveBuild, totalPriceEgp } from '../src/domain/build'
import { catalogAt, STORES } from '../src/domain/store'
import { formatEgp } from '../src/format'
import { CARDS_PER_PAGE } from '../src/domain/browse'
import { useWishlist } from '../src/useWishlist'
import { useCompare } from '../src/useCompare'
import { useSavedBuilds } from '../src/useSavedBuilds'
import { PRESETS } from '../src/domain/presets'

const pricierOffer = [...cpus.find(c => c.id === 'r5-7500f')!.listing.offers].filter(o => o.inStock).sort((a, b) => b.priceEgp - a.priceEgp)[0]
const pricierStore = STORES.find(s => s.name === pricierOffer.store)!
const soldOutPart = CATEGORIES.flatMap(category => catalog[category].filter(p => !p.listing.inStock).map(part => ({ category, part })))[0]
const nameOf = (id: string) => Object.values(catalog).flat().find(p => p.id === id)!.name
const shown = (wrapper: VueWrapper, category: string) => wrapper.find(`#pick-${category}`).text()

async function navigated() {
  window.dispatchEvent(new HashChangeEvent('hashchange'))
  await flushPromises()
}

async function pick(wrapper: VueWrapper, category: string, id: string) {
  await wrapper.find(`#pick-${category}`).trigger('click')
  const option = wrapper.findAll(`#pick-${category}-list [role="option"]`).find(o => o.find('.name').text() === nameOf(id))
  await option!.trigger('click')
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  localStorage.clear()
  useWishlist().clear()
  useCompare().clear()
  useSavedBuilds().clear()
  window.history.replaceState(null, '', '/')
})

describe('app', () => {
  it('starts in Arabic, right to left, with an empty build', () => {
    const wrapper = mount(App)
    expect(document.documentElement.dir).toBe('rtl')
    expect(wrapper.text()).toContain('جمّع جهازك')
    expect(wrapper.findAll('.picker .trigger')).toHaveLength(8)
  })

  it('loads a preset and shows the bottleneck and a clean compatibility check', async () => {
    const wrapper = mount(App)
    await wrapper.findAll('.preset')[1].trigger('click')
    expect(wrapper.findAll('.res')).toHaveLength(3)
    expect(wrapper.text()).toContain('كل القطع متوافقة مع بعض')
    expect(JSON.parse(localStorage.getItem('pcb-build')!)).toMatchObject({ cpu: 'r5-7500f' })
  })

  it('switches to English and remembers it', async () => {
    const wrapper = mount(App)
    await wrapper.find('.lang').trigger('click')
    expect(document.documentElement.dir).toBe('ltr')
    expect(wrapper.text()).toContain('Bottleneck calculator')
    expect(localStorage.getItem('pcb-locale')).toBe('en')
    await wrapper.find('.lang').trigger('click')
  })

  it('opens a shared build from the link', () => {
    window.history.replaceState(null, '', '/?cpu=i5-12400f&motherboard=mb-b650m-p')
    const wrapper = mount(App)
    expect(shown(wrapper, 'cpu')).toContain(nameOf('i5-12400f'))
    expect(wrapper.text()).toContain('LGA1700')
  })

  it('keeps a shared build after the link is cleared from the address bar', () => {
    localStorage.setItem('pcb-build', JSON.stringify({ cpu: 'r7-9800x3d' }))
    window.history.replaceState(null, '', '/?cpu=i5-12400f')
    mount(App)
    expect(window.location.search).toBe('')
    expect(JSON.parse(localStorage.getItem('pcb-build')!)).toEqual({ cpu: 'i5-12400f' })
    const reopened = mount(App)
    expect(shown(reopened, 'cpu')).toContain(nameOf('i5-12400f'))
  })

  it('suggests processors after a motherboard is picked, and applies one on click', async () => {
    const wrapper = mount(App)
    await pick(wrapper, 'motherboard', 'mb-b650m-p')
    const picks = wrapper.findAll('.pick')
    expect(picks).toHaveLength(3)
    expect(wrapper.text()).toContain('بروسيسورات تركب على المازربورد دي')
    await picks[0].trigger('click')
    expect(shown(wrapper, 'cpu')).toContain(nameOf('r5-8400f'))
    expect(wrapper.findAll('.pick')).toHaveLength(0)
  })

  it('suggests motherboards after a processor is picked', async () => {
    const wrapper = mount(App)
    await pick(wrapper, 'cpu', 'i7-14700k')
    expect(wrapper.text()).toContain('مازربوردات تناسب البروسيسور ده')
    expect(wrapper.findAll('.pick').map(p => p.text()).join(' ')).toContain('بتعمل أوفركلوك')
  })

  it('groups dropdown options by whether they fit', async () => {
    const wrapper = mount(App)
    await pick(wrapper, 'motherboard', 'mb-b650m-p')
    await wrapper.find('#pick-cpu').trigger('click')
    const items = wrapper.findAll('#pick-cpu-list li').map(li => li.text())
    const otherAt = items.indexOf('مش هتركب مع اختياراتك')
    expect(wrapper.findAll('#pick-cpu-list .group').map(g => g.text())).toEqual(['تركب مع اختياراتك', 'مش هتركب مع اختياراتك'])
    expect(items.slice(0, otherAt).join(' ')).toContain('Ryzen 5 7500F')
    expect(items.slice(otherAt).join(' ')).toContain('i5-12400F')
  })

  it('builds a full system from a budget typed in Arabic digits', async () => {
    const wrapper = mount(App)
    await wrapper.find('.budget input').setValue('٨٠٠٠٠')
    await wrapper.find('.budget').trigger('submit')
    expect(wrapper.find('.msg.ok').exists()).toBe(true)
    expect(wrapper.findAll('.picker .placeholder')).toHaveLength(0)
    expect(wrapper.findAll('li.error, li.warning')).toHaveLength(0)
  })

  it('explains a budget that is too low or not a number', async () => {
    const wrapper = mount(App)
    await wrapper.find('.budget input').setValue('5000')
    await wrapper.find('.budget').trigger('submit')
    expect(wrapper.find('.msg.bad').text()).toContain('أرخص تجميعة')
    await wrapper.find('.budget input').setValue('كتير')
    await wrapper.find('.budget').trigger('submit')
    expect(wrapper.find('.msg.bad').text()).toContain('رقم بالجنيه')
  })
  it('estimates FPS per game, including PUBG Mobile on GameLoop, and follows the chosen resolution', async () => {
    const wrapper = mount(App)
    await wrapper.findAll('.preset')[1].trigger('click')
    const fps = wrapper.find('.fps')
    expect(fps.text()).toContain('PUBG Mobile (GameLoop)')
    const cyberpunk = () => fps.find('[data-game="cyberpunk"] .value').text()
    const at1080 = cyberpunk()
    await fps.findAll('.seg button')[2].trigger('click')
    expect(cyberpunk()).not.toBe(at1080)
  })

  it('exports the build as text, a WhatsApp message and a printable sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    const wrapper = mount(App)
    await wrapper.findAll('.preset')[1].trigger('click')
    await wrapper.find('.copy-text').trigger('click')
    expect(writeText.mock.calls[0][0]).toContain('Ryzen 5 7500F')
    expect(wrapper.find('.whatsapp').attributes('href')).toMatch(/^https:\/\/wa\.me\/\?text=.*7500F/)
    expect(wrapper.find('.sheet').text()).toContain('Ryzen 5 7500F')
    await wrapper.find('.print').trigger('click')
    expect(print).toHaveBeenCalledOnce()
    print.mockRestore()
  })
  it('links to the product at the store once a part is picked', async () => {
    const wrapper = mount(App)
    expect(wrapper.find('.store-link').exists()).toBe(false)
    await pick(wrapper, 'cpu', 'r5-7500f')
    const cpu = cpus.find(c => c.id === 'r5-7500f')!
    const link = wrapper.find('.store-link')
    expect(link.attributes('href')).toBe(cpu.listing.url)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.text()).toContain('شوف في المحل')
    expect(link.text()).toContain(cpu.listing.store)
  })

  it('shows the part image when the store listing has one', async () => {
    const withImage = cpus.find(c => c.listing.image)!
    expect(withImage).toBeDefined()
    const wrapper = mount(App)
    await pick(wrapper, 'cpu', withImage.id)
    const img = wrapper.find('.part-image img')
    expect(img.attributes('src')).toBe(withImage.listing.image)
    expect(img.attributes('alt')).toBe(withImage.name)
    expect(img.attributes('loading')).toBe('lazy')
  })

  it('limits parts and prices to one chosen store and remembers it', async () => {
    const wrapper = mount(App)
    await wrapper.find('.store-panel .chip[data-store="compumarts"]').trigger('click')
    expect(localStorage.getItem('pcb-store')).toBe('compumarts')
    expect(wrapper.text()).toContain('من Compumarts بس')
    const there = catalogAt('compumarts')
    await wrapper.find('#pick-cpu').trigger('click')
    expect(wrapper.findAll('#pick-cpu-list [role="option"]')).toHaveLength(there.cpu.length)
    await wrapper.find('#pick-cpu').trigger('click')
    await pick(wrapper, 'cpu', 'r5-7500f')
    const cpu = there.cpu.find(c => c.id === 'r5-7500f')!
    expect(wrapper.find('.store-link').attributes('href')).toBe(cpu.listing.url)
    expect(wrapper.find('.store-link').text()).toContain('Compumarts')
    expect(mount(App).find('.store-panel .chip.on').text()).toBe('Compumarts')
  })

  it('compares the build at every store and switches to one on click', async () => {
    const wrapper = mount(App)
    await wrapper.findAll('.preset')[1].trigger('click')
    const quotes = wrapper.findAll('.quote')
    expect(quotes.length).toBeGreaterThan(1)
    const lacking = wrapper.findAll('.quote').find(q => !q.classes('complete'))
    expect(lacking).toBeDefined()
    await lacking!.trigger('click')
    expect(lacking!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('.not-here').exists()).toBe(true)
    expect(wrapper.text()).toContain('القطعة اللي اخترتها مش موجودة في')
  })

  it('builds a budget system from the chosen store only', async () => {
    const wrapper = mount(App)
    await wrapper.find('.store-panel .chip[data-store="compumarts"]').trigger('click')
    await wrapper.find('.budget input').setValue('80000')
    await wrapper.find('.budget').trigger('submit')
    expect(wrapper.find('.msg.ok').exists()).toBe(true)
    const ids = JSON.parse(localStorage.getItem('pcb-build')!)
    const there = catalogAt('compumarts')
    CATEGORIES.filter(c => ids[c]).forEach(c => expect(there[c].some(p => p.id === ids[c])).toBe(true))
    expect(wrapper.find('.not-here').exists()).toBe(false)
  })

  it('shares the chosen store in the link', async () => {
    window.history.replaceState(null, '', '/?cpu=r5-7500f&store=sigma')
    const wrapper = mount(App)
    expect(wrapper.find('.store-panel .chip.on').text()).toBe('Sigma Computer')
    expect(localStorage.getItem('pcb-store')).toBe('sigma')
  })

  it.skipIf(!soldOutPart)('marks sold-out parts in the list and keeps them out of the total', async () => {
    const { category, part } = soldOutPart!
    const wrapper = mount(App)
    await wrapper.find(`#pick-${category}`).trigger('click')
    const options = wrapper.findAll(`#pick-${category}-list [role="option"]`)
    const option = options.find(o => o.find('.name').text() === part.name)!
    expect(option.find('.sold').text()).toBe('نفدت')
    expect(options.at(-1)!.find('.sold').exists()).toBe(true)
    await option.trigger('click')
    expect(wrapper.find('.sold-note').text()).toContain('نفدت من كل المحلات')
    expect(wrapper.text()).toContain('القطعة اللي اخترتها نفدت من كل المحلات')
    expect(wrapper.find('.total strong').text()).toBe(formatEgp(0, 'ar'))
  })

  it('opens the price changes page from the header and goes back', async () => {
    const wrapper = mount(App)
    expect(wrapper.find('a.changes-link').attributes('href')).toBe('#prices')
    expect(wrapper.find('a.home-link').attributes('aria-current')).toBe('page')
    window.location.hash = '#prices'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await flushPromises()
    const page = wrapper.find('.price-changes')
    expect(page.exists()).toBe(true)
    expect(page.findAll('tbody tr').length).toBe(Object.values(catalog).flat().length)
    expect(wrapper.find('a.home-link').text()).toBe('الرئيسية')
    expect(wrapper.find('a.home-link').attributes('aria-current')).toBeUndefined()
    expect(wrapper.find('a.changes-link').attributes('aria-current')).toBe('page')
    expect(wrapper.findAll('.picker .trigger')).toHaveLength(0)
    await page.find('input[type="search"]').setValue('7500F')
    expect(page.findAll('tbody tr').map(r => r.find('.name').text())).toEqual([nameOf('r5-7500f')])
    window.location.hash = ''
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await flushPromises()
    expect(wrapper.findAll('.picker .trigger')).toHaveLength(8)
  })

  it('searches every part from the navbar and opens its profile with the price at each store', async () => {
    const wrapper = mount(App)
    const input = wrapper.find('.nav-search input')
    await input.setValue('7500F')
    const results = wrapper.findAll('.nav-search [role="option"]')
    expect(results[0].text()).toContain(nameOf('r5-7500f'))
    expect(results[0].text()).toContain('البروسيسور')
    await input.trigger('keydown', { key: 'Enter' })
    await navigated()
    expect(window.location.hash).toBe('#part/r5-7500f')
    expect((input.element as HTMLInputElement).value).toBe('')
    const profile = wrapper.find('.part-profile')
    expect(profile.find('h2').text()).toBe(nameOf('r5-7500f'))
    const rows = profile.findAll('.stores tbody tr')
    expect(rows).toHaveLength(8)
    expect(rows[0].text()).toContain(formatEgp(cpus.find(c => c.id === 'r5-7500f')!.listing.priceEgp, 'ar'))
    expect(rows[0].find('.best').exists()).toBe(true)
    expect(wrapper.findAll('.picker .trigger')).toHaveLength(0)
  })

  it('adds a part to the build from its profile and goes back to the builder', async () => {
    window.history.replaceState(null, '', '/#part/r5-7500f')
    const wrapper = mount(App)
    await wrapper.find('.part-profile button.add').trigger('click')
    await navigated()
    expect(JSON.parse(localStorage.getItem('pcb-build')!)).toMatchObject({ cpu: 'r5-7500f' })
    expect(shown(wrapper, 'cpu')).toContain(nameOf('r5-7500f'))
  })

  it('shows the builder for a link to an unknown part', () => {
    window.history.replaceState(null, '', '/#part/nope')
    const wrapper = mount(App)
    expect(wrapper.find('.part-profile').exists()).toBe(false)
    expect(wrapper.findAll('.picker .trigger')).toHaveLength(8)
  })

  it('browses every part as cards with search, filters and more on demand', async () => {
    window.history.replaceState(null, '', '/#parts')
    const wrapper = mount(App)
    const page = wrapper.find('.parts-page')
    await page.find('button[data-view="parts"]').trigger('click')
    expect(page.findAll('.part-card')).toHaveLength(CARDS_PER_PAGE)
    await page.find('button.more').trigger('click')
    expect(page.findAll('.part-card')).toHaveLength(CARDS_PER_PAGE * 2)
    await page.find('select.category').setValue('cooler')
    expect(page.findAll('.part-card .category').every(c => c.text() === 'مبرّد البروسيسور')).toBe(true)
    await page.find('select.category').setValue('')
    await page.find('input[type="search"]').setValue('7500F')
    const cards = page.findAll('.part-card')
    expect(cards.map(c => c.find('.name').text())).toEqual([nameOf('r5-7500f')])
    expect(cards[0].find('a.name').attributes('href')).toBe('#part/r5-7500f')
    expect(page.find('button.more').exists()).toBe(false)
  })

  it('saves favorites from a card and lists them on the wishlist page', async () => {
    window.history.replaceState(null, '', '/#parts')
    const wrapper = mount(App)
    await wrapper.find('.parts-page button[data-view="parts"]').trigger('click')
    await wrapper.find('.parts-page input[type="search"]').setValue('7500F')
    const fav = wrapper.find('.part-card .fav')
    expect(fav.attributes('aria-pressed')).toBe('false')
    await fav.trigger('click')
    expect(fav.attributes('aria-pressed')).toBe('true')
    expect(JSON.parse(localStorage.getItem('pcb-wishlist')!)).toEqual(['r5-7500f'])
    expect(wrapper.find('.wishlist-link .count').exists()).toBe(true)
    window.location.hash = '#wishlist'
    await navigated()
    const page = wrapper.find('.wishlist-page')
    expect(page.findAll('.part-card').map(c => c.find('.name').text())).toEqual([nameOf('r5-7500f')])
    await page.find('.part-card .fav').trigger('click')
    expect(page.findAll('.part-card')).toHaveLength(0)
    expect(page.find('.empty').exists()).toBe(true)
  })

  it('adds favorites from the part profile and from a picked part', async () => {
    window.history.replaceState(null, '', '/#part/r5-7500f')
    const wrapper = mount(App)
    await wrapper.find('.part-profile .category-row .fav').trigger('click')
    window.location.hash = ''
    await navigated()
    await pick(wrapper, 'gpu', catalog.gpu[0].id)
    await wrapper.find('.row .picked .fav').trigger('click')
    expect(useWishlist().keys.value).toEqual([catalog.gpu[0].id, 'r5-7500f'])
  })

  it('shows one card per store product by default', async () => {
    window.history.replaceState(null, '', '/#parts')
    const wrapper = mount(App)
    const page = wrapper.find('.parts-page')
    expect(page.findAll('.listing-card')).toHaveLength(CARDS_PER_PAGE)
    expect(page.find('button[data-view="listings"]').attributes('aria-pressed')).toBe('true')
    await page.find('input[type="search"]').setValue('7500F')
    const cards = page.findAll('.listing-card')
    const ryzen = cpus.find(c => c.id === 'r5-7500f')!
    expect(cards.length).toBeGreaterThanOrEqual(ryzen.listing.offers.length)
    const first = cards[0]
    expect(first.find('.store').text()).not.toBe('')
    expect(first.find('a.buy').attributes('href')).toMatch(/^https:\/\//)
    expect(page.findAll('.part-card')).toHaveLength(0)
  })

  it('saves a store product to the wishlist as that store listing', async () => {
    window.history.replaceState(null, '', '/#parts')
    const wrapper = mount(App)
    await wrapper.find('.parts-page input[type="search"]').setValue('7500F')
    const card = wrapper.findAll('.listing-card').find(c => c.find('.store').text() === pricierOffer.store)!
    await card.find('.fav').trigger('click')
    const key = `r5-7500f@${pricierStore.id}`
    expect(useWishlist().keys.value).toEqual([key])
    expect(wrapper.findAll('.listing-card .fav[aria-pressed="true"]')).toHaveLength(1)
    window.location.hash = '#wishlist'
    await navigated()
    const saved = wrapper.findAll('.wishlist-page .listing-card')
    expect(saved).toHaveLength(1)
    expect(saved[0].find('.store').text()).toBe(pricierOffer.store)
    expect(saved[0].find('.price').text()).toBe(formatEgp(pricierOffer.priceEgp, 'ar'))
    expect(wrapper.find('.wishlist-page .part-card').exists()).toBe(false)
  })

  it('saves one store row from the part profile', async () => {
    window.history.replaceState(null, '', '/#part/r5-7500f')
    const wrapper = mount(App)
    const row = wrapper.findAll('.stores tbody tr').find(r => r.find('.store b').text() === pricierOffer.store)!
    await row.find('.fav').trigger('click')
    expect(useWishlist().keys.value).toEqual([`r5-7500f@${pricierStore.id}`])
    expect(wrapper.find('.part-profile .category-row .fav').attributes('aria-pressed')).toBe('false')
  })

  it('compares parts picked from the cards side by side', async () => {
    window.history.replaceState(null, '', '/#parts')
    const wrapper = mount(App)
    const page = wrapper.find('.parts-page')
    await page.find('button[data-view="parts"]').trigger('click')
    await page.find('select.category').setValue('gpu')
    const cards = page.findAll('.part-card')
    await cards[0].find('.compare-toggle').trigger('click')
    expect(wrapper.find('.compare-bar').text()).toContain('ضيف قطعة كمان')
    await cards[1].find('.compare-toggle').trigger('click')
    expect(cards[0].find('.compare-toggle').attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('.compare-bar .chip')).toHaveLength(2)
    expect(wrapper.find('.compare-bar a.go').attributes('href')).toBe('#compare')
    window.location.hash = '#compare'
    await navigated()
    const table = wrapper.find('.compare-page table.specs')
    expect(table.findAll('thead th.part')).toHaveLength(2)
    expect(table.find('tr[data-row="vram"]').exists()).toBe(true)
    expect(table.findAll('tr[data-row="price"] td.best').length).toBeGreaterThanOrEqual(1)
    expect(wrapper.findAll('.compare-page table.prices tbody tr')).toHaveLength(8)
    expect(wrapper.find('.compare-bar').exists()).toBe(false)
    await wrapper.find('.compare-page thead .remove').trigger('click')
    expect(useCompare().ids.value).toHaveLength(1)
    expect(wrapper.find('.compare-page .need-more').exists()).toBe(true)
  })

  it('adds a compared part to the build from the comparison', async () => {
    useCompare().toggle('r5-7500f')
    useCompare().toggle('i5-12400f')
    window.history.replaceState(null, '', '/#compare')
    const wrapper = mount(App)
    await wrapper.findAll('.compare-page thead .add')[1].trigger('click')
    await flushPromises()
    expect(JSON.parse(localStorage.getItem('pcb-build')!)).toMatchObject({ cpu: 'i5-12400f' })
    expect(wrapper.findAll('.compare-page thead .in-build')).toHaveLength(1)
  })

  it('starts a new comparison from the part profile when the category differs', async () => {
    useCompare().toggle(catalog.gpu[0].id)
    window.history.replaceState(null, '', '/#part/r5-7500f')
    const wrapper = mount(App)
    await wrapper.find('.part-profile .compare-toggle').trigger('click')
    expect(useCompare().ids.value).toEqual(['r5-7500f'])
  })

  it('saves the current build under a name and lists it on My builds', async () => {
    const wrapper = mount(App)
    await wrapper.findAll('.preset')[0].trigger('click')
    const panel = wrapper.find('.save-build')
    await panel.find('input').setValue('  Budget  gaming ')
    await panel.find('form').trigger('submit')
    expect(useSavedBuilds().builds.value.map(b => b.name)).toEqual(['Budget gaming'])
    expect(wrapper.find('.save-build .status').text()).toContain('Budget gaming')
    await wrapper.findAll('.preset')[1].trigger('click')
    expect(wrapper.find('.save-build .changed').exists()).toBe(true)
    await wrapper.find('.save-build button.update').trigger('click')
    expect(useSavedBuilds().builds.value[0].ids).toEqual(PRESETS[1].ids)
    expect(wrapper.find('.save-build .changed').exists()).toBe(false)
    window.location.hash = '#builds'
    await navigated()
    const cards = wrapper.findAll('.builds-page .build-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].find('h3').text()).toBe('Budget gaming')
    expect(cards[0].find('.total').text()).toBe(formatEgp(totalPriceEgp(resolveBuild(PRESETS[1].ids)), 'ar'))
  })

  it('opens a saved build in the builder', async () => {
    const saved = useSavedBuilds()
    const id = saved.save('Old', { ids: PRESETS[0].ids, storeId: 'compumarts' })
    saved.setActive(undefined)
    window.history.replaceState(null, '', '/#builds')
    const wrapper = mount(App)
    await wrapper.find(`.build-card[data-build="${id}"] button.open`).trigger('click')
    await navigated()
    expect(window.location.hash).toBe('')
    expect(JSON.parse(localStorage.getItem('pcb-build')!)).toEqual(PRESETS[0].ids)
    expect(localStorage.getItem('pcb-store')).toBe('compumarts')
    expect(wrapper.find('.save-build .status').text()).toContain('Old')
  })

  it('compares saved builds side by side', async () => {
    const saved = useSavedBuilds()
    const cheap = saved.save('Cheap', { ids: PRESETS[0].ids })
    const fast = saved.save('Fast', { ids: PRESETS[3].ids })
    window.history.replaceState(null, '', '/#builds')
    const wrapper = mount(App)
    await wrapper.find(`.build-card[data-build="${cheap}"] input.pick`).setValue(true)
    expect(wrapper.find('.builds-compare').exists()).toBe(false)
    await wrapper.find(`.build-card[data-build="${fast}"] input.pick`).setValue(true)
    const table = wrapper.find('.builds-compare table')
    expect(table.findAll('thead th.build').map(th => th.text())).toEqual(['Fast', 'Cheap'])
    expect(table.find('tr[data-row="total"] td.best').text()).toBe(formatEgp(totalPriceEgp(resolveBuild(PRESETS[0].ids)), 'ar'))
    expect(table.find('tr[data-part="gpu"]').classes()).toContain('differs')
  })

  it('renames and deletes a saved build after confirming', async () => {
    const saved = useSavedBuilds()
    const id = saved.save('Temp', { ids: PRESETS[0].ids })
    window.history.replaceState(null, '', '/#builds')
    const wrapper = mount(App)
    const card = () => wrapper.find(`.build-card[data-build="${id}"]`)
    await card().find('button.rename').trigger('click')
    await card().find('input.name').setValue('Renamed')
    await card().find('form.rename-form').trigger('submit')
    expect(saved.builds.value[0].name).toBe('Renamed')
    await card().find('button.delete').trigger('click')
    expect(saved.builds.value).toHaveLength(1)
    await card().find('button.confirm').trigger('click')
    expect(saved.builds.value).toHaveLength(0)
    expect(wrapper.find('.builds-page .empty').exists()).toBe(true)
  })

  it('shows a saved build on its own page and opens it from there', async () => {
    const saved = useSavedBuilds()
    const id = saved.save('Desk PC', { ids: PRESETS[1].ids, storeId: 'compumarts' })
    saved.setActive(undefined)
    window.history.replaceState(null, '', '/#builds')
    const wrapper = mount(App)
    expect(wrapper.find(`.build-card[data-build="${id}"] h3 a`).attributes('href')).toBe(`#build/${id}`)
    window.location.hash = `#build/${id}`
    await navigated()
    const page = wrapper.find('.saved-build')
    expect(page.find('h2').text()).toBe('Desk PC')
    const build = resolveBuild(PRESETS[1].ids, catalogAt('compumarts'))
    expect(page.find('.total').text()).toBe(formatEgp(totalPriceEgp(build), 'ar'))
    expect(page.findAll('tr[data-line]')).toHaveLength(CATEGORIES.length)
    expect(page.find('tr[data-line="cpu"] a.name').attributes('href')).toBe(`#part/${PRESETS[1].ids.cpu}`)
    expect(page.find('tr[data-line="cpu"] .price').text()).toBe(formatEgp(build.cpu!.listing.priceEgp, 'ar'))
    expect(page.find('aside.checks').text()).toContain('كل القطع متوافقة مع بعض')
    await page.find('button.open').trigger('click')
    await navigated()
    expect(window.location.hash).toBe('')
    expect(JSON.parse(localStorage.getItem('pcb-build')!)).toEqual(PRESETS[1].ids)
    expect(saved.active.value?.id).toBe(id)
  })

  it('says so when a saved build no longer exists', async () => {
    window.history.replaceState(null, '', '/#build/gone')
    const wrapper = mount(App)
    expect(wrapper.find('.saved-build .not-found').exists()).toBe(true)
    expect(wrapper.find('.saved-build .not-found a').attributes('href')).toBe('#builds')
  })

  it('has a bottom tab bar for phones that marks the current page', async () => {
    useWishlist().toggle('r5-7500f')
    window.history.replaceState(null, '', '/#build/x')
    const wrapper = mount(App)
    const tabs = wrapper.findAll('nav.tabbar a')
    expect(tabs.map(a => a.attributes('href'))).toEqual(['#', '#parts', '#wishlist', '#builds', '#prices'])
    expect(wrapper.find('nav.tabbar [aria-current="page"]').attributes('href')).toBe('#builds')
    expect(wrapper.find('nav.tabbar a[href="#wishlist"] .count').text()).toBe('1')
    window.location.hash = '#parts'
    await navigated()
    expect(wrapper.find('nav.tabbar [aria-current="page"]').attributes('href')).toBe('#parts')
  })

  it('splits the build total into monthly installments', async () => {
    const wrapper = mount(App)
    await wrapper.findAll('.preset')[1].trigger('click')
    const total = totalPriceEgp(resolveBuild(PRESETS[1].ids))
    const panel = wrapper.find('.summary .installments')
    expect(panel.find('.monthly').text()).toBe(formatEgp(Math.ceil(total / 12), 'ar'))
    await panel.find('button[data-plan="finance"]').trigger('click')
    await panel.find('button[data-months="24"]').trigger('click')
    await panel.find('input.down').setValue('10000')
    const financed = total - 10000
    const monthly = Math.ceil((financed + Math.round(financed * 0.025 * 24)) / 24)
    expect(panel.find('.monthly').text()).toBe(formatEgp(monthly, 'ar'))
    await panel.find('input.rate').setValue('0')
    await panel.find('input.fee').setValue('0')
    expect(panel.find('.monthly').text()).toBe(formatEgp(Math.ceil(financed / 24), 'ar'))
    expect(panel.find('.extra').exists()).toBe(false)
  })

  it('offers to install the app when the browser allows it', async () => {
    const wrapper = mount(App)
    expect(wrapper.find('button.install').exists()).toBe(false)
    const prompt = vi.fn(() => Promise.resolve())
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) }))
    await flushPromises()
    await wrapper.find('button.install').trigger('click')
    await flushPromises()
    expect(prompt).toHaveBeenCalledOnce()
    expect(wrapper.find('button.install').exists()).toBe(false)
  })
})
