import type { Category, Mechanic, Region } from '../lib/types'

/**
 * How sure we are of one field. `unknown` is the default for everything —
 * a countdown site that guesses a date is worse than one that admits it
 * doesn't know, because a wrong date makes someone miss the drop.
 */
export type Confidence = 'unknown' | 'reported' | 'confirmed' | 'disputed'

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  unknown: '未知',
  reported: '有说法',
  confirmed: '已确认',
  disputed: '存疑',
}

/** A single field plus the evidence behind it. */
export interface Fact<T> {
  value: T | null
  confidence: Confidence
  /** Where it came from: a URL, "LINE 公式", "Discord #announcements", 用户投稿… */
  source?: string
  /** When a human last looked at the real page. */
  checkedAt?: string
  note?: string
}

export const unknownFact = <T>(): Fact<T> => ({ value: null, confidence: 'unknown' })

/** Sources that a crawler cannot reach, which is why they need a human round. */
export type SourceKind = 'instagram' | 'line' | 'discord' | 'x' | 'web' | 'store' | 'tip'

export const SOURCE_LABEL: Record<SourceKind, string> = {
  instagram: 'Instagram',
  line: 'LINE',
  discord: 'Discord',
  x: 'X',
  web: '官网 / 新闻',
  store: '线下店头',
  tip: '用户投稿',
}

/** Why this source has to be checked by hand — stops you re-litigating it. */
export const WHY_MANUAL: Record<SourceKind, string> = {
  instagram: 'Story 24 小时过期，且需登录',
  line: '公式账号推送不公开，只能自己收',
  discord: '公告在服务器内，需入群',
  x: '可抓，但限流且常被折叠',
  web: '通常可抓 —— 优先交给自动抽取',
  store: '只在店头张贴，没有线上版本',
  tip: '来自用户，天然无法自动获取',
}

/** Anything pasted in before it becomes a drop. */
export interface Lead {
  id: string
  capturedAt: string
  kind: SourceKind
  /** Whatever you pasted — screenshot text, a forwarded message, a URL. */
  raw: string
  url?: string
  status: 'new' | 'promoted' | 'dropped'
}

/**
 * Friction lives here, not on the drop. "Pokémon Center Online 需要日本手机号"
 * is true of the retailer, not of one item — verify it once and every drop on
 * that channel inherits it. Tens of channels instead of hundreds of drops.
 */
export interface ChannelProfile {
  id: string
  name: string
  region: Region
  url: string
  shipsWorldwide: Fact<boolean>
  acceptsForeignCard: Fact<boolean>
  requiresLocalPhone: Fact<boolean>
  requiresLocalId: Fact<boolean>
  /** 抽选资格绑定历史消费 */
  purchaseHistoryGated: Fact<boolean>
  /** 已知可用的代购/转运 */
  proxies: Fact<string>
  dutyNote: Fact<string>
  /**
   * 我能不能亲自代拍。纯商业判断，不是技术字段 —— 一旦为真，你就从
   * 资讯服务变成交易一方，那是另一套合规问题。
   */
  selfProxyViable: Fact<boolean>
  updatedAt: string
}

export const FRICTION_FIELDS = [
  ['shipsWorldwide', '全球直邮'],
  ['acceptsForeignCard', '接受海外卡'],
  ['requiresLocalPhone', '需本地手机号'],
  ['requiresLocalId', '需本地实名'],
  ['purchaseHistoryGated', '绑定消费历史'],
] as const

/** A drop being worked on. Every fact starts unknown. */
export interface DropDraft {
  id: string
  slug: string
  title: string
  brand: string
  category: Category
  /** Channel profile ids — friction is inherited from these. */
  channelIds: string[]
  opensAt: Fact<string>
  closesAt: Fact<string>
  releaseAt: Fact<string>
  price: Fact<number>
  mechanic: Fact<Mechanic>
  sourceUrl?: string
  leadId?: string
  status: 'draft' | 'ready' | 'published'
  updatedAt: string
}

/** A source you have to visit yourself, on a cadence. */
export interface PatrolSource {
  id: string
  name: string
  kind: SourceKind
  url?: string
  /** How often it's worth checking. */
  everyHours: number
  lastCheckedAt?: string
}

export interface AdminState {
  leads: Lead[]
  drafts: DropDraft[]
  channels: ChannelProfile[]
  patrol: PatrolSource[]
}
