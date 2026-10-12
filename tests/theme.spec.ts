import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const fakeSystem = (dark: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: dark && query.includes('dark'), media: query }))
}

async function freshApp() {
  vi.resetModules()
  const { default: App } = await import('../src/App.vue')
  return mount(App)
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('theme toggle', () => {
  it('follows the system until the user chooses', async () => {
    fakeSystem(true)
    const wrapper = await freshApp()
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(wrapper.find('.theme').text()).toBe('☀️')
  })

  it('switches from system dark to light and remembers it', async () => {
    fakeSystem(true)
    const wrapper = await freshApp()
    await wrapper.find('.theme').trigger('click')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('pcb-theme')).toBe('light')
    expect(wrapper.find('.theme').text()).toBe('🌙')
    expect(wrapper.find('.theme').attributes('aria-label')).toBe('الوضع الغامق')
  })

  it('restores a saved choice over the system setting', async () => {
    fakeSystem(false)
    localStorage.setItem('pcb-theme', 'dark')
    await freshApp()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('ignores a corrupted saved value', async () => {
    fakeSystem(false)
    localStorage.setItem('pcb-theme', 'purple')
    const wrapper = await freshApp()
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(wrapper.find('.theme').text()).toBe('🌙')
  })
})
