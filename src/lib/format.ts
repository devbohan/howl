import type { Currency, Locale } from './types'

/** Mock FX rates — a real build refreshes these hourly from a Worker cron. */
const RATES: Record<Currency, number> = { JPY: 1, USD: 0.0067, EUR: 0.0062, CNY: 0.048 }

export const CURRENCIES: Currency[] = ['JPY', 'USD', 'EUR', 'CNY']

export function convert(amount: number, from: Currency, to: Currency) {
  const jpy = amount / RATES[from]
  return jpy * RATES[to]
}

export function formatPrice(amount: number, from: Currency, to: Currency, locale: Locale) {
  const value = convert(amount, from, to)
  const fractionDigits = to === 'JPY' ? 0 : value >= 1000 ? 0 : 2
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: to,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatDateTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function localTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}
