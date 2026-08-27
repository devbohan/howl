import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushOutbound, hostOf, trackOutbound } from '../outbound'

const QUEUE_KEY = 'howl-clicks-pending'
const queue = () => JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('hostOf', () => {
  it('keeps only the host, never the tracking params', () => {
    expect(hostOf('https://www.nike.com/jp/launch?utm_source=howl&id=123')).toBe('www.nike.com')
  })

  it('does not throw on something that is not a url', () => {
    expect(hostOf('not a url')).toBe('invalid')
  })
})

describe('trackOutbound', () => {
  it('uses sendBeacon, because the browser is already navigating away', () => {
    const beacon = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { sendBeacon: beacon })

    const sent = trackOutbound({ kind: 'store', host: 'end.example', locale: 'ja', channelId: 'c3' })

    expect(sent).toBe(true)
    expect(beacon).toHaveBeenCalledOnce()
    expect(beacon.mock.calls[0][0]).toBe('/api/clicks')
    expect(queue()).toEqual([])
  })

  it('queues the click when the beacon is refused, rather than losing it', () => {
    vi.stubGlobal('navigator', { sendBeacon: vi.fn().mockReturnValue(false) })

    expect(trackOutbound({ kind: 'store', host: 'end.example', locale: 'en' })).toBe(false)
    expect(queue()).toHaveLength(1)
    expect(queue()[0]).toMatchObject({ kind: 'store', host: 'end.example', locale: 'en' })
    expect(typeof queue()[0].at).toBe('string')
  })

  it('queues when sendBeacon does not exist at all', () => {
    vi.stubGlobal('navigator', {})
    trackOutbound({ kind: 'coverage', host: 'youtube.example', locale: 'en' })
    expect(queue()).toHaveLength(1)
  })

  it('records whether the link earns affiliate revenue', () => {
    vi.stubGlobal('navigator', {})
    trackOutbound({ kind: 'store', host: 'buyee.example', locale: 'en', affiliate: true })
    expect(queue()[0].affiliate).toBe(true)
  })

  it('caps the queue so a permanently offline device cannot fill storage', () => {
    vi.stubGlobal('navigator', {})
    for (let i = 0; i < 260; i++) {
      trackOutbound({ kind: 'store', host: `h${i}.example`, locale: 'en' })
    }
    const kept = queue()
    expect(kept).toHaveLength(200)
    // The newest clicks survive, not the oldest.
    expect(kept[kept.length - 1].host).toBe('h259.example')
  })
})

describe('flushOutbound', () => {
  it('does nothing when there is nothing stranded', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await flushOutbound()).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the queue and clears it', async () => {
    vi.stubGlobal('navigator', {})
    trackOutbound({ kind: 'store', host: 'a.example', locale: 'en' })
    trackOutbound({ kind: 'news', host: 'b.example', locale: 'ja' })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    expect(await flushOutbound()).toBe(2)
    expect(queue()).toEqual([])
  })

  it('keeps the queue when the server rejects it', async () => {
    vi.stubGlobal('navigator', {})
    trackOutbound({ kind: 'store', host: 'a.example', locale: 'en' })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    expect(await flushOutbound()).toBe(0)
    expect(queue()).toHaveLength(1)
  })

  it('keeps the queue when the network is down', async () => {
    vi.stubGlobal('navigator', {})
    trackOutbound({ kind: 'store', host: 'a.example', locale: 'en' })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await flushOutbound()).toBe(0)
    expect(queue()).toHaveLength(1)
  })
})
