import { describe, expect, it } from 'vitest'
import { CATEGORIES } from '../labels'
import { DROPS as REAL_DROPS } from '../../data/mock'
import { makeChannel, makeDrop } from '../../test/fixtures'
import { LOCALES, type Drop, type Locale } from '../types'

/**
 * Metadata generation must hold for any drop, so it is exercised on fixtures.
 * The live catalogue is checked separately below, and is allowed to be empty
 * before launch.
 */
const DROPS: Drop[] = [
  makeDrop({
    slug: 'fixture-short',
    title: { en: 'Short Name', ja: '短い名前', 'zh-CN': '短名字', 'zh-TW': '短名字' },
    channels: [makeChannel({ id: 'f1' }), makeChannel({ id: 'f2', market: 'resale', stock: 'in-stock', askPrice: 90_000 })],
  }),
  makeDrop({
    slug: 'fixture-very-long-name',
    brand: 'A Brand With A Long Name Co.',
    title: {
      en: 'An Extremely Long Product Name That Would Otherwise Push The Brand Out Of The Visible Title',
      ja: '可視領域からブランド名を押し出してしまうほど非常に長い商品名',
      'zh-CN': '一个长到会把品牌名挤出可见区域的商品名称',
      'zh-TW': '一個長到會把品牌名擠出可見區域的商品名稱',
    },
  }),
]
import {
  DESCRIPTION_BUDGET,
  SITE_URL,
  TITLE_BUDGET,
  absolute,
  alternates,
  categoryHead,
  clamp,
  crowHead,
  dropHead,
  portalHead,
  visualWidth,
} from '../seo'

const heads = (locale: Locale) => [
  portalHead(locale, DROPS),
  ...CATEGORIES.map((c) => categoryHead(locale, c, DROPS.filter((d) => d.category === c))),
  ...DROPS.map((d) => dropHead(locale, d)),
]

