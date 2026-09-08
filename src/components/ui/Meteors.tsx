import { useMemo } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

/**
 * Aceternity's meteors. Pure CSS animation on a handful of spans — the original
 * animates each one from JS, which on a page with several banners means a rAF
 * loop per streak for something nobody is meant to look at directly.
 *
 * The offsets are derived from the index rather than Math.random(), so the
 * prerendered HTML and the hydrated client agree; random positions would差 on
 * every build and show up as churn in the static snapshot.
 */
export function Meteors({ count = 14, className }: { count?: number; className?: string }) {
  const reduced = useReducedMotion()

  const streaks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 97) % 100}%`,
        delay: `${((i * 37) % 60) / 10}s`,
        duration: `${4 + ((i * 13) % 45) / 10}s`,
      })),
    [count],
  )

  if (reduced) return null

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {streaks.map((s, i) => (
        <span
          key={i}
          className="meteor absolute top-0 h-0.5 w-0.5 rotate-[215deg] rounded-full bg-fg/70"
          style={{ left: s.left, animationDelay: s.delay, animationDuration: s.duration }}
        />
      ))}
    </div>
  )
}
