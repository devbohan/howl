import type { Drop } from '../lib/types'

/**
 * The live catalogue. Emptied before launch so no fabricated drop could reach a
 * crawler — a made-up date on a countdown site is worse than no entry at all,
 * and every drop page ships Product structured data that Google would take at
 * face value.
 *
 * Entries come from WolfGrandma (/admin.html): capture → verify on the real
 * page → export. Nothing belongs here that a human has not confirmed.
 */
export const DROPS: Drop[] = []
