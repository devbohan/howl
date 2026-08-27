import type { Locale } from './types'

/**
 * Counts how many people, standing at the friction wall, would want someone to
 * buy on their behalf. It is a counter and nothing else.
 *
 * Deliberately no email field. Collecting a contact implies you will use it,
 * which is a promise this is explicitly not making — and it turns a
 * zero-obligation tally into a store of personal data with everything that
 * comes with it. If the numbers ever justify building the service, adding a
 * contact field is easy; un-leaking an address list is not.
 */
const VOTED_KEY = 'howl-proxy-demand'
const QUEUE_KEY = 'howl-proxy-demand-pending'

export interface DemandVote {
  slug: string
  locale: Locale
  at: string
}

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode — the state just won't survive a reload */
  }
}

export function hasAsked(slug: string) {
  return read<string[]>(VOTED_KEY, []).includes(slug)
}

function remember(slug: string) {
  const all = read<string[]>(VOTED_KEY, [])
  if (!all.includes(slug)) write(VOTED_KEY, [...all, slug])
}

export type DemandResult = 'sent' | 'queued' | 'already'

export async function registerDemand(slug: string, locale: Locale): Promise<DemandResult> {
  if (hasAsked(slug)) return 'already'
  const vote: DemandVote = { slug, locale, at: new Date().toISOString() }
  remember(slug)

  try {
    const response = await fetch('/api/proxy-demand', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(vote),
    })
    if (!response.ok) throw new Error(String(response.status))
    return 'sent'
  } catch {
    write(QUEUE_KEY, [...read<DemandVote[]>(QUEUE_KEY, []), vote].slice(-100))
    return 'queued'
  }
}

/** Retries anything stranded by an earlier failure. */
export async function flushDemand(): Promise<number> {
  const pending = read<DemandVote[]>(QUEUE_KEY, [])
  if (pending.length === 0) return 0
  try {
    const response = await fetch('/api/proxy-demand', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pending),
    })
    if (!response.ok) return 0
    write(QUEUE_KEY, [])
    return pending.length
  } catch {
    return 0
  }
}
