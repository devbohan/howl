import type { Channel, Drop, MediaLink, NewsItem } from '../lib/types'

const NOW = Date.now()
export const at = (msFromNow: number) => new Date(NOW + msFromNow).toISOString()

export function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 'ch-1',
    name: 'END. Launches',
    region: 'EU',
    url: 'https://example.test/launch',
    status: 'open',
    shipsWorldwide: true,
    acceptsForeignCard: true,
    ...overrides,
  }
}

export function makeDrop(overrides: Partial<Drop> = {}): Drop {
  return {
    id: 'drop-1',
    slug: 'demo-drop',
    title: {
      en: 'Travis Scott x Air Jordan 1 Low OG "Olive"',
      ja: 'トラヴィス・スコット x エア ジョーダン 1 LOW OG「オリーブ」',
      'zh-CN': 'Travis Scott x Air Jordan 1 Low OG 橄榄绿',
      'zh-TW': 'Travis Scott x Air Jordan 1 Low OG 橄欖綠',
    },
    brand: 'Nike SNKRS',
    category: 'sneakers',
    region: 'GLOBAL',
    mechanic: 'app-raffle',
    friction: 'medium',
    price: 24_200,
    currency: 'JPY',
    opensAt: at(3 * 3_600_000),
    closesAt: at(9 * 3_600_000),
    channels: [makeChannel()],
    frictionNotes: [{ en: 'Ships to JP addresses only — use a forwarder.' }],
    art: { from: '#4b5320', to: '#0d0f08' },
    ...overrides,
  }
}

export function makeMedia(overrides: Partial<MediaLink> = {}): MediaLink {
  return {
    id: 'media-1',
    kind: 'video',
    platform: 'youtube',
    source: '@kicksdaily',
    title: { en: 'On-foot review: is the Olive worth resale?' },
    url: 'https://example.test/video',
    lang: 'en',
    audience: '1.2M',
    duration: '11:48',
    heat: { site: 960, external: 480_000 },
    ...overrides,
  }
}

export function makeNews(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: 'news-1',
    category: 'sneakers',
    kind: 'confirmed',
    at: new Date(NOW - 4 * 60_000).toISOString(),
    source: 'SNKRS',
    text: { en: 'SNKRS DAN window confirmed at 10:00 JST — 15 minutes only' },
    heat: { site: 960, external: 11_400 },
    ...overrides,
  }
}
