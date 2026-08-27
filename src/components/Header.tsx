import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LOCALE_LABELS, useT } from '../lib/i18n'
import { useTheme } from '../lib/theme'
import { CURRENCIES } from '../lib/format'
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
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        {/* The wordmark is hidden below sm, so the link needs its own name. */}
        <Link to={`/${locale}`} aria-label="HOWL" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-ink">
            {/* A signal going out — the howl that reaches you first. */}
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <circle cx="7" cy="12" r="2.4" fill="currentColor" />
              <path
                d="M11.5 7.5a6 6 0 0 1 0 9M15.5 4a10.5 10.5 0 0 1 0 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-extrabold tracking-[0.16em] text-fg">
              HOWL
            </span>
            <span className="mt-0.5 text-[10px] text-faint">{t('tagline')}</span>
          </span>
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
            className="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px] leading-none text-muted transition hover:text-fg"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
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
