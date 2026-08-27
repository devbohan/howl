import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { CategoryPage } from './pages/CategoryPage'
import { ItemPage } from './pages/ItemPage'
import { PortalPage } from './pages/PortalPage'
import { WantsPage } from './pages/WantsPage'
import { LocaleContext } from './lib/i18n'
import { CurrencyContext } from './lib/prefs'
import { ThemeContext, applyTheme, readTheme, type Theme } from './lib/theme'
import { flushOutbound } from './lib/outbound'
import { LOCALES, type Currency, type Locale } from './lib/types'

const DEFAULT_CURRENCY: Record<Locale, Currency> = {
  en: 'USD',
  ja: 'JPY',
  'zh-CN': 'CNY',
  'zh-TW': 'USD',
}

function detectLocale(): Locale {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en'
  if (nav.startsWith('ja')) return 'ja'
  if (nav.startsWith('zh')) return /TW|HK|Hant/i.test(nav) ? 'zh-TW' : 'zh-CN'
  return 'en'
}

/**
 * Locale lives in the URL rather than in state — the production build renders
 * these paths server-side so each language is independently indexable.
 */
function LocaleShell() {
  const { locale } = useParams()
  const [currency, setCurrency] = useState<Currency>('JPY')
  const [touchedCurrency, setTouchedCurrency] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => readTheme())

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }

  const valid = LOCALES.includes(locale as Locale)

  useEffect(() => {
    if (valid) document.documentElement.lang = locale as string
  }, [locale, valid])

  // Clicks that could not be sent while the browser was navigating away.
  useEffect(() => {
    void flushOutbound()
  }, [])

  useEffect(() => {
    if (valid && !touchedCurrency) setCurrency(DEFAULT_CURRENCY[locale as Locale])
  }, [locale, valid, touchedCurrency])

  if (!valid) return <Navigate to={`/${detectLocale()}`} replace />

  return (
    <LocaleContext.Provider value={locale as Locale}>
      <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
        <CurrencyContext.Provider value={currency}>
        <div className="page-grid min-h-screen">
          <Header
            currency={currency}
            onCurrencyChange={(next) => {
              setTouchedCurrency(true)
              setCurrency(next)
            }}
          />
          <main>
            <Routes>
              <Route index element={<PortalPage />} />
              <Route path="c/:category" element={<CategoryPage />} />
              <Route path="drop/:slug" element={<ItemPage />} />
              <Route path="wants" element={<WantsPage />} />
              <Route path="*" element={<Navigate to={`/${locale}`} replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
        </CurrencyContext.Provider>
      </ThemeContext.Provider>
    </LocaleContext.Provider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${detectLocale()}`} replace />} />
      <Route path="/:locale/*" element={<LocaleShell />} />
    </Routes>
  )
}
