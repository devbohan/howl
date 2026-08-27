import type { Page } from '@playwright/test'

export const LOCALES = ['en', 'ja', 'zh-CN', 'zh-TW'] as const
export const CATEGORIES = ['sneakers', 'tcg', 'figure', 'arttoy', 'goods', 'hardware'] as const

/** Category rows on the portal, in display order. */
export const portalRows = (page: Page) => page.locator('main a[href*="/c/"]')

/** Drop cards on a category page — excludes the ticker's own deep links. */
export const dropCards = (page: Page) =>
  page.locator('main a[href*="/drop/"]').filter({ hasNot: page.locator('.ticker-viewport') })

export const newsPanel = (page: Page) => page.locator('.ticker-viewport').first()
export const coveragePanel = (page: Page) => page.locator('.ticker-viewport').nth(1)

/** True when the document itself scrolls sideways — always a layout bug. */
export async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
}

/**
 * Switches language through whichever control the viewport actually shows:
 * a segmented button group from sm up, a select below it.
 */
export async function switchLocale(page: Page, label: string, value: string) {
  const picker = page.getByLabel('Language')
  if (await picker.isVisible()) {
    await picker.selectOption(value)
    return
  }
  await page.getByRole('button', { name: label, exact: true }).click()
}
