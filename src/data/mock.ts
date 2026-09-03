import type { Drop } from '../lib/types'

/**
 * The live catalogue.
 *
 * Every field here was read off a real page. Where a page did not say something
 * — a release time, whether a shop takes foreign cards — the field is absent
 * and the site renders "not established". Nothing is inferred to fill a gap,
 * because a countdown carrying a guessed date is worse than no entry at all.
 *
 * Each entry records the page it came from in `sourceNote`, so any claim can be
 * re-checked. Add new entries through /admin.html rather than by hand: the
 * confirm step there is what separates "the page said so" from "I checked".
 */
export const DROPS: Drop[] = [
  {
    id: 'd-eldenring-edwin-2026',
    slug: 'elden-ring-edwin-denim-2026',
    title: {
      en: 'ELDEN RING × EDWIN Denim Coat & Shirt — made-to-order',
      ja: 'ELDEN RING × EDWIN デニムコート／デニムシャツ 再受注',
      'zh-CN': 'ELDEN RING × EDWIN 牛仔外套 / 衬衫 再受注',
      'zh-TW': 'ELDEN RING × EDWIN 牛仔外套 / 襯衫 再受注',
    },
    brand: 'EDWIN',
    // EDWIN alone would not earn a slot — it is mass-market denim. The draw is
    // FromSoftware, which is why the title leads with ELDEN RING.
    collab: ['ELDEN RING', 'FromSoftware'],
    subtitle: {
      en: 'Reorder of the 2022 collaboration, four years on. Closes 30 Sept 23:59 JST.',
      ja: '2022年コラボの4年ぶり再受注。9月30日23:59まで。',
      'zh-CN': '2022 年联名的四年后再受注。9 月 30 日 23:59 截止。',
      'zh-TW': '2022 年聯名的四年後再受注。9 月 30 日 23:59 截止。',
    },
    category: 'sneakers',
    region: 'JP',
    mechanic: 'made-to-order',
    friction: 'medium',
    // 税込￥21,780 for the coat; the shirt is ￥10,780. Listing the coat as the
    // headline price, which is what the announcement led with.
    price: 21780,
    currency: 'JPY',
    // 受注期間「2026年9月3日 12:00 ～ 9月30日 23:59」— JST, stated on the official page.
    timePrecision: 'exact',
    opensAt: '2026-09-03T12:00:00+09:00',
    closesAt: '2026-09-30T23:59:00+09:00',
    // 発送予定「2027年3月下旬頃」— a month, not a day; encoded as the 21st and
    // spelled out in the notes rather than pretending to a precise date.
    releaseAt: '2027-03-21T00:00:00+09:00',
    art: { from: '#3a3f52', to: '#0a0c12' },
    tags: ['ELDEN RING', '受注生産', 'FromSoftware'],
    channels: [
      {
        id: 'ch-edwin-mall',
        name: 'EDWIN MALL',
        region: 'JP',
        // The order page, not the landing page. The 特設サイト explains the
        // collaboration but does not obviously lead anywhere you can order —
        // the two 【予約】 product pages are where the cart button lives.
        url: 'https://edwin-mall.jp/shop/g/gET0042-77-02/',
        status: 'open',
        // The official page routes overseas buyers through WorldShopping.
        shipsWorldwide: true,
        // The page does not say. Left unestablished rather than assumed.
        note: {
          en: 'Overseas orders go through the WorldShopping cross-border service, for the countries it covers.',
          ja: '海外からはWorldShoppingの越境サービス経由（対象国のみ）。',
          'zh-CN': '海外用户经 WorldShopping 跨境服务下单（仅限其覆盖国家）。',
          'zh-TW': '海外用戶經 WorldShopping 跨境服務下單（僅限其覆蓋國家）。',
        },
      },
    ],
    frictionNotes: [
      {
        en: 'Made to order: the window closes 30 September at 23:59 JST and there is no restock afterwards.',
        ja: '受注生産。9月30日23:59（JST）で受付終了、以降の再販はありません。',
        'zh-CN': '受注生产。9 月 30 日 23:59（日本时间）截止，之后不再补货。',
        'zh-TW': '受注生產。9 月 30 日 23:59（日本時間）截止，之後不再補貨。',
      },
      {
        en: 'The official page warns orders may close early: 「予定上限数に達し次第、受付を終了することがあります」.',
        ja: '公式に「予定上限数に達し次第、受付を終了することがあります」と明記。',
        'zh-CN': '官方明确写着「予定上限数に達し次第、受付を終了することがあります」——可能提前关闭。',
        'zh-TW': '官方明確寫著「予定上限数に達し次第、受付を終了することがあります」——可能提前關閉。',
      },
      {
        en: 'Shipping is stated as late March 2027 — roughly six months after ordering.',
        ja: '発送は「2027年3月下旬頃」。受注から半年ほど先です。',
        'zh-CN': '发货写的是 2027 年 3 月下旬，下单后约半年。',
        'zh-TW': '發貨寫的是 2027 年 3 月下旬，下單後約半年。',
      },
      {
        en: 'Whether the shop accepts a foreign-issued card is not stated anywhere we could read. Unverified.',
        ja: '海外発行カードが使えるかは、確認できる範囲に記載がありません。未確認です。',
        'zh-CN': '店家是否接受海外发行的信用卡，在能读到的页面上都没写。未确认。',
        'zh-TW': '店家是否接受海外發行的信用卡，在能讀到的頁面上都沒寫。未確認。',
      },
      {
        en: 'The collaboration page itself has no order button. Ordering happens on the two 【予約】 product pages — Denim Coat gET0042-77-02 and Denim Shirt gET0043-77-02 — where the cart button is.',
        ja: '特設サイトに注文ボタンはありません。注文は【予約】商品ページ2点（Denim Coat gET0042-77-02 / Denim Shirt gET0043-77-02）から。カートに入れるボタンはそちらにあります。',
        'zh-CN': '特設页面上没有下单按钮。下单要去两个【予約】商品页：Denim Coat gET0042-77-02 和 Denim Shirt gET0043-77-02 ——「カートに入れる」在那里。',
        'zh-TW': '特設頁面上沒有下單按鈕。下單要去兩個【予約】商品頁：Denim Coat gET0042-77-02 和 Denim Shirt gET0043-77-02 ——「カートに入れる」在那裡。',
      },
      {
        en: 'The collaboration page is the 2022 one, reused: it still carries that run’s dates (order period ending 2022, delivery March 2022) next to this year’s. The dates above are the 2026 run.',
        ja: '特設サイトは2022年のものを再利用しており、当時の日程（2022年3月上旬お届けなど）が今年の日程と並んで残っています。上記は2026年分の日程です。',
        'zh-CN': '特設页面是 2022 年那版改的，页面上仍留着当年的日程（2022 年 3 月上旬到货等）与今年的并列。上面写的是 2026 年这轮的日程。',
        'zh-TW': '特設頁面是 2022 年那版改的，頁面上仍留著當年的日程（2022 年 3 月上旬到貨等）與今年的並列。上面寫的是 2026 年這輪的日程。',
      },
    ],
    forwarders: ['WorldShopping', 'Buyee', 'tenso.com'],
  },
  {
    id: 'd-nb-1300-miusa-2026aw',
    slug: 'new-balance-1300-made-in-usa-2026aw',
    title: {
      en: 'New Balance 1300 — Made in USA 2026 FW, second drop',
      ja: 'New Balance 1300「Made in USA」2026年秋冬 第2弾',
      'zh-CN': 'New Balance 1300「Made in USA」2026 秋冬 第二波',
      'zh-TW': 'New Balance 1300「Made in USA」2026 秋冬 第二波',
    },
    brand: 'New Balance',
    subtitle: {
      en: 'Releases 10 September. Time of day was not announced.',
      ja: '9月10日（木）発売。時刻は未発表。',
      'zh-CN': '9 月 10 日（周四）发售。具体时刻未公布。',
      'zh-TW': '9 月 10 日（週四）發售。具體時刻未公布。',
    },
    category: 'sneakers',
    region: 'JP',
    // No lottery was announced, which for a New Balance Japan drop is normally
    // stated when one is held — so this is recorded as a straight sale.
    mechanic: 'fcfs',
    friction: 'medium',
    price: 49500,
    currency: 'JPY',
    // 「9月10日（木）」with no time given. `timePrecision: 'date'` makes the
    // countdown run to the start of that day and say the time is unannounced.
    timePrecision: 'date',
    opensAt: '2026-09-10T00:00:00+09:00',
    art: { from: '#4a4237', to: '#0d0b09' },
    tags: ['Made in USA', '1300'],
    channels: [
      {
        id: 'ch-nb-jp-online',
        name: 'New Balance 公式オンラインストア',
        region: 'JP',
        url: 'https://shop.newbalance.jp/',
        status: 'upcoming',
        // Neither field is established: the shop returns 403 to any program, so
        // its shipping and payment policies could not be read.
        note: {
          en: 'Also at T-HOUSE New Balance, NB Harajuku / Roppongi / Newoman Shinjuku / Newoman Takanawa / Horie, and select stockists.',
          ja: 'T-HOUSE New Balance、原宿・六本木・ニュウマン新宿・ニュウマン高輪・堀江、および一部取扱店舗でも展開。',
          'zh-CN': '同时在 T-HOUSE New Balance、原宿 / 六本木 / NEWoMan 新宿 / NEWoMan 高轮 / 堀江店，以及部分经销店发售。',
          'zh-TW': '同時在 T-HOUSE New Balance、原宿 / 六本木 / NEWoMan 新宿 / NEWoMan 高輪 / 堀江店，以及部分經銷店發售。',
        },
      },
    ],
    frictionNotes: [
      {
        en: 'The release time was not announced — only the date. Treat 10 September as the earliest possible moment, not the actual one.',
        ja: '発売時刻は未発表で、日付のみ。9月10日は「最も早い可能性」として扱ってください。',
        'zh-CN': '只公布了日期，没有公布时刻。把 9 月 10 日当作最早可能的时间，不是实际时间。',
        'zh-TW': '只公布了日期，沒有公布時刻。把 9 月 10 日當作最早可能的時間，不是實際時間。',
      },
      {
        en: 'No raffle was announced. New Balance Japan states one when it holds one, so this is being treated as a straight sale.',
        ja: '抽選の告知はありません。同社は抽選時には明示するため、通常販売として扱っています。',
        'zh-CN': '没有抽选公告。NB 日本举办抽选时会明确说明，所以按一般发售处理。',
        'zh-TW': '沒有抽選公告。NB 日本舉辦抽選時會明確說明，所以按一般發售處理。',
      },
      {
        en: 'The shop blocks automated requests (403), so its overseas shipping and card policies are unverified. Both are shown as not established.',
        ja: '同店はプログラムからのアクセスを拒否する（403）ため、海外発送・カード条件は未確認。両方とも「未確認」と表示しています。',
        'zh-CN': '该店拒绝程序访问（403），所以海外配送和信用卡条件都未核实，两项都显示为「未确认」。',
        'zh-TW': '該店拒絕程式訪問（403），所以海外配送和信用卡條件都未核實，兩項都顯示為「未確認」。',
      },
    ],
    forwarders: ['Buyee', 'tenso.com', 'ZenMarket'],
  },
]
