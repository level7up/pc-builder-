import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import PartPicker from '../src/components/PartPicker.vue'
import { cpus } from '../src/data/parts'

const byName = (name: string) => cpus.find(c => c.name === name)!
const ryzen = byName('AMD Ryzen 5 7500F')
const intel = byName('Intel Core i5-12400F')
const mounted: VueWrapper[] = []

function mountPicker(selected?: string) {
  const wrapper = mount(PartPicker, {
    attachTo: document.body,
    props: {
      id: 'pick-cpu',
      groups: [{ label: 'Fits', parts: [ryzen] }, { label: 'Other', parts: [intel] }],
      selected,
      locale: 'en' as const,
      placeholder: 'Choose…',
      searchLabel: 'Search',
      emptyLabel: 'No matches',
      soldLabel: 'Sold out'
    }
  })
  mounted.push(wrapper)
  return wrapper
}

const optionNames = (wrapper: VueWrapper) => wrapper.findAll('[role="option"]').map(o => o.find('.name').text())

afterEach(() => mounted.splice(0).forEach(w => w.unmount()))

describe('part picker', () => {
  it('shows the chosen part on the button, or a placeholder', () => {
    expect(mountPicker().find('#pick-cpu').text()).toContain('Choose…')
    expect(mountPicker(ryzen.id).find('#pick-cpu').text()).toContain('Ryzen 5 7500F')
  })

  it('opens a searchable list with group headings and focuses the search box', async () => {
    const wrapper = mountPicker()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    await wrapper.find('#pick-cpu').trigger('click')
    expect(wrapper.findAll('.group').map(g => g.text())).toEqual(['Fits', 'Other'])
    expect(optionNames(wrapper)).toEqual(['AMD Ryzen 5 7500F', 'Intel Core i5-12400F'])
    expect(document.activeElement).toBe(wrapper.find('input[type="search"]').element)
  })

  it('filters the list as you type and says when nothing matches', async () => {
    const wrapper = mountPicker()
    await wrapper.find('#pick-cpu').trigger('click')
    await wrapper.find('input[type="search"]').setValue('12400')
    expect(optionNames(wrapper)).toEqual(['Intel Core i5-12400F'])
    expect(wrapper.findAll('.group').map(g => g.text())).toEqual(['Other'])
    await wrapper.find('input[type="search"]').setValue('rtx')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0)
    expect(wrapper.find('.empty').text()).toBe('No matches')
  })

  it('picks with the keyboard and closes', async () => {
    const wrapper = mountPicker()
    await wrapper.find('#pick-cpu').trigger('click')
    const search = wrapper.find('input[type="search"]')
    await search.trigger('keydown', { key: 'ArrowDown' })
    await search.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('change')).toEqual([[intel.id]])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('picks with a click', async () => {
    const wrapper = mountPicker()
    await wrapper.find('#pick-cpu').trigger('click')
    await wrapper.findAll('[role="option"]')[0].trigger('click')
    expect(wrapper.emitted('change')).toEqual([[ryzen.id]])
  })

  it('closes on Escape or a click outside without picking', async () => {
    const wrapper = mountPicker()
    await wrapper.find('#pick-cpu').trigger('click')
    await wrapper.find('input[type="search"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('#pick-cpu').element)
    await wrapper.find('#pick-cpu').trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.emitted('change')).toBeUndefined()
  })
})
