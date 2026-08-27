import { expect, test } from '@playwright/test'
import { CATEGORIES, coveragePanel, dropCards, hasHorizontalOverflow, newsPanel } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/en/c/sneakers')
})

test('heads the page with the category and offers a way back', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sneakers')
  await expect(page.getByRole('link', { name: /All categories/ })).toBeVisible()
})

test('shows only drops from this category', async ({ page }) => {
  const hrefs = await dropCards(page).evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''))
  test.skip(hrefs.length === 0, '这个品类还没有商品 —— 录入后会自动恢复')
  for (const href of hrefs) {
    await page.goto(href)
    await expect(page.getByRole('link', { name: /Sneakers/ }).first()).toBeVisible()
    await page.goBack()
  }
})

test('mounts both scrolling panels above the filters', async ({ page }) => {
  await expect(page.getByText('NEWS')).toBeVisible()
  await expect(page.getByText('Coverage')).toBeVisible()
  await expect(page.locator('.ticker-viewport')).toHaveCount(2)
})

test('the news panel scrolls on its own', async ({ page }) => {
  const panel = newsPanel(page)
  const start = await panel.evaluate((el) => el.scrollTop)
  await page.waitForTimeout(1200)
  const later = await panel.evaluate((el) => el.scrollTop)
  expect(later).not.toBe(start)
})

test('the panel is a real scroll container with room to scroll', async ({ page }) => {
  const metrics = await newsPanel(page).evaluate((el) => ({
    overflow: getComputedStyle(el).overflowY,
    scrollable: el.scrollHeight > el.clientHeight,
  }))
  expect(metrics.overflow).toBe('auto')
  expect(metrics.scrollable).toBe(true)
})

test('hovering pauses the scroll, and leaving resumes it', async ({ page }) => {
  const panel = newsPanel(page)
  await panel.hover()
  await page.waitForTimeout(400)
  const held = await panel.evaluate((el) => el.scrollTop)
  await page.waitForTimeout(700)
  expect(await panel.evaluate((el) => el.scrollTop)).toBe(held)

  await page.mouse.move(0, 0)
  await page.waitForTimeout(600)
  expect(await panel.evaluate((el) => el.scrollTop)).not.toBe(held)
})

test('the reader can scroll the panel by hand while it is paused', async ({ page }) => {
  const panel = newsPanel(page)
  await panel.hover()
  await panel.evaluate((el) => {
    el.scrollTop = 60
  })
  expect(await panel.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
})

test('coverage rows open externally and safely', async ({ page }) => {
  const links = coveragePanel(page).locator('a')
  const attrs = await links.evaluateAll((els) =>
    els.map((e) => ({ target: e.getAttribute('target'), rel: e.getAttribute('rel'), href: e.getAttribute('href') })),
  )
  expect(attrs.length).toBeGreaterThan(0)
  for (const a of attrs) {
    expect(a.target).toBe('_blank')
    expect(a.rel).toContain('noopener')
    expect(a.rel).toContain('nofollow')
    expect(a.href).toMatch(/^https:\/\//)
  }
})

test('filters collapse by default and narrow the list when applied', async ({ page }) => {
  await expect(page.getByText('Region')).toBeHidden()
  const before = await dropCards(page).count()

  await page.getByRole('button', { name: /Filters/ }).click()
  await expect(page.getByText('Region')).toBeVisible()
  await page.getByRole('button', { name: /Japan only/ }).click()

  const after = await dropCards(page).count()
  expect(after).toBeLessThanOrEqual(before)
  await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()

  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(dropCards(page)).toHaveCount(before)
})

test('every category page renders and stays within the viewport on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  for (const category of CATEGORIES) {
    await page.goto(`/en/c/${category}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await hasHorizontalOverflow(page), `overflow on ${category}`).toBe(false)
  }
})
