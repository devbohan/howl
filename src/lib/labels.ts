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

export const FRICTION_DOT: Record<Friction, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
}

export const CATEGORY_ICON: Record<Category, string> = {
  sneakers: '👟',
  tcg: '🃏',
  figure: '🎎',
  arttoy: '🧸',
  goods: '🎤',
  hardware: '🎮',
}

export const REGION_FLAG: Record<Region, string> = {
  JP: '🇯🇵',
  US: '🇺🇸',
  EU: '🇪🇺',
  CN: '🇨🇳',
  GLOBAL: '🌐',
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
