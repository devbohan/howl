import { describe, expect, it } from 'vitest'
import {
  availableChannels,
  bestOffer,
  dropState,
  isAvailableNow,
  sortWeight,
  splitDuration,
} from '../schedule'
import type { Channel, Drop } from '../types'

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0)
const at = (msFromNow: number) => new Date(NOW + msFromNow).toISOString()

function channel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 'c1',
    name: 'Test Store',
    region: 'JP',
    url: 'https://example.test',
    status: 'open',
    shipsWorldwide: true,
    acceptsForeignCard: true,
    ...overrides,
  }
}

function drop(overrides: Partial<Drop> = {}): Drop {
  return {
    id: 'd1',
    slug: 'test-drop',
    title: { en: 'Test Drop' },
    brand: 'Test',
    category: 'sneakers',
    region: 'JP',
    mechanic: 'web-raffle',
    friction: 'easy',
    price: 10_000,
    currency: 'JPY',
    opensAt: at(3_600_000),
    channels: [],
    frictionNotes: [],
    art: { from: '#000', to: '#111' },
    ...overrides,
  }
}

describe('dropState', () => {
  it('counts down to open while the window is still ahead', () => {
    const state = dropState(drop({ opensAt: at(7_200_000) }), NOW)
    expect(state.phase).toBe('upcoming')
    expect(state.msLeft).toBe(7_200_000)
    expect(state.target).toBe(at(7_200_000))
    expect(state.urgent).toBe(false)
  })

  it('marks an imminent open as urgent under one hour', () => {
    expect(dropState(drop({ opensAt: at(3_599_000) }), NOW).urgent).toBe(true)
    expect(dropState(drop({ opensAt: at(3_600_001) }), NOW).urgent).toBe(false)
  })

  it('counts down to close once entry is open', () => {
    const state = dropState(drop({ opensAt: at(-1000), closesAt: at(5_000_000) }), NOW)
    expect(state.phase).toBe('open')
    expect(state.msLeft).toBe(5_000_000)
    expect(state.target).toBe(at(5_000_000))
  })

  it('marks an imminent close as urgent under one hour', () => {
    const state = dropState(drop({ opensAt: at(-1000), closesAt: at(60_000) }), NOW)
    expect(state.urgent).toBe(true)
  })

  it('ends once the close time has passed', () => {
    const state = dropState(drop({ opensAt: at(-9_000_000), closesAt: at(-1000) }), NOW)
    expect(state.phase).toBe('ended')
    expect(state.msLeft).toBe(0)
  })

  it('treats an open-ended FCFS drop as live for its first 24 hours', () => {
    const fcfs = drop({ mechanic: 'fcfs', opensAt: at(-3_600_000), closesAt: undefined })
    const state = dropState(fcfs, NOW)
    expect(state.phase).toBe('open')
    expect(state.msLeft).toBe(86_400_000 - 3_600_000)
  })

  it('ends an open-ended FCFS drop after 24 hours', () => {
    const fcfs = drop({ mechanic: 'fcfs', opensAt: at(-86_400_001), closesAt: undefined })
    expect(dropState(fcfs, NOW).phase).toBe('ended')
  })

  it('reports in-stock instead of ended when a channel still has stock', () => {
    const sold = drop({
      opensAt: at(-9_000_000),
      closesAt: at(-1000),
      channels: [channel({ stock: 'in-stock', market: 'resale', askPrice: 50_000 })],
    })
    expect(dropState(sold, NOW).phase).toBe('in-stock')
  })

  it('treats a sold-out channel as no stock', () => {
    const sold = drop({
      opensAt: at(-9_000_000),
      closesAt: at(-1000),
      channels: [channel({ stock: 'sold-out' })],
    })
    expect(dropState(sold, NOW).phase).toBe('ended')
  })
})

describe('availableChannels', () => {
  it('counts both in-stock and low stock as buyable', () => {
    const d = drop({
      channels: [
        channel({ id: 'a', stock: 'in-stock' }),
        channel({ id: 'b', stock: 'low' }),
        channel({ id: 'c', stock: 'sold-out' }),
        channel({ id: 'd' }),
      ],
    })
    expect(availableChannels(d).map((c) => c.id)).toEqual(['a', 'b'])
    expect(isAvailableNow(d)).toBe(true)
  })

  it('is not available when no channel reports stock', () => {
    expect(isAvailableNow(drop({ channels: [channel()] }))).toBe(false)
  })
})

