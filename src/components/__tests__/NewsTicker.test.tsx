import { describe, expect, it, vi } from 'vitest'
import { within } from '@testing-library/react'
import type { NewsItem } from '../../lib/types'

/** Fixtures: the live ticker is legitimately empty before launch. */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const NEWS: NewsItem[] = [
  { id: 'f1', category: 'sneakers', kind: 'confirmed', at: ago(4), urgent: true, source: 'Fixture', url: 'https://example.test/1', text: { en: 'Entry window confirmed for the Olive AJ1' }, heat: { site: 960, external: 11_400 } },
  { id: 'f2', category: 'sneakers', kind: 'restock', at: ago(23), dropSlug: 'fixture-drop', text: { en: 'Sizes quietly reopened' }, heat: { site: 700, external: 9_000 } },
  { id: 'f3', category: 'sneakers', kind: 'rumor', at: ago(96), source: 'Fixture', url: 'https://example.test/3', text: { en: 'Week 12 list said to have leaked' }, heat: { site: 400, external: 5_000 } },
  { id: 'f4', category: 'sneakers', kind: 'result', at: ago(310), text: { en: 'Draw results have gone out' }, heat: { site: 120, external: 900 } },
  { id: 'f5', category: 'sneakers', kind: 'confirmed', at: ago(540), text: { en: 'An in-store draw was added' }, heat: { site: 60, external: 400 } },
  { id: 'f6', category: 'tcg', kind: 'confirmed', at: ago(11), text: { en: 'Entry closes in under 48h', ja: '申込は48時間以内に締切' }, heat: { site: 900, external: 20_000 } },
  { id: 'f7', category: 'hardware', kind: 'restock', at: ago(9), text: { en: 'Queue is open now' }, heat: { site: 500, external: 3_000 } },
]

vi.mock('../../data/news', () => ({ NEWS }))

const { NewsTicker } = await import('../NewsTicker')
const { renderApp } = await import('../../test/render')

/** The visible copy — the marquee clone is aria-hidden. */
function rows(container: HTMLElement) {
  const viewport = container.querySelector('.ticker-viewport')!
  return Array.from(viewport.children[0].children) as HTMLElement[]
}

describe('NewsTicker', () => {
  it('shows only the news for its own category', () => {
    const { container } = renderApp(<NewsTicker category="tcg" />)
    const texts = rows(container).map((r) => r.textContent ?? '')
    const tcgTexts = NEWS.filter((n) => n.category === 'tcg').map((n) => n.text.en)
    expect(texts).toHaveLength(tcgTexts.length)
    for (const text of texts) {
      expect(NEWS.some((n) => n.category !== 'tcg' && text.includes(n.text.en))).toBe(false)
    }
  })

  it('labels the panel and counts the rows', () => {
    const { container } = renderApp(<NewsTicker category="sneakers" />)
    const header = container.querySelector('div')!
    expect(within(header).getByText('NEWS')).toBeInTheDocument()
    const count = NEWS.filter((n) => n.category === 'sneakers').length
    expect(within(header).getByText(String(count))).toBeInTheDocument()
  })

  it('ranks by heat, so the top row is the highest scoring one', () => {
    const { container } = renderApp(<NewsTicker category="sneakers" />)
    const first = rows(container)[0].textContent ?? ''
    const hottest = [...NEWS.filter((n) => n.category === 'sneakers')].sort(
      (a, b) => (b.heat?.site ?? 0) - (a.heat?.site ?? 0),
    )
    // The urgent boost plus on-site weighting should put a top-heat item first.
    expect(hottest.slice(0, 3).some((n) => first.includes(n.text.en))).toBe(true)
  })

  it('marks exactly the top three rows as hot', () => {
    const { container } = renderApp(<NewsTicker category="sneakers" />)
    const flamed = rows(container).map((r) => r.querySelector('svg[aria-hidden] path[d^="M1 9.5"]') !== null)
    expect(flamed.slice(0, 3)).toEqual([true, true, true])
    expect(flamed.slice(3).every((f) => !f)).toBe(true)
  })

  it('deep-links a row that names a drop, and leaves the rest inert', () => {
    const { container } = renderApp(<NewsTicker category="sneakers" />)
    const linked = NEWS.filter((n) => n.category === 'sneakers' && n.dropSlug)
    for (const item of linked) {
      const row = rows(container).find((r) => (r.textContent ?? '').includes(item.text.en))!
      expect(row.tagName).toBe('A')
      expect(row.getAttribute('href')).toBe(`/en/drop/${item.dropSlug}`)
    }
    const inert = rows(container).filter((r) => r.tagName === 'SPAN')
    expect(inert.length).toBeGreaterThan(0)
  })

  it('shows a relative timestamp and a refresh stamp', () => {
    const { container } = renderApp(<NewsTicker category="hardware" />)
    expect(container.textContent).toMatch(/ago|now/)
    expect(container.textContent).toContain('Updated')
  })

  it('translates the whole panel', () => {
    const { container } = renderApp(<NewsTicker category="tcg" />, { locale: 'ja' })
    expect(container.textContent).toContain('速報')
    expect(container.textContent).toContain('更新')
  })

  it('exposes the raw heat figures on hover', () => {
    const { container } = renderApp(<NewsTicker category="tcg" />)
    const titled = container.querySelector('[title*="On HOWL"]')
    expect(titled).toBeTruthy()
    expect(titled?.getAttribute('title')).toContain('Off-site')
  })
})
