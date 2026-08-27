import { describe, expect, it } from 'vitest'
import { DICT, LOCALE_LABELS } from '../i18n'
import {
  CATEGORIES,
  CATEGORY_ART,
  CATEGORY_KEY,
  FRICTIONS,
  FRICTION_DESC_KEY,
  FRICTION_KEY,
  MECHANICS,
  MECHANIC_KEY,
  MEDIA_KIND_KEY,
  PLATFORM_LABEL,
  REGIONS,
  REGION_KEY,
} from '../labels'
import { LOCALES } from '../types'

const EN_KEYS = Object.keys(DICT.en)

describe('translation dictionaries', () => {
  it('covers every declared locale', () => {
    expect(Object.keys(DICT).sort()).toEqual([...LOCALES].sort())
    for (const locale of LOCALES) expect(LOCALE_LABELS[locale]).toBeTruthy()
  })

  it.each(LOCALES)('%s has exactly the same keys as en', (locale) => {
    expect(Object.keys(DICT[locale]).sort()).toEqual([...EN_KEYS].sort())
  })

  it.each(LOCALES)('%s has no empty strings', (locale) => {
    const blank = EN_KEYS.filter((k) => !DICT[locale][k as keyof typeof DICT.en]?.trim())
    expect(blank).toEqual([])
  })

  it('actually translates rather than copying English through', () => {
    // A handful of keys are legitimately identical (e.g. brand words), so this
    // asserts on the overall rate instead of every single key.
    for (const locale of LOCALES.filter((l) => l !== 'en')) {
      const same = EN_KEYS.filter((k) => DICT[locale][k as keyof typeof DICT.en] === DICT.en[k as keyof typeof DICT.en])
      expect(same.length / EN_KEYS.length).toBeLessThan(0.1)
    }
  })
})

describe('label maps', () => {
  it('maps every category', () => {
    for (const c of CATEGORIES) {
      expect(DICT.en[CATEGORY_KEY[c]]).toBeTruthy()
      expect(CATEGORY_ART[c].from).toMatch(/^#[0-9a-f]{3,8}$/i)
      expect(CATEGORY_ART[c].to).toMatch(/^#[0-9a-f]{3,8}$/i)
    }
  })

  it('maps every region, mechanic and friction level', () => {
    for (const r of REGIONS) expect(DICT.en[REGION_KEY[r]]).toBeTruthy()
    for (const m of MECHANICS) expect(DICT.en[MECHANIC_KEY[m]]).toBeTruthy()
    for (const f of FRICTIONS) {
      expect(DICT.en[FRICTION_KEY[f]]).toBeTruthy()
      expect(DICT.en[FRICTION_DESC_KEY[f]]).toBeTruthy()
    }
  })

  it('maps every media kind and platform', () => {
    for (const key of Object.values(MEDIA_KIND_KEY)) expect(DICT.en[key]).toBeTruthy()
    for (const label of Object.values(PLATFORM_LABEL)) expect(label).toBeTruthy()
  })
})

describe('no emoji in the interface vocabulary', () => {
  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

  it('no dictionary string carries one', () => {
    const offenders = Object.entries(DICT).flatMap(([locale, dict]) =>
      Object.entries(dict)
        .filter(([, value]) => EMOJI.test(value))
        .map(([key]) => `${locale}.${key}`),
    )
    expect(offenders).toEqual([])
  })

  it('no label map carries one', () => {
    const values = [
      ...Object.values(PLATFORM_LABEL),
      ...Object.values(CATEGORY_KEY),
      ...Object.values(REGION_KEY),
      ...Object.values(MECHANIC_KEY),
    ]
    expect(values.filter((v) => EMOJI.test(v))).toEqual([])
  })
})
