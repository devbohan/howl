/**
 * Which brands earn a place on the calendar.
 *
 * This exists because listing the wrong brand is not a neutral mistake: a hype
 * calendar that leads with a mass-market label tells the people it is for that
 * it does not know the scene, and that judgement is hard to win back.
 *
 * The rule is not "is this brand cool" but **what is the draw**. EDWIN is a
 * 1947 mass-market denim house; an EDWIN × ELDEN RING coat still belongs here,
 * because the draw is FromSoftware. So a drop qualifies on its brand OR on a
 * registered collaborator, and the entry has to name which.
 *
 * ⚠️ This list is editorial and it goes stale. It is a starting point that the
 * operator is expected to edit — relevance in this scene is exactly the kind of
 * judgement a list in a repo gets wrong six months later.
 */
export type BrandTier =
  /** The reason someone checks a drop calendar at all. */
  | 'hype'
  /** Mainstream, but currently wanted by this audience. Kept on merit, not history. */
  | 'current'
  /** Mass-market. Only qualifies through a collaborator or IP. */
  | 'mass'
  /** Game / anime / artist IP — often the actual draw on a collab. */
  | 'ip'

export const BRANDS: Record<string, BrandTier> = {
  // ── Streetwear and sneaker culture ───────────────────────────────────────
  Supreme: 'hype',
  'Nike SNKRS': 'hype',
  Nike: 'hype',
  'Jordan Brand': 'hype',
  'Travis Scott': 'hype',
  'Cactus Jack': 'hype',
  'Off-White': 'hype',
  fragment: 'hype',
  BAPE: 'hype',
  'A Bathing Ape': 'hype',
  'HUMAN MADE': 'hype',
  Kith: 'hype',
  Palace: 'hype',
  Stüssy: 'hype',
  'COMME des GARÇONS': 'hype',
  sacai: 'hype',
  Needles: 'hype',
  'CONVERSE ADDICT': 'hype',
  atmos: 'hype',
  'END.': 'hype',
  'Albino & Preto': 'hype',
  'POST ARCHIVE FACTION': 'hype',
  KidSuper: 'hype',
  Graphpaper: 'hype',
  'BEAMS BOY': 'hype',
  'Wales Bonner': 'hype',

  // ── Mainstream, but the scene wants them right now ───────────────────────
  'New Balance': 'current',
  ASICS: 'current',
  adidas: 'current',
  'adidas Originals': 'current',
  Clarks: 'current',
  Salomon: 'current',
  On: 'current',
  Vans: 'current',
  Reebok: 'current',
  UGG: 'current',
  'Bottega Veneta': 'current',
  PUMA: 'current',

  // ── Collectibles, toys, cards, hardware ──────────────────────────────────
  'Pokémon Center Online': 'hype',
  'POP MART': 'hype',
  MEDICOM: 'hype',
  'BE@RBRICK': 'hype',
  KAWS: 'hype',
  GOODSMILE: 'hype',
  'Good Smile Company': 'hype',
  'プレミアムバンダイ': 'hype',
  'P-Bandai': 'hype',
  hololive: 'hype',
  'PlayStation Direct': 'current',
  Nintendo: 'current',
  Swatch: 'current',
  Leica: 'hype',

  // ── Mass-market: needs a collaborator to qualify ─────────────────────────
  EDWIN: 'mass',
  UNIQLO: 'mass',
  GU: 'mass',
  Merrell: 'mass',
  Havaianas: 'mass',
  KEEN: 'mass',
  'J.Crew': 'mass',
  'ABC-MART': 'mass',
}

/** Collaborators and IP that carry a drop on their own. */
export const DRAWS: Record<string, BrandTier> = {
  'ELDEN RING': 'ip',
  FromSoftware: 'ip',
  'ONE PIECE': 'ip',
  'Pokémon': 'ip',
  'Yu-Gi-Oh!': 'ip',
  'ちいかわ': 'ip',
  'Chiikawa': 'ip',
  'SPY×FAMILY': 'ip',
  'Demon Slayer': 'ip',
  'Gundam': 'ip',
  'Studio Ghibli': 'ip',
  'Hatsune Miku': 'ip',
  '京都紋付': 'hype',
  'Kyoto Montsuki': 'hype',
}

export const tierOf = (name: string): BrandTier | undefined => BRANDS[name] ?? DRAWS[name]

export interface Listable {
  ok: boolean
  /** What earns it the slot, for the editor to sanity-check. */
  draw?: string
  reason: 'brand' | 'collab' | 'unlisted-brand' | 'mass-without-collab'
}

/**
 * Whether a drop earns a place, and what the draw is.
 *
 * A brand nobody registered is not automatically rejected — it is flagged, so
 * the operator either adds it to the list or drops the entry. Silently letting
 * it through is how the calendar fills up with things the audience scrolls past.
 */
export function listable(brand: string, collab: string[] = []): Listable {
  const brandTier = BRANDS[brand]
  const collabDraw = collab.find((c) => tierOf(c) === 'hype' || tierOf(c) === 'ip')

  if (brandTier === 'hype' || brandTier === 'current') {
    return { ok: true, draw: brand, reason: 'brand' }
  }
  if (collabDraw) {
    return { ok: true, draw: collabDraw, reason: 'collab' }
  }
  if (brandTier === 'mass') {
    return { ok: false, reason: 'mass-without-collab' }
  }
  return { ok: false, reason: 'unlisted-brand' }
}