describe('every page head', () => {
  it.each(LOCALES)('%s has a non-empty, unique title and description', (locale) => {
    const all = heads(locale)
    for (const head of all) {
      expect(head.title.trim()).not.toBe('')
      expect(head.description.trim()).not.toBe('')
      // No unfilled placeholders left behind.
      expect(head.title).not.toMatch(/\{\w+\}/)
      expect(head.description).not.toMatch(/\{\w+\}/)
    }
    const titles = all.map((h) => h.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it.each(LOCALES)('%s keeps titles and descriptions inside what search engines show', (locale) => {
    for (const head of heads(locale)) {
      expect(visualWidth(head.title), head.title).toBeLessThanOrEqual(TITLE_BUDGET)
      expect(visualWidth(head.description), head.description).toBeLessThanOrEqual(DESCRIPTION_BUDGET)
      // Still substantial enough to be worth showing.
      expect(visualWidth(head.description), head.description).toBeGreaterThanOrEqual(70)
    }
  })

  it('clamps on a word boundary and marks the cut', () => {
    expect(clamp('short', 40)).toBe('short')
    const cut = clamp('a very long english sentence that will not fit at all', 20)
    expect(visualWidth(cut)).toBeLessThanOrEqual(20)
    expect(cut.endsWith('…')).toBe(true)
    expect(cut).not.toMatch(/\s…$/)
  })

  it('counts a CJK glyph as two columns', () => {
    expect(visualWidth('abcd')).toBe(4)
    expect(visualWidth('限定')).toBe(4)
  })

  it('keeps the brand visible even behind a very long product name', () => {
    const longest = [...DROPS].sort((a, b) => b.title.en.length - a.title.en.length)[0]
    const head = dropHead('en', longest)
    expect(head.title).toContain(longest.brand)
    expect(head.title).toContain('HOWL')
  })

  it('is actually translated, not English everywhere', () => {
    const drop = DROPS[0]
    expect(dropHead('ja', drop).description).not.toBe(dropHead('en', drop).description)
    expect(categoryHead('zh-CN', 'tcg', DROPS).title).not.toBe(categoryHead('en', 'tcg', DROPS).title)
  })
})

describe('canonical and hreflang', () => {
  it('builds absolute URLs under one origin', () => {
    expect(absolute('ja', '/drop/x')).toBe(`${SITE_URL}/ja/drop/x`)
    expect(SITE_URL).toMatch(/^https:\/\//)
    expect(SITE_URL).not.toMatch(/\/$/)
  })

  it('offers every locale as an alternate, reciprocally', () => {
    const alts = alternates('/c/tcg')
    expect(alts.map((a) => a.locale).sort()).toEqual([...LOCALES].sort())
    for (const alt of alts) expect(alt.url).toContain('/c/tcg')
  })

  it('gives each page a canonical path that matches its route', () => {
    expect(portalHead('en', DROPS).path).toBe('')
    expect(categoryHead('en', 'figure', DROPS).path).toBe('/c/figure')
    expect(dropHead('en', DROPS[0]).path).toBe(`/drop/${DROPS[0].slug}`)
  })
})

describe('structured data', () => {
  it('describes a drop as a Product with one Offer per channel', () => {
    const drop = DROPS.find((d) => d.channels.length > 1)!
    const [product] = dropHead('en', drop).jsonLd as any[]
    expect(product['@type']).toBe('Product')
    expect(product.offers).toHaveLength(drop.channels.length)
    for (const offer of product.offers) {
      expect(offer.url).toMatch(/^https:\/\//)
      expect(offer.price).toBeGreaterThanOrEqual(0)
      expect(offer.priceCurrency).toBeTruthy()
      expect(offer.availability).toMatch(/^https:\/\/schema\.org\//)
      expect(Number.isFinite(new Date(offer.priceValidUntil).getTime())).toBe(true)
    }
  })

  it('reports in-stock only when a channel really has stock', () => {
    for (const drop of [...DROPS, ...REAL_DROPS]) {
      const [product] = dropHead('en', drop).jsonLd as any[]
      const claimed = product.offers[0].availability
      const stocked = drop.channels.some((c) => c.stock === 'in-stock' || c.stock === 'low')
      expect(claimed === 'https://schema.org/InStock').toBe(stocked)
    }
  })

  it('trails breadcrumbs from the portal down to the drop', () => {
    const drop = DROPS[0]
    const crumbs = (dropHead('en', drop).jsonLd as any[]).find((n) => n['@type'] === 'BreadcrumbList')
    expect(crumbs.itemListElement).toHaveLength(3)
    expect(crumbs.itemListElement.map((c: any) => c.position)).toEqual([1, 2, 3])
    expect(crumbs.itemListElement[2].item).toContain(drop.slug)
  })

  it('lists a category page’s drops as an ItemList', () => {
    const drops = DROPS.filter((d) => d.category === 'arttoy')
    const [page] = categoryHead('en', 'arttoy', drops).jsonLd as any[]
    expect(page['@type']).toBe('CollectionPage')
    expect(page.mainEntity.itemListElement).toHaveLength(drops.length)
  })

  it('emits valid JSON for every page in every locale', () => {
    for (const locale of LOCALES) {
      for (const head of heads(locale)) {
        expect(() => JSON.parse(JSON.stringify(head.jsonLd))).not.toThrow()
        expect(head.jsonLd.length).toBeGreaterThan(0)
        for (const node of head.jsonLd as any[]) {
          expect(node['@context']).toBe('https://schema.org')
          expect(node['@type']).toBeTruthy()
        }
      }
    }
  })
})


describe('the live catalogue', () => {
  it('may be empty before launch, but everything in it must produce valid metadata', () => {
    for (const locale of LOCALES) {
      for (const drop of REAL_DROPS) {
        const head = dropHead(locale, drop)
        expect(head.title.trim(), drop.slug).not.toBe('')
        expect(head.path).toBe(`/drop/${drop.slug}`)
        expect(head.jsonLd.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('crowHead', () => {
  it('leads the description with the counts, because the queue is the product', () => {
    const head = crowHead('en', 14, 5)
    expect(head.description).toContain('14')
    expect(head.description).toContain('5')
    expect(head.path).toBe('/crow')
  })

  it('falls back to the premise when nothing is open', () => {
    const head = crowHead('en', 0, 0)
    expect(head.description).not.toMatch(/^open now: 0/i)
  })

  it('stays inside the title and description budgets in every language', () => {
    for (const locale of LOCALES) {
      const head = crowHead(locale, 120, 40)
      expect(visualWidth(head.title)).toBeLessThanOrEqual(TITLE_BUDGET)
      expect(head.description.length).toBeLessThanOrEqual(DESCRIPTION_BUDGET)
    }
  })

  it('declares a CollectionPage and a breadcrumb trail', () => {
    const types = crowHead('ja', 3, 1).jsonLd.map((n) => (n as { '@type': string })['@type'])
    expect(types).toContain('CollectionPage')
    expect(types).toContain('BreadcrumbList')
  })
})
