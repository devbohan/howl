import { createContext, useContext } from 'react'

/**
 * Who may see the full CROW queue.
 *
 * A stub on purpose. Real entitlement needs accounts and a payment provider
 * (Stripe for cards, KOMOJU or Paddle for PayPay and konbini in Japan), which
 * is P2 — and until a charge has actually been verified server-side, nothing
 * here should be treated as proof of anything. It exists so the paywall can be
 * built and tested now, and swapped for a real check without touching the UI.
 */
export type Tier = 'free' | 'vip'

const KEY = 'howl-tier'

export function readTier(): Tier {
  try {
    return localStorage.getItem(KEY) === 'vip' ? 'vip' : 'free'
  } catch {
    return 'free'
  }
}

/** Local only, and deliberately trivial to set — it gates nothing of value. */
export function setTier(tier: Tier) {
  try {
    localStorage.setItem(KEY, tier)
  } catch {
    /* private mode — the choice just won't persist */
  }
}

export const TierContext = createContext<Tier>('free')
export const useTier = () => useContext(TierContext)

/** Rows a signed-out visitor sees before the paywall. */
export const FREE_PREVIEW_ROWS = 3
