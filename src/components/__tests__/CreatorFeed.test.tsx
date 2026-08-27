import { describe, expect, it, vi } from 'vitest'
import type { Category, MediaLink } from '../../lib/types'

const media = (over: Partial<MediaLink>): MediaLink => ({
  id: 'm',
  kind: 'video',
  platform: 'youtube',
  source: '@fixture',
  title: { en: 'A fixture video', 'zh-CN': '一个夹具视频' },
  url: 'https://example.test/v',
  lang: 'en',
  ...over,
})

/** Fixtures: the live feed is legitimately empty before launch. */
const CATEGORY_MEDIA: Record<Category, MediaLink[]> = {
  sneakers: [
    media({ id: 's1', source: '@kicksdaily', audience: '1.2M', duration: '11:48', featured: true, title: { en: 'How raffles really allocate', 'zh-CN': '用六年抽选数据反推中签逻辑' }, heat: { site: 2980, external: 827_000 } }),
    media({ id: 's2', source: '@atmos_tokyo_ch', lang: 'ja', audience: '38.4万', duration: '14:20', heat: { site: 900, external: 300_000 } }),
    media({ id: 's3', kind: 'article', platform: 'web', source: 'Fixture Press', heat: { site: 200, external: 50_000 } }),
  ],
  tcg: [media({ id: 't1', source: '@ptcg', heat: { site: 500, external: 100_000 } })],
  figure: [media({ id: 'g1', source: '@figures', heat: { site: 100, external: 20_000 } })],
  arttoy: [
    media({ id: 'a1', source: '@toys', heat: { site: 300, external: 60_000 } }),
    media({ id: 'a2', source: '@toys2', heat: { site: 100, external: 10_000 } }),
  ],
  goods: [media({ id: 'o1', source: '@goods', heat: { site: 90, external: 9_000 } })],
  hardware: [media({ id: 'h1', source: '@hw', heat: { site: 80, external: 8_000 } })],
}

vi.mock('../../data/creators', () => ({ CATEGORY_MEDIA }))

const { CreatorFeed } = await import('../CreatorFeed')
const { renderApp } = await import('../../test/render')

function rows(container: HTMLElement) {
  const viewport = container.querySelector('.ticker-viewport')!
  return Array.from(viewport.children[0].children) as HTMLElement[]
}

describe('CreatorFeed', () => {
  it('lists the coverage for its own category', () => {
    const { container } = renderApp(<CreatorFeed category="arttoy" />)
    expect(rows(container)).toHaveLength(CATEGORY_MEDIA.arttoy.length)
  })

  it('opens every link in a new tab without leaking referrer or link equity', () => {
    const { container } = renderApp(<CreatorFeed category="sneakers" />)
    for (const row of rows(container)) {
      expect(row.tagName).toBe('A')
      expect(row.getAttribute('target')).toBe('_blank')
      expect(row.getAttribute('rel')).toContain('noopener')
      expect(row.getAttribute('rel')).toContain('noreferrer')
      expect(row.getAttribute('rel')).toContain('nofollow')
    }
  })

  it('shows platform, source and audience on each row', () => {
    const { container } = renderApp(<CreatorFeed category="sneakers" />)
    const text = container.textContent ?? ''
    expect(text).toContain('YouTube')
    expect(text).toContain('@kicksdaily')
    expect(text).toContain('1.2M')
  })

  it('marks the top two rows as hot only', () => {
    const { container } = renderApp(<CreatorFeed category="sneakers" />)
    const flamed = rows(container).map((r) => r.querySelector('svg[aria-hidden] path[d^="M1 9.5"]') !== null)
    expect(flamed.slice(0, 2)).toEqual([true, true])
    expect(flamed.slice(2).every((f) => !f)).toBe(true)
  })

  it('tags a row only when its language differs from the site language', () => {
    const { container: en } = renderApp(<CreatorFeed category="sneakers" />, { locale: 'en' })
    const enRows = rows(en)
    const englishRow = enRows.find((r) => (r.textContent ?? '').includes('@kicksdaily'))!
    expect(englishRow.textContent).not.toContain('EN')

    const { container: ja } = renderApp(<CreatorFeed category="sneakers" />, { locale: 'ja' })
    const sameRow = rows(ja).find((r) => (r.textContent ?? '').includes('@kicksdaily'))!
    expect(sameRow.textContent).toContain('EN')
  })

  it('shows the localised title for the reader, not the original', () => {
    const { container } = renderApp(<CreatorFeed category="sneakers" />, { locale: 'zh-CN' })
    expect(container.textContent).toContain('用六年抽选数据反推中签逻辑')
  })

  it('renders nothing for a category with no coverage', () => {
    const original = CATEGORY_MEDIA.goods
    try {
      CATEGORY_MEDIA.goods = []
      const { container } = renderApp(<CreatorFeed category="goods" />)
      expect(container).toBeEmptyDOMElement()
    } finally {
      CATEGORY_MEDIA.goods = original
    }
  })
})
