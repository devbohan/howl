import { useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

/**
 * Aceternity's 3D card: the surface tilts toward the cursor.
 *
 * The rotation is written straight to the element's style rather than held in
 * React state — a card grid re-rendering on every mousemove is the thing that
 * makes this effect feel expensive on a list page.
 *
 * Skipped entirely under reduced motion, and driven only by mouse events, so a
 * touch device never gets a card stuck at an angle it cannot correct.
 */
export function Tilt3D({
  children,
  className,
  max = 7,
}: {
  children: ReactNode
  className?: string
  /** Degrees at the far edge. Small on purpose: a list of cards, not a hero. */
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const reduced = useReducedMotion()

  const tilt = (event: React.MouseEvent) => {
    const el = ref.current
    if (!el || reduced) return
    const r = el.getBoundingClientRect()
    const x = (event.clientX - r.left) / r.width - 0.5
    const y = (event.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--tilt-x', `${(-y * max).toFixed(2)}deg`)
    el.style.setProperty('--tilt-y', `${(x * max).toFixed(2)}deg`)
  }

  const reset = () => {
    setActive(false)
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <div className={cn('tilt-3d-scene', className)}>
      <div
        ref={ref}
        onMouseMove={tilt}
        onMouseEnter={() => !reduced && setActive(true)}
        onMouseLeave={reset}
        className={cn('tilt-3d h-full', active && 'is-tilting')}
      >
        {children}
      </div>
    </div>
  )
}
