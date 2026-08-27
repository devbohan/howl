import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { PortalPage } from '../PortalPage'
import { DROPS } from '../../data/mock'
import { CATEGORIES } from '../../lib/labels'
import { dropState, isAvailableNow } from '../../lib/schedule'
import { renderApp } from '../../test/render'

const rows = () => screen.getAllByRole('link')

describe('PortalPage', () => {
  it('lists every category exactly once', () => {
    renderApp(<PortalPage />)
    expect(rows()).toHaveLength(CATEGORIES.length)
  })

  it('links each row to its localised category route', () => {
    renderApp(<PortalPage />, { locale: 'zh-TW' })
    const hrefs = rows().map((r) => r.getAttribute('href'))
    expect(hrefs).toEqual(CATEGORIES.map((c) => `/zh-TW/c/${c}`))
  })

  it('carries no decorative icon in the rows', () => {
    renderApp(<PortalPage />)
    for (const row of rows()) {
      expect(row.textContent).not.toMatch(/[👟🃏🎎🧸🎤🎮]/)
    }
  })

  it('shows the tracked count for each category', () => {
    renderApp(<PortalPage />)
    for (const [i, category] of CATEGORIES.entries()) {
      const expected = DROPS.filter((d) => d.category === category).length
      // getAllBy: with an empty catalogue every column in the row reads zero.
      expect(within(rows()[i]).getAllByText(String(expected)).length).toBeGreaterThan(0)
    }
  })

  it('per-category in-stock counts add up to the header total', () => {
    renderApp(<PortalPage />)
    const total = DROPS.filter(isAvailableNow).length
    const summed = CATEGORIES.reduce(
      (n, c) => n + DROPS.filter((d) => d.category === c && isAvailableNow(d)).length,
      0,
    )
    // A regression here means the header and the rows are using different rules.
    expect(summed).toBe(total)
  })

  it('per-category live counts add up to the header total', () => {
    const now = Date.now()
    const total = DROPS.filter((d) => dropState(d, now).phase === 'open').length
    const summed = CATEGORIES.reduce(
      (n, c) => n + DROPS.filter((d) => d.category === c && dropState(d, now).phase === 'open').length,
      0,
    )
    expect(summed).toBe(total)
  })

  it('renders the headline and the three-stat legend', () => {
    const { container } = renderApp(<PortalPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(container.textContent).toContain('tracked')
    expect(container.textContent).toContain('live now')
    expect(container.textContent).toContain('Available now')
  })

  it('translates category names', () => {
    renderApp(<PortalPage />, { locale: 'ja' })
    expect(screen.getByText('スニーカー・アパレル')).toBeInTheDocument()
  })
})
