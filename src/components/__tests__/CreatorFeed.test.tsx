import { describe, expect, it } from 'vitest'
import { CreatorFeed } from '../CreatorFeed'
import { CATEGORY_MEDIA } from '../../data/creators'
import { renderApp } from '../../test/render'

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

  it('flames the top two rows only', () => {
    const { container } = renderApp(<CreatorFeed category="sneakers" />)
    const flamed = rows(container).map((r) => (r.textContent ?? '').includes('🔥'))
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
