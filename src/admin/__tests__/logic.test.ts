import { describe, expect, it } from 'vitest'
import { frictionOf, openQuestions, overdueLabel, patrolStatus, readiness } from '../logic'
import { emptyChannel, emptyDraft } from '../store'
import type { ChannelProfile, Confidence, DropDraft, Fact } from '../types'
import { unknownFact } from '../types'

const fact = <T>(value: T, confidence: Confidence = 'confirmed'): Fact<T> => ({ value, confidence })

const channel = (over: Partial<ChannelProfile> = {}): ChannelProfile => ({ ...emptyChannel('Store'), ...over })

const draft = (over: Partial<DropDraft> = {}): DropDraft => ({ ...emptyDraft(), ...over })

describe('everything starts unknown', () => {
  it('a fresh fact has no value and no confidence in it', () => {
    const blank = unknownFact<string>()
    expect(blank.value).toBeNull()
    expect(blank.confidence).toBe('unknown')
  })

  it('a fresh draft claims nothing', () => {
    const d = emptyDraft()
    for (const field of ['opensAt', 'closesAt', 'releaseAt', 'price', 'mechanic'] as const) {
      expect(d[field].confidence, field).toBe('unknown')
      expect(d[field].value, field).toBeNull()
    }
  })

  it('a fresh channel claims nothing', () => {
    const c = emptyChannel('X')
    expect(c.acceptsForeignCard.confidence).toBe('unknown')
    expect(c.selfProxyViable.confidence).toBe('unknown')
  })
})

describe('readiness', () => {
  it('blocks a draft that is missing the facts a user would act on', () => {
    const r = readiness(emptyDraft())
    expect(r.ready).toBe(false)
    expect(r.missing).toContain('开始时间')
    expect(r.missing).toContain('发售形式')
    expect(r.missing).toContain('购买渠道')
    expect(r.missing).toContain('商品名')
  })

  it('does not accept a merely reported date — that is what an extractor produces', () => {
    const d = draft({
      title: 'X',
      channelIds: ['ch1'],
      opensAt: fact('2026-01-01T00:00:00.000Z', 'reported'),
      mechanic: fact('web-raffle'),
    })
    expect(readiness(d).ready).toBe(false)
    expect(readiness(d).missing).toEqual(['开始时间'])
  })

  it('passes once a human has confirmed the required facts', () => {
    const d = draft({
      title: 'X',
      channelIds: ['ch1'],
      opensAt: fact('2026-01-01T00:00:00.000Z'),
      mechanic: fact('web-raffle'),
    })
    expect(readiness(d).ready).toBe(true)
    expect(readiness(d).missing).toEqual([])
  })

  it('counts confirmed facts for a progress figure', () => {
    const d = draft({ opensAt: fact('x'), price: fact(100) })
    expect(readiness(d)).toMatchObject({ confirmed: 2, total: 5 })
  })

  it('treats a disputed fact as not confirmed', () => {
    const d = draft({
      title: 'X',
      channelIds: ['ch1'],
      opensAt: fact('2026-01-01T00:00:00.000Z', 'disputed'),
      mechanic: fact('web-raffle'),
    })
    expect(readiness(d).ready).toBe(false)
  })
})

describe('friction is inherited from channels', () => {
  it('is unknown while no channel is attached', () => {
    expect(frictionOf([])).toEqual({ friction: null, why: [] })
  })

  it('stays unknown while the deciding facts are unconfirmed', () => {
    expect(frictionOf([channel()]).friction).toBeNull()
  })

  it('is easy when a channel ships worldwide and takes foreign cards', () => {
    const easy = channel({ shipsWorldwide: fact(true), acceptsForeignCard: fact(true) })
    expect(frictionOf([easy]).friction).toBe('easy')
  })

  it('is medium when the card works but shipping does not', () => {
    const c = channel({ shipsWorldwide: fact(false), acceptsForeignCard: fact(true) })
    const out = frictionOf([c])
    expect(out.friction).toBe('medium')
    expect(out.why[0]).toContain('不发海外')
  })

  it('is hard when a local phone number is required', () => {
    const c = channel({
      name: 'PCO',
      shipsWorldwide: fact(false),
      acceptsForeignCard: fact(false),
      requiresLocalPhone: fact(true),
    })
    const out = frictionOf([c])
    expect(out.friction).toBe('hard')
    expect(out.why.join(' ')).toContain('PCO')
  })

  it('one workable route rescues the drop', () => {
    const hard = channel({ name: 'PCO', requiresLocalPhone: fact(true), acceptsForeignCard: fact(false) })
    const easy = channel({ name: 'END.', shipsWorldwide: fact(true), acceptsForeignCard: fact(true) })
    expect(frictionOf([hard, easy]).friction).toBe('easy')
  })

  it('still explains the hard route even when an easy one exists', () => {
    const hard = channel({ name: 'PCO', requiresLocalPhone: fact(true) })
    const easy = channel({ name: 'END.', shipsWorldwide: fact(true), acceptsForeignCard: fact(true) })
    expect(frictionOf([hard, easy]).why.join(' ')).toContain('PCO')
  })
})

