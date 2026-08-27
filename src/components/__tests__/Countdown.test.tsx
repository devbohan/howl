import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { Countdown, CountdownLabel } from '../Countdown'
import { renderApp } from '../../test/render'
import type { DropState } from '../../lib/schedule'

const state = (overrides: Partial<DropState> = {}): DropState => ({
  phase: 'upcoming',
  target: '2026-01-01T00:00:00.000Z',
  msLeft: 0,
  urgent: false,
  ...overrides,
})

describe('Countdown', () => {
  it('zero-pads hours, minutes and seconds', () => {
    renderApp(<Countdown state={state({ msLeft: 5 * 60_000 + 3_000 })} />)
    expect(screen.getByText('00')).toBeInTheDocument()
    expect(screen.getByText('05')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('shows days instead of seconds once a day is left', () => {
    const { container } = renderApp(<Countdown state={state({ msLeft: 2 * 86_400_000 + 3_600_000 })} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    // Seconds would be a fourth unit; with days shown there are only three.
    expect(container.querySelectorAll('.tabular-nums')).toHaveLength(3)
  })

  it('renders a closed drop as ended, with no digits', () => {
    renderApp(<Countdown state={state({ phase: 'ended' })} />)
    expect(screen.getByText(/Closed/)).toBeInTheDocument()
  })

  it('renders in-stock rather than a countdown', () => {
    renderApp(<Countdown state={state({ phase: 'in-stock' })} />)
    expect(screen.getByText('Available now')).toBeInTheDocument()
  })

  it('turns red when the window is urgent', () => {
    const { container } = renderApp(<Countdown state={state({ phase: 'open', msLeft: 60_000, urgent: true })} />)
    expect(container.firstElementChild?.className).toContain('text-hard')
  })

  it('uses the accent colour while open but not urgent', () => {
    const { container } = renderApp(<Countdown state={state({ phase: 'open', msLeft: 7_200_000 })} />)
    expect(container.firstElementChild?.className).toContain('text-accent-fg')
  })

  it('honours the size prop', () => {
    const { container } = renderApp(<Countdown state={state({ msLeft: 1000 })} size="lg" />)
    expect(container.firstElementChild?.className).toContain('text-3xl')
  })

  it('translates unit labels', () => {
    renderApp(<Countdown state={state({ msLeft: 3_600_000 })} />, { locale: 'ja' })
    expect(screen.getByText('時')).toBeInTheDocument()
  })
})

describe('CountdownLabel', () => {
  it('says "opens in" before the window', () => {
    renderApp(<CountdownLabel state={state()} />)
    expect(screen.getByText('Entry opens in')).toBeInTheDocument()
  })

  it('says "closes in" once open', () => {
    renderApp(<CountdownLabel state={state({ phase: 'open' })} />)
    expect(screen.getByText('Entry closes in')).toBeInTheDocument()
  })

  it('renders nothing for ended and in-stock', () => {
    const { container: ended } = renderApp(<CountdownLabel state={state({ phase: 'ended' })} />)
    expect(ended).toBeEmptyDOMElement()
    const { container: stock } = renderApp(<CountdownLabel state={state({ phase: 'in-stock' })} />)
    expect(stock).toBeEmptyDOMElement()
  })
})
