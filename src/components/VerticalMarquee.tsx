import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Continuous vertical scroll driven by scrollTop rather than a CSS transform,
 * so the panel is a real scroll container: it gets a scrollbar, and the wheel,
 * a drag on the bar, and keyboard scrolling all work mid-animation.
 *
 * `children` is rendered twice — the clone is aria-hidden and exists only so
 * resetting scrollTop by half the height loops without a visible seam.
 */
export function VerticalMarquee({
  children,
  speed = 14,
  className,
}: {
  children: ReactNode
  /** Pixels per second. Constant across panels so they read at the same pace. */
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setAnimate(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !animate) return

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
  }, [animate, speed])

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
        className={`ticker-viewport overflow-y-auto ${className ?? ''}`}
        onPointerEnter={hold}
        onPointerLeave={release}
        onFocusCapture={hold}
        onBlurCapture={release}
      >
        <div className="flex flex-col">{children}</div>
        {animate && (
          // inert as well as aria-hidden: without it the duplicated links stay
          // in the tab order, so keyboard users walk the same rows twice.
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
