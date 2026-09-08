import type { ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

/**
 * Aceternity's moving-border button, reduced to CSS so it costs nothing per
 * frame in JS. A conic gradient rotates behind the button and is masked to the
 * one-pixel edge, which is the same effect the original animates with motion
 * values but without a rAF loop per instance.
 *
 * Reserved for the single primary action on a surface: an outline that moves is
 * a strong claim on attention, and it stops meaning anything if everything has
 * one.
 */
export function MovingBorder({
  children,
  className,
  as: Tag = 'button',
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: 'button' | 'a' | 'span'
} & React.HTMLAttributes<HTMLElement>) {
  const reduced = useReducedMotion()

  return (
    <Tag
      className={cn(
        'moving-border relative inline-flex items-center justify-center rounded-md',
        !reduced && 'is-moving',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
