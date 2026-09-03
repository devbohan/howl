import { describe, expect, it } from 'vitest'
import { BRANDS, DRAWS, listable, tierOf } from '../brands'

describe('listable', () => {
  it('admits a hype brand on its own', () => {
    expect(listable('Supreme')).toMatchObject({ ok: true, draw: 'Supreme', reason: 'brand' })
  })

  it('admits a mainstream brand the scene currently wants', () => {
    expect(listable('New Balance')).toMatchObject({ ok: true, reason: 'brand' })
  })

  it('rejects a mass-market label with nothing attached', () => {
    // Leading a hype calendar with plain EDWIN says we do not know the scene.
    expect(listable('EDWIN')).toEqual({ ok: false, reason: 'mass-without-collab' })
  })

  it('admits the same label once the draw is a real IP', () => {
    const out = listable('EDWIN', ['ELDEN RING', 'FromSoftware'])
    expect(out.ok).toBe(true)
    expect(out.draw).toBe('ELDEN RING')
    expect(out.reason).toBe('collab')
  })

  it('is not fooled by a collaborator nobody registered', () => {
    expect(listable('EDWIN', ['Some Local Shop'])).toEqual({ ok: false, reason: 'mass-without-collab' })
  })

  it('flags an unknown brand instead of silently admitting it', () => {
    // Silence is how a calendar fills up with things the audience scrolls past.
    expect(listable('Totally Unknown Co')).toEqual({ ok: false, reason: 'unlisted-brand' })
  })

  it('lets a hype collaborator carry an unknown brand', () => {
    expect(listable('Unknown Atelier', ['京都紋付'])).toMatchObject({ ok: true, reason: 'collab' })
  })

  it('names the draw so an editor can sanity-check the call', () => {
    expect(listable('Nike', []).draw).toBe('Nike')
    expect(listable('EDWIN', ['ONE PIECE']).draw).toBe('ONE PIECE')
  })
})

describe('the registry itself', () => {
  it('resolves tiers from either table', () => {
    expect(tierOf('Supreme')).toBe('hype')
    expect(tierOf('ELDEN RING')).toBe('ip')
    expect(tierOf('nothing here')).toBeUndefined()
  })

  it('has no brand listed in both tables under conflicting tiers', () => {
    for (const name of Object.keys(DRAWS)) {
      if (name in BRANDS) expect(BRANDS[name]).toBe(DRAWS[name])
    }
  })

  it('covers every category the site has, so no genre is left unlistable', () => {
    const tiers = Object.values(BRANDS)
    expect(tiers.filter((t) => t === 'hype').length).toBeGreaterThan(10)
    expect(tiers.filter((t) => t === 'current').length).toBeGreaterThan(5)
    expect(tiers.filter((t) => t === 'mass').length).toBeGreaterThan(3)
  })
})
