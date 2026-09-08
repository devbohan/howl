import type { Drop } from '../../lib/types'
import type { NewsItem } from '../../lib/types'
import type { Want } from '../../lib/wants'
import type { Category, MediaLink } from '../../lib/types'

/**
 * Dummy data for looking at the layout with something in it.
 *
 * Loaded only when VITE_DEMO=1. The production build never sets it, so none of
 * this can reach a static file — which is the point: R1.9 says placeholder data
 * must not ship, and a comment saying so has already failed once. A build flag
 * cannot be forgotten the way a cleanup step can.
 *
 * Everything here is obviously synthetic on purpose: brands are real (they have
 * to be, to look right) but every product name is marked, so a screenshot of
 * this can never be mistaken for the live site.
 */
const H = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()
const AGO = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

const art = (from: string, to: string) => ({ from, to, glyph: '' })

/*
 * The builders below are annotated pure at every call site. Without that,
 * Rollup sees top-level function calls, assumes they might have side effects,
 * and keeps this whole module in the bundle even though the only branch that
 * reads it is statically false — which would put dummy data in a production
 * file. The annotation is what makes the tree-shake real rather than hopeful.
 */
const demoDrop = (over: Partial<Drop> & { id: string; slug: string }): Drop => ({
  title: { en: 'DEMO item', ja: 'DEMO 商品' },
  brand: 'Nike',
  category: 'sneakers',
  region: 'JP',
  mechanic: 'web-raffle',
  friction: 'medium',
  price: 20_000,
  currency: 'JPY',
  opensAt: H(24),
  channels: [
    {
      id: `${over.id}-c1`,
      name: 'DEMO Store',
      region: 'JP',
      url: 'https://example.test/demo',
      status: 'open',
      shipsWorldwide: false,
      acceptsForeignCard: true,
    },
  ],
  frictionNotes: [{ en: 'DEMO — not a real requirement.', ja: 'DEMO — 実際の条件ではありません。' }],
  art: art('#2f3a1c', '#0f1408'),
  ...over,
})

export const DEMO_DROPS: Drop[] = [
  /*#__PURE__*/ demoDrop({ id: 'demo1', slug: 'demo-sneaker-raffle', title: { en: 'DEMO · Air Jordan 1 Raffle', ja: 'DEMO・エア ジョーダン 1 抽選' }, opensAt: H(-2), closesAt: H(9), friction: 'hard', category: 'sneakers' }),
  /*#__PURE__*/ demoDrop({ id: 'demo2', slug: 'demo-sneaker-restock', title: { en: 'DEMO · Samba Restock', ja: 'DEMO・サンバ 再入荷' }, brand: 'adidas', opensAt: H(-30), closesAt: H(-1), category: 'sneakers', friction: 'easy' }),
  /*#__PURE__*/ demoDrop({ id: 'demo3', slug: 'demo-tcg-lottery', title: { en: 'DEMO · 151 Premium BOX', ja: 'DEMO・151 プレミアム BOX' }, brand: 'Pokémon Center Online', category: 'tcg', friction: 'hard', opensAt: H(-6), closesAt: H(40), art: art('#4a1f22', '#160a0b') }),
  /*#__PURE__*/ demoDrop({ id: 'demo4', slug: 'demo-tcg-booster', title: { en: 'DEMO · Premium Booster', ja: 'DEMO・プレミアムブースター' }, brand: 'Pokémon Center Online', category: 'tcg', opensAt: H(72), art: art('#4a1f22', '#160a0b') }),
  /*#__PURE__*/ demoDrop({ id: 'demo5', slug: 'demo-figure-wf', title: { en: 'DEMO · WF Limited Nendoroid', ja: 'DEMO・ワンフェス限定ねんどろいど' }, brand: 'Good Smile Company', category: 'figure', mechanic: 'made-to-order', opensAt: H(-100), closesAt: H(120), art: art('#153f3a', '#07120f') }),
  /*#__PURE__*/ demoDrop({ id: 'demo6', slug: 'demo-arttoy-mega', title: { en: 'DEMO · MEGA 1000%', ja: 'DEMO・MEGA 1000%' }, brand: 'POP MART', category: 'arttoy', friction: 'hard', opensAt: H(5), art: art('#3a1f52', '#12081b') }),
  /*#__PURE__*/ demoDrop({ id: 'demo7', slug: 'demo-goods-birthday', title: { en: 'DEMO · Birthday Set', ja: 'DEMO・誕生日記念セット' }, brand: 'hololive', category: 'goods', opensAt: H(-12), closesAt: H(200), art: art('#1b3560', '#080d18') }),
  /*#__PURE__*/ demoDrop({ id: 'demo8', slug: 'demo-hardware-console', title: { en: 'DEMO · Anniversary Console', ja: 'DEMO・記念モデル' }, brand: 'PlayStation Direct', category: 'hardware', mechanic: 'restock', opensAt: H(18), art: art('#252d38', '#0a0d11') }),
]

