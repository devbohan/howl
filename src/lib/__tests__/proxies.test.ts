import { describe, expect, it } from 'vitest'
import { PROXIES, blockersFor, proxiesFor, proxyUrl } from '../proxies'
import { makeChannel, makeDrop } from '../../test/fixtures'
import type { Channel } from '../types'

const ch = (over: Partial<Channel>) => makeChannel(over)

describe('blockersFor', () => {
  it('finds no blocker when one channel ships worldwide and takes foreign cards', () => {
    expect(blockersFor([ch({ shipsWorldwide: true, acceptsForeignCard: true })])).toEqual({
      shipping: false,
      payment: false,
    })
  })

  it('flags shipping when nothing ships out', () => {
    expect(blockersFor([ch({ shipsWorldwide: false, acceptsForeignCard: true })])).toMatchObject({
      shipping: true,
      payment: false,
    })
  })

  it('flags payment when no channel takes a foreign card', () => {
    expect(blockersFor([ch({ shipsWorldwide: true, acceptsForeignCard: false })])).toMatchObject({
      payment: true,
    })
  })

  it('needs only one workable channel to clear a blocker', () => {
    const channels = [
      ch({ id: 'a', shipsWorldwide: false, acceptsForeignCard: false }),
      ch({ id: 'b', shipsWorldwide: true, acceptsForeignCard: true }),
    ]
    expect(blockersFor(channels)).toEqual({ shipping: false, payment: false })
  })

  it('claims no blocker when there are no channels to judge', () => {
    expect(blockersFor([])).toEqual({ shipping: false, payment: false })
  })
})

describe('proxiesFor', () => {
  it('suggests nothing when the drop is already buyable from abroad', () => {
    const drop = makeDrop({ channels: [ch({ shipsWorldwide: true, acceptsForeignCard: true })] })
    const out = proxiesFor(drop)
    expect(out.needed).toBe(false)
    expect(out.services).toEqual([])
  })

  it('offers forwarders too when only the parcel is the problem', () => {
    const drop = makeDrop({ channels: [ch({ shipsWorldwide: false, acceptsForeignCard: true })] })
    const out = proxiesFor(drop)
    expect(out.needed).toBe(true)
    expect(out.services.some((s) => s.kind === 'forwarder')).toBe(true)
  })

  it('drops forwarders entirely once payment is blocked', () => {
    // A forwarder gives you an address; it cannot pay with a card the shop
    // refuses. Suggesting one here would cost the buyer the drop.
    const drop = makeDrop({ channels: [ch({ shipsWorldwide: false, acceptsForeignCard: false })] })
    const out = proxiesFor(drop)
    expect(out.services.length).toBeGreaterThan(0)
    expect(out.services.every((s) => s.kind === 'buyer')).toBe(true)
  })

  it('also drops forwarders when shipping works but payment does not', () => {
    const drop = makeDrop({ channels: [ch({ shipsWorldwide: true, acceptsForeignCard: false })] })
    expect(proxiesFor(drop).services.every((s) => s.kind === 'buyer')).toBe(true)
  })
})

describe('proxyUrl', () => {
  it('pre-searches the product where the service supports it', () => {
    const buyee = PROXIES.find((p) => p.id === 'buyee')!
    expect(proxyUrl(buyee, 'ポケモンカード 151')).toContain(encodeURIComponent('ポケモンカード 151'))
  })

  it('falls back to the home page when there is no search', () => {
    const tenso = PROXIES.find((p) => p.id === 'tenso')!
    expect(proxyUrl(tenso, 'anything')).toBe(tenso.home)
  })

  it('appends the affiliate parameter with the right separator', () => {
    const withQuery = { ...PROXIES[0], affiliateParam: 'aff=howl' }
    expect(proxyUrl(withQuery, 'x')).toMatch(/[?&]aff=howl$/)

    const withoutQuery = { ...PROXIES.find((p) => p.id === 'tenso')!, affiliateParam: 'aff=howl' }
    expect(proxyUrl(withoutQuery, 'x')).toBe('https://www.tenso.com?aff=howl')
  })

  it('leaves links clean until an affiliate account exists', () => {
    for (const service of PROXIES) {
      expect(proxyUrl(service, 'x')).not.toContain('undefined')
    }
  })
})

describe('the registry itself', () => {
  it('has unique ids and https homes', () => {
    const ids = PROXIES.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of PROXIES) expect(p.home).toMatch(/^https:\/\//)
  })

  it('has at least one of each kind, or the matching logic is pointless', () => {
    expect(PROXIES.some((p) => p.kind === 'buyer')).toBe(true)
    expect(PROXIES.some((p) => p.kind === 'forwarder')).toBe(true)
  })
})
