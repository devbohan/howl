import { describe, expect, it } from 'vitest'
import { CURRENCIES, convert, formatDateTime, formatPrice, formatRelative, localTimeZone } from '../format'

describe('convert', () => {
  it('is identity within one currency', () => {
    expect(convert(1234, 'JPY', 'JPY')).toBe(1234)
    expect(convert(99, 'USD', 'USD')).toBeCloseTo(99, 10)
  })

  it('round-trips through a third currency', () => {
    const there = convert(10_000, 'JPY', 'USD')
    expect(convert(there, 'USD', 'JPY')).toBeCloseTo(10_000, 6)
  })

  it('scales linearly', () => {
    expect(convert(200, 'JPY', 'USD')).toBeCloseTo(2 * convert(100, 'JPY', 'USD'), 10)
  })

  it('handles zero', () => {
    for (const c of CURRENCIES) expect(convert(0, 'JPY', c)).toBe(0)
  })
})

describe('formatPrice', () => {
  it('renders JPY without decimals', () => {
    expect(formatPrice(24_200, 'JPY', 'JPY', 'en')).toBe('¥24,200')
  })

  it('converts into the display currency', () => {
    const usd = formatPrice(10_000, 'JPY', 'USD', 'en')
    expect(usd).toMatch(/^\$\d/)
  })

  it('keeps cents on small non-JPY amounts but drops them above 1000', () => {
    expect(formatPrice(10, 'USD', 'USD', 'en')).toBe('$10.00')
    expect(formatPrice(5000, 'USD', 'USD', 'en')).toBe('$5,000')
  })

  it('follows the locale numbering conventions', () => {
    expect(formatPrice(1_000_000, 'JPY', 'JPY', 'ja')).toContain('￥')
  })
})

describe('formatDateTime', () => {
  it('renders an ISO string in the given locale', () => {
    const out = formatDateTime('2026-03-04T05:06:00.000Z', 'en')
    expect(out).toMatch(/2026/)
  })

  it('differs between locales', () => {
    const iso = '2026-03-04T05:06:00.000Z'
    expect(formatDateTime(iso, 'ja')).not.toBe(formatDateTime(iso, 'en'))
  })
})

describe('formatRelative', () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0)

  it('accepts both an ISO string and a timestamp', () => {
    const iso = new Date(now - 300_000).toISOString()
    expect(formatRelative(iso, 'en', now)).toBe(formatRelative(now - 300_000, 'en', now))
  })

  // The formatter uses Intl's `narrow` style: "12m ago", not "12 minutes ago".
  it('uses seconds under a minute', () => {
    expect(formatRelative(now - 30_000, 'en', now)).toBe('30s ago')
  })

  it('uses minutes under an hour', () => {
    expect(formatRelative(now - 12 * 60_000, 'en', now)).toBe('12m ago')
  })

  it('uses hours under a day', () => {
    expect(formatRelative(now - 5 * 3_600_000, 'en', now)).toBe('5h ago')
  })

  it('uses days beyond that', () => {
    expect(formatRelative(now - 3 * 86_400_000, 'en', now)).toBe('3d ago')
  })

  it('handles the future direction', () => {
    expect(formatRelative(now + 10 * 60_000, 'en', now)).toBe('in 10m')
  })

  it('switches unit exactly at each boundary', () => {
    expect(formatRelative(now - 59_400, 'en', now)).toBe('59s ago')
    // Rounds up past the unit limit, so it promotes instead of saying "60s".
    expect(formatRelative(now - 59_999, 'en', now)).toBe('1m ago')
    expect(formatRelative(now - 60_000, 'en', now)).toBe('1m ago')
    expect(formatRelative(now - 3_599_999, 'en', now)).toBe('1h ago')
    expect(formatRelative(now - 3_600_000, 'en', now)).toBe('1h ago')
    // numeric: 'auto' deliberately words a single day as "yesterday".
    expect(formatRelative(now - 86_399_999, 'en', now)).toBe('yesterday')
    expect(formatRelative(now - 86_400_000, 'en', now)).toBe('yesterday')
  })

  it('localises the wording', () => {
    expect(formatRelative(now - 12 * 60_000, 'ja', now)).toContain('分')
    expect(formatRelative(now - 12 * 60_000, 'zh-CN', now)).toContain('分钟')
  })
})

describe('localTimeZone', () => {
  it('returns an IANA-looking zone name', () => {
    expect(localTimeZone()).toMatch(/^[A-Za-z]+(\/[A-Za-z_+\-0-9]+)*$/)
  })
})
