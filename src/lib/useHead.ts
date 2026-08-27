import { useEffect } from 'react'
import { LOCALE_LABELS } from './i18n'
import { LOCALES, type Locale } from './types'
import { SITE_NAME, SITE_URL, absolute, alternates, type HeadData } from './seo'

/** Everything this hook owns is tagged, so a route change can clear it cleanly. */
const OWNED = 'data-head'

function upsert<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  match: string,
  attrs: Record<string, string>,
) {
  let el = document.head.querySelector<HTMLElementTagNameMap[K]>(`${tag}[${match}]`)
  if (!el) {
    el = document.createElement(tag)
    document.head.append(el)
  }
  el.setAttribute(OWNED, '')
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
  return el
}

/**
 * Writes the document head imperatively rather than pulling in a helmet
 * library — there are three page types and the prerenderer reads the DOM, so a
 * dozen lines of setAttribute is the whole requirement.
 *
 * Drop pages get their own share card; everything else falls back to the
 * site-level one.
 */
export function useHead(locale: Locale, head: HeadData) {
  const { title, description, path, jsonLd } = head
  const canonical = absolute(locale, path)
  // Share cards are generated per drop per language at build time.
  const image = path.startsWith('/drop/')
    ? `${SITE_URL}/og${path}-${locale}.png`
    : `${SITE_URL}/og.png`
  const json = JSON.stringify(jsonLd)

  useEffect(() => {
    document.title = title

    for (const el of document.head.querySelectorAll(`[${OWNED}]`)) el.remove()

    upsert('meta', 'name="description"', { name: 'description', content: description })
    upsert('link', 'rel="canonical"', { rel: 'canonical', href: canonical })

    // hreflang: every language version points at every other, plus x-default.
    for (const alt of alternates(path)) {
      upsert('link', `hreflang="${alt.locale}"`, {
        rel: 'alternate',
        hreflang: alt.locale,
        href: alt.url,
      })
    }
    upsert('link', 'hreflang="x-default"', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: absolute('en', path),
    })

    const og: Record<string, string> = {
      'og:type': path.startsWith('/drop/') ? 'product' : 'website',
      'og:site_name': SITE_NAME,
      'og:title': title,
      'og:description': description,
      'og:url': canonical,
      'og:image': image,
      'og:locale': locale.replace('-', '_'),
    }
    for (const [property, content] of Object.entries(og)) {
      upsert('meta', `property="${property}"`, { property, content })
    }
    for (const other of LOCALES.filter((l) => l !== locale)) {
      const el = document.createElement('meta')
      el.setAttribute(OWNED, '')
      el.setAttribute('property', 'og:locale:alternate')
      el.setAttribute('content', other.replace('-', '_'))
      document.head.append(el)
    }

    const twitter: Record<string, string> = {
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
    }
    for (const [name, content] of Object.entries(twitter)) {
      upsert('meta', `name="${name}"`, { name, content })
    }

    const ld = upsert('script', 'type="application/ld+json"', { type: 'application/ld+json' })
    ld.textContent = json

    upsert('link', 'type="application/rss+xml"', {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: `${SITE_NAME} — ${LOCALE_LABELS[locale]}`,
      href: `${SITE_URL}/${locale}/feed.xml`,
    })

    // Helps a human scanning view-source, and costs nothing.
    upsert('meta', 'name="language"', { name: 'language', content: LOCALE_LABELS[locale] })
  }, [title, description, canonical, path, locale, json, image])
}
