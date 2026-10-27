import { describe, expect, it } from 'vitest'
import { bar, createProgress, formatDuration, remainingMs, storeLine, totalLine } from '../scripts/lib/progress.mjs'

const state = (patch = {}) => ({ name: 'Compumarts', done: 0, total: 100, matched: 0, errors: 0, startedAt: 0, ...patch })

const fakeStream = (isTTY: boolean) => {
  const chunks: string[] = []
  return { isTTY, chunks, write: (text: string) => { chunks.push(text); return true } }
}

describe('scrape progress', () => {
  it('formats durations as minutes and seconds', () => {
    expect(formatDuration(5_000)).toBe('5s')
    expect(formatDuration(65_000)).toBe('1m 05s')
    expect(formatDuration(3_725_000)).toBe('62m 05s')
  })

  it('draws a bar of fixed width', () => {
    expect(bar(0, 10)).toBe('░'.repeat(10))
    expect(bar(0.5, 10)).toBe('█'.repeat(5) + '░'.repeat(5))
    expect(bar(1.4, 10)).toBe('█'.repeat(10))
  })

  it('estimates the time left from the pace so far', () => {
    expect(remainingMs(state({ done: 0 }), 10_000)).toBeUndefined()
    expect(remainingMs(state({ done: 25 }), 10_000)).toBe(30_000)
    expect(remainingMs(state({ done: 100, finishedAt: 9_000 }), 10_000)).toBe(0)
  })

  it('shows count, percentage, matches, errors and time left for a running store', () => {
    const line = storeLine(state({ done: 25, matched: 20, errors: 2 }), 10_000)
    expect(line).toContain('Compumarts')
    expect(line).toContain('25/100')
    expect(line).toContain('25%')
    expect(line).toContain('20 matched')
    expect(line).toContain('2 errors')
    expect(line).toContain('~30s left')
  })

  it('names the stage a store is in after matching', () => {
    const counting = storeLine(state({ stage: 'stock counts', done: 50, total: 200 }), 50_000)
    expect(counting).toContain('50/200  25%')
    expect(counting).toContain('stock counts, ~2m 30s left')
  })

  it('marks a finished store with its duration, or as failed', () => {
    expect(storeLine(state({ done: 100, matched: 60, finishedAt: 65_000 }), 70_000)).toContain('done in 1m 05s')
    expect(storeLine(state({ done: 100, errors: 100, finishedAt: 5_000, failed: true }), 6_000)).toContain('failed, keeping old prices')
  })

  it('totals all stores and takes the slowest store as the time left', () => {
    const line = totalLine([state({ done: 50 }), state({ name: 'Sigma', done: 25 })], 10_000)
    expect(line).toContain('75/200')
    expect(line).toContain('38%')
    expect(line).toContain('10s elapsed')
    expect(line).toContain('~30s left')
  })

  it('redraws the same block in a terminal', () => {
    let clock = 0
    const out = fakeStream(true)
    const progress = createProgress([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], 10, { out, now: () => clock, throttleMs: 0 })
    clock = 1_000
    progress.update('a', { done: 1, matched: 1 })
    progress.stop()
    const redraws = out.chunks.filter(chunk => chunk.includes('\x1b[3F'))
    expect(redraws.length).toBeGreaterThan(0)
    expect(out.chunks.join('')).toContain('1/10')
  })

  it('prints a line per quarter and at the end when not in a terminal', () => {
    let clock = 0
    const out = fakeStream(false)
    const progress = createProgress([{ id: 'a', name: 'A' }], 8, { out, now: () => clock })
    for (let done = 1; done <= 8; done += 1) {
      clock = done * 1_000
      progress.update('a', { done, matched: done })
    }
    progress.update('a', { finishedAt: clock })
    progress.stop()
    const text = out.chunks.join('')
    expect(text).not.toContain('\x1b[')
    expect(text).toContain('2/8')
    expect(text).toContain('4/8')
    expect(text).toContain('6/8')
    expect(text).toContain('done in 8s')
    expect(text).not.toContain('3/8')
  })
})
