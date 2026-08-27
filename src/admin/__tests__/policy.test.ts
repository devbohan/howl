import { describe, expect, it } from 'vitest'
import { policyUrls, scanPolicy } from '../policy'

const find = (text: string, field: string) => scanPolicy(text).find((f) => f.field === field)

describe('shipping', () => {
  it('reads a plain refusal to ship overseas', () => {
    expect(find('誠に恐れ入りますが、海外への発送はいたしておりません。', 'shipsWorldwide')).toMatchObject({
      value: false,
    })
  })

  it.each([
    '日本国内のみの配送となります。',
    '海外発送は不可となっております。',
    'We do not ship internationally.',
    'Shipping to Japan only.',
  ])('reads %s as domestic only', (text) => {
    expect(find(text, 'shipsWorldwide')?.value).toBe(false)
  })

  it.each([
    '海外発送に対応しております。',
    '国際配送も承っております。',
    'Worldwide shipping available.',
    'We ship internationally.',
  ])('reads %s as worldwide', (text) => {
    expect(find(text, 'shipsWorldwide')?.value).toBe(true)
  })

  it('lets a restriction win over a promise in the same document', () => {
    const text = '海外発送に対応しております。ただし一部商品は海外発送は不可です。'
    expect(find(text, 'shipsWorldwide')?.value).toBe(false)
  })
})

describe('foreign cards', () => {
  it('reads an explicit refusal', () => {
    const f = find('海外で発行されたクレジットカードはご利用いただけません。', 'acceptsForeignCard')
    expect(f?.value).toBe(false)
    expect(f?.evidence).toContain('海外')
  })

  it('reads a japan-issued-only restriction', () => {
    expect(find('日本国内で発行されたクレジットカードのみご利用可能です。', 'acceptsForeignCard')?.value).toBe(false)
  })

  it('reads acceptance', () => {
    expect(find('海外発行のクレジットカードもご利用いただけます。', 'acceptsForeignCard')?.value).toBe(true)
    expect(find('International credit cards are accepted.', 'acceptsForeignCard')?.value).toBe(true)
  })
})

describe('local phone and identity', () => {
  it.each(['SMS認証が必要です', '日本国内の携帯電話番号が必須となります', 'A Japanese phone number is required.'])(
    'reads %s as requiring a local phone',
    (text) => {
      expect(find(text, 'requiresLocalPhone')?.value).toBe(true)
    },
  )

  it('reads an optional phone number as not required', () => {
    expect(find('電話番号の入力は任意です。', 'requiresLocalPhone')?.value).toBe(false)
  })

  it('reads identity verification', () => {
    expect(find('ご購入には本人確認書類が必要です。', 'requiresLocalId')?.value).toBe(true)
  })

  it('reads purchase-history gating', () => {
    expect(find('抽選の対象は過去のご購入履歴に応じて決まります。', 'purchaseHistoryGated')?.value).toBe(true)
  })
})

describe('evidence', () => {
  it('returns the sentence it matched, not the whole page', () => {
    const page = [
      'ご利用ガイド',
      'お支払いについて。海外で発行されたクレジットカードはご利用いただけません。ご了承ください。',
      '営業時間は平日10時から18時です。',
    ].join('\n')
    const f = find(page, 'acceptsForeignCard')!
    expect(f.evidence).toContain('海外で発行された')
    expect(f.evidence).not.toContain('営業時間')
    expect(f.evidence.length).toBeLessThan(120)
  })
})

describe('finds nothing rather than guessing', () => {
  it('returns no findings for unrelated text', () => {
    expect(scanPolicy('本日は晴天なり。新商品が入荷しました。')).toEqual([])
  })

  it('returns no findings for empty input', () => {
    expect(scanPolicy('   ')).toEqual([])
  })

  it('reports at most one finding per field', () => {
    const text = '海外発送は不可です。日本国内のみの配送となります。国内発送のみ。'
    expect(scanPolicy(text).filter((f) => f.field === 'shipsWorldwide')).toHaveLength(1)
  })
})

describe('policyUrls', () => {
  it('builds candidates from the shop origin', () => {
    const urls = policyUrls('https://shop.example/item/123?x=1')
    expect(urls.every((u) => u.url.startsWith('https://shop.example/'))).toBe(true)
    expect(urls.some((u) => u.url.endsWith('/shipping'))).toBe(true)
    expect(urls.some((u) => u.url.endsWith('/payment'))).toBe(true)
  })

  it('accepts a bare host', () => {
    expect(policyUrls('shop.example').length).toBeGreaterThan(0)
  })

  it('returns nothing for something that is not a url', () => {
    expect(policyUrls('not a url at all')).toEqual([])
  })
})
