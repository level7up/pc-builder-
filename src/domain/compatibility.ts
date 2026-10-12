import { estimatedLoadW, recommendedPsuW } from './power'
import { REQUIRED } from './build'
import type { Build, Cpu, Issue } from './types'

export const GPU_TIGHT_MARGIN_MM = 15
export const MIN_RAM_GB = 16
export const LOW_VRAM_GB = 8

type Check = (build: Build) => Issue[]

const issue = (severity: Issue['severity'], code: string, params?: Issue['params']): Issue[] => [{ severity, code, ...(params ? { params } : {}) }]

export const isUnlocked = (cpu: Cpu): boolean => cpu.brand === 'AMD' || /\d+KF?\b/.test(cpu.name)

const isNewGenOnOlderChipset = (build: Build): boolean => {
  const { cpu, motherboard } = build
  if (!cpu || !motherboard) return false
  const amdZen5 = cpu.socket === 'AM5' && /Ryzen \d 9\d{3}/.test(cpu.name)
  const intel14th = /i\d-14\d{3}/.test(cpu.name)
  return (amdZen5 && ['A620', 'B650'].includes(motherboard.chipset)) || (intel14th && ['H610', 'B760'].includes(motherboard.chipset))
}

const missing: Check = build => REQUIRED.filter(category => !build[category]).flatMap(category => issue('info', 'missing', { category }))

const socket: Check = ({ cpu, motherboard }) =>
  cpu && motherboard && cpu.socket !== motherboard.socket ? issue('error', 'socketMismatch', { cpu: cpu.socket, board: motherboard.socket }) : []

const memoryType: Check = ({ cpu, motherboard, memory }) => [
  ...(motherboard && memory && motherboard.memory !== memory.type ? issue('error', 'memoryMismatch', { board: motherboard.memory, memory: memory.type }) : []),
  ...(cpu && memory && !cpu.memory.includes(memory.type) ? issue('error', 'cpuMemoryMismatch', { cpu: cpu.memory.join('/'), memory: memory.type }) : [])
]

const formFactor: Check = ({ motherboard, case: pcCase }) =>
  motherboard && pcCase && !pcCase.formFactors.includes(motherboard.formFactor) ? issue('error', 'formFactorMismatch', { board: motherboard.formFactor }) : []

const gpuFit: Check = ({ gpu, case: pcCase }) => {
  if (!gpu || !pcCase) return []
  if (gpu.lengthMm > pcCase.maxGpuMm) return issue('error', 'gpuTooLong', { gpu: gpu.lengthMm, max: pcCase.maxGpuMm })
  return gpu.lengthMm > pcCase.maxGpuMm - GPU_TIGHT_MARGIN_MM ? issue('warning', 'gpuTight', { gpu: gpu.lengthMm, max: pcCase.maxGpuMm }) : []
}

const video: Check = ({ cpu, gpu }) => (cpu && !gpu && !cpu.hasIgpu ? issue('error', 'noVideoOutput') : [])

const power: Check = build => {
  const { psu } = build
  if (!psu || !build.cpu) return []
  const load = estimatedLoadW(build)
  const recommended = recommendedPsuW(build)
  if (psu.watts < load) return issue('error', 'psuTooWeak', { load, watts: psu.watts })
  return psu.watts < recommended ? issue('warning', 'psuLowHeadroom', { recommended, watts: psu.watts }) : []
}

const psuQuality: Check = ({ psu, gpu }) =>
  psu && gpu && psu.rating === 'Standard' && gpu.boardPowerW >= 200 ? issue('warning', 'psuRatingLow', { gpuW: gpu.boardPowerW }) : []

const cooling: Check = ({ cpu, cooler }) =>
  cpu && cooler && cooler.ratedW < cpu.powerW ? issue('warning', 'coolerUnderrated', { cooler: cooler.ratedW, cpu: cpu.powerW }) : []

const boardPower: Check = ({ cpu, motherboard }) =>
  cpu && motherboard && cpu.socket === motherboard.socket && motherboard.maxCpuPowerW < cpu.powerW
    ? issue('warning', 'boardPowerLimited', { chipset: motherboard.chipset, cpu: cpu.powerW })
    : []

const overclock: Check = ({ cpu, motherboard }) =>
  cpu && motherboard && cpu.socket === motherboard.socket && isUnlocked(cpu) && !motherboard.canOverclock ? issue('info', 'noOverclock', { chipset: motherboard.chipset }) : []

const bios: Check = build => (isNewGenOnOlderChipset(build) ? issue('info', 'biosUpdate', { chipset: build.motherboard!.chipset }) : [])

const memorySize: Check = ({ memory }) => [
  ...(memory && memory.totalGb < MIN_RAM_GB ? issue('warning', 'lowRam', { gb: memory.totalGb }) : []),
  ...(memory && memory.sticks === 1 ? issue('warning', 'singleChannel') : [])
]

const vram: Check = ({ gpu }) => (gpu && gpu.vramGb <= LOW_VRAM_GB ? issue('info', 'lowVram', { gb: gpu.vramGb }) : [])

const CHECKS: Check[] = [socket, memoryType, formFactor, gpuFit, video, power, psuQuality, cooling, boardPower, memorySize, vram, overclock, bios, missing]

const RANK: Record<Issue['severity'], number> = { error: 0, warning: 1, info: 2 }

export function checkBuild(build: Build): Issue[] {
  return CHECKS.flatMap(check => check(build)).sort((a, b) => RANK[a.severity] - RANK[b.severity])
}

export const hasErrors = (issues: Issue[]): boolean => issues.some(i => i.severity === 'error')
