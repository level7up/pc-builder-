import { computed, shallowRef, type ComputedRef } from 'vue'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferred = shallowRef<InstallPromptEvent | undefined>(undefined)

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  deferred.value = event as InstallPromptEvent
})
window.addEventListener('appinstalled', () => { deferred.value = undefined })

export interface InstallPrompt {
  canInstall: ComputedRef<boolean>
  install: () => Promise<void>
}

export function useInstallPrompt(): InstallPrompt {
  async function install() {
    const event = deferred.value
    if (!event) return
    deferred.value = undefined
    try {
      await event.prompt()
      await event.userChoice
    } catch {
      deferred.value = event
    }
  }
  return { canInstall: computed(() => deferred.value !== undefined), install }
}
