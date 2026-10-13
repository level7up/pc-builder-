import { describe, expect, it } from 'vitest'
import { idsFromQuery, idsToQuery, storeFromQuery } from '../src/domain/share'
import { PRESETS } from '../src/domain/presets'

describe('share links', () => {
  it.each(PRESETS.map(p => [p.id, p.ids] as const))('round-trips the %s build', (_id, ids) => {
    expect(idsFromQuery(idsToQuery(ids))).toEqual(ids)
  })

  it('ignores parts that do not exist', () => {
    expect(idsFromQuery('?cpu=r5-7500f&gpu=<script>&ram=x')).toEqual({ cpu: 'r5-7500f' })
  })

  it('carries the chosen store, and only a known one', () => {
    const query = idsToQuery({ cpu: 'r5-7500f' }, 'sigma')
    expect(query).toBe('cpu=r5-7500f&store=sigma')
    expect(storeFromQuery(query)).toBe('sigma')
    expect(idsFromQuery(query)).toEqual({ cpu: 'r5-7500f' })
    expect(storeFromQuery('?cpu=r5-7500f&store=evil')).toBeUndefined()
    expect(storeFromQuery('?cpu=r5-7500f')).toBeUndefined()
  })
})