export const DEMO_NEWS: NewsItem[] = [
  { id: 'dn1', category: 'sneakers', kind: 'confirmed', at: AGO(6), urgent: true, url: 'https://example.test/demo', source: 'DEMO', text: { en: 'DEMO · Entry window confirmed for tomorrow 10:00', ja: 'DEMO・明日10時に受付開始が確定' }, heat: { site: 900, external: 12_000 } },
  { id: 'dn2', category: 'sneakers', kind: 'restock', at: AGO(40), url: 'https://example.test/demo', source: 'DEMO', text: { en: 'DEMO · Sizes quietly reopened', ja: 'DEMO・サイズが静かに再開放' }, heat: { site: 500, external: 6_000 } },
  { id: 'dn3', category: 'sneakers', kind: 'rumor', at: AGO(180), url: 'https://example.test/demo', source: 'DEMO', text: { en: 'DEMO · Next week’s list said to have leaked', ja: 'DEMO・来週のリストが流出との噂' }, heat: { site: 200, external: 3_000 } },
  { id: 'dn4', category: 'tcg', kind: 'confirmed', at: AGO(14), urgent: true, url: 'https://example.test/demo', source: 'DEMO', text: { en: 'DEMO · Entry closes in under 48h', ja: 'DEMO・申込は48時間以内に締切' }, heat: { site: 800, external: 9_000 } },
  { id: 'dn5', category: 'tcg', kind: 'result', at: AGO(300), url: 'https://example.test/demo', source: 'DEMO', text: { en: 'DEMO · Draw results have gone out', ja: 'DEMO・当落メール送信済み' }, heat: { site: 300, external: 2_000 } },
  { id: 'dn6', category: 'figure', kind: 'confirmed', at: AGO(50), url: 'https://example.test/demo', source: 'DEMO', text: { en: 'DEMO · Order window extended by 72h', ja: 'DEMO・受注期間を72時間延長' }, heat: { site: 400, external: 5_000 } },
  { id: 'dn7', category: 'arttoy', kind: 'restock', at: AGO(20), url: 'https://example.test/demo', source: 'DEMO', text: { en: 'DEMO · Overseas allocation goes live 2h later', ja: 'DEMO・海外分は2時間後に開始' }, heat: { site: 600, external: 7_000 } },
  { id: 'dn8', category: 'goods', kind: 'leak', at: AGO(90), url: 'https://example.test/demo', source: 'DEMO', text: { en: 'DEMO · Pop-up lineup surfaced early', ja: 'DEMO・ポップアップの内容が先行公開' }, heat: { site: 350, external: 4_000 } },
  { id: 'dn9', category: 'hardware', kind: 'restock', at: AGO(9), urgent: true, url: 'https://example.test/demo', source: 'DEMO', text: { en: 'DEMO · Queue is open now', ja: 'DEMO・待機列が現在稼働中' }, heat: { site: 700, external: 8_000 } },
]

const demoMedia = (id: string, over: Partial<MediaLink> = {}): MediaLink => ({
  id,
  kind: 'video',
  platform: 'youtube',
  source: '@demo_channel',
  title: { en: 'DEMO · Unboxing and sizing', ja: 'DEMO・開封とサイズ感' },
  url: 'https://example.test/demo',
  lang: 'ja',
  audience: '12.3万',
  duration: '11:20',
  heat: { site: 400, external: 200_000 },
  ...over,
})

export const DEMO_MEDIA: Record<Category, MediaLink[]> = {
  sneakers: [/*#__PURE__*/ demoMedia('dm1', { featured: true }), /*#__PURE__*/ demoMedia('dm2', { lang: 'en', source: '@demo_en' })],
  tcg: [/*#__PURE__*/ demoMedia('dm3', { featured: true })],
  figure: [/*#__PURE__*/ demoMedia('dm4')],
  arttoy: [/*#__PURE__*/ demoMedia('dm5')],
  goods: [/*#__PURE__*/ demoMedia('dm6')],
  hardware: [/*#__PURE__*/ demoMedia('dm7')],
}

const day = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

export const DEMO_WANTS: Want[] = [
  { id: 'dw1', name: 'DEMO · 151 UPC 再販', category: 'tcg', count: 412, firstAskedAt: day(46), lastAskedAt: day(1), note: 'DEMO' },
  { id: 'dw2', name: 'DEMO · KAWS 1000%', category: 'arttoy', count: 268, firstAskedAt: day(38), lastAskedAt: day(2) },
  { id: 'dw3', name: 'DEMO · Zelda Switch OLED', category: 'hardware', count: 149, firstAskedAt: day(21), lastAskedAt: day(4) },
]
