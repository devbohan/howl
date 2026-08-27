import type { Category } from './types'
import type { Want } from './wants'

/**
 * Votes go to the API. When it is not reachable — no backend deployed yet, or
 * the visitor is offline — the vote is kept on the device and retried, rather
 * than silently dropped. A lost vote is a lost data point we cannot recover.
 */
const PENDING_KEY = 'howl-wants-pending'
const VOTED_KEY = 'howl-wants-voted'

export interface WantSubmission {
  name: string
  category: Category
  note?: string
  /** Set when voting on an existing request rather than creating one. */
  wantId?: string
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
    /* private mode — the vote just won't survive a reload */
  }
}

/** Requests this device has already voted for, so the UI can show it. */
export function votedIds(): string[] {
  return read<string[]>(VOTED_KEY, [])
}

export function hasVoted(id: string) {
  return votedIds().includes(id)
}

function rememberVote(id: string) {
  const all = votedIds()
  if (!all.includes(id)) write(VOTED_KEY, [...all, id])
}

export function pendingSubmissions(): WantSubmission[] {
  return read<WantSubmission[]>(PENDING_KEY, [])
}

function queue(submission: WantSubmission) {
  write(PENDING_KEY, [...pendingSubmissions(), submission])
}

function dequeue(count: number) {
  write(PENDING_KEY, pendingSubmissions().slice(count))
}

export type SubmitResult = 'sent' | 'queued' | 'duplicate'

export async function submitWant(submission: WantSubmission): Promise<SubmitResult> {
  if (submission.wantId && hasVoted(submission.wantId)) return 'duplicate'

  try {
    const response = await fetch('/api/wants', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(submission),
    })
    if (!response.ok) throw new Error(String(response.status))
    if (submission.wantId) rememberVote(submission.wantId)
    return 'sent'
  } catch {
    queue(submission)
    if (submission.wantId) rememberVote(submission.wantId)
    return 'queued'
  }
}

/** Retries anything stranded by an earlier failure. Safe to call on mount. */
export async function flushPending(): Promise<number> {
  const pending = pendingSubmissions()
  if (pending.length === 0) return 0

  let sent = 0
  for (const submission of pending) {
    try {
      const response = await fetch('/api/wants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(submission),
      })
      if (!response.ok) break
      sent += 1
    } catch {
      break
    }
  }
  if (sent > 0) dequeue(sent)
  return sent
}

/** Live counts when the API is up; the build-time snapshot otherwise. */
export async function fetchWants(): Promise<Want[] | null> {
  try {
    const response = await fetch('/api/wants')
    if (!response.ok) return null
    return (await response.json()) as Want[]
  } catch {
    return null
  }
}
