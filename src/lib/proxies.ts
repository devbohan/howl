import type { Channel, Drop } from './types'

/**
 * Proxy services, and which blocker each one actually removes.
 *
 * The distinction that matters and that most sites get wrong:
 *
 *   转运 (forwarding) gives you a Japanese address. It fixes "does not ship
 *   overseas" and nothing else — you still check out yourself, so a shop that
 *   demands a Japanese phone number or rejects foreign cards still stops you.
 *
 *   代购 (proxy buying) buys on your behalf with their account and their card.
 *   It clears every blocker, and costs more for it.
 *
 * Recommending a forwarder to someone blocked by a card check wastes their
 * money and their drop. So each service declares what it can actually clear.
 */
export type ProxyKind = 'forwarder' | 'buyer'

export interface ProxyService {
  id: string
  name: string
  kind: ProxyKind
  /** Roughly what they add on top, so nobody is surprised at checkout. */
  fee: string
  home: string
  /** Pre-searches the product where the service supports it. */
  search?: (query: string) => string
  /** Set once the affiliate account is approved; appended to outbound links. */
  affiliateParam?: string
}

export const PROXIES: ProxyService[] = [
  {
    id: 'buyee',
    name: 'Buyee',
    kind: 'buyer',
    fee: '手数料 + 国際送料',
    home: 'https://buyee.jp',
    search: (q) => `https://buyee.jp/item/search/query/${encodeURIComponent(q)}`,
  },
  {
    id: 'zenmarket',
    name: 'ZenMarket',
    kind: 'buyer',
    fee: '一律手数料 + 国際送料',
    home: 'https://zenmarket.jp',
    search: (q) => `https://zenmarket.jp/en/yahoo.aspx?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'fromjapan',
    name: 'FromJapan',
    kind: 'buyer',
    fee: '手数料 + 国際送料',
    home: 'https://www.fromjapan.co.jp',
    search: (q) => `https://www.fromjapan.co.jp/japan/en/special/search/word/${encodeURIComponent(q)}`,
  },
  {
    id: 'neokyo',
    name: 'Neokyo',
    kind: 'buyer',
    fee: '手数料 + 国際送料',
    home: 'https://neokyo.com',
  },
  {
    id: 'tenso',
    name: 'tenso.com',
    kind: 'forwarder',
    fee: '国際送料のみ',
    home: 'https://www.tenso.com',
  },
  {
    id: 'blackship',
    name: 'Blackship',
    kind: 'forwarder',
    fee: '国際送料のみ',
    home: 'https://blackship.jp',
  },
]

/** What is actually stopping an overseas buyer on this drop. */
export interface Blockers {
  /** No tracked channel ships outside its own region. */
  shipping: boolean
  /** No tracked channel takes a foreign card. */
  payment: boolean
}

export function blockersFor(channels: Channel[]): Blockers {
  if (channels.length === 0) return { shipping: false, payment: false }
  return {
    shipping: !channels.some((c) => c.shipsWorldwide),
    payment: !channels.some((c) => c.acceptsForeignCard),
  }
}

/**
 * A forwarder is enough when the only problem is the parcel. The moment
 * payment or account requirements are in the way, only a proxy buyer helps.
 */
export function proxiesFor(drop: Drop): { blockers: Blockers; services: ProxyService[]; needed: boolean } {
  const blockers = blockersFor(drop.channels)
  const needed = blockers.shipping || blockers.payment

  const services = !needed
    ? []
    : blockers.payment
      ? PROXIES.filter((p) => p.kind === 'buyer')
      : PROXIES

  return { blockers, services, needed }
}

/** Outbound URL for a service, pre-searched and affiliate-tagged when possible. */
export function proxyUrl(service: ProxyService, query: string) {
  const base = service.search ? service.search(query) : service.home
  if (!service.affiliateParam) return base
  return base + (base.includes('?') ? '&' : '?') + service.affiliateParam
}
