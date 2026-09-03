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

/** Engagement signals behind the feed ranking. Both are refreshed by the CMS. */
export interface Heat {
  /** Interactions on HOWL itself — card opens, notify taps, watchlist adds. */
  site: number
  /** Reach on the source platform — views, reposts, likes. */
  external: number
}

export type NewsKind = 'confirmed' | 'rumor' | 'restock' | 'leak' | 'result'

/** A one-line update in the category ticker. Short enough to read while it scrolls. */
export interface NewsItem {
  id: string
  category: Category
  kind: NewsKind
  text: L
  /** ISO — drives the relative stamp and the ordering. */
  at: string
  /** Deep-links into a drop we already track. */
  dropSlug?: string
  /** External source when there is no drop page yet. */
  url?: string
  source?: string
  /** Breaking — scores a large boost so it usually leads the ticker. */
  urgent?: boolean
  heat?: Heat
}

export type MediaKind = 'video' | 'article' | 'social'

export type Platform =
  | 'youtube'
  | 'bilibili'
  | 'x'
  | 'instagram'
  | 'tiktok'
  | 'weibo'
  | 'xiaohongshu'
  | 'note'
  | 'web'

/**
 * Third-party coverage — creator unboxings, media write-ups, official teasers.
 * We link out only; nothing is embedded or re-hosted.
 */
export interface MediaLink {
  id: string
  kind: MediaKind
  platform: Platform
  /** Creator handle or outlet name, as it appears on the platform. */
  source: string
  title: L
  url: string
  /** Language of the content, so users can skip what they can't read. */
  lang: Locale
  /** Subscriber / follower count, pre-formatted for display. */
  audience?: string
  /** Videos only, e.g. "12:04". */
  duration?: string
  /** Editor's pick — scores a boost in the feed ranking. */
  featured?: boolean
  heat?: Heat
}

export interface Channel {
  id: string
  name: string
  /** Where the retailer itself is based. */
  region: Region
  url: string
  status: ChannelStatus
  /**
   * Optional on purpose. Plenty of shops never say, and several refuse to serve
   * a program at all — New Balance Japan answers 403. A required boolean would
   * force a guess at publish time on exactly the two fields the whole product
   * is trusted for, so absent means "not established" and renders that way.
   */
  shipsWorldwide?: boolean
  acceptsForeignCard?: boolean
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
  /**
   * How precisely the schedule is actually known.
   *
   * Plenty of announcements give a date and no time. Encoding that as midnight
   * and saying nothing would present a guess as a fact, so `'date'` means the
   * countdown runs to the start of that day — always early, never late — and
   * the UI says the time was not announced.
   */
  timePrecision?: 'exact' | 'date'
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
  /** Unboxings, reviews and press coverage from outside HOWL. */
  media?: MediaLink[]
  /** Placeholder gradient standing in for product photography. */
  art: { from: string; to: string }
  hot?: boolean
}
