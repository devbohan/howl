import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

/**
 * jsdom ships no matchMedia. Several modules read it at first render
 * (theme detection, reduced-motion), so it has to exist before any test does.
 */
function stubMatchMedia(matches: (query: string) => boolean = () => false) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matches(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

/** Opt a single test into "user prefers reduced motion". */
export function preferReducedMotion() {
  stubMatchMedia((q) => q.includes('prefers-reduced-motion'))
}

/** Opt a single test into "system is in dark mode". */
export function preferDarkScheme() {
  stubMatchMedia((q) => q.includes('prefers-color-scheme: dark'))
}

beforeEach(() => {
  stubMatchMedia()
  // jsdom has no layout, so scrollHeight is 0 and the marquee loop would idle.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 16) as unknown as number)
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
  // jsdom has no layout engine, so scrollTo is unimplemented and noisy.
  vi.stubGlobal('scrollTo', vi.fn())
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  cleanup()
})
