/**
 * Renders every route in the sitemap to static HTML so crawlers that do not run
 * JavaScript — which is most answer-engine crawlers — still get the full page.
 *
 * Deliberately not SSR: the app is client-only and its data is generated at
 * module load, so hydration would mismatch. React re-renders over the snapshot
 * on load instead; the markup is identical, so nothing visibly changes.
 */
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import sirv from 'sirv'

const DIST = resolve('dist')
const PORT = Number(process.env.PRERENDER_PORT ?? 4180)
const CONCURRENCY = 8

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://howl.tokyo').replace(/\/$/, '')

/** Routes come from the sitemap so the two can never disagree. */
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

async function routes() {
  const index = await readFile(join(DIST, 'sitemap.xml'), 'utf8')
  // sitemap.xml is an index, so follow it to the child sitemaps for real URLs.
  const children = index.includes('<sitemapindex')
    ? await Promise.all(locs(index).map((url) => readFile(join(DIST, url.slice(SITE_URL.length + 1)), 'utf8')))
    : [index]
  const listed = children.flatMap(locs).map((url) => url.slice(SITE_URL.length))
  // '/' is not in the sitemap (it redirects), but it is the SPA fallback every
  // static host serves for unknown paths — leaving it a blank shell means the
  // bare domain is the one URL a non-JS crawler still sees nothing on.
  return ['/', ...listed]
}

function serve() {
  const handler = sirv(DIST, { single: true, dev: true })
  const server = createServer(handler)
  return new Promise((ok) => server.listen(PORT, '127.0.0.1', () => ok(server)))
}

async function snapshot(page, route) {
  await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'networkidle' })
  // The head hook is the last thing each page does, so this proves it ran.
  try {
    await page.waitForSelector('link[rel="canonical"]', { state: 'attached', timeout: 15_000 })
  } catch (cause) {
    throw new Error(`head never rendered for ${route}`, { cause })
  }

  return page.evaluate(() => {
    // The pre-paint script stamps a theme from *this* browser's preference.
    // Leaving it in would freeze every static page to one theme.
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.removeProperty('color-scheme')
    return `<!doctype html>\n${document.documentElement.outerHTML}`
  })
}

/**
 * Share cards, drawn from the wordmark so a pasted link stops unfurling as a
 * bare URL. Every drop gets its own card in every language, because a drop link
 * dropped into a Discord channel is one of the main ways this spreads.
 */
async function ogCard(page, { eyebrow, headline, file }) {
  const logo = (await readFile(resolve('src/components/Logo.tsx'), 'utf8'))
    .split('<g fill="none"')[1]
    .split('</g>')[0]

  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#08090a;color:#f1f3f6;
    font-family:Inter,'Hiragino Sans','Noto Sans JP','PingFang SC',system-ui,sans-serif;
    display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;padding:72px 88px;
    height:630px;box-sizing:border-box">
    <svg viewBox="0 0 160 84" style="height:120px;width:auto"><g fill="none"${logo}</g></svg>
    <div>
      ${eyebrow ? `<p style="margin:0 0 18px;font-size:26px;letter-spacing:.18em;text-transform:uppercase;color:#8b929d">${esc(eyebrow)}</p>` : ''}
      <p style="margin:0;font-size:${headline.length > 70 ? 44 : 56}px;line-height:1.22;font-weight:700;
        max-width:1010px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(headline)}</p>
    </div>
  </body></html>`)
  await mkdir(dirname(file), { recursive: true })
  await page.screenshot({ path: file })
}

/** Drop routes, parsed back into (locale, slug) so cards can be named to match. */
function dropCards(all) {
  return all.flatMap((route) => {
    const m = route.match(/^\/([\w-]+)\/drop\/(.+)$/)
    return m ? [{ route, locale: m[1], slug: m[2] }] : []
  })
}

const server = await serve()
const browser = await chromium.launch()
const all = await routes()
let written = 0

try {
  const cardPage = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await ogCard(cardPage, {
    eyebrow: '',
    headline: 'Every limited drop and raffle, one countdown.',
    file: join(DIST, 'og.png'),
  })

  const queue = [...all]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      const page = await browser.newPage()
      for (let route = queue.shift(); route; route = queue.shift()) {
        const html = await snapshot(page, route)
        // Flat `<route>.html` rather than `<route>/index.html`: static hosts
        // and `vite preview` alike resolve an extensionless URL to the .html
        // file, while the directory form only resolves with a trailing slash.
        const file = route === '/' ? join(DIST, 'index.html') : join(DIST, `${route}.html`)
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, html)
        written += 1
      }
      await page.close()
    }),
  )

  // Card headlines come from the page that was just rendered, so they always
  // match what the visitor will see.
  for (const { route, locale, slug } of dropCards(all)) {
    await cardPage.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'networkidle' })
    const { brand, headline } = await cardPage.evaluate(() => ({
      brand: document.querySelector('main span.uppercase')?.textContent?.trim() ?? '',
      headline: document.querySelector('h1')?.textContent?.trim() ?? '',
    }))
    await ogCard(cardPage, {
      eyebrow: brand,
      headline,
      file: join(DIST, 'og', 'drop', `${slug}-${locale}.png`),
    })
  }
  await cardPage.close()
} finally {
  await browser.close()
  server.close()
}

if (!existsSync(join(DIST, 'og.png'))) throw new Error('og.png was not written')
console.log(`prerendered ${written} routes + ${dropCards(all).length + 1} share cards`)
