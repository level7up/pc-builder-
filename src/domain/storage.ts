import type { Storage } from './types'

export const isNvme = (drive: Storage): boolean => drive.kind === 'nvme'

export function storageInterface(drive: Storage): string {
  if (drive.kind === 'hdd') return 'HDD'
  if (drive.kind === 'sata') return 'SATA SSD'
  return `NVMe PCIe ${drive.pcieGen}`
}
