import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { FEED_REFRESH_MS, useRefresh } from '../useRefresh'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useRefresh', () => {
  it('refreshes on a 30-minute cadence by default', () => {
    expect(FEED_REFRESH_MS).toBe(30 * 60_000)

    const { result } = renderHook(() => useRefresh())
    const first = result.current

    act(() => {
      vi.advanceTimersByTime(FEED_REFRESH_MS - 1)
    })
    expect(result.current).toBe(first)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBeGreaterThan(first)
  })

  it('honours a custom interval', () => {
    const { result } = renderHook(() => useRefresh(1_000))
    const first = result.current
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(result.current).toBeGreaterThan(first)
  })

  it('refreshes when a hidden tab comes back stale', () => {
    const { result } = renderHook(() => useRefresh(1_000))
    const first = result.current

    setVisibility('hidden')
    // Timers are throttled in a real hidden tab, so simulate the clock moving
    // on without the interval firing.
    vi.setSystemTime(Date.now() + 5_000)

    act(() => {
      setVisibility('visible')
    })
    expect(result.current).toBeGreaterThan(first)
  })

  it('does not refresh when a tab comes back while still fresh', () => {
    const { result } = renderHook(() => useRefresh(FEED_REFRESH_MS))
    const first = result.current

    setVisibility('hidden')
    act(() => {
      setVisibility('visible')
    })
    expect(result.current).toBe(first)
  })

  it('stops ticking and unsubscribes once unmounted', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useRefresh(1_000))
    unmount()
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    // No act() wrapper needed: a ticking timer here would warn about updating
    // an unmounted component, which is exactly what we are asserting against.
    vi.advanceTimersByTime(10_000)
  })
})
