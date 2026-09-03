import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Drop } from '../../lib/types'
import { makeChannel, makeDrop } from '../../test/fixtures'

const now = Date.now()
const at = (ms: number) => new Date(now + ms).toISOString()

const DROPS: Drop[] = [
  makeDrop({
    id: 'urgent',
    slug: 'urgent-raffle',
    title: { en: 'Urgent raffle' },
    category: 'tcg',
    opensAt: at(-1000),
    closesAt: at(3_600_000),
    channels: [makeChannel({ id: 'c-urgent', acceptsForeignCard: true, shipsWorldwide: true })],
  }),
  makeDrop({
    id: 'walled',
    slug: 'walled-raffle',
    title: { en: 'Walled raffle' },
    category: 'sneakers',
    opensAt: at(-1000),
    closesAt: at(7_200_000),
    channels: [makeChannel({ id: 'c-walled', acceptsForeignCard: false, shipsWorldwide: false })],
  }),
  makeDrop({
    id: 'later',
    slug: 'later-raffle',
    title: { en: 'Later raffle' },
    category: 'tcg',
    opensAt: at(-1000),
    closesAt: at(400_000_000),
    // Deliberately bare: neither requirement established.
    channels: [makeChannel({ id: 'c-later', shipsWorldwide: undefined, acceptsForeignCard: undefined })],
  }),
  makeDrop({
    id: 'soon',
    slug: 'not-open-yet',
    title: { en: 'Not open yet' },
    category: 'arttoy',
    opensAt: at(86_400_000),
    closesAt: at(90_000_000),
    channels: [makeChannel({ id: 'c-soon', acceptsForeignCard: true })],
  }),
]

vi.mock('../../data/mock', () => ({ DROPS }))

const { CrowPage } = await import('../CrowPage')
const { renderApp } = await import('../../test/render')

const rows = () => screen.getAllByRole('listitem')

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})


describe('the queue', () => {
  it('leads with what the page is for', () => {
    renderApp(<CrowPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Every raffle you can still enter')
  })

  it('orders by what disappears first', () => {
    renderApp(<CrowPage />, { tier: 'vip' })
    const names = rows().map((r) => r.textContent ?? '')
    expect(names[0]).toContain('Urgent raffle')
    expect(names[1]).toContain('Walled raffle')
    expect(names[2]).toContain('Later raffle')
    // Not-yet-open sits below everything already open.
    expect(names[3]).toContain('Not open yet')
  })

  it('counts what is open and what closes inside 48h', () => {
    renderApp(<CrowPage />)
    expect(screen.getByText('open now')).toBeInTheDocument()
    expect(screen.getByText('closing within 48h')).toBeInTheDocument()
  })

  it('shows the entry barrier on each row, so it can be skipped fast', () => {
    renderApp(<CrowPage />, { tier: 'vip' })
    const walled = rows().find((r) => r.textContent?.includes('Walled raffle'))!
    expect(within(walled).getByText('Local card required')).toBeInTheDocument()
    expect(within(walled).getByText('Forwarder needed')).toBeInTheDocument()
  })

  it('marks an unresearched row as unverified rather than as blocked', () => {
    renderApp(<CrowPage />, { tier: 'vip' })
    const later = rows().find((r) => r.textContent?.includes('Later raffle'))!
    expect(within(later).getByText('Requirements unverified')).toBeInTheDocument()
    expect(within(later).queryByText('Local card required')).not.toBeInTheDocument()
  })

  it('hides the card-walled rows on request, and brings them back', async () => {
    const user = userEvent.setup()
    renderApp(<CrowPage />, { tier: 'vip' })
    expect(rows()).toHaveLength(4)

    await user.click(screen.getByRole('button', { name: 'Only ones I can enter' }))
    expect(rows().some((r) => r.textContent?.includes('Walled raffle'))).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Only ones I can enter' }))
    expect(rows()).toHaveLength(4)
  })

  it('filters by category', async () => {
    const user = userEvent.setup()
    renderApp(<CrowPage />, { tier: 'vip' })
    const group = screen.getByRole('group', { name: 'Category' })
    await user.click(within(group).getByRole('button', { name: 'Art Toys' }))
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Not open yet')
  })

  it('links each row to its own page and out to the retailer', () => {
    renderApp(<CrowPage />, { tier: 'vip' })
    const urgent = rows()[0]
    expect(within(urgent).getByRole('link', { name: 'Urgent raffle' })).toHaveAttribute(
      'href',
      '/en/drop/urgent-raffle',
    )
    const out = within(urgent).getByRole('link', { name: /Enter/ })
    expect(out).toHaveAttribute('data-outbound', 'store')
    expect(out.getAttribute('rel')).toContain('sponsored')
  })
})

describe('the premise, and the line', () => {
  it('states the arithmetic rather than implying an edge', () => {
    renderApp(<CrowPage />)
    expect(screen.getByText(/entering 15 raffles at 5% each is a 54% chance/i)).toBeInTheDocument()
  })

  it('says outright that it does not fill entry forms', () => {
    // R0.2 — and the visitor is the one whose account is at risk, so say so.
    renderApp(<CrowPage />)
    expect(screen.getByText(/We do not fill entry forms for you/)).toBeInTheDocument()
  })

  it('describes the marketplace idea as needing its own groundwork', () => {
    renderApp(<CrowPage />)
    expect(screen.getByText(/needs its own legal and payment groundwork/)).toBeInTheDocument()
  })
})

describe('the paywall', () => {
  it('previews three rows for a signed-out visitor and says how many are hidden', () => {
    renderApp(<CrowPage />)
    expect(rows()).toHaveLength(3)
    expect(screen.getByText('showing 3 of 4')).toBeInTheDocument()
    expect(screen.getByText('The rest of the queue is for members')).toBeInTheDocument()
  })

  it('previews the most urgent rows, not an arbitrary slice', () => {
    renderApp(<CrowPage />)
    expect(rows()[0]).toHaveTextContent('Urgent raffle')
  })

  it('opens the whole queue for a member and drops the paywall', () => {
    renderApp(<CrowPage />, { tier: 'vip' })
    expect(rows()).toHaveLength(4)
    expect(screen.queryByText('The rest of the queue is for members')).not.toBeInTheDocument()
  })

  it('does not show a paywall when nothing is hidden', async () => {
    const user = userEvent.setup()
    renderApp(<CrowPage />)
    const group = screen.getByRole('group', { name: 'Category' })
    await user.click(within(group).getByRole('button', { name: 'Art Toys' }))
    expect(screen.queryByText('The rest of the queue is for members')).not.toBeInTheDocument()
  })
})
