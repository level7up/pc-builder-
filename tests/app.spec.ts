import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import App from '../src/App.vue'
import { catalog, cpus } from '../src/data/parts'
import { CATEGORIES } from '../src/domain/build'
import { catalogAt } from '../src/domain/store'

const nameOf = (id: string) => Object.values(catalog).flat().find(p => p.id === id)!.name
const shown = (wrapper: VueWrapper, category: string) => wrapper.find(`#pick-${category}`).text()

async function pick(wrapper: VueWrapper, category: string, id: string) {
  await wrapper.find(`#pick-${category}`).trigger('click')
  const option = wrapper.findAll(`#pick-${category}-list [role="option"]`).find(o => o.find('.name').text() === nameOf(id))
  await option!.trigger('click')
}

beforeEach(() => {
  localStorage.clear()
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
})
