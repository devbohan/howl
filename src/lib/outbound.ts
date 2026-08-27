import type { Locale } from './types'

/**
 * Outbound click tracking. This is the only number a retailer cares about —
 * not pageviews, but how many buyers we actually sent them — and it cannot be
 * measured retroactively, so it has to exist before the traffic does.
 *
 * Nothing here identifies a person: a drop slug, which channel, which language,
 * and a timestamp. That is everything the report needs and nothing more.
 */
export type OutboundKind = 'store' | 'coverage' | 'news'

export interface OutboundClick {
  kind: OutboundKind
  /** Destination host only — never the full URL with its tracking params. */
  host: string
  locale: Locale
  /** Drop slug for store clicks; category or feed id otherwise. */
  context?: string
  /** Channel id, so the report can be broken down per retailer. */
  channelId?: string
  /** Whether we earn on this link — separates revenue clicks from the rest. */
  affiliate?: boolean
  at: string
}

const QUEUE_KEY = 'howl-clicks-pending'

export function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return 'invalid'
  }
}

function queued(): OutboundClick[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as OutboundClick[]
  } catch {
    return []
  }
}

function setQueue(clicks: OutboundClick[]) {
  try {
    // Cap it: a queue that never drains should not grow without bound.
    localStorage.setItem(QUEUE_KEY, JSON.stringify(clicks.slice(-200)))
  } catch {
    /* private mode — the click is simply lost, which is acceptable here */
  }
}

/**
 * sendBeacon rather than fetch: the browser is navigating away, and beacon is
 * the one transport guaranteed to survive that. A failed beacon is queued and
 * retried on the next page load instead of being dropped silently.
 */
export function trackOutbound(click: Omit<OutboundClick, 'at'>) {
  const payload: OutboundClick = { ...click, at: new Date().toISOString() }
  try {
    const blob = new Blob([JSON.stringify([payload])], { type: 'application/json' })
    if (navigator.sendBeacon?.('/api/clicks', blob)) return true
  } catch {
    /* fall through to the queue */
  }
  setQueue([...queued(), payload])
  return false
}

/** Retries anything a previous navigation could not send. Call once on mount. */
export async function flushOutbound(): Promise<number> {
  const pending = queued()
  if (pending.length === 0) return 0
  try {
    const response = await fetch('/api/clicks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pending),
      keepalive: true,
    })
    if (!response.ok) return 0
    setQueue([])
    return pending.length
  } catch {
    return 0
  }
}
