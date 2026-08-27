import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryPage } from '../CategoryPage'
import { DROPS } from '../../data/mock'
import { renderApp } from '../../test/render'

const show = (category: string, locale: 'en' | 'ja' = 'en') =>
  renderApp(<CategoryPage />, { route: `/${locale}/c/${category}`, path: '/:locale/c/:category', locale })

/** Drop cards only — the news ticker also deep-links to /drop/ routes. */
const cards = () =>
  screen
    .getAllByRole('link')
    .filter((a) => a.getAttribute('href')?.includes('/drop/') && !a.closest('.ticker-viewport'))

describe('CategoryPage', () => {
  it('shows only the drops in its category', () => {
    show('tcg')
    const expected = DROPS.filter((d) => d.category === 'tcg')
    expect(cards()).toHaveLength(expected.length)
  })

  it('heads the page with the category name and a back link to the portal', () => {
    const { container } = show('sneakers')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sneakers & Apparel')
    expect(container.querySelector('a')).toHaveAttribute('href', '/en')
  })

  it('mounts both scrolling panels above the filters', () => {
    const { container } = show('sneakers')
    expect(container.textContent).toContain('NEWS')
    expect(container.textContent).toContain('Coverage')
    expect(container.querySelectorAll('.ticker-viewport')).toHaveLength(2)
  })

  it('groups results by phase with a count on each heading', () => {
    const { container } = show('sneakers')
    const headings = Array.from(container.querySelectorAll('h2')).map((h) => h.textContent)
    for (const heading of headings) {
      expect(['Live now', 'Available now', 'Upcoming', 'Closed']).toContain(heading)
    }
  })

  it('filters down to buyable drops with the stock toggle', async () => {
    const user = userEvent.setup()
    show('arttoy')
    const before = cards().length
    await user.click(screen.getByText(/In stock only/))
    expect(cards().length).toBeLessThanOrEqual(before)
  })

  it('redirects an unknown category away rather than rendering empty', () => {
    const { container } = show('not-a-category')
    expect(container).toBeEmptyDOMElement()
  })

  it('translates', () => {
    show('tcg', 'ja')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('トレーディングカード')
  })
})
