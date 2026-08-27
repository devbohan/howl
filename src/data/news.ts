import type { NewsItem } from '../lib/types'

/**
 * Category ticker feed. Like the drops themselves this is PLACEHOLDER content —
 * a real build pulls these from the CMS, where each line is written by an editor
 * or promoted from a monitored source, and carries an actual source URL.
 */
const AGO = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

export const NEWS: NewsItem[] = [
  // ── Sneakers ──────────────────────────────────────────────────────────────
  {
    id: 'n01', heat: { site: 960, external: 11400 }, category: 'sneakers', kind: 'confirmed', at: AGO(4), urgent: true, source: 'SNKRS',
    text: { en: 'SNKRS DAN window for the Olive AJ1 Low confirmed at 10:00 JST — 15 minutes only', ja: 'オリーブAJ1 LowのSNKRS DAN枠、10:00 JSTで確定。枠は15分のみ', 'zh-CN': '橄榄绿 AJ1 Low 的 SNKRS DAN 抽选确定 10:00 JST 开始，仅 15 分钟', 'zh-TW': '橄欖綠 AJ1 Low 的 SNKRS DAN 抽選確定 10:00 JST 開始，僅 15 分鐘' },
  },
  {
    id: 'n02', heat: { site: 1920, external: 3300 }, category: 'sneakers', kind: 'restock', at: AGO(23), source: 'END.',
    text: { en: 'END. quietly reopened Wales Bonner Samba sizes UK7–UK9', ja: 'END.がWales Bonner SambaのUK7〜UK9を静かに再開放', 'zh-CN': 'END. 悄悄放出 Wales Bonner Samba 的 UK7–UK9 码', 'zh-TW': 'END. 悄悄放出 Wales Bonner Samba 的 UK7–UK9 碼' },
  },
  {
    id: 'n03', heat: { site: 600, external: 39600 }, category: 'sneakers', kind: 'rumor', at: AGO(96),
    source: '@snkr_alerts',
    text: { en: 'Supreme Week 12 tee list leaked — box logo not included', ja: 'シュプリームWeek 12のTシャツ一覧が流出。ボックスロゴは含まれず', 'zh-CN': 'Supreme Week 12 T恤清单外流，不含 box logo', 'zh-TW': 'Supreme Week 12 T恤清單外流，不含 box logo' },
  },
  {
    id: 'n04', heat: { site: 140, external: 89400 }, category: 'sneakers', kind: 'result', at: AGO(310), source: 'Kith Tokyo',
    text: { en: 'Kith Tokyo Monday Program results are out — check your mail folder', ja: 'Kith Tokyo Monday Programの当落メール送信済み。迷惑メールも確認を', 'zh-CN': 'Kith Tokyo Monday Program 中签邮件已发出，记得翻垃圾箱', 'zh-TW': 'Kith Tokyo Monday Program 中籤郵件已發出，記得翻垃圾桶' },
  },
  {
    id: 'n05', heat: { site: 2590, external: 1700 }, category: 'sneakers', kind: 'confirmed', at: AGO(540),
    source: 'atmos',
    text: { en: 'atmos adds an in-store draw on top of the online raffle for Shibuya', ja: 'atmos渋谷、オンライン抽選に加えて店頭抽選も実施', 'zh-CN': 'atmos 涩谷店在线上抽选之外加开线下抽选', 'zh-TW': 'atmos 澀谷店在線上抽選之外加開線下抽選' },
  },

  // ── TCG ───────────────────────────────────────────────────────────────────
  {
    id: 'n06', heat: { site: 2030, external: 49900 }, category: 'tcg', kind: 'confirmed', at: AGO(11), urgent: true, source: 'ポケモンセンター',
    text: { en: '151 Premium Collection entry closes in under 48h — no extension planned', ja: '151プレミアムコレクションの申込は48時間以内に締切。延長予定なし', 'zh-CN': '151 典藏礼盒申请 48 小时内截止，官方明确不延期', 'zh-TW': '151 典藏禮盒申請 48 小時內截止，官方明確不延期' },
  },
  {
    id: 'n07', heat: { site: 2030, external: 70600 }, category: 'tcg', kind: 'leak', at: AGO(78),
    source: '@opcg_market',
    text: { en: 'One Piece Premium Booster card list surfaced on a Chinese forum', ja: 'ワンピースカード プレミアムブースターの収録リストが中国の掲示板に流出', 'zh-CN': '海贼王高级补充包收录列表在国内论坛流出', 'zh-TW': '海賊王高級補充包收錄列表在中國論壇流出' },
  },
  {
    id: 'n08', heat: { site: 1260, external: 20900 }, category: 'tcg', kind: 'restock', at: AGO(190),
    source: 'Yodobashi',
    text: { en: 'Yodobashi added a second draw round tied to in-store purchase history', ja: 'ヨドバシが購入履歴連動の第2次抽選を追加', 'zh-CN': '友都八喜追加第二轮抽选，绑定线下消费记录', 'zh-TW': '友都八喜追加第二輪抽選，綁定線下消費紀錄' },
  },
  {
    id: 'n09', heat: { site: 2430, external: 44700 }, category: 'tcg', kind: 'rumor', at: AGO(700),
    source: 'ポケカ投資メモ',
    text: { en: 'Print run for the Celebrations reissue said to be double the 2021 batch', ja: 'セレブレーションズ再販の生産数は2021年版の倍との情報', 'zh-CN': '传 Celebrations 复刻版印量是 2021 年批次的两倍', 'zh-TW': '傳 Celebrations 復刻版印量是 2021 年批次的兩倍' },
  },

  // ── Figures ───────────────────────────────────────────────────────────────
  {
    id: 'n10', heat: { site: 760, external: 69200 }, category: 'figure', kind: 'confirmed', at: AGO(31), source: 'GOODSMILE',
    text: { en: 'WF-exclusive Nendoroid order window extended by 72 hours', ja: 'ワンフェス限定ねんどろいどの受注期間を72時間延長', 'zh-CN': 'WF 限定黏土人受注期延长 72 小时', 'zh-TW': 'WF 限定黏土人受注期延長 72 小時' },
  },
  {
    id: 'n11', heat: { site: 510, external: 13600 }, category: 'figure', kind: 'restock', at: AGO(140), source: 'AmiAmi',
    text: { en: 'AmiAmi restocked Nendoroid Yor at 10% below MSRP', ja: 'あみあみがねんどろいどヨルを定価の1割引で再入荷', 'zh-CN': 'AmiAmi 补货黏土人约尔，低于定价 10%', 'zh-TW': 'AmiAmi 補貨黏土人約爾，低於定價 10%' },
  },
  {
    id: 'n12', heat: { site: 1570, external: 84300 }, category: 'figure', kind: 'leak', at: AGO(420),
    source: '@figure_no_heya',
    text: { en: 'P-Bandai Metal Build Red Frame photos leaked ahead of the official reveal', ja: 'P-Bandai メタルビルド レッドフレームの実物写真が公開前に流出', 'zh-CN': 'P-Bandai Metal Build 红异端实物图在官宣前流出', 'zh-TW': 'P-Bandai Metal Build 紅異端實物圖在官宣前流出' },
  },

  // ── Art toys ──────────────────────────────────────────────────────────────
  {
    id: 'n13', heat: { site: 210, external: 41700 }, category: 'arttoy', kind: 'confirmed', at: AGO(7), urgent: true, source: 'POP MART',
    text: { en: 'Global site allocation for MEGA MOLLY 1000% goes live 2h after the CN drop', ja: 'MEGA MOLLY 1000%のグローバル分は中国版の2時間後に開始', 'zh-CN': 'MEGA MOLLY 1000% 海外站配额比国内晚 2 小时开售', 'zh-TW': 'MEGA MOLLY 1000% 海外站配額比中國晚 2 小時開售' },
  },
  {
    id: 'n14', heat: { site: 1290, external: 11800 }, category: 'arttoy', kind: 'rumor', at: AGO(120),
    source: '@bearbrick_archive',
    text: { en: 'A fourth KAWS 1000% colourway is rumoured for the same window', ja: 'KAWS 1000%の4色目が同時期に出るとの噂', 'zh-CN': '传 KAWS 1000% 第四款配色将在同期发售', 'zh-TW': '傳 KAWS 1000% 第四款配色將在同期發售' },
  },
  {
    id: 'n15', heat: { site: 220, external: 25600 }, category: 'arttoy', kind: 'result', at: AGO(260),
    text: { en: 'Warhol 400% resale settled at +18% — down from +40% on launch day', ja: 'ウォーホル400%の二次価格は+18%で落ち着き。発売日の+40%から下落', 'zh-CN': '沃霍尔 400% 二级价格回落至 +18%，发售日曾 +40%', 'zh-TW': '沃荷 400% 二級價格回落至 +18%，發售日曾 +40%' },
  },
  {
    id: 'n16', heat: { site: 380, external: 74100 }, category: 'arttoy', kind: 'restock', at: AGO(610), source: 'POP MART Global',
    text: { en: 'SKULLPANDA 400% back at retail on the overseas store, no queue', ja: 'SKULLPANDA 400%が海外ストアに定価で再入荷。待機列なし', 'zh-CN': 'SKULLPANDA 400% 海外官网原价回货，无需排队', 'zh-TW': 'SKULLPANDA 400% 海外官網原價回貨，無需排隊' },
  },

  // ── Goods / VTuber ────────────────────────────────────────────────────────
  {
    id: 'n17', heat: { site: 2540, external: 11800 }, category: 'goods', kind: 'confirmed', at: AGO(16), urgent: true, source: 'LivePocket',
    text: { en: 'Chiikawa pop-up entry lottery opens tonight — one entry per SMS-verified account', ja: 'ちいかわポップアップの入場抽選が今夜開始。SMS認証済みアカウント1件につき1申込', 'zh-CN': '吉伊卡哇快闪店入场抽选今晚开始，每个 SMS 认证账号限一次', 'zh-TW': '吉伊卡哇快閃店入場抽選今晚開始，每個 SMS 認證帳號限一次' },
  },
  {
    id: 'n18', heat: { site: 1080, external: 39400 }, category: 'goods', kind: 'confirmed', at: AGO(88), source: 'hololive',
    text: { en: 'Birthday set: voice pack stays JP-only, physical goods ship worldwide', ja: '誕生日セット、ボイスは国内限定・物販は全世界発送', 'zh-CN': '生日套组：语音仅限日本，实体周边全球直邮', 'zh-TW': '生日套組：語音僅限日本，實體週邊全球直郵' },
  },
  {
    id: 'n19', heat: { site: 400, external: 87700 }, category: 'goods', kind: 'restock', at: AGO(330), source: 'hololive Global',
    text: { en: 'Leftover birthday stock released on the global shop without notice', ja: '誕生日グッズの余剰在庫がグローバル店で予告なく放出', 'zh-CN': '生日周边余量在海外店无预告放出', 'zh-TW': '生日週邊餘量在海外店無預告放出' },
  },

  // ── Hardware ──────────────────────────────────────────────────────────────
  {
    id: 'n20', heat: { site: 2410, external: 85300 }, category: 'hardware', kind: 'restock', at: AGO(9), urgent: true, source: 'ソニーストア',
    text: { en: 'Sony Store queue is open now for the 30th Anniversary set', ja: 'ソニーストアの30周年セット待機列が現在稼働中', 'zh-CN': '索尼商店 30 周年套装排队通道现已开启', 'zh-TW': '索尼商店 30 週年套裝排隊通道現已開啟' },
  },
  {
    id: 'n21', heat: { site: 2520, external: 14200 }, category: 'hardware', kind: 'confirmed', at: AGO(150), source: 'Swatch',
    text: { en: 'Swatch confirms MoonSwatch stays in-store only — still no online sales', ja: 'スウォッチ、MoonSwatchは店頭のみと再確認。オンライン販売は引き続きなし', 'zh-CN': 'Swatch 重申 MoonSwatch 仅限门店，仍不做线上销售', 'zh-TW': 'Swatch 重申 MoonSwatch 僅限門市，仍不做線上銷售' },
  },
  {
    id: 'n22', heat: { site: 1430, external: 75500 }, category: 'hardware', kind: 'rumor', at: AGO(480),
    source: '@restock_jp',
    text: { en: 'Zelda-edition Switch OLED said to get one final production run', ja: 'ゼルダ版Switch OLED、最後の生産ロットがあるとの情報', 'zh-CN': '传塞尔达版 Switch OLED 还有最后一批产能', 'zh-TW': '傳薩爾達版 Switch OLED 還有最後一批產能' },
  },
]
