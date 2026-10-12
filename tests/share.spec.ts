import { describe, expect, it } from 'vitest'
import { idsFromQuery, idsToQuery } from '../src/domain/share'
import { PRESETS } from '../src/domain/presets'

describe('share links', () => {
  it.each(PRESETS.map(p => [p.id, p.ids] as const))('round-trips the %s build', (_id, ids) => {
    expect(idsFromQuery(idsToQuery(ids))).toEqual(ids)
  })

  it('ignores parts that do not exist', () => {
    expect(idsFromQuery('?cpu=r5-7500f&gpu=<script>&ram=x')).toEqual({ cpu: 'r5-7500f' })
  })
})
