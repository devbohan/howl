import { useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

/**
 * Aceternity's card-spotlight: a soft light that follows the cursor.
 *
 * Pointer position is written to CSS custom properties rather than to React
 * state on every mousemove — a state update per frame would re-render the whole
 * card list, and this sits on a grid of them.
 *
 * The glow is purely decorative: it never sits above text, and it is skipped
 * entirely under reduced motion and on touch devices, where a cursor-following
 * highlight has nothing to follow.
 */
export function GlowCard({
  children,
  className,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'article'
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null)
  const [lit, setLit] = useState(false)
  const reduced = useReducedMotion()

  const track = (event: React.MouseEvent) => {
    const el = ref.current
    if (!el || reduced) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--glow-x', `${event.clientX - rect.left}px`)
    el.style.setProperty('--glow-y', `${event.clientY - rect.top}px`)
  }

  return (
    <Tag
      // @ts-expect-error — the ref type follows the polymorphic tag
      ref={ref}
      onMouseMove={track}
      onMouseEnter={() => !reduced && setLit(true)}
      onMouseLeave={() => setLit(false)}
      className={cn('glow-card relative overflow-hidden', lit && 'is-lit', className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}
