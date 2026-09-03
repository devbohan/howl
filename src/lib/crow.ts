import { dropState, type DropState } from './schedule'
import type { Channel, Drop } from './types'

/**
 * CROW — the work queue for people who enter a lot of raffles.
 *
 * The mechanism is arithmetic, not automation. Winning at least one of n
 * independent raffles is 1 − (1−p)^n, so the lever is n. If finding the
 * raffles is what limits n, then removing the search cost is what raises the
 * odds — entering fifteen instead of three moves a 5% chance to about 54%.
 *
 * What this deliberately does NOT do is fill the forms in. That is R0.2: it
 * breaks the retailers' terms, carries CFAA and 不正アクセス禁止法 exposure,
 * and charging for it would get the payment account closed. The efficiency
 * here comes from a shorter list to work through, not from a robot.
 */

export interface Barrier {
  /** Nothing we know of ships to the buyer without a forwarder. */
  localShippingOnly: boolean
  /** No channel is known to take a foreign card. */
  localCardOnly: boolean
  /** Nobody has established the requirements yet. */
  unresearched: boolean
}

const known = (values: (boolean | undefined)[]) => values.filter((v) => v !== undefined)

/**
 * What stands between an overseas buyer and an entry. Mirrors R3.4: only an
 * explicit "no" counts, because an unresearched channel is not evidence.
 */
export function barriersOf(channels: Channel[]): Barrier {
  const shipping = known(channels.map((c) => c.shipsWorldwide))
  const card = known(channels.map((c) => c.acceptsForeignCard))

  return {
    localShippingOnly: shipping.length > 0 && !shipping.includes(true),
    localCardOnly: card.length > 0 && !card.includes(true),
    unresearched: shipping.length === 0 && card.length === 0,
  }
}

export interface CrowRow {
  drop: Drop
  state: DropState
  barrier: Barrier
  /** Nothing known blocks an overseas entry. */
  open: boolean
}

export interface CrowFilters {
  category: Drop['category'] | null
  /** Hide rows whose payment step is known to reject a foreign card. */
  enterableOnly: boolean
}

export const NO_FILTERS: CrowFilters = { category: null, enterableOnly: false }

/**
 * The queue: things you can still enter, soonest deadline first.
 *
 * Sorted by time left rather than by start time — this page is worked from the
 * top down, and the only thing that matters is what disappears first.
 */
export function crowQueue(drops: Drop[], now: number, filters: CrowFilters = NO_FILTERS): CrowRow[] {
  return drops
    .map((drop) => {
      const state = dropState(drop, now)
      const barrier = barriersOf(drop.channels)
      return { drop, state, barrier, open: !barrier.localCardOnly }
    })
    .filter(({ state }) => state.phase === 'open' || state.phase === 'upcoming')
    .filter(({ drop }) => !filters.category || drop.category === filters.category)
    .filter(({ open }) => !filters.enterableOnly || open)
    .sort((a, b) => {
      // Already open beats not-yet-open; within each, the closest deadline wins.
      if (a.state.phase !== b.state.phase) return a.state.phase === 'open' ? -1 : 1
      return a.state.msLeft - b.state.msLeft
    })
}

/**
 * Chance of winning at least one, given a per-raffle rate. Shown to make the
 * point that the lever is how many you enter — not any edge we could give you.
 */
export function atLeastOnce(perRaffle: number, count: number) {
  const p = Math.min(Math.max(perRaffle, 0), 1)
  return 1 - Math.pow(1 - p, Math.max(0, count))
}

/** How many rows close inside the next `hours`. */
export function closingWithin(rows: CrowRow[], hours: number) {
  const window = hours * 3_600_000
  return rows.filter((r) => r.state.phase === 'open' && r.state.msLeft <= window).length
}
