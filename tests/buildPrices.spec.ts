import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { resolveBuild } from '../src/domain/build'
import { PRESETS } from '../src/domain/presets'
import { formatEgp } from '../src/format'

enableAutoUnmount(afterEach)

const ids = PRESETS[1].ids
const cpuNow = resolveBuild(ids).cpu!.listing.priceEgp

async function mountWithSavedBuilds(builds: unknown[]) {
  localStorage.clear()
  localStorage.setItem('pcb-builds', JSON.stringify(builds))
  window.history.replaceState(null, '', '/#builds')
  vi.resetModules()
  const { default: App } = await import('../src/App.vue')
  const wrapper = mount(App)
  await flushPromises()
  return wrapper
}

describe('saved build prices', () => {
  beforeEach(() => localStorage.clear())

  it('shows each part price on the card and flags prices that moved since saving', async () => {
    const prices = { cpu: cpuNow - 500 }
    const wrapper = await mountWithSavedBuilds([{ id: 'b1', name: 'Desk', ids, savedAt: '2026-10-20T10:00:00.000Z', prices }])
    const card = wrapper.find('.build-card[data-build="b1"]')
    expect(card.findAll('.parts li')).toHaveLength(Object.keys(ids).length)
    expect(card.find('[data-line="cpu"] .part-price').text()).toContain(formatEgp(cpuNow, 'ar'))
    expect(card.find('[data-line="cpu"] .was').text()).toContain(formatEgp(cpuNow - 500, 'ar'))
    expect(card.find('[data-line="cpu"] .part-price').classes()).toContain('up')
    expect(card.find('.price-alert').exists()).toBe(true)
    expect(wrapper.find('.price-banner').text()).toContain('1')

    await card.find('button.accept').trigger('click')
    expect(wrapper.find('.price-banner').exists()).toBe(false)
    expect(wrapper.find('.build-card .price-alert').exists()).toBe(false)
    expect(JSON.parse(localStorage.getItem('pcb-builds')!)[0].prices.cpu).toBe(cpuNow)
  })

  it('starts tracking builds saved before prices were recorded, without an alert', async () => {
    const wrapper = await mountWithSavedBuilds([{ id: 'old', name: 'Old', ids, savedAt: '2026-10-01T10:00:00.000Z' }])
    expect(wrapper.find('.price-banner').exists()).toBe(false)
    expect(JSON.parse(localStorage.getItem('pcb-builds')!)[0].prices.cpu).toBe(cpuNow)
  })

  it('marks every build as seen from the banner', async () => {
    const stale = (id: string) => ({ id, name: id, ids, savedAt: '2026-10-20T10:00:00.000Z', prices: { cpu: cpuNow + 300 } })
    const wrapper = await mountWithSavedBuilds([stale('a'), stale('b')])
    expect(wrapper.findAll('.build-card .price-alert')).toHaveLength(2)
    await wrapper.find('.price-banner button.accept-all').trigger('click')
    expect(wrapper.findAll('.build-card .price-alert')).toHaveLength(0)
  })

  it('shows the old price on the saved build page', async () => {
    const wrapper = await mountWithSavedBuilds([{ id: 'b1', name: 'Desk', ids, savedAt: '2026-10-20T10:00:00.000Z', prices: { cpu: cpuNow + 300 } }])
    window.location.hash = '#build/b1'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await flushPromises()
    const page = wrapper.find('.saved-build')
    expect(page.find('.price-alert').exists()).toBe(true)
    expect(page.find('tr[data-line="cpu"] .was').text()).toContain(formatEgp(cpuNow + 300, 'ar'))
    expect(page.find('tr[data-line="cpu"] .price').classes()).toContain('down')
  })
})
