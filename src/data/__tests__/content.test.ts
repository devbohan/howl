import { describe, expect, it } from 'vitest'
import { CATEGORY_MEDIA } from '../creators'
import { DROPS } from '../mock'
import { NEWS } from '../news'
import { DICT } from '../../lib/i18n'
import { CATEGORIES, MECHANICS, PLATFORM_LABEL, REGIONS } from '../../lib/labels'
import { LOCALES, type L } from '../../lib/types'

const ALL_MEDIA = [...DROPS.flatMap((d) => d.media ?? []), ...Object.values(CATEGORY_MEDIA).flat()]
const ALL_L: [string, L][] = [
  ...DROPS.flatMap((d): [string, L][] => [
    [`${d.slug}.title`, d.title],
    ...(d.subtitle ? ([[`${d.slug}.subtitle`, d.subtitle]] as [string, L][]) : []),
    ...(d.dutyNote ? ([[`${d.slug}.dutyNote`, d.dutyNote]] as [string, L][]) : []),
    ...d.frictionNotes.map((n, i): [string, L] => [`${d.slug}.frictionNotes[${i}]`, n]),
    ...d.channels.flatMap((c): [string, L][] => (c.note ? [[`${d.slug}.${c.id}.note`, c.note]] : [])),
  ]),
  ...NEWS.map((n): [string, L] => [`news.${n.id}`, n.text]),
  ...ALL_MEDIA.map((m): [string, L] => [`media.${m.id}`, m.title]),
]

const duplicates = (values: string[]) => values.filter((v, i) => values.indexOf(v) !== i)

describe('drops', () => {
  it('has unique ids and slugs', () => {
    expect(duplicates(DROPS.map((d) => d.id))).toEqual([])
    expect(duplicates(DROPS.map((d) => d.slug))).toEqual([])
  })

  it('uses url-safe slugs', () => {
    for (const d of DROPS) expect(d.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('only uses declared categories, regions and mechanics', () => {
    for (const d of DROPS) {
      expect(CATEGORIES).toContain(d.category)
      expect(REGIONS).toContain(d.region)
      expect(MECHANICS).toContain(d.mechanic)
      for (const c of d.channels) expect(REGIONS).toContain(c.region)
    }
  })

  it('has a coherent timeline: opens before closes before release', () => {
    for (const d of DROPS) {
      const opens = new Date(d.opensAt).getTime()
      expect(Number.isFinite(opens)).toBe(true)
      if (d.closesAt) expect(new Date(d.closesAt).getTime()).toBeGreaterThan(opens)
      if (d.releaseAt && d.closesAt) {
        expect(new Date(d.releaseAt).getTime()).toBeGreaterThanOrEqual(new Date(d.closesAt).getTime())
      }
    }
  })

  it('gives every drop at least one channel and one friction note', () => {
    for (const d of DROPS) {
      expect(d.channels.length).toBeGreaterThan(0)
      expect(d.frictionNotes.length).toBeGreaterThan(0)
    }
  })

  it('keeps channel ids unique across the whole dataset', () => {
    expect(duplicates(DROPS.flatMap((d) => d.channels.map((c) => c.id)))).toEqual([])
  })

  it('never prices a drop negatively', () => {
    for (const d of DROPS) {
      expect(d.price).toBeGreaterThanOrEqual(0)
      for (const c of d.channels) if (c.askPrice !== undefined) expect(c.askPrice).toBeGreaterThan(0)
    }
  })

  it('only quotes an ask price on a channel that reports stock', () => {
    for (const d of DROPS) {
      for (const c of d.channels) {
        if (c.askPrice !== undefined) expect(c.stock).toBeDefined()
      }
    }
  })

  it('supplies gradient art for every card', () => {
    for (const d of DROPS) {
      expect(d.art.from).toMatch(/^#[0-9a-f]{3,8}$/i)
      expect(d.art.to).toMatch(/^#[0-9a-f]{3,8}$/i)
    }
  })
})

describe('news', () => {
  it('has unique ids', () => {
    expect(duplicates(NEWS.map((n) => n.id))).toEqual([])
  })

  it('covers every category so no ticker is ever empty', () => {
    for (const c of CATEGORIES) {
      expect(NEWS.filter((n) => n.category === c).length).toBeGreaterThan(0)
    }
  })

  it('is dated in the past — a ticker never shows tomorrow', () => {
    const now = Date.now()
    for (const n of NEWS) expect(new Date(n.at).getTime()).toBeLessThanOrEqual(now)
  })

  it('only deep-links to drops that exist', () => {
    const slugs = new Set(DROPS.map((d) => d.slug))
    for (const n of NEWS) if (n.dropSlug) expect(slugs).toContain(n.dropSlug)
  })

  it('carries both heat signals wherever heat is present', () => {
    for (const n of NEWS) {
      if (!n.heat) continue
      expect(n.heat.site).toBeGreaterThanOrEqual(0)
      expect(n.heat.external).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('media links', () => {
  it('has unique ids across drop-level and category-level coverage', () => {
    expect(duplicates(ALL_MEDIA.map((m) => m.id))).toEqual([])
  })

  it('covers every category in the creator feed', () => {
    for (const c of CATEGORIES) expect(CATEGORY_MEDIA[c].length).toBeGreaterThan(0)
  })

  it('uses absolute https urls', () => {
    for (const m of ALL_MEDIA) expect(m.url).toMatch(/^https:\/\//)
  })

  it('declares a known platform and a supported content language', () => {
    for (const m of ALL_MEDIA) {
      expect(PLATFORM_LABEL[m.platform]).toBeTruthy()
      expect(LOCALES).toContain(m.lang)
    }
  })

  it('only puts a duration on a video', () => {
    for (const m of ALL_MEDIA) {
      if (m.duration) expect(m.kind).toBe('video')
      if (m.kind === 'video') expect(m.duration).toMatch(/^\d{1,2}:\d{2}$/)
    }
  })

  it('marks at most one featured pick per category feed', () => {
    for (const c of CATEGORIES) {
      expect(CATEGORY_MEDIA[c].filter((m) => m.featured).length).toBeLessThanOrEqual(1)
    }
  })
})

describe('localised content', () => {
  it('always has an English fallback', () => {
    for (const [where, value] of ALL_L) {
      expect(value.en, `${where} is missing en`).toBeTruthy()
    }
  })

  it('is translated into all four locales', () => {
    const missing = ALL_L.flatMap(([where, value]) =>
      LOCALES.filter((l) => !value[l]?.trim()).map((l) => `${where}:${l}`),
    )
    expect(missing).toEqual([])
  })

  it('does not leave raw dictionary keys in content', () => {
    const keys = new Set(Object.keys(DICT.en))
    for (const [, value] of ALL_L) {
      for (const l of LOCALES) expect(keys.has(value[l] ?? '')).toBe(false)
    }
  })
})
