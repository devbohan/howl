import { expect, test } from '@playwright/test'
import { hasHorizontalOverflow } from './helpers'

const SLUG = 'travis-scott-aj1-low-olive'

test.beforeEach(async ({ page }) => {
  await page.goto(`/en/drop/${SLUG}`)
})

test('renders the drop with its channels, friction and coverage', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Travis Scott')
  await expect(page.getByRole('heading', { name: 'Where to buy' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Friction Index' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Unboxings & coverage' })).toBeVisible()
})

test('carries the compliance disclaimer on the coverage section and in the footer', async ({ page }) => {
  await expect(page.getByText(/neither owns nor endorses/)).toBeVisible()
  await expect(page.getByText(/never enter raffles or handle payments/)).toBeVisible()
})

test('the countdown actually ticks', async ({ page }) => {
  // Under a day out, the countdown renders seconds — so its text must change.
  const countdown = page.getByTestId('countdown').first()
  const first = await countdown.innerText()
  await expect(countdown).not.toHaveText(first, { timeout: 5_000 })
})

test('every outbound link is safe, and store links are marked sponsored', async ({ page }) => {
  const external = page.locator('a[href^="http"]')
  const attrs = await external.evaluateAll((els) =>
    els.map((e) => ({ rel: e.getAttribute('rel') ?? '', target: e.getAttribute('target'), text: e.textContent ?? '' })),
  )
  expect(attrs.length).toBeGreaterThan(0)
  for (const a of attrs) {
    expect(a.target).toBe('_blank')
    expect(a.rel).toContain('noopener')
    expect(a.rel).toContain('noreferrer')
    expect(a.rel).toContain('nofollow')
  }
  const storeLinks = attrs.filter((a) => a.text.includes('Go to store'))
  expect(storeLinks.length).toBeGreaterThan(0)
  for (const a of storeLinks) expect(a.rel).toContain('sponsored')
})

test('back goes to the category, not the portal', async ({ page }) => {
  await page.getByRole('link', { name: /Sneakers/ }).first().click()
  await expect(page).toHaveURL('/en/c/sneakers')
})

test('prices follow the currency picker', async ({ page }) => {
  const price = page.locator('aside .font-mono').last()
  await page.getByLabel('Currency').selectOption('USD')
  await expect(page.locator('aside')).toContainText('$')
  await page.getByLabel('Currency').selectOption('EUR')
  await expect(page.locator('aside')).toContainText('€')
  await expect(price).toBeVisible()
})

test('an unknown slug shows a not-found notice rather than a blank page', async ({ page }) => {
  await page.goto('/en/drop/definitely-not-a-real-drop')
  await expect(page.getByText('Not found.')).toBeVisible()
})

test('holds together on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto(`/en/drop/${SLUG}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await hasHorizontalOverflow(page)).toBe(false)
})