describe('bestOffer', () => {
  it('returns null when nothing is buyable', () => {
    expect(bestOffer(drop({ channels: [channel()] }))).toBeNull()
  })

  it('picks the cheapest listing after converting to a common currency', () => {
    // 100 USD ≈ 14,925 JPY at the mock rate, so the 20,000 JPY listing loses.
    const d = drop({
      price: 10_000,
      currency: 'JPY',
      channels: [
        channel({ id: 'jpy', stock: 'in-stock', askPrice: 20_000, askCurrency: 'JPY' }),
        channel({ id: 'usd', stock: 'in-stock', askPrice: 100, askCurrency: 'USD' }),
      ],
    })
    const offer = bestOffer(d)
    expect(offer?.channel.id).toBe('usd')
    expect(offer?.currency).toBe('USD')
    expect(offer?.price).toBe(100)
  })

  it('reports a positive premium above retail', () => {
    const d = drop({
      price: 10_000,
      channels: [channel({ stock: 'in-stock', askPrice: 25_000 })],
    })
    expect(bestOffer(d)?.premium).toBeCloseTo(1.5, 5)
  })

  it('reports a negative premium below retail', () => {
    const d = drop({
      price: 10_000,
      channels: [channel({ stock: 'in-stock', askPrice: 9_000 })],
    })
    expect(bestOffer(d)?.premium).toBeCloseTo(-0.1, 5)
  })

  it('falls back to MSRP when a stocked channel quotes no ask price', () => {
    const d = drop({ price: 10_000, channels: [channel({ stock: 'low' })] })
    const offer = bestOffer(d)
    expect(offer?.price).toBe(10_000)
    expect(offer?.premium).toBeCloseTo(0, 10)
  })

  it('does not divide by zero on a free drop', () => {
    const d = drop({ price: 0, channels: [channel({ stock: 'in-stock', askPrice: 500 })] })
    expect(bestOffer(d)?.premium).toBe(0)
  })
})

describe('sortWeight', () => {
  it('orders live entries by urgency, then stock, then upcoming, then ended', () => {
    const live = sortWeight({ phase: 'open', target: '', msLeft: 60_000, urgent: true, dateOnly: false })
    const liveLater = sortWeight({ phase: 'open', target: '', msLeft: 600_000, urgent: false, dateOnly: false })
    const stock = sortWeight({ phase: 'in-stock', target: '', msLeft: 0, urgent: false, dateOnly: false })
    const upcoming = sortWeight({ phase: 'upcoming', target: '', msLeft: 1000, urgent: false, dateOnly: false })
    const ended = sortWeight({ phase: 'ended', target: '', msLeft: 0, urgent: false, dateOnly: false })

    expect(live).toBeLessThan(liveLater)
    expect(liveLater).toBeLessThan(stock)
    expect(stock).toBeLessThan(upcoming)
    expect(upcoming).toBeLessThan(ended)
  })
})

describe('splitDuration', () => {
  it('breaks milliseconds into d/h/m/s', () => {
    const ms = ((2 * 24 + 3) * 60 + 4) * 60_000 + 5_000
    expect(splitDuration(ms)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 })
  })

  it('clamps negative input to zero rather than counting backwards', () => {
    expect(splitDuration(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('date-only schedules', () => {
  it('marks the state so the UI can say the time is unannounced', () => {
    const d = drop({ timePrecision: 'date', opensAt: at(86_400_000) })
    expect(dropState(d, NOW).dateOnly).toBe(true)
  })

  it('defaults to exact when the field is absent', () => {
    expect(dropState(drop(), NOW).dateOnly).toBe(false)
    expect(dropState(drop({ timePrecision: 'exact' }), NOW).dateOnly).toBe(false)
  })

  it('never calls a date-only drop urgent — the hour itself is unknown', () => {
    // Claiming "under an hour left" when the time was never announced would be
    // a guess presented as a warning.
    const soon = drop({ timePrecision: 'date', opensAt: at(60_000) })
    expect(dropState(soon, NOW).urgent).toBe(false)

    const exact = drop({ opensAt: at(60_000) })
    expect(dropState(exact, NOW).urgent).toBe(true)
  })

  it('still counts down, and to the start of the day', () => {
    const d = drop({ timePrecision: 'date', opensAt: at(3 * 86_400_000) })
    const state = dropState(d, NOW)
    expect(state.phase).toBe('upcoming')
    expect(state.msLeft).toBe(3 * 86_400_000)
  })

  it('carries the flag through a closing window too', () => {
    const d = drop({ timePrecision: 'date', opensAt: at(-1000), closesAt: at(60_000) })
    const state = dropState(d, NOW)
    expect(state.phase).toBe('open')
    expect(state.dateOnly).toBe(true)
    expect(state.urgent).toBe(false)
  })
})
