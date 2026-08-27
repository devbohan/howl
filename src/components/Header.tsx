import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LOCALE_LABELS, useT } from '../lib/i18n'
import { useTheme } from '../lib/theme'
import { CURRENCIES } from '../lib/format'
import { Logo } from './Logo'
import { MoonMark, SunMark } from './icons'
import { LOCALES, type Currency, type Locale } from '../lib/types'

export function Header({
  currency,
  onCurrencyChange,
}: {
  currency: Currency
  onCurrencyChange: (next: Currency) => void
}) {
  const { t, locale } = useT()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const switchLocale = (next: Locale) => {
    const rest = pathname.split('/').slice(2).join('/')
    navigate(`/${next}${rest ? `/${rest}` : ''}`)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-4">
        {/* The tagline is hidden below sm, so the link carries its own name. */}
        <Link to={`/${locale}`} aria-label="HOWL" className="flex items-center gap-3">
          <Logo className="h-4.5 w-auto shrink-0 text-fg sm:h-6" />
          <span className="hidden max-w-[13rem] text-[10px] leading-tight text-faint lg:block">
            {t('tagline')}
          </span>
        </Link>

        {/* Hidden on the narrowest phones — the row is already full there. */}
        <Link
          to={`/${locale}/wants`}
          className="hidden text-[11px] font-medium text-muted transition hover:text-fg sm:block"
        >
          {t('wantsNav')}
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="rounded-md border border-line bg-surface px-2 py-1.5 font-mono text-[12px] text-muted outline-none hover:text-fg focus:border-faint"
            aria-label="Currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/*
            The segmented control only fits from sm up. Below that it becomes a
            select — a four-language site must never strand a phone user in a
            language they cannot read.
          */}
          <select
            value={locale}
            onChange={(e) => switchLocale(e.target.value as Locale)}
            aria-label="Language"
            className="rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] text-muted outline-none hover:text-fg focus:border-faint sm:hidden"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l]}
              </option>
            ))}
          </select>

          <div className="hidden items-center rounded-md border border-line bg-surface p-0.5 sm:flex">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => switchLocale(l)}
                className={`rounded px-2 py-1 text-[11px] font-medium transition ${
                  l === locale ? 'bg-surface-2 text-fg' : 'text-faint hover:text-muted'
                }`}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center rounded-md border border-line bg-surface px-2 py-1.5 text-muted transition hover:text-fg"
          >
            {theme === 'dark' ? <SunMark /> : <MoonMark />}
          </button>

          <button
            type="button"
            className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-bold text-accent-ink transition hover:bg-accent-dim"
          >
            {t('navVip')}
          </button>
        </div>
      </div>
    </header>
  )
}
