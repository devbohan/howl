import { expect, test } from '@playwright/test'
import { CATEGORIES, LOCALES, hasHorizontalOverflow, portalRows } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/en')
})

test('lands on the portal with a headline and the three-stat legend', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('tracked').first()).toBeVisible()
  await expect(page.getByText('live now').first()).toBeVisible()
  await expect(page.getByText('Available now').first()).toBeVisible()
})

test('lists every category exactly once, in order', async ({ page }) => {
  const rows = portalRows(page)
  await expect(rows).toHaveCount(CATEGORIES.length)
  const hrefs = await rows.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
  expect(hrefs).toEqual(CATEGORIES.map((c) => `/en/c/${c}`))
})

test('shows no decorative icons in the rows', async ({ page }) => {
  const text = await portalRows(page).evaluateAll((els) => els.map((e) => e.textContent ?? '').join(''))
  expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
})

test('per-category counts add up to the header totals', async ({ page }) => {
  // A mismatch means the header and the rows are counting by different rules —
  // exactly the bug where "in stock" meant two different things.
  for (const stat of ['tracked', 'live', 'stock'] as const) {
    const total = Number(await page.locator(`[data-stat="${stat}-total"]`).innerText())
    const perRow = await page
      .locator(`[data-stat="${stat}"]`)
      .evaluateAll((els) => els.map((e) => Number(e.textContent)))

    expect(perRow).toHaveLength(CATEGORIES.length)
    expect(perRow.reduce((a, b) => a + b, 0), `${stat} does not add up`).toBe(total)
  }
})

test('opens a category and can come back', async ({ page }) => {
  await portalRows(page).first().click()
  await expect(page).toHaveURL('/en/c/sneakers')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sneakers')

  await page.getByRole('link', { name: /All categories/ }).click()
  await expect(page).toHaveURL('/en')
})

test('never scrolls sideways, at any width', async ({ page }) => {
  for (const width of [320, 375, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await hasHorizontalOverflow(page), `overflow at ${width}px`).toBe(false)
  }
})

test('the headline stays on one line in every language, at every width', async ({ page }) => {
  for (const width of [320, 375, 414, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const locale of LOCALES) {
      await page.goto(`/${locale}`)
      const fits = await page.locator('h1').evaluate((h) => {
        const range = document.createRange()
        range.selectNodeContents(h)
        // Against the parent: the h1 is w-fit, so its own box is the text box
        // and comparing the two would always pass.
        return {
          text: Math.ceil(range.getBoundingClientRect().width),
          box: (h.parentElement as HTMLElement).clientWidth,
        }
      })
      expect(fits.text, `${locale} headline wraps at ${width}px`).toBeLessThanOrEqual(fits.box)
    }
  }
})
