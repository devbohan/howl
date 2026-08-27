/**
 * Hand-drawn line icons in the wordmark's register: one weight, round caps,
 * currentColor only. No emoji anywhere in the UI — they carry a different
 * visual language on every platform and never match the brand.
 */

/** Rising trend — marks the hottest rows in a feed. */
export function HeatMark({ className = 'h-2.5 w-2.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true">
      <path
        d="M1 9.5 4.2 5.6l2.4 2 3.4-4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.6 3.2h2.7v2.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SunMark({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3.1 3.1l1.3 1.3M11.6 11.6l1.3 1.3M12.9 3.1l-1.3 1.3M4.4 11.6l-1.3 1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MoonMark({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="M13.4 9.8A5.8 5.8 0 0 1 6.2 2.6a5.9 5.9 0 1 0 7.2 7.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CheckMark({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true">
      <path d="M2 6.4 4.6 9 10 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CrossMark({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
