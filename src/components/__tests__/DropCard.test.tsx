import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { DropCard } from '../DropCard'
import { renderApp } from '../../test/render'
import type { Drop } from '../../lib/types'

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0)
const at = (ms: number) => new Date(NOW + ms).toISOString()

const drop = (overrides: Partial<Drop> = {}): Drop => ({
  id: 'd1',
  slug: 'test-drop',
  title: { en: 'Test Drop', ja: 'テストドロップ' },
  brand: 'TESTCO',
  category: 'sneakers',
  region: 'JP',
  mechanic: 'web-raffle',
  friction: 'medium',
  price: 24_200,
  currency: 'JPY',
  opensAt: at(7_200_000),
  channels: [
    { id: 'c1', name: 'Store', region: 'JP', url: 'https://x.test', status: 'upcoming', shipsWorldwide: true, acceptsForeignCard: true },
  ],
  frictionNotes: [{ en: 'note' }],
  art: { from: '#123456', to: '#000000' },
  ...overrides,
})

describe('DropCard', () => {
  it('links to the localised detail route', () => {
    const { container } = renderApp(<DropCard drop={drop()} now={NOW} currency="JPY" />, { locale: 'ja' })
    expect(container.querySelector('a')).toHaveAttribute('href', '/ja/drop/test-drop')
  })

  it('shows the title in the reader’s language', () => {
    renderApp(<DropCard drop={drop()} now={NOW} currency="JPY" />, { locale: 'ja' })
    expect(screen.getByText('テストドロップ')).toBeInTheDocument()
  })

  it('prices in the selected currency, not the source currency', () => {
    renderApp(<DropCard drop={drop()} now={NOW} currency="USD" />)
    expect(screen.getByText(/^\$/)).toBeInTheDocument()
  })

  it('counts channels when nothing is buyable yet', () => {
    renderApp(<DropCard drop={drop()} now={NOW} currency="JPY" />)
    expect(screen.getByText('1 channels')).toBeInTheDocument()
  })

  it('shows a LIVE badge while entry is open', () => {
    const live = drop({ opensAt: at(-1000), closesAt: at(3_600_000 * 5) })
    renderApp(<DropCard drop={live} now={NOW} currency="JPY" />)
    expect(screen.getByText('Entry open')).toBeInTheDocument()
  })

  it('shows the HOT flag only when the drop is flagged', () => {
    renderApp(<DropCard drop={drop({ hot: true })} now={NOW} currency="JPY" />)
    expect(screen.getByText('HOT')).toBeInTheDocument()
  })

  it('dims an ended drop', () => {
    const ended = drop({ opensAt: at(-9_000_000), closesAt: at(-1000) })
    const { container } = renderApp(<DropCard drop={ended} now={NOW} currency="JPY" />)
    // Dimming lives on the card shell, which wraps the link.
    expect(container.querySelector('.glow-card')?.className).toContain('opacity-55')
  })

  it('keeps the decorative glow out of the accessibility tree and below the text', () => {
    const { container } = renderApp(<DropCard drop={drop()} now={NOW} currency="JPY" />)
    const card = container.querySelector('.glow-card')!
    // The wash is a ::before on the shell — never an element that could be read
    // out, and never above the copy it sits behind.
    expect(card.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(card.className).toContain('overflow-hidden')
  })

  it('swaps in the best resale offer and its premium once in stock', () => {
    const inStock = drop({
      opensAt: at(-9_000_000),
      closesAt: at(-1000),
      price: 10_000,
      channels: [
        { id: 'c1', name: 'StockX', region: 'US', url: 'https://x.test', status: 'sold-out', shipsWorldwide: true, acceptsForeignCard: true, market: 'resale', stock: 'in-stock', askPrice: 30_000, askCurrency: 'JPY' },
      ],
    })
    renderApp(<DropCard drop={inStock} now={NOW} currency="JPY" />)
    // Once as the corner badge, once in place of the countdown.
    expect(screen.getAllByText('Available now')).toHaveLength(2)
    expect(screen.getByText(/\+200%/)).toBeInTheDocument()
  })

  it('renders a zero price as FREE rather than ¥0', () => {
    renderApp(<DropCard drop={drop({ price: 0 })} now={NOW} currency="JPY" />)
    expect(screen.getByText('FREE')).toBeInTheDocument()
  })
})

describe('cards line up in a grid', () => {
  it('reserves two title lines, so short and long titles align the same', () => {
    const { container } = renderApp(<DropCard drop={drop({ title: { en: 'Short' } })} now={NOW} currency="JPY" />)
    // Without the reserve, a one-line title pulls the badges and the footer up
    // and the row ends up ragged.
    expect(container.querySelector('h3')?.className).toContain('min-h-')
  })

  it('reserves the badge row and the countdown label', () => {
    const { container } = renderApp(<DropCard drop={drop()} now={NOW} currency="JPY" />)
    const reserved = [...container.querySelectorAll('[class*="min-h-"]')]
    // Title, badge row, countdown column: the three blocks whose height varies
    // with content and would otherwise decide the row height.
    expect(reserved.length).toBeGreaterThanOrEqual(3)
  })

  it('passes the row height down instead of collapsing to content', () => {
    const { container } = renderApp(<DropCard drop={drop()} now={NOW} currency="JPY" />)
    expect(container.querySelector('.tilt-3d-scene')?.className).toContain('h-full')
    expect(container.querySelector('.tilt-3d')?.className).toContain('h-full')
    expect(container.querySelector('.glow-card')?.className).toContain('h-full')
  })

  it('has a floor, for a group that holds only one card', () => {
    const { container } = renderApp(<DropCard drop={drop()} now={NOW} currency="JPY" />)
    expect(container.querySelector('.glow-card')?.className).toMatch(/min-h-\[/)
  })
})
