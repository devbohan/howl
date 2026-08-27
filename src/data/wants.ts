import type { Want } from '../lib/wants'

/**
 * Build-time snapshot of the wantlist. Submissions go to /api/wants and land
 * here on the next build.
 *
 * Emptied before launch. It was seeded with plausible requests carrying
 * invented vote counts, on the reasoning that an empty board tells visitors
 * nobody uses the site. That reasoning leads somewhere it should not: a
 * fabricated "412 people want this" is manufactured social proof, which is the
 * same thing as a fake review no matter how it is labelled in the source.
 *
 * An empty board with an honest invitation is the correct starting state.
 */
export const WANTS: Want[] = []
