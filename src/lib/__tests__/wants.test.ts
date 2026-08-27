import { describe, expect, it } from 'vitest'
import { WANTS } from '../../data/wants'
import { CATEGORIES } from '../labels'
import { findDuplicate, normalizeName, sortWants, validateWant, type Want } from '../wants'

const want = (over: Partial<Want> = {}): Want => ({
  id: 'w',
  name: 'thing',
  category: 'tcg',
  count: 1,
  firstAskedAt: '2026-01-01T00:00:00.000Z',
  lastAskedAt: '2026-01-01T00:00:00.000Z',
  ...over,
})

describe('sortWants', () => {
  it('ranks by how many people asked', () => {
    const list = [want({ id: 'a', count: 3 }), want({ id: 'b', count: 12 })]
    expect(sortWants(list, 'count').map((w) => w.id)).toEqual(['b', 'a'])
  })

  it('breaks a tie with the most recent vote', () => {
    const list = [
      want({ id: 'old', count: 5, lastAskedAt: '2026-01-01T00:00:00.000Z' }),
      want({ id: 'new', count: 5, lastAskedAt: '2026-02-01T00:00:00.000Z' }),
    ]
    expect(sortWants(list, 'count')[0].id).toBe('new')
  })

  it('ranks by recency when asked to', () => {
    const list = [
      want({ id: 'popular', count: 900, lastAskedAt: '2026-01-01T00:00:00.000Z' }),
      want({ id: 'fresh', count: 1, lastAskedAt: '2026-03-01T00:00:00.000Z' }),
    ]
    expect(sortWants(list, 'recent')[0].id).toBe('fresh')
  })

  it('does not mutate the input', () => {
    const list = [want({ id: 'a', count: 1 }), want({ id: 'b', count: 9 })]
    sortWants(list, 'count')
    expect(list.map((w) => w.id)).toEqual(['a', 'b'])
  })
})

describe('duplicate collapsing', () => {
  it('ignores spacing, case and punctuation', () => {
    expect(normalizeName('Pokémon Card 151 UPC')).toBe(normalizeName('pokémon　card151-upc'))
    expect(normalizeName('ワンピース カード')).toBe(normalizeName('ワンピースカード'))
  })

  it('folds full-width characters onto half-width', () => {
    expect(normalizeName('ＵＰＣ')).toBe(normalizeName('UPC'))
  })

  it('finds an existing request so a second ask becomes a vote', () => {
    const list = [want({ id: 'x', name: 'Bearbrick 1000% KAWS' })]
    expect(findDuplicate(list, 'bearbrick 1000%  kaws')?.id).toBe('x')
  })

  it('does not collapse genuinely different requests', () => {
    const list = [want({ id: 'x', name: 'Nendoroid Yor' })]
    expect(findDuplicate(list, 'Nendoroid Anya')).toBeUndefined()
  })

  it('treats an empty name as no match rather than matching everything', () => {
    expect(findDuplicate([want({ name: '' })], '   ')).toBeUndefined()
  })
})

describe('validateWant', () => {
  it('rejects something too short to be a product', () => {
    expect(validateWant('x').ok).toBe(false)
  })

  it('rejects a wall of text', () => {
    expect(validateWant('x'.repeat(200)).ok).toBe(false)
  })

  it('rejects links — that is what spam looks like here', () => {
    expect(validateWant('buy now https://spam.example').ok).toBe(false)
  })

  it('accepts a real request', () => {
    expect(validateWant('ポケモンカード151 UPC 再販').ok).toBe(true)
  })
})

describe('seeded wantlist', () => {
  it('has unique ids', () => {
    const ids = WANTS.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no duplicates under normalisation', () => {
    const keys = WANTS.map((w) => normalizeName(w.name))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('only uses declared categories, and covers every one', () => {
    for (const w of WANTS) expect(CATEGORIES).toContain(w.category)
    for (const c of CATEGORIES) {
      expect(WANTS.some((w) => w.category === c), `no seed request for ${c}`).toBe(true)
    }
  })

  it('is dated in the past, with the last ask no earlier than the first', () => {
    const now = Date.now()
    for (const w of WANTS) {
      const first = new Date(w.firstAskedAt).getTime()
      const last = new Date(w.lastAskedAt).getTime()
      expect(first).toBeLessThanOrEqual(now)
      expect(last).toBeGreaterThanOrEqual(first)
    }
  })

  it('every seeded request would pass its own validation', () => {
    for (const w of WANTS) expect(validateWant(w.name), w.name).toMatchObject({ ok: true })
  })
})
