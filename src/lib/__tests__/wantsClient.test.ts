import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWants, flushPending, hasVoted, pendingSubmissions, submitWant, votedIds } from '../wantsClient'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const ok = () => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
const offline = () => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

describe('submitWant', () => {
  it('sends a new request and reports it sent', async () => {
    ok()
    expect(await submitWant({ name: '151 UPC 再販', category: 'tcg' })).toBe('sent')
    expect(pendingSubmissions()).toEqual([])
  })

  it('remembers a vote on an existing request so the UI can show it', async () => {
    ok()
    expect(hasVoted('w1')).toBe(false)
    await submitWant({ wantId: 'w1', name: 'x', category: 'tcg' })
    expect(hasVoted('w1')).toBe(true)
    expect(votedIds()).toEqual(['w1'])
  })

  it('refuses a second vote from the same device on the same request', async () => {
    ok()
    await submitWant({ wantId: 'w1', name: 'x', category: 'tcg' })
    expect(await submitWant({ wantId: 'w1', name: 'x', category: 'tcg' })).toBe('duplicate')
  })

  it('does not treat two different requests as duplicates', async () => {
    ok()
    await submitWant({ wantId: 'w1', name: 'x', category: 'tcg' })
    expect(await submitWant({ wantId: 'w2', name: 'y', category: 'tcg' })).toBe('sent')
  })

  it('queues rather than dropping the vote when the request fails', async () => {
    offline()
    expect(await submitWant({ name: 'queued item', category: 'arttoy' })).toBe('queued')
    expect(pendingSubmissions()).toHaveLength(1)
    expect(pendingSubmissions()[0]).toMatchObject({ name: 'queued item' })
  })

  it('queues on a non-ok response too, not just a thrown request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    expect(await submitWant({ name: 'x', category: 'tcg' })).toBe('queued')
    expect(pendingSubmissions()).toHaveLength(1)
  })

  it('still records the vote locally when the send failed, so it is not re-asked', async () => {
    offline()
    await submitWant({ wantId: 'w9', name: 'x', category: 'tcg' })
    expect(hasVoted('w9')).toBe(true)
  })
})

describe('flushPending', () => {
  it('does nothing when nothing is stranded', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await flushPending()).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends everything queued and clears it', async () => {
    offline()
    await submitWant({ name: 'a', category: 'tcg' })
    await submitWant({ name: 'b', category: 'tcg' })
    expect(pendingSubmissions()).toHaveLength(2)

    ok()
    expect(await flushPending()).toBe(2)
    expect(pendingSubmissions()).toEqual([])
  })

  it('stops at the first failure and keeps the rest queued', async () => {
    offline()
    await submitWant({ name: 'a', category: 'tcg' })
    await submitWant({ name: 'b', category: 'tcg' })

    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        call += 1
        return call === 1 ? Promise.resolve({ ok: true }) : Promise.resolve({ ok: false })
      }),
    )
    expect(await flushPending()).toBe(1)
    expect(pendingSubmissions()).toHaveLength(1)
    expect(pendingSubmissions()[0]).toMatchObject({ name: 'b' })
  })

  it('keeps the whole queue when the network is down', async () => {
    offline()
    await submitWant({ name: 'a', category: 'tcg' })
    expect(await flushPending()).toBe(0)
    expect(pendingSubmissions()).toHaveLength(1)
  })
})

describe('fetchWants', () => {
  it('returns the live list when the API answers', async () => {
    const rows = [{ id: 'w1', name: 'x', category: 'tcg', count: 3, firstAskedAt: '', lastAskedAt: '' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => rows }))
    expect(await fetchWants()).toEqual(rows)
  })

  it('returns null on a bad response, so the caller keeps the snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await fetchWants()).toBeNull()
  })

  it('returns null when the request throws', async () => {
    offline()
    expect(await fetchWants()).toBeNull()
  })
})

describe('storage is never allowed to break the page', () => {
  it('survives unreadable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(votedIds()).toEqual([])
    expect(pendingSubmissions()).toEqual([])
  })

  it('survives unwritable storage', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    ok()
    await expect(submitWant({ wantId: 'w1', name: 'x', category: 'tcg' })).resolves.toBe('sent')
  })
})
