import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import type { Decorator, Preview } from '@storybook/react-vite'
import '../src/index.css'
import { LocaleContext } from '../src/lib/i18n'
import { CurrencyContext } from '../src/lib/prefs'
import { ThemeContext, type Theme } from '../src/lib/theme'
import type { Currency, Locale } from '../src/lib/types'

/** Mirrors the provider stack App mounts, so stories match the real app. */
const withProviders: Decorator = (Story, context) => {
  const theme = context.globals.theme as Theme
  const locale = context.globals.locale as Locale
  const currency = context.globals.currency as Currency

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  return (
    <MemoryRouter initialEntries={[`/${locale}`]}>
      <LocaleContext.Provider value={locale}>
        <ThemeContext.Provider value={{ theme, toggle: () => {} }}>
          <CurrencyContext.Provider value={currency}>
            <div className="bg-ink p-6 text-fg">
              <Story />
            </div>
          </CurrencyContext.Provider>
        </ThemeContext.Provider>
      </LocaleContext.Provider>
    </MemoryRouter>
  )
}

const preview: Preview = {
  decorators: [withProviders],
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Language',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'EN' },
          { value: 'ja', title: '日本語' },
          { value: 'zh-CN', title: '简体' },
          { value: 'zh-TW', title: '繁體' },
        ],
        dynamicTitle: true,
      },
    },
    currency: {
      description: 'Display currency',
      toolbar: {
        icon: 'paintbrush',
        items: ['JPY', 'USD', 'EUR', 'CNY'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark', locale: 'en', currency: 'JPY' },
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // Every story is checked; the same rules the Playwright axe pass enforces.
    a11y: { test: 'error' },
  },
}

export default preview
