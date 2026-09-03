import { describe, expect, it } from 'vitest'
import { atLeastOnce, barriersOf, closingWithin, crowQueue, NO_FILTERS } from '../crow'
import { makeChannel, makeDrop } from '../../test/fixtures'
import type { Channel, Drop } from '../types'

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0)
const at = (ms: number) => new Date(NOW + ms).toISOString()

const open = (msLeft: number, over: Partial<Drop> = {}) =>
  makeDrop({ opensAt: at(-1000), closesAt: at(msLeft), ...over })

const upcoming = (msUntil: number, over: Partial<Drop> = {}) =>
  makeDrop({ opensAt: at(msUntil), closesAt: at(msUntil + 3_600_000), ...over })

const ch = (over: Partial<Channel>) => makeChannel(over)

describe('barriersOf', () => {
  it('finds nothing blocking when a channel takes a foreign card and ships out', () => {
    expect(barriersOf([ch({ shipsWorldwide: true, acceptsForeignCard: true })])).toEqual({
      localShippingOnly: false,
      localCardOnly: false,
      unresearched: false,
    })
  })

  it('flags a card wall when no channel is known to accept one', () => {
    expect(barriersOf([ch({ acceptsForeignCard: false, shipsWorldwide: true })])).toMatchObject({
      localCardOnly: true,
    })
  })

  it('flags shipping when nothing ships out', () => {
    expect(barriersOf([ch({ shipsWorldwide: false, acceptsForeignCard: true })])).toMatchObject({
      localShippingOnly: true,
    })
  })

  it('reports unresearched rather than inventing a barrier', () => {
    // R3.4: an unresearched channel is not evidence that a buyer is stuck.
    const bare = barriersOf([ch({ shipsWorldwide: undefined, acceptsForeignCard: undefined })])
    expect(bare).toEqual({ localShippingOnly: false, localCardOnly: false, unresearched: true })
  })

  it('takes one workable channel as enough', () => {
    const mixed = [
      ch({ id: 'a', shipsWorldwide: false, acceptsForeignCard: false }),
      ch({ id: 'b', shipsWorldwide: true, acceptsForeignCard: true }),
    ]
    expect(barriersOf(mixed)).toMatchObject({ localCardOnly: false, localShippingOnly: false })
  })
})

describe('crowQueue', () => {
  it('lists what is open and what is coming, and drops what has ended', () => {
    const ended = makeDrop({ id: 'x', opensAt: at(-9_000_000), closesAt: at(-1000) })
    const rows = crowQueue([open(60_000), upcoming(86_400_000), ended], NOW)
    expect(rows).toHaveLength(2)
  })

  it('puts open entries before not-yet-open ones', () => {
    const rows = crowQueue([upcoming(1000, { id: 'soon' }), open(9_000_000, { id: 'now' })], NOW)
    expect(rows.map((r) => r.drop.id)).toEqual(['now', 'soon'])
  })

  it('orders by what disappears first, not by what started first', () => {
    const rows = crowQueue(
      [open(9_000_000, { id: 'later' }), open(60_000, { id: 'urgent' }), open(600_000, { id: 'mid' })],
      NOW,
    )
    expect(rows.map((r) => r.drop.id)).toEqual(['urgent', 'mid', 'later'])
  })

  it('filters to one category', () => {
    const rows = crowQueue(
      [open(1000, { id: 'a', category: 'tcg' }), open(2000, { id: 'b', category: 'sneakers' })],
      NOW,
      { ...NO_FILTERS, category: 'tcg' },
    )
    expect(rows.map((r) => r.drop.id)).toEqual(['a'])
  })

  it('can hide entries whose payment step is known to reject a foreign card', () => {
    const blocked = open(1000, { id: 'blocked', channels: [ch({ acceptsForeignCard: false })] })
    const fine = open(2000, { id: 'fine', channels: [ch({ acceptsForeignCard: true })] })

    const all = crowQueue([blocked, fine], NOW)
    expect(all).toHaveLength(2)

    const filtered = crowQueue([blocked, fine], NOW, { ...NO_FILTERS, enterableOnly: true })
    expect(filtered.map((r) => r.drop.id)).toEqual(['fine'])
  })

  it('keeps an unresearched entry in the enterable list', () => {
    // Hiding it would mean acting on an assumption we have not verified.
    const unknown = open(1000, { id: 'u', channels: [ch({ shipsWorldwide: undefined, acceptsForeignCard: undefined })] })
    expect(crowQueue([unknown], NOW, { ...NO_FILTERS, enterableOnly: true })).toHaveLength(1)
  })

  it('is empty when nothing is live, rather than throwing', () => {
    expect(crowQueue([], NOW)).toEqual([])
  })
})

describe('atLeastOnce', () => {
  it('is the per-raffle rate for a single entry', () => {
    expect(atLeastOnce(0.05, 1)).toBeCloseTo(0.05, 10)
  })

  it('is zero when you enter nothing', () => {
    expect(atLeastOnce(0.05, 0)).toBe(0)
  })

  it('shows why the lever is how many you enter', () => {
    // The whole premise of the page, in one assertion.
    expect(atLeastOnce(0.05, 3)).toBeCloseTo(0.1426, 3)
    expect(atLeastOnce(0.05, 15)).toBeCloseTo(0.5367, 3)
  })

  it('never exceeds certainty, and handles a certain raffle', () => {
    expect(atLeastOnce(1, 5)).toBe(1)
    expect(atLeastOnce(2, 5)).toBe(1)
    expect(atLeastOnce(-1, 5)).toBe(0)
  })
})

describe('closingWithin', () => {
  it('counts only open entries inside the window', () => {
    // 48h is 172,800,000ms — the second row closes well past it.
    const rows = crowQueue([open(3_600_000), open(400_000_000), upcoming(1000)], NOW)
    expect(closingWithin(rows, 48)).toBe(1)
    expect(closingWithin(rows, 200)).toBe(2)
  })
})
