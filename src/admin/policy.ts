/**
 * Friction answers are rarely on a product page, but they are often written
 * down somewhere on the shop — in 配送/送料, お支払い方法, 会員登録 or the FAQ.
 * This finds those pages and highlights the sentences that answer each question.
 *
 * It only ever proposes. A match becomes `reported` with the sentence as its
 * source; a human still has to read it and mark it `confirmed`, because shops
 * contradict themselves and policies change without notice.
 */
import type { ChannelProfile } from './types'

export type PolicyField = Extract<
  keyof ChannelProfile,
  'shipsWorldwide' | 'acceptsForeignCard' | 'requiresLocalPhone' | 'requiresLocalId' | 'purchaseHistoryGated'
>

interface Rule {
  /** What the match implies for the field. */
  value: boolean
  patterns: RegExp[]
}

/**
 * Negative rules come first on purpose: "海外発送も承ります… ただし一部商品は
 * 海外発送不可" should land on the restriction, because the restriction is the
 * thing a buyer gets caught by.
 */
const RULES: Record<PolicyField, Rule[]> = {
  shipsWorldwide: [
    {
      value: false,
      patterns: [
        // Japanese negation has many shapes — いたしておりません / できません /
        // 行っておりません — so match the span loosely rather than enumerating.
        /海外.{0,8}(発送|配送|お届け).{0,12}(ません|ておりません|不可|できかねます)/,
        /海外(発送|配送)(は)?不可/,
        /日本国内(のみ|限定|に限)/,
        /国内(発送|配送)のみ/,
        /(do(es)? not|cannot|can't)\s+ship\s+(internationally|outside|overseas)/i,
        /(japan|domestic)\s+(only|addresses only)/i,
        /shipping.{0,20}within japan only/i,
      ],
    },
    {
      value: true,
      patterns: [
        /海外(発送|配送)(に)?(対応|可能|承り)/,
        /国際(配送|発送)/,
        /worldwide shipping/i,
        /ship(s|ping)?\s+(internationally|worldwide|overseas)/i,
        /international shipping (is )?(available|offered)/i,
      ],
    },
  ],
  acceptsForeignCard: [
    {
      value: false,
      patterns: [
        /海外(で)?発行(された)?の?(クレジット)?カード(は|を)?(ご)?利用(いただけ|でき)ま?せ?ん/,
        /日本国内(で)?発行(された)?の?(クレジット)?カード(のみ|に限)/,
        /(foreign|non-japanese|internationally issued)\s+(credit\s+)?cards?\s+(are\s+)?not\s+accepted/i,
        /only.{0,30}issued in japan/i,
      ],
    },
    {
      value: true,
      patterns: [
        /海外(で)?発行(された)?の?(クレジット)?カード(も)?(ご)?利用(いただけ|でき)ます/,
        /international(ly)?\s+(issued\s+)?(credit\s+)?cards?\s+(are\s+)?accepted/i,
      ],
    },
  ],
  requiresLocalPhone: [
    {
      value: true,
      patterns: [
        /SMS(による)?認証/i,
        /(携帯)?電話番号(による)?(の)?認証/,
        /日本国内の(携帯)?電話番号(が)?(必要|必須)/,
        /japanese\s+(mobile\s+)?phone number\s+(is\s+)?(required|needed)/i,
        /sms verification/i,
      ],
    },
    {
      value: false,
      patterns: [/電話番号(の入力)?(は)?任意/, /phone number.{0,20}optional/i],
    },
  ],
  requiresLocalId: [
    {
      value: true,
      patterns: [
        /本人確認(書類)?(が)?(必要|必須)/,
        /実名(登録|認証)/,
        /身分証(明書)?(の提出|が必要)/,
        /identity verification (is )?required/i,
      ],
    },
  ],
  purchaseHistoryGated: [
    {
      value: true,
      patterns: [
        /(過去の)?(ご)?購入(履歴|実績)(に応じ|が必要|のある)/,
        /会員ランク/,
        /抽選(の)?(対象|資格).{0,20}(購入|会員)/,
        /based on.{0,30}purchase history/i,
      ],
    },
  ],
}

export const FIELD_QUESTION: Record<PolicyField, string> = {
  shipsWorldwide: '发不发海外',
  acceptsForeignCard: '海外发行的卡能不能付',
  requiresLocalPhone: '要不要本地手机号',
  requiresLocalId: '要不要本地实名',
  purchaseHistoryGated: '抽选是否绑定消费历史',
}

export interface Finding {
  field: PolicyField
  value: boolean
  /** The sentence that matched, so you can judge it yourself. */
  evidence: string
}

const TERMINATORS = ['。', '．', '\n', '. ']

/**
 * The sentence containing the match — found by walking outwards from the match
 * itself, not from the start of the line. A policy page puts several sentences
 * on one line, and quoting the wrong one is worse than quoting nothing.
 */
function sentenceAround(text: string, index: number, length: number) {
  // Guard the not-found case: -1 + terminator length is a positive offset, and
  // would silently eat the first characters of the sentence.
  const start = Math.max(
    0,
    ...TERMINATORS.map((t) => {
      const at = text.lastIndexOf(t, index)
      return at === -1 ? 0 : at + t.length
    }),
  )

  const after = index + length
  const ends = TERMINATORS.map((t) => text.indexOf(t, after)).filter((i) => i !== -1)
  const end = ends.length > 0 ? Math.min(...ends) + 1 : Math.min(text.length, after + 80)

  return text.slice(start, end).trim().slice(0, 200)
}

/**
 * Scans policy text. At most one finding per field — the first rule that hits,
 * and the negative rules are checked first so a restriction beats a promise.
 */
export function scanPolicy(text: string): Finding[] {
  const findings: Finding[] = []
  if (!text.trim()) return findings

  for (const [field, rules] of Object.entries(RULES) as [PolicyField, Rule[]][]) {
    let hit: Finding | null = null
    for (const rule of rules) {
      for (const pattern of rule.patterns) {
        const match = pattern.exec(text)
        if (match) {
          hit = { field, value: rule.value, evidence: sentenceAround(text, match.index, match[0].length) }
          break
        }
      }
      if (hit) break
    }
    if (hit) findings.push(hit)
  }
  return findings
}

/** Paths shops commonly put these policies on, to save you hunting. */
export function policyUrls(url: string): { label: string; url: string }[] {
  let origin: string
  try {
    origin = new URL(url.startsWith('http') ? url : `https://${url}`).origin
  } catch {
    return []
  }
  const paths: [string, string[]][] = [
    ['配送・送料', ['/shipping', '/delivery', '/guide/shipping', '/help/delivery', '/support/shipping']],
    ['支付方式', ['/payment', '/help/payment', '/guide/payment', '/support/payment']],
    ['帮助 / FAQ', ['/faq', '/help', '/support', '/guide']],
    ['海外配送', ['/overseas', '/international', '/global', '/en/shipping']],
    ['会员注册', ['/register', '/signup', '/entry', '/member']],
  ]
  return paths.flatMap(([label, candidates]) =>
    candidates.map((path) => ({ label, url: origin + path })),
  )
}
