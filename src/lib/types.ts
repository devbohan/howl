export type Locale = 'en' | 'ja' | 'zh-CN' | 'zh-TW'
export const LOCALES: Locale[] = ['en', 'ja', 'zh-CN', 'zh-TW']

/** Localized string. `en` is required and acts as the fallback. */
export type L = Partial<Record<Locale, string>> & { en: string }

export type Category =
  | 'sneakers'
  | 'tcg'
  | 'figure'
  | 'arttoy'
  | 'goods'
  | 'hardware'

export type Region = 'JP' | 'US' | 'EU' | 'CN' | 'GLOBAL'

export type Mechanic =
  | 'web-raffle'
  | 'app-raffle'
  | 'made-to-order'
  | 'restock'
  | 'offline-ticket'
  | 'fcfs'

/** 海淘难度 — Friction Index */
export type Friction = 'easy' | 'medium' | 'hard'

export type Currency = 'JPY' | 'USD' | 'EUR' | 'CNY'

export type ChannelStatus = 'upcoming' | 'open' | 'closed' | 'sold-out'

/** Primary retail vs. secondary/resale marketplaces. */
export type Market = 'retail' | 'resale'

export type Stock = 'in-stock' | 'low' | 'sold-out'

export interface Channel {
  id: string
  name: string
  /** Where the retailer itself is based. */
  region: Region
  url: string
  status: ChannelStatus
  shipsWorldwide: boolean
  acceptsForeignCard: boolean
  /** Retailer-specific gotcha, e.g. "requires JP phone number". */
  note?: L
  /** Whether we earn affiliate revenue on this link. */
  affiliate?: boolean
  /** Defaults to 'retail'. */
  market?: Market
  /** Present only once the drop window is over and we track live availability. */
  stock?: Stock
  /** Current asking price when it differs from MSRP (resale, or a marked-up restock). */
  askPrice?: number
  askCurrency?: Currency
}

export interface Drop {
  id: string
  slug: string
  title: L
  brand: string
  subtitle?: L
  category: Category
  region: Region
  mechanic: Mechanic
  friction: Friction
  price: number
  currency: Currency
  /** ISO strings. `opensAt` is when entry/sale starts. */
  opensAt: string
  closesAt?: string
  /** Ship / draw-result date, shown when different from the entry window. */
  releaseAt?: string
  channels: Channel[]
  /** Bullet points for the Friction Index breakdown. */
  frictionNotes: L[]
  /** Estimated import duty note for the destination. */
  dutyNote?: L
  forwarders?: string[]
  tags?: string[]
  /** Decorative art for the card — no remote images in the prototype. */
  art: { from: string; to: string; glyph: string }
  hot?: boolean
}
