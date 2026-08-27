import type { Category, L } from './types'

/**
 * A request for something to be made again — sold out, discontinued, or never
 * released outside Japan. The count is the whole point: an aggregated wantlist
 * is the one asset a competitor cannot copy in a weekend, and it is far more
 * persuasive to a manufacturer or a shop than any pageview number.
 */
export interface Want {
  id: string
  /** As typed by the person asking. Not localized — it is their words. */
  name: string
  category: Category
  note?: string
  /** How many people have asked for it. */
  count: number
  /** ISO. First time anyone asked. */
  firstAskedAt: string
  /** ISO. Most recent vote, for the "newest" sort. */
  lastAskedAt: string
  /** Set once an editor has matched it to a real product. */
  matchedSlug?: string
  /** Editorial note shown under the request, e.g. "已确认 2026 年复刻". */
  status?: L
}

export type WantSort = 'count' | 'recent'

export function sortWants(wants: Want[], sort: WantSort): Want[] {
  return [...wants].sort((a, b) =>
    sort === 'count'
      ? b.count - a.count || new Date(b.lastAskedAt).getTime() - new Date(a.lastAskedAt).getTime()
      : new Date(b.lastAskedAt).getTime() - new Date(a.lastAskedAt).getTime(),
  )
}

/** Collapses obvious duplicates so "151 UPC" and "151UPC 复刻" land together. */
export function normalizeName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s　]+/g, '')
    .replace(/[·・･\-—_/,.，。、!！?？"'"'`()（）[\]【】]/g, '')
}

export function findDuplicate(wants: Want[], name: string): Want | undefined {
  const key = normalizeName(name)
  if (!key) return undefined
  return wants.find((w) => normalizeName(w.name) === key)
}

/** Rough guard against junk before anything reaches the queue. */
export function validateWant(name: string): { ok: boolean; reason?: string } {
  const trimmed = name.trim()
  if (trimmed.length < 2) return { ok: false, reason: 'too-short' }
  if (trimmed.length > 120) return { ok: false, reason: 'too-long' }
  if (/https?:\/\//i.test(trimmed)) return { ok: false, reason: 'link' }
  return { ok: true }
}
