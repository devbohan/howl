import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { makeChannel, makeDrop, at } from '../../test/fixtures'
import type { Drop } from '../../lib/types'

/**
 * Fixtures rather than the live dataset. These assert how the page behaves,
 * which must hold whether the site is tracking zero drops or a thousand — the
 * real catalogue is E2E's job, not this file's.
 */
const WITH_MEDIA: Drop = makeDrop({
  slug: 'fixture-with-media',
  title: { en: 'Fixture Drop With Coverage', ja: 'カバレッジ付きのドロップ' },
  media: [
    {
      id: 'fm1',
      kind: 'video',
      platform: 'youtube',
      source: '@fixture',
      title: { en: 'A hands-on look' },
      url: 'https://example.test/video',
      lang: 'en',
      duration: '10:00',
    },
  ],
})

const HARD: Drop = makeDrop({
  slug: 'fixture-hard',
  title: { en: 'Fixture Hard Drop', ja: '難易度の高いドロップ' },
  friction: 'hard',
  channels: [
    makeChannel({ id: 'fh1', name: 'Local Only Store', shipsWorldwide: false, acceptsForeignCard: false }),
    makeChannel({ id: 'fh2', name: 'Proxy Service', affiliate: true }),
  ],
  frictionNotes: [{ en: 'Needs a local phone number verified by SMS.' }],
  closesAt: at(9 * 3_600_000),
})

const WITHOUT_MEDIA: Drop = makeDrop({ slug: 'fixture-plain', title: { en: 'Fixture Plain Drop' } })

vi.mock('../../data/mock', () => ({ DROPS: [WITH_MEDIA, HARD, WITHOUT_MEDIA] }))

const { ItemPage } = await import('../ItemPage')
const { renderApp } = await import('../../test/render')

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
    show(WITHOUT_MEDIA.slug)
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
