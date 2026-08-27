import { describe, expect, it } from 'vitest'
import { capture, completeness } from '../capture'

const doc = (html: string) => new DOMParser().parseFromString(`<html><head>${html}</head><body></body></html>`, 'text/html')

const ld = (json: unknown) => `<script type="application/ld+json">${JSON.stringify(json)}</script>`

describe('capture from JSON-LD', () => {
  it('reads name, price, currency and availability from a Product', () => {
    const d = doc(
      ld({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Nendoroid Yor Forger',
        brand: { '@type': 'Brand', name: 'Good Smile Company' },
        gtin13: '4580590123456',
        sku: 'GSC-1234',
        offers: {
          '@type': 'Offer',
          price: '7800',
          priceCurrency: 'JPY',
          availability: 'https://schema.org/InStock',
        },
      }),
    )
    const out = capture(d, 'https://shop.example/item/1')
    expect(out).toMatchObject({
      name: 'Nendoroid Yor Forger',
      brand: 'Good Smile Company',
      price: 7800,
      currency: 'JPY',
      availability: 'in-stock',
      gtin: '4580590123456',
      sku: 'GSC-1234',
      host: 'shop.example',
    })
    expect(out.via.price).toBe('json-ld')
  })

  it('digs the Product out of an @graph', () => {
    const d = doc(
      ld({
        '@graph': [
          { '@type': 'WebSite', name: 'Shop' },
          { '@type': 'Product', name: 'Buried Product', offers: { '@type': 'Offer', price: 100, priceCurrency: 'USD' } },
        ],
      }),
    )
    expect(capture(d, 'https://x.test')).toMatchObject({ name: 'Buried Product', price: 100, currency: 'USD' })
  })

  it('handles an array of offers by taking the first', () => {
    const d = doc(
      ld({
        '@type': 'Product',
        name: 'Multi Offer',
        offers: [
          { '@type': 'Offer', price: '24200', priceCurrency: 'JPY', availability: 'https://schema.org/SoldOut' },
          { '@type': 'Offer', price: '30000', priceCurrency: 'JPY' },
        ],
      }),
    )
    expect(capture(d, 'https://x.test')).toMatchObject({ price: 24200, availability: 'sold-out' })
  })

  it('survives malformed JSON-LD instead of throwing', () => {
    const d = doc('<script type="application/ld+json">{ not json </script>')
    expect(() => capture(d, 'https://x.test')).not.toThrow()
    expect(capture(d, 'https://x.test').name).toBeNull()
  })

  it.each([
    ['https://schema.org/InStock', 'in-stock'],
    ['https://schema.org/SoldOut', 'sold-out'],
    ['https://schema.org/OutOfStock', 'sold-out'],
    ['https://schema.org/PreOrder', 'preorder'],
    ['https://schema.org/LimitedAvailability', 'low'],
    ['nonsense', null],
  ])('normalises availability %s', (input, expected) => {
    const d = doc(ld({ '@type': 'Product', name: 'x', offers: { '@type': 'Offer', availability: input } }))
    expect(capture(d, 'https://x.test').availability).toBe(expected)
  })
})

describe('capture from meta tags', () => {
  it('falls back to Open Graph when there is no JSON-LD', () => {
    const d = doc(`
      <meta property="og:title" content="OG Product">
      <meta property="product:price:amount" content="12,800">
      <meta property="product:price:currency" content="jpy">
      <meta property="product:availability" content="instock">
    `)
    const out = capture(d, 'https://x.test')
    expect(out).toMatchObject({ name: 'OG Product', price: 12800, currency: 'JPY', availability: 'in-stock' })
    expect(out.via.price).toBe('og')
  })

  it('falls back to the document title as a last resort', () => {
    const d = doc('<title>  Just A Title  </title>')
    const out = capture(d, 'https://x.test')
    expect(out.name).toBe('Just A Title')
    expect(out.via.name).toBe('meta')
  })

  it('lets JSON-LD win over Open Graph when both are present', () => {
    const d = doc(`
      <meta property="og:title" content="Marketing Headline">
      ${ld({ '@type': 'Product', name: 'Canonical Name' })}
    `)
    const out = capture(d, 'https://x.test')
    expect(out.name).toBe('Canonical Name')
    expect(out.via.name).toBe('json-ld')
  })
})

describe('never guesses', () => {
  it('leaves everything null on a page with no product data', () => {
    const out = capture(doc('<meta name="description" content="a blog">'), 'https://x.test')
    expect(out.price).toBeNull()
    expect(out.currency).toBeNull()
    expect(out.availability).toBeNull()
    expect(out.gtin).toBeNull()
  })

  it('rejects a currency it does not support rather than inventing one', () => {
    const d = doc(ld({ '@type': 'Product', name: 'x', offers: { '@type': 'Offer', price: 10, priceCurrency: 'GBP' } }))
    expect(capture(d, 'https://x.test').currency).toBeNull()
  })

  it('rejects a zero or negative price', () => {
    const d = doc(ld({ '@type': 'Product', name: 'x', offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' } }))
    expect(capture(d, 'https://x.test').price).toBeNull()
  })

  it('does not throw on a url it cannot parse', () => {
    expect(capture(doc(''), 'not a url').host).toBe('unknown')
  })
})

describe('completeness', () => {
  it('reports how thin a capture is, so a useless one is obvious', () => {
    const thin = capture(doc('<title>x</title>'), 'https://x.test')
    expect(completeness(thin)).toEqual({ got: 1, total: 4 })

    const full = capture(
      doc(ld({ '@type': 'Product', name: 'x', offers: { '@type': 'Offer', price: 1, priceCurrency: 'JPY', availability: 'InStock' } })),
      'https://x.test',
    )
    expect(completeness(full)).toEqual({ got: 4, total: 4 })
  })
})
