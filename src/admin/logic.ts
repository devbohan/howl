import type { Friction } from '../lib/types'
import type { ChannelProfile, Confidence, DropDraft, Fact, PatrolSource } from './types'

/** Facts a countdown cannot be published without. */
export const REQUIRED_FIELDS = ['opensAt', 'mechanic'] as const

export interface Readiness {
  ready: boolean
  /** Field labels still blocking publication. */
  missing: string[]
  /** Confirmed out of all tracked facts — the progress figure. */
  confirmed: number
  total: number
}

const FIELD_LABEL: Record<string, string> = {
  opensAt: '开始时间',
  closesAt: '截止时间',
  releaseAt: '发售 / 开奖',
  price: '定价',
  mechanic: '发售形式',
}

const TRACKED = ['opensAt', 'closesAt', 'releaseAt', 'price', 'mechanic'] as const

/**
 * A draft is publishable only when the facts a user would act on are confirmed
 * by a human. `reported` is not enough — that is exactly the state an extractor
 * produces, and shipping it is how a wrong date reaches a countdown.
 */
export function readiness(draft: DropDraft): Readiness {
  const missing: string[] = []
  for (const field of REQUIRED_FIELDS) {
    if (draft[field].confidence !== 'confirmed') missing.push(FIELD_LABEL[field])
  }
  if (draft.channelIds.length === 0) missing.push('购买渠道')
  if (!draft.title.trim()) missing.push('商品名')

  const confirmed = TRACKED.filter((f) => draft[f].confidence === 'confirmed').length
  return { ready: missing.length === 0, missing, confirmed, total: TRACKED.length }
}

/**
 * Friction is a property of the channel, so a drop's rating is just the worst
 * of the channels it can be bought from — verify a retailer once, and every
 * drop it ever carries inherits the answer.
 */
export function frictionOf(channels: ChannelProfile[]): { friction: Friction | null; why: string[] } {
  if (channels.length === 0) return { friction: null, why: [] }

  const why: string[] = []
  let worst: Friction = 'easy'
  const raise = (level: Friction) => {
    if (level === 'hard' || (level === 'medium' && worst === 'easy')) worst = level
  }

  let anyUnknown = false
  for (const channel of channels) {
    const known = (fact: Fact<boolean>) => fact.confidence === 'confirmed'
    if (!known(channel.shipsWorldwide) || !known(channel.acceptsForeignCard)) anyUnknown = true

    if (known(channel.requiresLocalPhone) && channel.requiresLocalPhone.value) {
      raise('hard')
      why.push(`${channel.name}：需本地手机号`)
    }
    if (known(channel.acceptsForeignCard) && channel.acceptsForeignCard.value === false) {
      raise('hard')
      why.push(`${channel.name}：不接受海外卡`)
    }
    if (known(channel.shipsWorldwide) && channel.shipsWorldwide.value === false) {
      raise('medium')
      why.push(`${channel.name}：不发海外，需转运`)
    }
  }

  // One easy channel rescues the drop — a buyer only needs one route that works.
  const anyEasy = channels.some(
    (c) =>
      c.shipsWorldwide.confidence === 'confirmed' &&
      c.shipsWorldwide.value === true &&
      c.acceptsForeignCard.confidence === 'confirmed' &&
      c.acceptsForeignCard.value === true,
  )
  if (anyEasy) worst = 'easy'

  return { friction: anyUnknown && !anyEasy ? null : worst, why }
}

/** Facts still unanswered on a channel, in the order worth chasing. */
export function openQuestions(channel: ChannelProfile): string[] {
  const questions: [Fact<unknown>, string][] = [
    [channel.acceptsForeignCard, '海外发行的卡能不能付款？'],
    [channel.requiresLocalPhone, '注册需不需要本地手机号 SMS？'],
    [channel.shipsWorldwide, '发不发海外？'],
    [channel.requiresLocalId, '需不需要本地实名认证？'],
    [channel.purchaseHistoryGated, '抽选资格是否绑定消费历史？'],
    [channel.proxies, '哪些代购 / 转运能接？'],
  ]
  return questions.filter(([fact]) => fact.confidence !== 'confirmed').map(([, q]) => q)
}

export interface PatrolStatus {
  source: PatrolSource
  /** Hours past due; negative means not due yet. */
  overdueHours: number
  due: boolean
}

/** Patrol list ordered by how overdue each source is. */
export function patrolStatus(sources: PatrolSource[], now: number): PatrolStatus[] {
  return sources
    .map((source) => {
      const last = source.lastCheckedAt ? new Date(source.lastCheckedAt).getTime() : 0
      const elapsed = (now - last) / 3_600_000
      const overdueHours = elapsed - source.everyHours
      return { source, overdueHours, due: overdueHours >= 0 }
    })
    .sort((a, b) => b.overdueHours - a.overdueHours)
}

/** Confidence ordering, for sorting a review queue worst-first. */
export const CONFIDENCE_RANK: Record<Confidence, number> = {
  disputed: 0,
  unknown: 1,
  reported: 2,
  confirmed: 3,
}
