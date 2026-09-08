/**
 * What the app reads. Real data, plus the demo overlay when it is switched on.
 *
 * This layer exists because vite.config.ts imports the raw datasets in Node to
 * build the sitemap, and Node has no build-time globals. Keeping `__DEMO__` out
 * of those files and confining it here means the guard needs no `typeof` — and
 * without a `typeof`, esbuild actually replaces the identifier, the branch
 * folds to a constant, and the demo module is dropped from the bundle instead
 * of merely being unreachable inside it.
 *
 * Nothing outside the app should import this; the sitemap and the prerenderer
 * want the real catalogue, not whatever is being demoed.
 */
import { DROPS as REAL_DROPS } from './mock'
import { NEWS as REAL_NEWS } from './news'
import { WANTS as REAL_WANTS } from './wants'
import { CATEGORY_MEDIA as REAL_MEDIA } from './creators'
import { DEMO_DROPS, DEMO_MEDIA, DEMO_NEWS, DEMO_WANTS } from './demo'
import type { Category, MediaLink } from '../lib/types'

declare const __DEMO__: boolean

export const DROPS = __DEMO__ ? [...REAL_DROPS, ...DEMO_DROPS] : REAL_DROPS
export const NEWS = __DEMO__ ? [...REAL_NEWS, ...DEMO_NEWS] : REAL_NEWS
export const WANTS = __DEMO__ ? [...REAL_WANTS, ...DEMO_WANTS] : REAL_WANTS

export const CATEGORY_MEDIA: Record<Category, MediaLink[]> = __DEMO__
  ? (Object.fromEntries(
      Object.entries(REAL_MEDIA).map(([key, list]) => [key, [...list, ...DEMO_MEDIA[key as Category]]]),
    ) as Record<Category, MediaLink[]>)
  : REAL_MEDIA
