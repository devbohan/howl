import type { Heat } from './types'

/** Hard cap on how many rows a feed panel will ever hold. */
export const MAX_FEED_ITEMS = 50

/**
 * Ranking weights. On-site engagement counts for more than raw off-site reach:
 * a link 200 HOWL users opened is a better row than a video with a million
 * views from an audience that never intended to buy.
 */
const SITE_WEIGHT = 0.6
const EXTERNAL_WEIGHT = 0.4
const URGENT_BOOST = 0.35
const FEATURED_BOOST = 0.2

export interface Ranked<T> {
  item: T
  /** 0–1 before boosts, so it stays comparable across categories. */
  score: number
}

/** Both signals are long-tailed, so compare their logs, not their raw counts. */
const scale = (n: number) => Math.log1p(Math.max(0, n))

/**
 * Orders a feed by combined on-site + off-site heat, then truncates.
 * Normalising against the max in the list keeps the two very different scales
 * (hundreds of clicks vs. millions of views) from letting one drown the other.
 */
export function rankFeed<T extends { heat?: Heat; urgent?: boolean; featured?: boolean }>(
  items: T[],
  limit = MAX_FEED_ITEMS,
): Ranked<T>[] {
  const maxSite = Math.max(1, ...items.map((i) => scale(i.heat?.site ?? 0)))
  const maxExternal = Math.max(1, ...items.map((i) => scale(i.heat?.external ?? 0)))

  return items
    .map((item) => ({
      item,
      score:
        (SITE_WEIGHT * scale(item.heat?.site ?? 0)) / maxSite +
        (EXTERNAL_WEIGHT * scale(item.heat?.external ?? 0)) / maxExternal +
        (item.urgent ? URGENT_BOOST : 0) +
        (item.featured ? FEATURED_BOOST : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** "18.2K" — compact enough for a ticker row, localised by Intl. */
export function formatCount(n: number, locale: string) {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
