import { expect, test } from '@playwright/test'
import { CATEGORIES, LOCALES } from './helpers'

/**
 * Most answer-engine crawlers do not execute JavaScript. Everything in this
 * file runs with JS switched off, so it asserts on exactly what those crawlers
 * receive — if the prerender step ever breaks, these fail rather than the site
 * quietly going invisible.
 */
test.use({ javaScriptEnabled: false })

const PAGES = [
  ['portal', '/en'],
  ['category', '/en/c/sneakers'],
  ['drop', '/en/drop/travis-scott-aj1-low-olive'],
] as const

for (const [name, url] of PAGES) {
  test(`${name} page serves real content without JavaScript`, async ({ page }) => {
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    const text = await page.locator('body').innerText()
    expect(text.length, `${name} page is nearly empty`).toBeGreaterThan(200)
  })
}

test('the bare domain is not an empty shell', async ({ page }) => {
  await page.goto('/')
  const text = await page.locator('body').innerText()
  expect(text.length).toBeGreaterThan(200)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en$/)
})

test('every page has a unique title, description and canonical', async ({ page }) => {
  const seen = new Map<string, string>()
  for (const [, url] of PAGES) {
    await page.goto(url)
    const meta = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    }))
    expect(meta.title).not.toBe('')
    expect(meta.description.length).toBeGreaterThan(60)
    expect(meta.canonical).toMatch(/^https:\/\//)
    expect(seen.has(meta.title), `duplicate title: ${meta.title}`).toBe(false)
    seen.set(meta.title, url)
  }
})

test('a drop page declares every language version reciprocally', async ({ page }) => {
  await page.goto('/ja/drop/pokemon-center-151-premium')
  const tags = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('hreflang')))
  for (const locale of LOCALES) expect(tags).toContain(locale)
  expect(tags).toContain('x-default')
})

test('a drop page carries Product structured data an engine can parse', async ({ page }) => {
  await page.goto('/en/drop/travis-scott-aj1-low-olive')
  const raw = await page.locator('script[type="application/ld+json"]').innerText()
  const nodes = JSON.parse(raw)

  const product = nodes.find((n: any) => n['@type'] === 'Product')
  expect(product).toBeTruthy()
  expect(product.name).toContain('Travis Scott')
  expect(product.offers.length).toBeGreaterThan(0)
  expect(nodes.some((n: any) => n['@type'] === 'BreadcrumbList')).toBe(true)
})

test('each language is a separately indexable URL', async ({ page }) => {
  const titles = new Set<string>()
  for (const locale of LOCALES) {
    await page.goto(`/${locale}/c/tcg`)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    titles.add(await page.title())
  }
  expect(titles.size).toBe(LOCALES.length)
})

test('every category page is prerendered, in every language', async ({ page }) => {
  for (const locale of LOCALES) {
    for (const category of CATEGORIES) {
      const response = await page.goto(`/${locale}/c/${category}`)
      expect(response?.status()).toBe(200)
      const text = await page.locator('body').innerText()
      expect(text.length, `${locale}/${category} is empty`).toBeGreaterThan(200)
    }
  }
})

test('robots.txt lets answer engines in and points at the sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text()
  for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
    expect(body, `${bot} is not addressed`).toContain(bot)
  }
  expect(body).not.toMatch(/Disallow: \/\s*$/m)
  expect(body).toMatch(/^Sitemap: https:\/\/.+\/sitemap\.xml$/m)
})

test('the sitemap indexes every page in every language, with alternates', async ({ request }) => {
  const index = await (await request.get('/sitemap.xml')).text()
  expect(index).toContain('<sitemapindex')

  const children = [...index.matchAll(/<loc>[^<]*?(\/sitemap-[^<]+)<\/loc>/g)].map((m) => m[1])
  expect(children.length).toBeGreaterThan(1)

  let total = 0
  for (const child of children) {
    const xml = await (await request.get(child)).text()
    const urls = [...xml.matchAll(/<loc>/g)].length
    total += urls
    expect(xml).toContain('<lastmod>')
    expect(xml).toContain('hreflang="x-default"')
  }
  // 4 locales × (portal + 6 categories + 21 drops)
  expect(total).toBe(4 * 28)
})

test('llms.txt describes the site for answer engines', async ({ request }) => {
  const body = await (await request.get('/llms.txt')).text()
  expect(body.startsWith('# HOWL')).toBe(true)
  expect(body).toContain('sitemap.xml')
  expect(body.length).toBeGreaterThan(400)
})

test('each language has its own feed', async ({ request }) => {
  for (const locale of LOCALES) {
    const body = await (await request.get(`/${locale}/feed.xml`)).text()
    expect(body).toContain('<rss')
    expect(body).toContain(`<language>${locale}</language>`)
    expect([...body.matchAll(/<item>/g)].length).toBeGreaterThan(10)
  }
})

test('share cards exist for the site and for each drop', async ({ request, page }) => {
  expect((await request.get('/og.png')).status()).toBe(200)

  await page.goto('/ja/drop/pokemon-center-151-premium')
  const image = await page
    .locator('meta[property="og:image"]')
    .getAttribute('content')
  expect(image).toMatch(/\/og\/drop\/pokemon-center-151-premium-ja\.png$/)
  expect((await request.get(new URL(image!).pathname)).status()).toBe(200)
})
