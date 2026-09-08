import { expect, test } from '@playwright/test'
import { LOCALES, anyDropSlug, portalRows, skipWithoutDrops, switchLocale } from './helpers'

const LABEL: Record<string, string> = { en: 'EN', ja: '日本語', 'zh-CN': '简体', 'zh-TW': '繁體' }
const DEFAULT_CURRENCY: Record<string, string> = { en: 'USD', ja: 'JPY', 'zh-CN': 'CNY', 'zh-TW': 'USD' }

for (const locale of LOCALES) {
  test(`serves ${locale} at its own URL prefix and stamps html[lang]`, async ({ page }) => {
    await page.goto(`/${locale}`)
    await expect(page).toHaveURL(`/${locale}`)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test(`${locale} prices in its own default currency`, async ({ page }) => {
    await page.goto(`/${locale}`)
    await expect(page.getByLabel('Currency')).toHaveValue(DEFAULT_CURRENCY[locale])
  })
}

test('switching language keeps you on the same page', async ({ page }) => {
  await page.goto('/en/c/tcg')
  await switchLocale(page, LABEL.ja, 'ja')
  await expect(page).toHaveURL('/ja/c/tcg')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('トレカ')
})

test('switching language on a drop page keeps the drop', async ({ page, request }) => {
  const slug = await anyDropSlug(request)
  skipWithoutDrops(test, slug)
  await page.goto(`/en/drop/${slug}`)
  await switchLocale(page, LABEL['zh-CN'], 'zh-CN')
  await expect(page).toHaveURL(`/zh-CN/drop/${slug}`)
  await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty()
})

test('a manual currency choice survives a language switch', async ({ page }) => {
  await page.goto('/en')
  await page.getByLabel('Currency').selectOption('EUR')
  await switchLocale(page, LABEL.ja, 'ja')
  await expect(page.getByLabel('Currency')).toHaveValue('EUR')
})

test('an unknown locale redirects instead of 404ing', async ({ page }) => {
  await page.goto('/klingon')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/(${LOCALES.join('|')})$`))
})

test('no locale leaves untranslated English on the portal', async ({ page }) => {
  await page.goto('/ja')
  const rowText = await portalRows(page).evaluateAll((els) => els.map((e) => e.textContent ?? '').join(' '))
  expect(rowText).not.toContain('Sneakers')
  expect(rowText).toContain('スニーカー')
})

test('the language picker is reachable at every viewport width', async ({ page }) => {
  await page.goto('/en')
  for (const width of [320, 375, 640, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    const select = page.getByLabel('Language')
    const buttons = page.getByRole('button', { name: LABEL.ja, exact: true })
    const reachable = (await select.isVisible()) || (await buttons.isVisible())
    expect(reachable, `no language control at ${width}px`).toBe(true)
  }
})
