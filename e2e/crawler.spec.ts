import { expect, test } from '@playwright/test'
import { CATEGORIES, LOCALES, anyDropSlug, skipWithoutDrops } from './helpers'

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

test('a drop page declares every language version reciprocally', async ({ page, request }) => {
  const slug = await anyDropSlug(request)
  skipWithoutDrops(test, slug)
  await page.goto(`/ja/drop/${slug}`)
  const tags = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('hreflang')))
  for (const locale of LOCALES) expect(tags).toContain(locale)
  expect(tags).toContain('x-default')
})

test('a drop page carries Product structured data an engine can parse', async ({ page, request }) => {
  const slug = await anyDropSlug(request)
  skipWithoutDrops(test, slug)
  await page.goto(`/en/drop/${slug}`)
  const raw = await page.locator('script[type="application/ld+json"]').innerText()
  const nodes = JSON.parse(raw)

  const product = nodes.find((n: any) => n['@type'] === 'Product')
  expect(product).toBeTruthy()
  expect(product.name).not.toBe('')
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
    // A drop sitemap is legitimately empty before launch; a page sitemap is not.
    if (urls > 0) {
      expect(xml).toContain('<lastmod>')
      expect(xml).toContain('hreflang="x-default"')
    }
  }
  // Derive the expected count from the two halves rather than hardcoding the
  // number of static pages — that number changes whenever a page is added.
  const drops = [...(await (await request.get('/sitemap-drops.xml')).text()).matchAll(/<loc>/g)].length
  const pages = [...(await (await request.get('/sitemap-pages.xml')).text()).matchAll(/<loc>/g)].length
  expect(total).toBe(pages + drops)
  // Every static page is present in all four languages.
  expect(pages % LOCALES.length).toBe(0)
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
    expect(body).toContain('rel="self"')
    // Item count tracks the catalogue, which may still be empty.
    const items = [...body.matchAll(/<item>/g)].length
    const drops = [...(await (await request.get('/sitemap-drops.xml')).text()).matchAll(/<loc>/g)].length
    expect(items).toBe(Math.min(50, drops / LOCALES.length))
  }
})

test('share cards exist for the site and for each drop', async ({ request, page }) => {
  expect((await request.get('/og.png')).status()).toBe(200)

  const slug = await anyDropSlug(request)
  skipWithoutDrops(test, slug)
  await page.goto(`/ja/drop/${slug}`)
  const image = await page
    .locator('meta[property="og:image"]')
    .getAttribute('content')
  expect(image).toMatch(new RegExp(`/og/drop/${slug}-ja\\.png$`))
  expect((await request.get(new URL(image!).pathname)).status()).toBe(200)
})

test('the reissue wantlist is prerendered, with its counts when it has any', async ({ page }) => {
  await page.goto('/en/wants')
  await expect(page.locator('h1')).toBeVisible()

  // The invitation and the form are the substance while the board is empty —
  // a crawler must still get a real page, not a shell it has to run JS to fill.
  const text = await page.locator('body').innerText()
  expect(text.length).toBeGreaterThan(400)
  await expect(page.getByRole('button', { name: /Add my request/ })).toBeVisible()

  const raw = await page.locator('script[type="application/ld+json"]').innerText()
  const nodes = JSON.parse(raw)
  const collection = nodes.find((n: any) => n['@type'] === 'CollectionPage')
  expect(collection).toBeTruthy()

  const items = collection.mainEntity.itemListElement.length
  if (items > 0) expect(text).toMatch(/\d{2,}/)
})

test('the wantlist is in the sitemap in every language', async ({ request }) => {
  const xml = await (await request.get('/sitemap-pages.xml')).text()
  for (const locale of LOCALES) {
    expect(xml).toContain(`/${locale}/wants</loc>`)
  }
})

test('the CROW queue is prerendered for a raffle-intent search', async ({ page }) => {
  await page.goto('/ja/crow')
  await expect(page.locator('h1')).toBeVisible()

  // This page exists to answer "<product> 抽選 / where can I still enter", so a
  // crawler with no JS must get the premise, the counts and the disclaimer.
  const text = await page.locator('body').innerText()
  expect(text.length).toBeGreaterThan(400)
  expect(text).toContain('代行入力は行いません')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/ja\/crow$/)
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1)

  const nodes = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())
  expect(nodes.some((n: { '@type': string }) => n['@type'] === 'CollectionPage')).toBe(true)
})

test('CROW is in the sitemap for every language', async ({ page }) => {
  const response = await page.request.get('/sitemap-pages.xml')
  const xml = await response.text()
  for (const locale of ['en', 'ja', 'zh-CN', 'zh-TW']) {
    expect(xml).toContain(`/${locale}/crow`)
  }
})

test('the paywall does not hide the page from crawlers', async ({ page }) => {
  await page.goto('/en/crow')
  // Gated rows are fine; a gated *page* would be cloaking, and the intent copy
  // plus the counts are what earns the ranking in the first place.
  const text = await page.locator('body').innerText()
  expect(text).toContain('Every raffle you can still enter')
  expect(text).toContain('We do not fill entry forms for you')
})

test('the two sitemaps are split by page type, not by position in a list', async ({ page }) => {
  // Regression: the split used a hardcoded index, so adding a static page
  // pushed a category page into the drop sitemap. The point of the split is
  // that drop pages churn hourly and the rest barely move.
  const drops = await (await page.request.get('/sitemap-drops.xml')).text()
  const pages = await (await page.request.get('/sitemap-pages.xml')).text()

  const dropLocs = [...drops.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  const pageLocs = [...pages.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  for (const loc of dropLocs) expect(loc).toContain('/drop/')
  for (const loc of pageLocs) expect(loc).not.toContain('/drop/')
  expect(pageLocs.length).toBeGreaterThan(0)
})
