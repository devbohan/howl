import { describe, expect, it } from 'vitest'
import { MAX_FEED_ITEMS, formatCount, rankFeed } from '../feed'

interface Row {
  id: string
  heat?: { site: number; external: number }
  urgent?: boolean
  featured?: boolean
}

const ids = (rows: { item: Row }[]) => rows.map((r) => r.item.id)

describe('rankFeed', () => {
  it('returns an empty list unchanged', () => {
    expect(rankFeed<Row>([])).toEqual([])
  })

  it('ranks higher combined heat first', () => {
    const ranked = rankFeed<Row>([
      { id: 'cold', heat: { site: 10, external: 100 } },
      { id: 'hot', heat: { site: 5000, external: 900_000 } },
      { id: 'mid', heat: { site: 400, external: 20_000 } },
    ])
    expect(ids(ranked)).toEqual(['hot', 'mid', 'cold'])
  })

  it('weights on-site engagement above off-site reach', () => {
    // Same shape of gap on each axis: the on-site leader must win.
    const ranked = rankFeed<Row>([
      { id: 'site-heavy', heat: { site: 10_000, external: 1_000 } },
      { id: 'reach-heavy', heat: { site: 1_000, external: 10_000 } },
    ])
    expect(ids(ranked)[0]).toBe('site-heavy')
  })

  it('treats missing heat as zero rather than dropping the row', () => {
    const ranked = rankFeed<Row>([{ id: 'known', heat: { site: 100, external: 100 } }, { id: 'unknown' }])
    expect(ids(ranked)).toEqual(['known', 'unknown'])
    expect(ranked).toHaveLength(2)
  })

  it('boosts urgent items without pinning them absolutely', () => {
    const overtaken = rankFeed<Row>([
      { id: 'urgent-cold', urgent: true, heat: { site: 1, external: 1 } },
      { id: 'quiet-hot', heat: { site: 50_000, external: 5_000_000 } },
    ])
    // The 0.35 boost is smaller than a full-scale lead on both axes.
    expect(ids(overtaken)[0]).toBe('quiet-hot')

    const leading = rankFeed<Row>([
      { id: 'urgent', urgent: true, heat: { site: 900, external: 90_000 } },
      { id: 'plain', heat: { site: 1_000, external: 100_000 } },
    ])
    expect(ids(leading)[0]).toBe('urgent')
  })

  it('boosts featured items', () => {
    const ranked = rankFeed<Row>([
      { id: 'plain', heat: { site: 500, external: 50_000 } },
      { id: 'pick', featured: true, heat: { site: 500, external: 50_000 } },
    ])
    expect(ids(ranked)[0]).toBe('pick')
  })

  it('compares logarithmically so one huge outlier cannot flatten the rest', () => {
    const ranked = rankFeed<Row>([
      { id: 'outlier', heat: { site: 1, external: 50_000_000 } },
      { id: 'balanced', heat: { site: 900, external: 40_000 } },
    ])
    // Under linear normalisation the outlier's external score would be ~1.0 and
    // it would win outright; on a log scale the on-site lead still decides it.
    expect(ids(ranked)[0]).toBe('balanced')
  })

  it('caps the list at 50 by default', () => {
    const many = Array.from({ length: 120 }, (_, i) => ({
      id: `r${i}`,
      heat: { site: i, external: i * 10 },
    }))
    const ranked = rankFeed(many)
    expect(ranked).toHaveLength(MAX_FEED_ITEMS)
    expect(MAX_FEED_ITEMS).toBe(50)
    // Truncation keeps the hottest, not the first-declared.
    expect(ranked[0].item.id).toBe('r119')
  })

  it('honours an explicit smaller limit', () => {
    const many: Row[] = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}` }))
    expect(rankFeed(many, 3)).toHaveLength(3)
  })

  it('does not mutate the input array', () => {
    const input: Row[] = [
      { id: 'a', heat: { site: 1, external: 1 } },
      { id: 'b', heat: { site: 900, external: 900 } },
    ]
    const snapshot = input.map((r) => r.id)
    rankFeed(input)
    expect(input.map((r) => r.id)).toEqual(snapshot)
  })

  it('scores everything finitely even when every row has zero heat', () => {
    const ranked = rankFeed<Row>([{ id: 'a' }, { id: 'b' }])
    expect(ranked.every((r) => Number.isFinite(r.score))).toBe(true)
  })
})

describe('formatCount', () => {
  it('compacts large numbers', () => {
    expect(formatCount(18_200, 'en')).toBe('18.2K')
    expect(formatCount(2_400_000, 'en')).toBe('2.4M')
  })

  it('leaves small numbers readable', () => {
    expect(formatCount(940, 'en')).toBe('940')
  })

  it('localises the compact suffix', () => {
    expect(formatCount(20_000, 'ja')).toContain('万')
  })
})
