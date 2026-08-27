import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from '../Header'
import { LocaleContext } from '../../lib/i18n'
import { ThemeContext, type Theme } from '../../lib/theme'
import type { Currency, Locale } from '../../lib/types'

function Probe() {
  return <span data-testid="path">{useLocation().pathname}</span>
}

function setup({
  route = '/en/c/sneakers',
  locale = 'en' as Locale,
  currency = 'JPY' as Currency,
  theme = 'dark' as Theme,
} = {}) {
  const onCurrencyChange = vi.fn()
  const toggle = vi.fn()
  render(
    <MemoryRouter initialEntries={[route]}>
      <LocaleContext.Provider value={locale}>
        <ThemeContext.Provider value={{ theme, toggle }}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <Header currency={currency} onCurrencyChange={onCurrencyChange} />
                  <Probe />
                </>
              }
            />
          </Routes>
        </ThemeContext.Provider>
      </LocaleContext.Provider>
    </MemoryRouter>,
  )
  return { onCurrencyChange, toggle }
}

describe('Header', () => {
  it('sends the wordmark home in the current locale', () => {
    setup({ route: '/ja/drop/x', locale: 'ja' })
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/ja')
  })

  it('keeps you on the same page when you switch language', async () => {
    const user = userEvent.setup()
    setup({ route: '/en/c/sneakers' })
    await user.click(screen.getByRole('button', { name: '日本語' }))
    expect(screen.getByTestId('path')).toHaveTextContent('/ja/c/sneakers')
  })

  it('switches language from the portal without appending an empty segment', async () => {
    const user = userEvent.setup()
    setup({ route: '/en' })
    await user.click(screen.getByRole('button', { name: '简体' }))
    expect(screen.getByTestId('path')).toHaveTextContent('/zh-CN')
  })

  it('preserves a deep drop route across a language switch', async () => {
    const user = userEvent.setup()
    setup({ route: '/en/drop/travis-scott-aj1-low-olive' })
    await user.click(screen.getByRole('button', { name: '繁體' }))
    expect(screen.getByTestId('path')).toHaveTextContent('/zh-TW/drop/travis-scott-aj1-low-olive')
  })

  it('offers all four languages', () => {
    setup()
    for (const label of ['EN', '日本語', '简体', '繁體']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('reports currency changes upward', async () => {
    const user = userEvent.setup()
    const { onCurrencyChange } = setup()
    await user.selectOptions(screen.getByLabelText('Currency'), 'USD')
    expect(onCurrencyChange).toHaveBeenCalledWith('USD')
  })

  it('toggles the theme', async () => {
    const user = userEvent.setup()
    const { toggle } = setup()
    await user.click(screen.getByRole('button', { name: /Switch to light mode/i }))
    expect(toggle).toHaveBeenCalledOnce()
  })

  it('labels the theme button by the mode it switches to', () => {
    setup({ theme: 'light' })
    expect(screen.getByRole('button', { name: /Switch to dark mode/i })).toBeInTheDocument()
  })
})
