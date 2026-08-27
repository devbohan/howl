import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushDemand, hasAsked, registerDemand } from '../proxyDemand'

const QUEUE_KEY = 'howl-proxy-demand-pending'
const queue = () => JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('registerDemand', () => {
  it('records the vote and remembers this device asked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    expect(hasAsked('a-drop')).toBe(false)
    expect(await registerDemand('a-drop', 'ja')).toBe('sent')
    expect(hasAsked('a-drop')).toBe(true)
  })

  it('refuses to count the same device twice on the same drop', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await registerDemand('a-drop', 'en')
    expect(await registerDemand('a-drop', 'en')).toBe('already')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('counts the same device on a different drop', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    await registerDemand('one', 'en')
    expect(await registerDemand('two', 'en')).toBe('sent')
  })

  it('queues rather than losing the vote when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await registerDemand('a-drop', 'zh-CN')).toBe('queued')
    expect(queue()).toHaveLength(1)
    expect(queue()[0]).toMatchObject({ slug: 'a-drop', locale: 'zh-CN' })
  })

  it('still marks the drop as asked when the send failed, so the UI does not nag', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await registerDemand('a-drop', 'en')
    expect(hasAsked('a-drop')).toBe(true)
  })

  it('sends no contact details — only slug, locale and time', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await registerDemand('a-drop', 'ja')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(Object.keys(body).sort()).toEqual(['at', 'locale', 'slug'])
  })
})

describe('flushDemand', () => {
  it('does nothing when nothing is stranded', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await flushDemand()).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the queue and clears it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await registerDemand('one', 'en')
    await registerDemand('two', 'en')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    expect(await flushDemand()).toBe(2)
    expect(queue()).toEqual([])
  })

  it('keeps the queue when the server is still unhappy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await registerDemand('one', 'en')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await flushDemand()).toBe(0)
    expect(queue()).toHaveLength(1)
  })
})
