import { describe, expect, it } from 'vitest'
import { bottleneck, bottleneckForBuild } from '../src/domain/bottleneck'
import { resolveBuild } from '../src/domain/build'
import { cpus, gpus, memories } from '../src/data/parts'

const cpu = (id: string) => cpus.find(c => c.id === id)!
const gpu = (id: string) => gpus.find(g => g.id === id)!

describe('bottleneck estimate', () => {
  it('shows a fast GPU held back by a budget CPU at 1080p', () => {
    const r = bottleneck(cpu('r5-5500'), gpu('rtx5080'), '1080p')
    expect(r.limitedBy).toBe('cpu')
    expect(r.strength).toBe('strong')
  })

  it('shows the same pair GPU-bound at 4K', () => {
    expect(bottleneck(cpu('r5-5500'), gpu('rtx5080'), '4K').limitedBy).toBe('gpu')
  })

  it('treats a matched mid-range pair as GPU-bound or balanced, not CPU-bound', () => {
    expect(bottleneck(cpu('i5-12400f'), gpu('rtx5060'), '1080p').limitedBy).not.toBe('cpu')
  })

  it('moves the load to the GPU as the resolution rises', () => {
    const results = bottleneckForBuild(resolveBuild({ cpu: 'r5-7500f', gpu: 'rtx5070ti' }))
    expect(results.map(r => r.resolution)).toEqual(['1080p', '1440p', '4K'])
    const gpuShare = results.map(r => r.cpuCapacity / r.gpuCapacity)
    expect([...gpuShare].sort((a, b) => a - b)).toEqual(gpuShare)
  })

  it('penalises 8GB cards at 1440p and single-channel memory', () => {
    const eight = bottleneck(cpu('r7-9800x3d'), gpu('rtx5060ti-8'), '1440p')
    const sixteen = bottleneck(cpu('r7-9800x3d'), gpu('rtx5060ti-16'), '1440p')
    expect(eight.gpuCapacity).toBeLessThan(sixteen.gpuCapacity * 0.9)
    const single = memories.find(m => m.sticks === 1)!
    expect(bottleneck(cpu('r5-7500f'), gpu('rtx5060'), '1080p', single).cpuCapacity).toBeLessThan(bottleneck(cpu('r5-7500f'), gpu('rtx5060'), '1080p').cpuCapacity)
  })

  it('needs both a CPU and a GPU', () => {
    expect(bottleneckForBuild(resolveBuild({ cpu: 'r5-7500f' }))).toEqual([])
  })

  it('keeps the percentage between 0 and 100', () => {
    cpus.forEach(c => gpus.forEach(g => {
      const r = bottleneck(c, g, '1440p')
      expect(r.percent).toBeGreaterThanOrEqual(0)
      expect(r.percent).toBeLessThan(100)
    }))
  })
})
