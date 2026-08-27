/**
 * Reads a retailer's product page and pulls out the facts we need.
 *
 * The important design point: this runs **in your own browser, on a page you
 * are already looking at**. The retailers that matter most (SNKRS, Pokémon
 * Center, atmos, AmiAmi, END.) all block bots, so a crawler cannot see these
 * pages at all — but you can, because you are a person visiting a shop. Nothing
 * here circumvents anything; it just saves you retyping what is on screen.
 *
 * Extraction prefers schema.org JSON-LD, then Open Graph, then meta tags —
 * in that order, because that is the order of how deliberately machine-readable
 * each one is. Anything it cannot find stays null, never guessed.
 */
import type { Currency } from '../lib/types'

export interface Captured {
  url: string
  host: string
  /** Product name as the retailer states it. */
  name: string | null
  brand: string | null
  price: number | null
  currency: Currency | null
  /** schema.org availability, normalised. */
  availability: 'in-stock' | 'low' | 'sold-out' | 'preorder' | null
  /** GTIN / JAN / EAN — the only reliable key for matching across retailers. */
  gtin: string | null
  sku: string | null
  /** Where each field came from, so you can tell a claim from a guess. */
  via: Record<string, 'json-ld' | 'og' | 'meta'>
  capturedAt: string
}

const CURRENCIES: Currency[] = ['JPY', 'USD', 'EUR', 'CNY']

const asCurrency = (value: unknown): Currency | null => {
  const code = String(value ?? '').toUpperCase()
  return (CURRENCIES as string[]).includes(code) ? (code as Currency) : null
}

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const n = Number(String(value).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function normalizeAvailability(value: unknown): Captured['availability'] {
  const raw = String(value ?? '').toLowerCase()
  if (!raw) return null
  if (raw.includes('soldout') || raw.includes('sold_out') || raw.includes('outofstock')) return 'sold-out'
  if (raw.includes('limitedavailability') || raw.includes('lowstock')) return 'low'
  if (raw.includes('preorder') || raw.includes('presale') || raw.includes('backorder')) return 'preorder'
  if (raw.includes('instock') || raw.includes('in_stock') || raw.includes('onlineonly')) return 'in-stock'
  return null
}

/** JSON-LD is often an array, or wrapped in @graph, or both. */
function flatten(node: unknown): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap(flatten)
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    const graph = record['@graph']
    return graph ? flatten(graph) : [record]
  }
  return []
}

const typeOf = (node: Record<string, unknown>) =>
  ([] as unknown[]).concat(node['@type'] ?? []).map((t) => String(t).toLowerCase())

function fromJsonLd(doc: Document) {
  const out: Partial<Captured> & { via: Captured['via'] } = { via: {} }

  const scripts = [...doc.querySelectorAll('script[type="application/ld+json"]')]
  const nodes = scripts.flatMap((script) => {
    try {
      return flatten(JSON.parse(script.textContent ?? ''))
    } catch {
      return []
    }
  })

  const product = nodes.find((n) => typeOf(n).includes('product'))
  if (!product) return out

  const mark = <K extends keyof Captured>(key: K, value: Captured[K]) => {
    if (value !== null && value !== undefined && value !== '') {
      Object.assign(out, { [key]: value })
      out.via[key as string] = 'json-ld'
    }
  }

  mark('name', typeof product.name === 'string' ? product.name.trim() : null)
  const brand = product.brand
  mark(
    'brand',
    typeof brand === 'string'
      ? brand
      : brand && typeof brand === 'object'
        ? String((brand as Record<string, unknown>).name ?? '') || null
        : null,
  )
  mark('gtin', String(product.gtin13 ?? product.gtin ?? product.gtin12 ?? product.ean ?? '') || null)
  mark('sku', String(product.sku ?? product.mpn ?? '') || null)

  const offer = flatten(product.offers).find((o) => typeOf(o).some((t) => t.includes('offer')))
  if (offer) {
    mark('price', asNumber(offer.price ?? offer.lowPrice))
    mark('currency', asCurrency(offer.priceCurrency))
    mark('availability', normalizeAvailability(offer.availability))
  }

  return out
}

const meta = (doc: Document, selector: string) =>
  doc.querySelector(selector)?.getAttribute('content')?.trim() || null

function fromMetaTags(doc: Document) {
  const out: Partial<Captured> & { via: Captured['via'] } = { via: {} }
  const put = <K extends keyof Captured>(key: K, value: Captured[K], source: 'og' | 'meta') => {
    if (value !== null && value !== undefined && value !== '') {
      Object.assign(out, { [key]: value })
      out.via[key as string] = source
    }
  }

  put('name', meta(doc, 'meta[property="og:title"]'), 'og')
  put('brand', meta(doc, 'meta[property="product:brand"]'), 'og')
  put('price', asNumber(meta(doc, 'meta[property="product:price:amount"]')), 'og')
  put('currency', asCurrency(meta(doc, 'meta[property="product:price:currency"]')), 'og')
  put('availability', normalizeAvailability(meta(doc, 'meta[property="product:availability"]')), 'og')

  if (!out.name) put('name', doc.title?.trim() || null, 'meta')
  if (!out.price) put('price', asNumber(meta(doc, 'meta[itemprop="price"]')), 'meta')
  if (!out.currency) put('currency', asCurrency(meta(doc, 'meta[itemprop="priceCurrency"]')), 'meta')

  return out
}

/** Structured data wins; meta tags only fill the gaps it leaves. */
export function capture(doc: Document, url: string): Captured {
  const structured = fromJsonLd(doc)
  const tags = fromMetaTags(doc)

  let host = 'unknown'
  try {
    host = new URL(url).host
  } catch {
    /* keep the placeholder */
  }

  const pick = <K extends keyof Captured>(key: K): Captured[K] =>
    (structured[key] ?? tags[key] ?? null) as Captured[K]

  return {
    url,
    host,
    name: pick('name'),
    brand: pick('brand'),
    price: pick('price'),
    currency: pick('currency'),
    availability: pick('availability'),
    gtin: pick('gtin'),
    sku: pick('sku'),
    via: { ...tags.via, ...structured.via },
    capturedAt: new Date().toISOString(),
  }
}

/** How much of a capture is usable — shown so a thin page is obvious. */
export function completeness(c: Captured) {
  const fields: (keyof Captured)[] = ['name', 'price', 'currency', 'availability']
  const got = fields.filter((f) => c[f] !== null).length
  return { got, total: fields.length }
}
