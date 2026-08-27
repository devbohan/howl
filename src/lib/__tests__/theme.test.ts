import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, readTheme } from '../theme'
import { preferDarkScheme } from '../../test/setup'

const STORAGE_KEY = 'howl-theme'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('readTheme', () => {
  it('uses a stored preference over the system setting', () => {
    localStorage.setItem(STORAGE_KEY, 'light')
    preferDarkScheme()
    expect(readTheme()).toBe('light')
  })

  it('falls back to the system setting when nothing is stored', () => {
    preferDarkScheme()
    expect(readTheme()).toBe('dark')
  })

  it('reports light when the system is not dark', () => {
    expect(readTheme()).toBe('light')
  })

  it('ignores a corrupt stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'chartreuse')
    expect(readTheme()).toBe('light')
  })

  it('falls back to dark when storage throws, as in private mode', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readTheme()).toBe('dark')
  })
})

describe('applyTheme', () => {
  it('stamps the root element so the CSS variables switch', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('persists the choice', () => {
    applyTheme('light')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('still applies the theme when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => applyTheme('dark')).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('matches the key the pre-paint script in index.html reads', () => {
    applyTheme('dark')
    expect(Object.keys(localStorage)).toContain('howl-theme')
  })
})
