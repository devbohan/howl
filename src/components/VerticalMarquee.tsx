import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/**
 * Continuous vertical scroll driven by scrollTop rather than a CSS transform,
 * so the panel is a real scroll container: it gets a scrollbar, and the wheel,
 * a drag on the bar, and keyboard scrolling all work mid-animation.
 *
 * `children` is rendered twice so resetting scrollTop by half the height loops
 * without a visible seam — but only when there is actually more content than
 * fits. With two rows in a panel that holds three, the duplicate is not hiding
 * a seam, it is just the same headline printed twice, which reads as a bug.
 */
export function VerticalMarquee({
  children,
  label,
  speed = 14,
  className,
}: {
  children: ReactNode
  /** Names the scrollable region for screen readers. */
  label: string
  /** Pixels per second. Constant across panels so they read at the same pace. */
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const firstCopy = useRef<HTMLDivElement>(null)
  const paused = useRef(false)

  /**
   * Read synchronously on the first render: deciding this in an effect would
   * mount the clone and run the loop for a frame before switching off, which is
   * a visible twitch for exactly the readers who asked for no motion. Falls back
   * to animating when there is no window (server render).
   */
  const [animate, setAnimate] = useState(
    () => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setAnimate(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Re-measured on resize: the same panel overflows at one width and not another.
  useEffect(() => {
    const viewport = ref.current
    const copy = firstCopy.current
    if (!viewport || !copy) return

    const measure = () => setOverflows(copy.scrollHeight > viewport.clientHeight + 1)
    measure()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(copy)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [children])

  useEffect(() => {
    const el = ref.current
    if (!el || !animate || !overflows) return

    let raf = 0
    let last = performance.now()
    // Sub-pixel accumulator — scrollTop rounds, so stepping it directly stalls.
    let offset = el.scrollTop

    const step = (t: number) => {
      const dt = Math.min(t - last, 100)
      last = t
      if (!paused.current) {
        const half = el.scrollHeight / 2
        if (half > 0) {
          offset += (speed * dt) / 1000
          if (offset >= half) offset -= half
          el.scrollTop = offset
        }
      } else {
        // Keep in sync with wherever the user scrolled to while paused.
        offset = el.scrollTop
      }
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [animate, speed, overflows])

  const hold = () => {
    paused.current = true
  }
  const release = () => {
    paused.current = false
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        // Focusable so a keyboard user can scroll a panel whose rows are not
        // all links; a scroll container with no focusable child is otherwise
        // unreachable without a pointer.
        tabIndex={0}
        className={`ticker-viewport overflow-y-auto ${className ?? ''}`}
        style={{ '--ticker-speed': `${speed}` } as CSSProperties}
        onPointerEnter={hold}
        onPointerLeave={release}
        onFocusCapture={hold}
        onBlurCapture={release}
      >
        <div ref={firstCopy} className="flex flex-col">
          {children}
        </div>
        {animate && overflows && (
          // The clone exists only to make the loop seamless — hide it from
          // readers, and keep it out of the tab order (aria-hidden does not).
          <div className="flex flex-col" aria-hidden inert>
            {children}
          </div>
        )}
      </div>

      {/* Edge fades stop short of the scrollbar so the bar stays fully visible. */}
      <span className="pointer-events-none absolute inset-x-0 top-0 right-2 h-3 bg-gradient-to-b from-surface to-transparent" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 right-2 h-3 bg-gradient-to-t from-surface to-transparent" />
    </div>
  )
}
