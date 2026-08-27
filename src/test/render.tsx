import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LocaleContext } from '../lib/i18n'
import { CurrencyContext } from '../lib/prefs'
import { ThemeContext } from '../lib/theme'
import type { Currency, Locale } from '../lib/types'

export interface Options extends Omit<RenderOptions, 'wrapper'> {
  locale?: Locale
  currency?: Currency
  /** Initial URL. Use with `path` when the component reads route params. */
  route?: string
  /** Route pattern to mount the element under, e.g. "/:locale/drop/:slug". */
  path?: string
}

/**
 * Renders inside the same providers App sets up, so components under test see
 * a real locale, currency and router without each test rebuilding the shell.
 */
export function renderApp(ui: ReactElement, options: Options = {}) {
  const { locale = 'en', currency = 'JPY', route = '/', path, ...rest } = options

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <LocaleContext.Provider value={locale}>
          <ThemeContext.Provider value={{ theme: 'dark', toggle: () => {} }}>
            <CurrencyContext.Provider value={currency}>
              {path ? <Routes><Route path={path} element={children} /></Routes> : children}
            </CurrencyContext.Provider>
          </ThemeContext.Provider>
        </LocaleContext.Provider>
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...rest })
}
