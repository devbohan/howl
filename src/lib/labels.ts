import type { Key } from './i18n'
import type { Category, Friction, MediaKind, Mechanic, Platform, Region } from './types'

export const CATEGORIES: Category[] = ['sneakers', 'tcg', 'figure', 'arttoy', 'goods', 'hardware']
export const REGIONS: Region[] = ['JP', 'US', 'EU', 'CN', 'GLOBAL']
export const MECHANICS: Mechanic[] = ['web-raffle', 'app-raffle', 'made-to-order', 'restock', 'offline-ticket', 'fcfs']
export const FRICTIONS: Friction[] = ['easy', 'medium', 'hard']

export const CATEGORY_KEY: Record<Category, Key> = {
  sneakers: 'catSneakers',
  tcg: 'catTcg',
  figure: 'catFigure',
  arttoy: 'catArttoy',
  goods: 'catGoods',
  hardware: 'catHardware',
}

export const REGION_KEY: Record<Region, Key> = {
  JP: 'regJP',
  US: 'regUS',
  EU: 'regEU',
  CN: 'regCN',
  GLOBAL: 'regGLOBAL',
}

export const MECHANIC_KEY: Record<Mechanic, Key> = {
  'web-raffle': 'mecWebRaffle',
  'app-raffle': 'mecAppRaffle',
  'made-to-order': 'mecMadeToOrder',
  restock: 'mecRestock',
  'offline-ticket': 'mecOfflineTicket',
  fcfs: 'mecFcfs',
}

export const FRICTION_KEY: Record<Friction, Key> = {
  easy: 'fricEasy',
  medium: 'fricMedium',
  hard: 'fricHard',
}

export const FRICTION_DESC_KEY: Record<Friction, Key> = {
  easy: 'fricEasyDesc',
  medium: 'fricMediumDesc',
  hard: 'fricHardDesc',
}

export const CATEGORY_ART: Record<Category, { from: string; to: string }> = {
  sneakers: { from: '#3f4a1f', to: '#0b0d07' },
  tcg: { from: '#5c1f1f', to: '#0d0606' },
  figure: { from: '#1b4f4a', to: '#060f0e' },
  arttoy: { from: '#43265e', to: '#0a0710' },
  goods: { from: '#1f3f75', to: '#050912' },
  hardware: { from: '#2b3543', to: '#07090c' },
}

export const MEDIA_KIND_KEY: Record<MediaKind, Key> = {
  video: 'mediaVideo',
  article: 'mediaArticle',
  social: 'mediaSocial',
}

/** Shown as plain text — no remote logos, so nothing to load and nothing to license. */
export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: 'YouTube',
  bilibili: 'bilibili',
  x: 'X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  weibo: '微博',
  xiaohongshu: '小红书',
  note: 'note',
  web: 'Web',
}

export const CATEGORY_BLURB_KEY: Record<Category, Key> = {
  sneakers: 'catSneakersBlurb',
  tcg: 'catTcgBlurb',
  figure: 'catFigureBlurb',
  arttoy: 'catArttoyBlurb',
  goods: 'catGoodsBlurb',
  hardware: 'catHardwareBlurb',
}

/**
 * The blurred field behind a category tile.
 *
 * Colours are chosen at mid luminance, not near-black: a dark colour behind a
 * dark panel adds murk rather than identity, which is what the first pass did.
 *
 * Generated rather than photographic, on purpose. At the blur radius this runs
 * at, a stock photo is a colour field with some grain — so a mesh gradient is
 * visually the same thing without a network request, a licence to track, or a
 * layout shift. Swapping in real photography later means changing only these
 * values.
 */
export const CATEGORY_FIELD: Record<Category, string[]> = {
  sneakers: ['#6f8a2e', '#2b3512', '#9ec23f'],
  tcg: ['#a8353c', '#3d1416', '#d4535a'],
  figure: ['#1f7f74', '#0b2a26', '#34b3a3'],
  arttoy: ['#6f3a9e', '#241033', '#9a5fd0'],
  goods: ['#2f5fa8', '#101f38', '#4b8ada'],
  hardware: ['#4a5768', '#1a1f27', '#6d7d92'],
}
