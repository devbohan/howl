import type { Channel, Currency, Drop } from './types'
import { convert } from './format'

/** Channels that can actually be bought from right now, retail or resale. */
export function availableChannels(drop: Drop): Channel[] {
  return drop.channels.filter((c) => c.stock === 'in-stock' || c.stock === 'low')
}

export function isAvailableNow(drop: Drop) {
  return availableChannels(drop).length > 0
}

export interface BestOffer {
  channel: Channel
  price: number
  currency: Currency
  /** Fraction over MSRP: 1.8 means +180%. Negative means below retail. */
  premium: number
}

/** Cheapest buyable listing across every tracked channel, normalised to JPY. */
export function bestOffer(drop: Drop): BestOffer | null {
  const offers = availableChannels(drop).map((channel) => {
    const currency = channel.askCurrency ?? drop.currency
    const price = channel.askPrice ?? drop.price
    return {
      channel,
      price,
      currency,
      jpy: convert(price, currency, 'JPY'),
    }
  })
  if (offers.length === 0) return null

  const cheapest = offers.reduce((a, b) => (a.jpy <= b.jpy ? a : b))
  const msrpJpy = convert(drop.price, drop.currency, 'JPY')
  return {
    channel: cheapest.channel,
    price: cheapest.price,
    currency: cheapest.currency,
    premium: msrpJpy > 0 ? cheapest.jpy / msrpJpy - 1 : 0,
  }
}

export type Phase = 'upcoming' | 'open' | 'in-stock' | 'ended'

export interface DropState {
  phase: Phase
  /** The moment the countdown is ticking toward. */
  target: string
  msLeft: number
  /** Under an hour left on an open entry window — drives the urgent styling. */
  urgent: boolean
}

export function dropState(drop: Drop, now: number): DropState {
  const opens = new Date(drop.opensAt).getTime()
  const closes = drop.closesAt ? new Date(drop.closesAt).getTime() : undefined

  const ended = (): DropState => ({
    phase: isAvailableNow(drop) ? 'in-stock' : 'ended',
    target: drop.closesAt ?? drop.opensAt,
    msLeft: 0,
    urgent: false,
  })

  if (now < opens) {
    return { phase: 'upcoming', target: drop.opensAt, msLeft: opens - now, urgent: opens - now < 3_600_000 }
  }
  if (closes === undefined) {
    // First-come first-served with no stated end: treat the first 24h as live.
    const msLeft = opens + 86_400_000 - now
    return msLeft > 0 ? { phase: 'open', target: drop.opensAt, msLeft, urgent: false } : ended()
  }
  if (now < closes) {
    return { phase: 'open', target: drop.closesAt!, msLeft: closes - now, urgent: closes - now < 3_600_000 }
  }
  return ended()
}

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/** Sort key: live entries first, then what you can buy today, then what's coming. */
export function sortWeight(state: DropState) {
  if (state.phase === 'open') return state.msLeft
  if (state.phase === 'in-stock') return 5e11
  if (state.phase === 'upcoming') return state.msLeft + 1e12
  return 1e15
}
