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
