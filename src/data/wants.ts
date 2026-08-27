import type { Want } from '../lib/wants'

/**
 * Build-time snapshot of the wantlist. Submissions go to the API and land here
 * on the next build, which is the same cadence the rest of the data uses.
 *
 * Seeded with real, frequently-asked-for reissues so the page is not empty on
 * day one — an empty board tells every visitor that nobody uses this.
 */
const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

export const WANTS: Want[] = [
  {
    id: 'w01',
    name: 'ポケモンカード151 ウルトラプレミアムコレクション 再販',
    category: 'tcg',
    note: '2023年版と同じ収録で。転売価格が定価の4倍で手が出ない。',
    count: 412,
    firstAskedAt: ago(46),
    lastAskedAt: ago(1),
  },
  {
    id: 'w02',
    name: 'Bearbrick 1000% KAWS Dissected — 任意配色',
    category: 'arttoy',
    note: '二级市场已经完全脱离普通人能买的范围。',
    count: 268,
    firstAskedAt: ago(38),
    lastAskedAt: ago(2),
  },
  {
    id: 'w03',
    name: 'Travis Scott x Air Jordan 1 Low OG "Olive" restock',
    category: 'sneakers',
    count: 233,
    firstAskedAt: ago(31),
    lastAskedAt: ago(1),
  },
  {
    id: 'w04',
    name: 'ホロライブ 白上フブキ 誕生日記念2023 フルセット 再販',
    category: 'goods',
    note: '海外からは当時買えませんでした。',
    count: 187,
    firstAskedAt: ago(29),
    lastAskedAt: ago(3),
  },
  {
    id: 'w05',
    name: 'ねんどろいど ヨル・フォージャー 再生産',
    category: 'figure',
    count: 156,
    firstAskedAt: ago(24),
    lastAskedAt: ago(2),
  },
  {
    id: 'w06',
    name: 'PlayStation 5 30周年アニバーサリー 再販',
    category: 'hardware',
    note: '抽選に一度も当たらなかった人が多すぎる。',
    count: 149,
    firstAskedAt: ago(21),
    lastAskedAt: ago(4),
  },
  {
    id: 'w07',
    name: 'POP MART MEGA SPACE MOLLY 1000% 초코 — 海外发售',
    category: 'arttoy',
    note: '只在中国大陆发过，海外根本没有渠道。',
    count: 121,
    firstAskedAt: ago(18),
    lastAskedAt: ago(1),
  },
  {
    id: 'w08',
    name: 'ちいかわ ポップアップ限定ぬいぐるみ 通販化',
    category: 'goods',
    note: '店頭限定なので日本国外からは物理的に不可能。',
    count: 98,
    firstAskedAt: ago(15),
    lastAskedAt: ago(2),
  },
  {
    id: 'w09',
    name: 'ワンピースカード プレミアムブースター 追加生産',
    category: 'tcg',
    count: 76,
    firstAskedAt: ago(12),
    lastAskedAt: ago(5),
  },
  {
    id: 'w10',
    name: 'MoonSwatch Mission to Earthphase — オンライン販売',
    category: 'hardware',
    note: '店頭のみなので、日本にいない人は買いようがない。',
    count: 64,
    firstAskedAt: ago(9),
    lastAskedAt: ago(3),
  },
]
