import type { Category, MediaLink } from '../lib/types'

/**
 * Category-level coverage: the creators and outlets worth following for a whole
 * genre. Emptied before launch — it held invented handles, invented view counts
 * and invented video titles, which is fabricated coverage however clearly the
 * file said so.
 *
 * Real entries are collected by hand and, ideally, refreshed from each
 * platform's own API once there are enough to be worth automating.
 */
export const CATEGORY_MEDIA: Record<Category, MediaLink[]> = {
  sneakers: [],
  tcg: [],
  figure: [],
  arttoy: [],
  goods: [],
  hardware: [],
}
