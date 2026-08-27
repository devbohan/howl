import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { VerticalMarquee } from '../VerticalMarquee'
import { preferReducedMotion } from '../../test/setup'

describe('VerticalMarquee', () => {
  it('renders the content twice so the loop has no seam', () => {
    render(
      <VerticalMarquee>
        <span>row</span>
      </VerticalMarquee>,
    )
    expect(screen.getAllByText('row')).toHaveLength(2)
  })

  it('hides the duplicate from assistive tech', () => {
    const { container } = render(
      <VerticalMarquee>
        <span>row</span>
      </VerticalMarquee>,
    )
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
    // Only one copy is reachable by accessible name.
    expect(screen.getAllByText('row', { ignore: '[aria-hidden="true"] *' })).toHaveLength(1)
  })

  it('renders a single copy when the user prefers reduced motion', () => {
    preferReducedMotion()
    render(
      <VerticalMarquee>
        <span>row</span>
      </VerticalMarquee>,
    )
    expect(screen.getAllByText('row')).toHaveLength(1)
  })

  it('is a real scroll container so the scrollbar works', () => {
    const { container } = render(
      <VerticalMarquee className="h-36">
        <span>row</span>
      </VerticalMarquee>,
    )
    const viewport = container.querySelector('.ticker-viewport')
    expect(viewport?.className).toContain('overflow-y-auto')
    expect(viewport?.className).toContain('h-36')
  })

  it('puts the edge fades outside the scroll area and clear of the scrollbar', () => {
    const { container } = render(
      <VerticalMarquee>
        <span>row</span>
      </VerticalMarquee>,
    )
    const fades = container.querySelectorAll('.pointer-events-none')
    expect(fades).toHaveLength(2)
    for (const fade of fades) {
      expect(fade.className).toContain('right-2')
      expect(fade.closest('.ticker-viewport')).toBeNull()
    }
  })
})

describe('VerticalMarquee scrolling', () => {
  /** jsdom has no layout, so the loop needs a scrollHeight to work against. */
  function withHeight(height: number) {
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(height)
    return () => spy.mockRestore()
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function mount(speed = 100) {
    const { container } = render(
      <VerticalMarquee speed={speed}>
        <span>row</span>
      </VerticalMarquee>,
    )
    return container.querySelector('.ticker-viewport') as HTMLElement
  }

  it('advances scrollTop over time', () => {
    const restore = withHeight(400)
    try {
      const viewport = mount(100)
      expect(viewport.scrollTop).toBe(0)
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(viewport.scrollTop).toBeGreaterThan(0)
    } finally {
      restore()
    }
  })

  it('wraps at half the height so the loop is seamless', () => {
    const restore = withHeight(400)
    try {
      const viewport = mount(1000)
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      // Half of 400 is 200; a full second at 1000px/s must have wrapped.
      expect(viewport.scrollTop).toBeLessThan(200)
    } finally {
      restore()
    }
  })

  it('pauses while the pointer is over the panel and resumes after', () => {
    const restore = withHeight(400)
    try {
      const viewport = mount(100)
      act(() => {
        vi.advanceTimersByTime(200)
      })
      fireEvent.pointerEnter(viewport)
      const held = viewport.scrollTop

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(viewport.scrollTop).toBe(held)

      fireEvent.pointerLeave(viewport)
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(viewport.scrollTop).toBeGreaterThan(held)
    } finally {
      restore()
    }
  })

  it('picks up wherever the reader scrolled to while paused', () => {
    const restore = withHeight(400)
    try {
      const viewport = mount(100)
      fireEvent.pointerEnter(viewport)
      viewport.scrollTop = 150
      act(() => {
        vi.advanceTimersByTime(100)
      })
      fireEvent.pointerLeave(viewport)
      act(() => {
        vi.advanceTimersByTime(100)
      })
      // It continues from 150 rather than snapping back to where it paused.
      expect(viewport.scrollTop).toBeGreaterThanOrEqual(150)
    } finally {
      restore()
    }
  })

  it('never scrolls when the reader prefers reduced motion', () => {
    preferReducedMotion()
    const restore = withHeight(400)
    try {
      const viewport = mount(1000)
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect(viewport.scrollTop).toBe(0)
    } finally {
      restore()
    }
  })
})
