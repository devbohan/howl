import { expect, test } from '@playwright/test'

const root = (page: import('@playwright/test').Page) => page.locator('html')

test('starts in the system theme when nothing is stored', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/en')
  await expect(root(page)).toHaveAttribute('data-theme', 'dark')

  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/en')
  await expect(root(page)).toHaveAttribute('data-theme', 'light')
})

test('toggles, persists across a reload, and beats the system setting', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/en')
  await page.getByRole('button', { name: /Switch to light mode/i }).click()
  await expect(root(page)).toHaveAttribute('data-theme', 'light')

  await page.reload()
  await expect(root(page)).toHaveAttribute('data-theme', 'light')
  expect(await page.evaluate(() => localStorage.getItem('howl-theme'))).toBe('light')
})

test('applies the theme before first paint, so there is no flash', async ({ page }) => {
  await page.goto('/en')
  await page.evaluate(() => localStorage.setItem('howl-theme', 'light'))
  await page.emulateMedia({ colorScheme: 'dark' })

  // Read the attribute as early as the document allows: if the inline script in
  // index.html were removed, this would still be unset at this point.
  await page.goto('/en', { waitUntil: 'commit' })
  const early = await page.evaluate(() => document.documentElement.dataset.theme)
  expect(early).toBe('light')
})

test('repaints the page, not just the attribute', async ({ page }) => {
  await page.goto('/en')
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  await page.getByRole('button', { name: /Switch to (light|dark) mode/i }).click()
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(light).not.toBe(dark)
})

test('keeps the accent readable as text in both themes', async ({ page }) => {
  await page.goto('/en')
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t
    }, theme)
    const { fg, bg } = await page.evaluate(() => {
      const probe = document.createElement('span')
      probe.className = 'text-accent-fg'
      document.body.append(probe)
      const fg = getComputedStyle(probe).color
      const bg = getComputedStyle(document.body).backgroundColor
      probe.remove()
      return { fg, bg }
    })
    expect(fg, `accent text collapses into the background in ${theme}`).not.toBe(bg)
  }
})
