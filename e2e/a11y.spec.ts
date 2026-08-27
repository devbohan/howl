import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = [
  ['portal', '/en'],
  ['category', '/en/c/sneakers'],
  ['item', '/en/drop/travis-scott-aj1-low-olive'],
] as const

const scan = (page: import('@playwright/test').Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

for (const [name, url] of PAGES) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${name} page has no accessibility violations in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme })
      await page.goto(url)
      await page.waitForSelector('h1')

      const { violations } = await scan(page)
      const summary = violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`).join('\n')
      expect(violations, summary).toEqual([])
    })
  }
}

test('every page is reachable and operable by keyboard alone', async ({ page }) => {
  await page.goto('/en')
  await page.keyboard.press('Tab')

  // Walk forward until a category row takes focus, then follow it.
  for (let i = 0; i < 25; i++) {
    const href = await page.evaluate(() => (document.activeElement as HTMLAnchorElement | null)?.getAttribute('href'))
    if (href?.includes('/c/')) {
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(new RegExp('/en/c/'))
      return
    }
    await page.keyboard.press('Tab')
  }
  throw new Error('never reached a category row by tabbing')
})

test('the page has exactly one h1 and a sensible heading order', async ({ page }) => {
  for (const [, url] of PAGES) {
    await page.goto(url)
    const levels = await page
      .locator('h1, h2, h3')
      .evaluateAll((els) => els.map((e) => Number(e.tagName[1])))
    expect(levels.filter((l) => l === 1), `h1 count on ${url}`).toHaveLength(1)
    expect(levels[0]).toBe(1)
  }
})

test('the interface carries no emoji', async ({ page }) => {
  // Emoji render differently on every platform and never match the wordmark;
  // every mark in the UI is an inline SVG in currentColor instead.
  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u
  for (const [name, url] of PAGES) {
    await page.goto(url)
    const text = await page.locator('body').innerText()
    const found = [...text].filter((ch) => EMOJI.test(ch))
    expect(found, `emoji on the ${name} page: ${found.join(' ')}`).toEqual([])
  }
})

test('the brand accent is monochrome, and only status carries colour', async ({ page }) => {
  await page.goto('/en/c/sneakers')
  const { accent, accentFg, live } = await page.evaluate(() => {
    const probe = (cls: string) => {
      const el = document.createElement('span')
      el.className = cls
      document.body.append(el)
      const value = getComputedStyle(el).color
      el.remove()
      return value
    }
    return { accent: probe('text-accent'), accentFg: probe('text-accent-fg'), live: probe('text-live-fg') }
  })

  // The neutrals are a faintly blue black/white, so allow a small spread —
  // wide enough for #101317, nowhere near wide enough for the old lime.
  const isGrey = (rgb: string) => {
    const [r, g, b] = rgb.match(/\d+/g)!.map(Number)
    return Math.max(r, g, b) - Math.min(r, g, b) <= 12
  }
  expect(isGrey(accent), `accent is not neutral: ${accent}`).toBe(true)
  expect(isGrey(accentFg), `accent-fg is not neutral: ${accentFg}`).toBe(true)
  // Live is the one status that kept its colour.
  expect(isGrey(live), `live lost its colour: ${live}`).toBe(false)
})
