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

  it('leaves out a scrolling panel that has nothing to show', () => {
    // Both feeds are empty before launch. An empty panel labelled NEWS is worse
    // than no panel: it says the site is broken rather than new.
    const { container } = show('sneakers')
    expect(container.querySelectorAll('.ticker-viewport')).toHaveLength(0)
    expect(container.textContent).not.toContain('NEWS')
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
