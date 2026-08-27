import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { DROPS } from './src/data/mock'
import { DICT } from './src/lib/i18n'
import { CATEGORIES, CATEGORY_KEY } from './src/lib/labels'
import { LOCALES, type Drop, type Locale } from './src/lib/types'

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://howl.tokyo').replace(/\/$/, '')

/** Every indexable path, locale-relative. Order matters only for readability. */
const PATHS = ['', '/wants', ...CATEGORIES.map((c) => `/c/${c}`), ...DROPS.map((d) => `/drop/${d.slug}`)]

const BUILT_AT = new Date().toISOString()
const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const tl = (value: { en: string } & Partial<Record<Locale, string>>, locale: Locale) =>
  value[locale] ?? value.en

/**
 * A drop's freshness date. Anything still open or upcoming is effectively
 * changing (countdown, channel stock), so it carries the build time; anything
 * closed is pinned to when it closed, which stops crawlers re-fetching the
 * whole archive on every rebuild.
 */
function lastmod(drop: Drop) {
  const closes = drop.closesAt ? new Date(drop.closesAt).getTime() : Infinity
  return closes < Date.now() ? drop.closesAt! : BUILT_AT
}

/**
 * Emits the crawler-facing files at build time. They are generated rather than
 * checked in so a new drop can never be missing from the sitemap — and the
 * prerender step reads this same sitemap for its route list, which keeps the
 * two from drifting apart.
 */
function seoAssets(): Plugin {
  return {
    name: 'howl-seo-assets',
    apply: 'build',
    generateBundle() {
      const urlset = (entries: string) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`
      const urls = PATHS.map((path) => {
        const alternates = LOCALES.map(
          (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}${path}"/>`,
        ).join('\n')
        return LOCALES.map(
          (locale) => `  <url>
    <loc>${SITE_URL}/${locale}${path}</loc>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/en${path}"/>
    <lastmod>${
      path.startsWith('/drop/')
        ? lastmod(DROPS.find((d) => `/drop/${d.slug}` === path)!)
        : BUILT_AT
    }</lastmod>
    <changefreq>${path.startsWith('/drop/') ? 'hourly' : 'daily'}</changefreq>
    <priority>${path === '' ? '1.0' : path === '/wants' ? '0.9' : path.startsWith('/c/') ? '0.8' : '0.7'}</priority>
  </url>`,
        ).join('\n')
      })

      // Split by page type: a drop sitemap churns hourly while the category and
      // portal pages barely move, and crawlers budget per sitemap.
      const pageUrls = urls.slice(0, 2 + CATEGORIES.length).join('\n')
      const dropUrls = urls.slice(2 + CATEGORIES.length).join('\n')

      this.emitFile({ type: 'asset', fileName: 'sitemap-pages.xml', source: urlset(pageUrls) })
      this.emitFile({ type: 'asset', fileName: 'sitemap-drops.xml', source: urlset(dropUrls) })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap-pages.xml</loc><lastmod>${BUILT_AT}</lastmod></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-drops.xml</loc><lastmod>${BUILT_AT}</lastmod></sitemap>
</sitemapindex>
`,
      })

      // One RSS feed per language. Drop calendars are exactly the kind of thing
      // people follow in a reader or pipe into a Discord webhook, and feed
      // readers and aggregators pick up new entries far faster than a crawler.
      for (const locale of LOCALES) {
        const items = [...DROPS]
          .sort((a, b) => new Date(b.opensAt).getTime() - new Date(a.opensAt).getTime())
          .slice(0, 50)
          .map((drop) => {
            const title = tl(drop.title, locale)
            const url = `${SITE_URL}/${locale}/drop/${drop.slug}`
            const category = DICT[locale][CATEGORY_KEY[drop.category]]
            return `    <item>
      <title>${xml(title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <category>${xml(category)}</category>
      <pubDate>${new Date(drop.opensAt).toUTCString()}</pubDate>
      <description>${xml(
        `${drop.brand} · ${DICT[locale].detEntryOpens} ${drop.opensAt}${
          drop.closesAt ? ` · ${DICT[locale].detEntryCloses} ${drop.closesAt}` : ''
        }`,
      )}</description>
    </item>`
          })
          .join('\n')

        this.emitFile({
          type: 'asset',
          fileName: `${locale}/feed.xml`,
          source: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>HOWL — ${xml(DICT[locale].tagline)}</title>
    <link>${SITE_URL}/${locale}</link>
    <atom:link href="${SITE_URL}/${locale}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${xml(DICT[locale].seoPortalDesc)}</description>
    <language>${locale}</language>
    <lastBuildDate>${new Date(BUILT_AT).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`,
        })
      }

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `# HOWL — global drop and raffle calendar
User-agent: *
Allow: /

# Answer engines are allowed on purpose: being cited in an AI answer is close
# to free reach for a site whose whole value is closing an information gap.
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`,
      })

      // llms.txt: an emerging convention for telling answer engines what a site
      // is and where the substance lives, in plain markdown.
      this.emitFile({
        type: 'asset',
        fileName: 'llms.txt',
        source: `# HOWL

> A calendar of limited drops and raffles worldwide — sneakers, trading cards,
> figures, art toys, anime goods and limited hardware — with a Friction Index
> rating how hard each one is to buy from outside its home country.

HOWL is an information service. It never enters raffles or handles payments on a
user's behalf; every buy button links to the official retailer.

## What each page contains

- **Drop pages** (\`/{locale}/drop/{slug}\`): entry and close times in absolute
  ISO form, every tracked retailer with whether it ships worldwide and accepts
  foreign cards, the specific blocker for overseas buyers (local SMS
  verification, locally-issued card, proxy required), import duty estimates and
  forwarder routes, plus current resale asking prices and premium over MSRP.
- **Category pages** (\`/{locale}/c/{category}\`): everything tracked in one
  genre, grouped by whether entry is open, buyable now, upcoming or closed.
- **Portal** (\`/{locale}\`): the six categories and what is live right now.

## Languages

Each language is a separate indexable URL, not a client-side toggle:
${LOCALES.map((l) => `- ${SITE_URL}/${l}`).join('\n')}

## Machine-readable

- Sitemap: ${SITE_URL}/sitemap.xml
- Every drop page carries schema.org Product + Offer + BreadcrumbList as JSON-LD.
`,
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoAssets()],
  build: {
    rollupOptions: {
      // WolfGrandma is a second entry, not a route: it must never appear in the
      // sitemap, never be prerendered, and never be crawled.
      input: { main: 'index.html', admin: 'admin.html' },
    },
  },
})
