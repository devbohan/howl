import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

/**
 * Aceternity's lamp: two conic cones meeting at a lit horizon line, with the
 * heading rising into the light.
 *
 * Adapted in two ways that matter here. The cones are drawn from `--color-live`
 * and `--color-fg` rather than a fixed indigo, so the same component reads
 * correctly in both themes; and the heading is always in the DOM at full
 * opacity for a crawler — only its transform is animated, so a client with no
 * JavaScript still gets the text (R6.1).
 */
export function Lamp({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()

  const grow = reduced
    ? undefined
    : { initial: { opacity: 0.35, width: '14rem' }, whileInView: { opacity: 1, width: '28rem' } }

  return (
    <div className={cn('relative isolate flex flex-col items-center justify-center overflow-hidden', className)}>
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center" aria-hidden="true">
        <motion.div
          {...grow}
          transition={{ delay: 0.15, duration: 0.8, ease: 'easeInOut' }}
          style={{ backgroundImage: 'conic-gradient(var(--conic-position), var(--tw-gradient-stops))' }}
          className="lamp-cone absolute inset-auto right-1/2 h-56 w-[28rem] overflow-visible from-live/40 via-transparent to-transparent [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute bottom-0 left-0 z-20 h-40 w-full bg-ink [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute bottom-0 left-0 z-20 h-full w-40 bg-ink [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>

        <motion.div
          {...grow}
          transition={{ delay: 0.15, duration: 0.8, ease: 'easeInOut' }}
          style={{ backgroundImage: 'conic-gradient(var(--conic-position), var(--tw-gradient-stops))' }}
          className="lamp-cone absolute inset-auto left-1/2 h-56 w-[28rem] from-transparent via-transparent to-live/40 [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute bottom-0 right-0 z-20 h-full w-40 bg-ink [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute bottom-0 right-0 z-20 h-40 w-full bg-ink [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>

        {/* The lit horizon: a bright line with a bloom above it. */}
        <div className="absolute inset-auto z-30 h-32 w-56 -translate-y-24 rounded-full bg-live opacity-25 blur-2xl" />
        <motion.div
          initial={reduced ? undefined : { width: '8rem' }}
          whileInView={reduced ? undefined : { width: '16rem' }}
          transition={{ delay: 0.15, duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-auto z-30 h-0.5 w-64 -translate-y-[7rem] bg-live opacity-70"
        />
        <div className="absolute inset-auto z-40 h-36 w-full -translate-y-[11rem] bg-ink" />
      </div>

      {/* Content sits above every layer and is never itself animated in. */}
      <div className="relative z-50 -mt-24 flex w-full flex-col px-4">{children}</div>
    </div>
  )
}
