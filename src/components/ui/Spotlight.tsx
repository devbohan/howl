import { motion, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

/**
 * Aceternity's spotlight, rebuilt against our tokens.
 *
 * Two deliberate departures from the original:
 *  · it paints with `currentColor` instead of a hardcoded white, so the same
 *    component works in both themes rather than only on black;
 *  · under `prefers-reduced-motion` it renders as a still gradient rather than
 *    disappearing, because the glow is part of the composition, not decoration
 *    layered on top of it.
 */
export function Spotlight({ className, fill }: { className?: string; fill?: string }) {
  const reduced = useReducedMotion()

  return (
    <svg
      className={cn(
        'pointer-events-none absolute z-0 h-[169%] w-[138%] opacity-0 lg:w-[84%]',
        !reduced && 'animate-spotlight',
        reduced && 'opacity-100',
        className,
      )}
      viewBox="0 0 3787 2842"
      fill="none"
      aria-hidden="true"
    >
      <g filter="url(#spotlight-blur)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill ?? 'currentColor'}
          fillOpacity="0.16"
        />
      </g>
      <defs>
        <filter
          id="spotlight-blur"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur" />
        </filter>
      </defs>
    </svg>
  )
}

/**
 * Aurora wash for a hero. Kept behind the content and at low opacity so text
 * contrast is decided by the page background, not by wherever the gradient
 * happens to be — that is what keeps the axe pass green in both themes.
 */
export function Aurora({ className }: { className?: string }) {
  const reduced = useReducedMotion()

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <motion.div
        className="aurora absolute -inset-[40%] opacity-[0.13]"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={reduced ? undefined : { duration: 90, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}
