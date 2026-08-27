import { DICT, type Key } from './i18n'
import { CATEGORY_KEY, FRICTION_DESC_KEY, MECHANIC_KEY } from './labels'
import { LOCALES, type Category, type Drop, type L, type Locale } from './types'

/**
 * Absolute origin used for canonical URLs, hreflang and the sitemap.
 * Override at build time with VITE_SITE_URL once the domain is registered.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://howl.app').replace(/\/$/, '')

export const SITE_NAME = 'HOWL'

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))

/**
 * Search results are clipped by pixel width, not character count, and a CJK
 * glyph is about twice as wide as a Latin one. Counting in half-widths is the
 * cheap approximation that makes one budget work for all four languages.
 */
export const visualWidth = (text: string) =>
  [...text].reduce((n, ch) => n + (/[\u1100-\u115f\u2e80-\u9fff\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/.test(ch) ? 2 : 1), 0)

/** Roughly the 600px Google gives a title, and the 920px it gives a snippet. */
export const TITLE_BUDGET = 75
export const DESCRIPTION_BUDGET = 300

/** Trims to a budget on a word boundary where the language has them. */
export function clamp(text: string, budget: number) {
  if (visualWidth(text) <= budget) return text
  let out = ''
  for (const ch of text) {
    if (visualWidth(out + ch) > budget - 1) break
    out += ch
  }
  const lastSpace = out.lastIndexOf(' ')
  if (lastSpace > budget * 0.6) out = out.slice(0, lastSpace)
  return `${out.trimEnd()}…`
}

/**
 * Long product names would push the brand and site name out of the visible
 * title, so the name is trimmed to whatever the fixed suffix leaves behind
 * rather than letting the whole line overflow.
 */
function titleWithin(template: string, name: string, values: Record<string, string | number>) {
  const suffixWidth = visualWidth(fill(template, { ...values, title: '' }))
  return fill(template, { ...values, title: clamp(name, Math.max(20, TITLE_BUDGET - suffixWidth)) })
}

const t = (locale: Locale, key: Key) => DICT[locale][key]
const tl = (value: L, locale: Locale) => value[locale] ?? value.en

export interface HeadData {
  title: string
  description: string
  /** Locale-relative path, e.g. "/c/sneakers" — "" for the portal. */
  path: string
  /** Rendered into a single <script type="application/ld+json"> block. */
  jsonLd: object[]
}

export const absolute = (locale: Locale, path: string) => `${SITE_URL}/${locale}${path}`

/** Every language version of one page, for hreflang and the sitemap. */
export const alternates = (path: string) =>
  LOCALES.map((locale) => ({ locale, url: absolute(locale, path) }))

function breadcrumbs(locale: Locale, trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: absolute(locale, step.path),
    })),
  }
}

export function portalHead(locale: Locale, drops: Drop[]): HeadData {
  return {
    title: clamp(t(locale, 'seoPortalTitle'), TITLE_BUDGET),
    description: clamp(t(locale, 'seoPortalDesc'), DESCRIPTION_BUDGET),
    path: '',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: absolute(locale, ''),
        inLanguage: locale,
        description: t(locale, 'seoPortalDesc'),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: t(locale, 'seoPortalTitle'),
        numberOfItems: drops.length,
      },
    ],
  }
}

export function categoryHead(locale: Locale, category: Category, drops: Drop[]): HeadData {
  const name = t(locale, CATEGORY_KEY[category])
  const path = `/c/${category}`
  return {
    title: clamp(fill(t(locale, 'seoCategoryTitle'), { category: name }), TITLE_BUDGET),
    description: clamp(fill(t(locale, 'seoCategoryDesc'), { category: name, count: drops.length }), DESCRIPTION_BUDGET),
    path,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name,
        url: absolute(locale, path),
        inLanguage: locale,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: drops.length,
          itemListElement: drops.map((drop, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: absolute(locale, `/drop/${drop.slug}`),
            name: tl(drop.title, locale),
          })),
        },
      },
      breadcrumbs(locale, [
        { name: t(locale, 'seoBreadcrumbHome'), path: '' },
        { name, path },
      ]),
    ],
  }
}

/** schema.org availability, derived from what the channels report. */
function availability(drop: Drop) {
  const stocked = drop.channels.filter((c) => c.stock === 'in-stock' || c.stock === 'low')
  if (stocked.length > 0) return 'https://schema.org/InStock'
  if (drop.channels.some((c) => c.stock === 'sold-out')) return 'https://schema.org/SoldOut'
  return 'https://schema.org/PreOrder'
}

export function dropHead(locale: Locale, drop: Drop): HeadData {
  const title = tl(drop.title, locale)
  const name = t(locale, CATEGORY_KEY[drop.category])
  const path = `/drop/${drop.slug}`

  const description = fill(t(locale, 'seoDropDesc'), {
    title,
    brand: drop.brand,
    mechanic: t(locale, MECHANIC_KEY[drop.mechanic]),
    friction: t(locale, FRICTION_DESC_KEY[drop.friction]),
    channels: drop.channels.length,
  })

  return {
    title: titleWithin(t(locale, 'seoDropTitle'), title, { brand: drop.brand }),
    description: clamp(description, DESCRIPTION_BUDGET),
    path,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description,
        brand: { '@type': 'Brand', name: drop.brand },
        category: name,
        url: absolute(locale, path),
        offers: drop.channels.map((channel) => ({
          '@type': 'Offer',
          url: channel.url,
          price: channel.askPrice ?? drop.price,
          priceCurrency: channel.askCurrency ?? drop.currency,
          availability: availability(drop),
          // The entry window is the honest validity bound for a raffle price.
          priceValidUntil: drop.closesAt ?? drop.releaseAt ?? drop.opensAt,
          seller: { '@type': 'Organization', name: channel.name },
        })),
      },
      breadcrumbs(locale, [
        { name: t(locale, 'seoBreadcrumbHome'), path: '' },
        { name, path: `/c/${drop.category}` },
        { name: title, path },
      ]),
    ],
  }
}
