import { useEffect, useState } from 'react'

/** How often the category feeds are considered stale. */
export const FEED_REFRESH_MS = 30 * 60_000

/**
 * Returns the moment the feed was last refreshed, ticking every `intervalMs`.
 * Also fires when a backgrounded tab comes back and the data has already gone
 * stale — browsers throttle timers in hidden tabs, so the interval alone would
 * leave a tab that sat overnight showing yesterday's feed until it caught up.
 *
 * In the production build this is the dependency the CMS fetch hangs off.
 */
export function useRefresh(intervalMs = FEED_REFRESH_MS) {
  const [refreshedAt, setRefreshedAt] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setRefreshedAt(Date.now()), intervalMs)

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      setRefreshedAt((prev) => (Date.now() - prev >= intervalMs ? Date.now() : prev))
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])

  return refreshedAt
}