describe('open questions', () => {
  it('lists every unanswered friction question on a new channel', () => {
    expect(openQuestions(emptyChannel('X')).length).toBeGreaterThan(4)
  })

  it('drops a question once it is confirmed', () => {
    const before = openQuestions(emptyChannel('X'))
    const after = openQuestions(channel({ acceptsForeignCard: fact(true) }))
    expect(after.length).toBe(before.length - 1)
    expect(after.join(' ')).not.toContain('能不能付款')
  })

  it('keeps asking while a fact is only reported', () => {
    const c = channel({ acceptsForeignCard: fact(true, 'reported') })
    expect(openQuestions(c).join(' ')).toContain('能不能付款')
  })
})

describe('patrol', () => {
  const NOW = Date.UTC(2026, 0, 2, 12, 0, 0)
  const ago = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString()

  it('puts the most overdue source first', () => {
    const list = patrolStatus(
      [
        { id: 'a', name: 'A', kind: 'line', everyHours: 12, lastCheckedAt: ago(2) },
        { id: 'b', name: 'B', kind: 'instagram', everyHours: 12, lastCheckedAt: ago(40) },
      ],
      NOW,
    )
    expect(list.map((s) => s.source.id)).toEqual(['b', 'a'])
    expect(list[0].due).toBe(true)
    expect(list[1].due).toBe(false)
  })

  it('treats a never-checked source as maximally overdue', () => {
    const list = patrolStatus(
      [
        { id: 'never', name: 'N', kind: 'line', everyHours: 12 },
        { id: 'fresh', name: 'F', kind: 'line', everyHours: 12, lastCheckedAt: ago(1) },
      ],
      NOW,
    )
    expect(list[0].source.id).toBe('never')
    expect(list[0].due).toBe(true)
  })
})

describe('overdueLabel', () => {
  const NOW = Date.UTC(2026, 0, 2, 12, 0, 0)
  const ago = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString()
  const label = (source: Parameters<typeof patrolStatus>[0][number]) =>
    overdueLabel(patrolStatus([source], NOW)[0])

  it('says a never-checked source has not been checked, not that it is 56 years late', () => {
    // The sort treats it as maximally overdue; showing the epoch arithmetic
    // ("逾期 496779 小时") makes the whole list look broken.
    expect(label({ id: 'a', name: 'A', kind: 'line', everyHours: 12 })).toBe('还没查过')
  })

  it('says it is within its cycle when it is not due', () => {
    expect(label({ id: 'a', name: 'A', kind: 'line', everyHours: 12, lastCheckedAt: ago(2) })).toBe('在周期内')
  })

  it('counts hours while that is still readable', () => {
    expect(label({ id: 'a', name: 'A', kind: 'line', everyHours: 12, lastCheckedAt: ago(20) })).toBe('逾期 8 小时')
  })

  it('switches to days once hours stop being useful', () => {
    expect(label({ id: 'a', name: 'A', kind: 'line', everyHours: 12, lastCheckedAt: ago(24 * 5) })).toBe('逾期 4 天')
  })

  it('says just-due rather than "逾期 0 小时"', () => {
    expect(label({ id: 'a', name: 'A', kind: 'line', everyHours: 12, lastCheckedAt: ago(12) })).toBe('刚到期')
  })
})
