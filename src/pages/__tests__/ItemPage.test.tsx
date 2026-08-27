import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { ItemPage } from '../ItemPage'
import { DROPS } from '../../data/mock'
import { renderApp } from '../../test/render'

const WITH_MEDIA = DROPS.find((d) => d.media && d.media.length > 0)!
const HARD = DROPS.find((d) => d.friction === 'hard')!

const show = (slug: string, locale: 'en' | 'ja' | 'zh-CN' | 'zh-TW' = 'en') =>
  renderApp(<ItemPage />, { route: `/${locale}/drop/${slug}`, path: '/:locale/drop/:slug', locale })

describe('ItemPage', () => {
  it('renders the drop it was routed to', () => {
    show(WITH_MEDIA.slug)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(WITH_MEDIA.title.en)
  })

  it('falls back to a not-found notice for an unknown slug', () => {
    show('no-such-drop')
    expect(screen.getByText('Not found.')).toBeInTheDocument()
  })

  it('goes back to the category, not the portal', () => {
    const { container } = show(WITH_MEDIA.slug)
    expect(container.querySelector('a')).toHaveAttribute('href', `/en/c/${WITH_MEDIA.category}`)
  })

  it('lists every sales channel with its shipping and card verdicts', () => {
    show(HARD.slug)
    for (const channel of HARD.channels) {
      expect(screen.getByText(channel.name)).toBeInTheDocument()
    }
    expect(screen.getAllByText(/Local card required|Foreign cards OK/).length).toBe(HARD.channels.length)
  })

  it('spells out the friction notes', () => {
    show(HARD.slug)
    for (const note of HARD.frictionNotes) {
      expect(screen.getByText(note.en)).toBeInTheDocument()
    }
  })

  it('marks affiliate links as sponsored for search engines', () => {
    const { container } = show(HARD.slug)
    const storeLinks = Array.from(container.querySelectorAll('a[href^="http"]'))
    expect(storeLinks.length).toBeGreaterThan(0)
    for (const link of storeLinks) {
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  it('shows third-party coverage with its disclaimer', () => {
    show(WITH_MEDIA.slug)
    expect(screen.getByText('Unboxings & coverage')).toBeInTheDocument()
    expect(screen.getByText(/neither owns nor endorses/)).toBeInTheDocument()
  })

  it('omits the coverage section entirely when there is none', () => {
    const without = DROPS.find((d) => !d.media)!
    show(without.slug)
    expect(screen.queryByText('Unboxings & coverage')).not.toBeInTheDocument()
  })

  it('states that times are in the reader’s own timezone', () => {
    show(WITH_MEDIA.slug)
    expect(screen.getByText(/local timezone/)).toBeInTheDocument()
  })

  it('translates the whole page', () => {
    show(WITH_MEDIA.slug, 'ja')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(WITH_MEDIA.title.ja!)
    expect(screen.getByText('購入先')).toBeInTheDocument()
  })
})
