/**
 * The HOWL wordmark: a stretched banner with the name written inside it by
 * hand. Drawn as strokes in currentColor so it inherits the text colour and
 * flips with the theme on its own — no two-tone asset, no remote file.
 *
 * The geometry keeps the original drawing's asymmetry (the left point sits
 * higher than the right, the top edge sags further than the bottom rises).
 * Straightening it out would make it look like clip art.
 */
export function Logo({ className = 'h-8 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 84" className={className} role="img" aria-label="HOWL">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Banner: points left and right, both long edges pulled inward. */}
        <path d="M2 47 L42 5 Q72.5 35.6 117 3 L157 52 L111 80 Q76.1 54.2 28 78 Z" strokeWidth="3.4" />

        {/* h */}
        <path d="M34 26 C32 38 32 52 34 61" strokeWidth="3.2" />
        <path d="M33.5 45 C37.5 39.5 45.5 38.5 47 45.5 C47.8 51 47.4 56 47.2 60.5" strokeWidth="3.2" />
        {/* o — a leaf, not a circle */}
        <path d="M53.5 51 C55.5 45.5 66.5 43.8 69.2 48.6 C71.4 52.6 63.4 58.6 57.4 57 C54.4 56.2 52.8 53.6 53.5 51 Z" strokeWidth="3.2" />
        {/* w */}
        <path d="M78 40.5 L84.2 61.5 L90.2 46.5 L96.2 61.5 L104.5 40" strokeWidth="3.2" />
        {/* l, with the tail that runs out to the right */}
        <path d="M113 21 C112 34 112 48 113.4 56.5 C116.5 59 124 58 129.5 55.8" strokeWidth="3.2" />
      </g>
    </svg>
  )
}
