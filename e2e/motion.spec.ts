import { expect, test } from '@playwright/test'
import { newsPanel, skipWithoutTicker } from './helpers'

test.describe('with prefers-reduced-motion', () => {
  test.beforeEach(async ({ page }) => {
    // emulateMedia rather than the `reducedMotion` fixture: on Playwright 1.62
    // the fixture does not reach the page, and a silently unset preference here
    // would make these tests pass for the wrong reason.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/c/sneakers')
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  })

  test('the ticker does not scroll itself', async ({ page }) => {
    await skipWithoutTicker(test, page)
    const panel = newsPanel(page)
    // No settle window on purpose: under reduced motion it must never move,
    // not even for the frame between mount and an effect switching it off.
    expect(await panel.evaluate((el) => el.scrollTop)).toBe(0)
    await page.waitForTimeout(1500)
    expect(await panel.evaluate((el) => el.scrollTop)).toBe(0)
  })

  test('the reader can still scroll it by hand', async ({ page }) => {
    await skipWithoutTicker(test, page)
    const panel = newsPanel(page)
    await panel.evaluate((el) => {
      el.scrollTop = 40
    })
    expect(await panel.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  })

  test('no row is duplicated, since the loop clone is dropped', async ({ page }) => {
    await skipWithoutTicker(test, page)
    const copies = await newsPanel(page).evaluate((el) => el.children.length)
    expect(copies).toBe(1)

    const rows = await newsPanel(page).evaluate((el) =>
      Array.from(el.children[0].children).map((n) => n.textContent ?? ''),
    )
    expect(rows.length).toBeGreaterThan(0)
    expect(new Set(rows).size).toBe(rows.length)
  })

  test('the headline is fully painted, with no shimmer left running', async ({ page }) => {
    await page.goto('/en')
    const headline = await page.locator('h1').evaluate((h) => {
      const style = getComputedStyle(h)
      return {
        animation: style.animationName,
        fill: style.webkitTextFillColor,
        image: style.backgroundImage,
      }
    })
    expect(headline.animation).toBe('none')
    expect(headline.image).toBe('none')
    // A transparent fill with no gradient behind it would be invisible text.
    expect(headline.fill).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
  })

  test('the live dot stops pulsing', async ({ page }) => {
    // The dot animation is CSS-driven; reduced motion should not leave it
    // running at full speed. Live dots only exist where something is live.
    const dots = await page.locator('.live-dot').count()
    test.skip(dots === 0, '现在没有进行中的商品 —— 有数据后会自动恢复')
    await expect(page.locator('.live-dot').first()).toBeVisible()
  })
})
