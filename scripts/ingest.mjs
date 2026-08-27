/**
 * Pulls leads from sources that publish for machines — RSS feeds and sitemaps.
 * Output is a leads file you import into WolfGrandma's inbox; nothing is
 * published without a human reading it.
 *
 * What this deliberately does NOT do: fetch anything behind bot protection.
 * A 403 means the site asked not to be read by a program, and routing around
 * that is the "circumventing access controls" problem, not a technical one.
 *
 *   npm run ingest                    # every source in scripts/sources.json
 *   npm run ingest -- --only pbandai  # one source
 *   npm run ingest -- --check <url>   # is this URL allowed? does it respond?
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const UA = 'HOWLbot/0.1 (+https://howl.tokyo/bot; drop calendar; contact via site)'
const POLITE_DELAY_MS = 1500
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? null : (args[i + 1] ?? true)
}

async function get(url, accept = 'text/xml,application/xml,application/rss+xml,*/*') {
  const response = await fetch(url, { headers: { 'user-agent': UA, accept }, redirect: 'follow' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

/** robots.txt is a rule we follow, not a hint. A source that says no is a no. */
async function robotsAllows(url) {
  const { origin, pathname } = new URL(url)
  let text
  try {
    text = await get(`${origin}/robots.txt`, 'text/plain')
  } catch (error) {
    // No robots.txt (404) means nothing is disallowed. A 403 means the site is
    // refusing programs outright, which we treat as a refusal.
    return { allowed: !String(error).includes('403'), reason: `robots.txt ${error.message}` }
  }

  // Only the `*` group applies to us; we are not pretending to be anyone else.
  const lines = text.split('\n').map((l) => l.replace(/#.*/, '').trim())
  let inStar = false
  const disallow = []
  for (const line of lines) {
    const [rawKey, ...rest] = line.split(':')
    const key = rawKey.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (key === 'user-agent') inStar = value === '*'
    else if (inStar && key === 'disallow' && value) disallow.push(value)
  }

  const blocked = disallow.find((rule) => pathname.startsWith(rule))
  return { allowed: !blocked, reason: blocked ? `Disallow: ${blocked}` : 'allowed by robots.txt' }
}

/**
 * Pages that answer 200 but say "you are a bot". A site that starts serving
 * these is refusing, and the correct response is to stop asking — not to slow
 * down, rotate anything, or try again from somewhere else.
 */
const REFUSAL = /アクセス制限|アクセスが制限|access denied|forbidden|are you a robot|verify you are human|検証しています/i

const strip = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? strip(m[1]) : ''
}

function parseRss(xml) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? []
  return blocks.map((block) => {
    const link =
      tag(block, 'link') || (block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? '')
    return {
      title: tag(block, 'title'),
      url: link,
      at: tag(block, 'pubDate') || tag(block, 'updated') || tag(block, 'published'),
      summary: tag(block, 'description') || tag(block, 'summary'),
    }
  })
}

function parseSitemap(xml) {
  const blocks = xml.match(/<url\b[\s\S]*?<\/url>/gi) ?? []
  return blocks.map((block) => ({
    title: '',
    url: tag(block, 'loc'),
    at: tag(block, 'lastmod'),
    summary: '',
  }))
}

/** A sitemap index points at more sitemaps; follow one level, politely. */
async function fetchSitemap(url, depth = 0) {
  const xml = await get(url)
  if (!xml.includes('<sitemapindex')) return parseSitemap(xml)
  if (depth > 0) return []

  const children = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 5)
  const out = []
  for (const child of children) {
    await sleep(POLITE_DELAY_MS)
    try {
      out.push(...(await fetchSitemap(child, depth + 1)))
    } catch {
      /* one bad child sitemap should not sink the run */
    }
  }
  return out
}

/**
 * A sitemap gives URLs and nothing else, and a lead with no title still costs a
 * click to triage — which defeats the point. So for sitemap sources we fetch
 * each page's <title> and meta description, slowly, and only for the handful
 * we actually kept.
 */
async function enrich(items, render) {
  if (!render) {
    const out = []
    for (const item of items) {
      await sleep(POLITE_DELAY_MS)
      try {
        const html = await get(item.url, 'text/html')
        const title = strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
      if (REFUSAL.test(title)) {
        console.log(`  ✗ ${new URL(item.url).host} 开始拒绝——停止抓这个源`)
        break
      }
        const description = strip(
          html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? '',
        )
        out.push({ ...item, title: title || item.title, summary: description || item.summary })
      } catch {
        out.push(item)
      }
    }
    return out
  }

  // Some catalogues render entirely in the browser — the served HTML has an
  // empty <title>. Rendering is not circumvention here: robots.txt allows the
  // path and the server answers 200 happily; it just expects a real client.
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch()
  const page = await browser.newPage({ userAgent: UA })
  const out = []
  try {
    for (const item of items) {
      await sleep(POLITE_DELAY_MS)
      try {
        await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 20_000 })
        await page.waitForFunction(() => document.title.trim().length > 0, null, { timeout: 8_000 })
        const meta = await page.evaluate(() => ({
          title: document.title.trim(),
          description:
            document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '',
        }))
        if (REFUSAL.test(meta.title)) {
          console.log(`  ✗ ${new URL(item.url).host} 开始拒绝（「${meta.title}」）——停止抓这个源`)
          break
        }
        out.push({ ...item, title: meta.title || item.title, summary: meta.description || item.summary })
      } catch {
        out.push(item)
      }
    }
  } finally {
    await browser.close()
  }
  return out
}

async function pull(source) {
  const check = await robotsAllows(source.url)
  if (!check.allowed) {
    return { source, skipped: `robots.txt 不允许 (${check.reason})`, items: [] }
  }

  let items
  try {
    items = source.type === 'rss' ? parseRss(await get(source.url)) : await fetchSitemap(source.url)
  } catch (error) {
    return { source, skipped: `取不到：${error.message}`, items: [] }
  }

  const cutoff = Date.now() - (source.withinDays ?? 7) * 86_400_000
  const match = source.match ? new RegExp(source.match, 'i') : null

  const fresh = items
    .filter((item) => item.url)
    .filter((item) => !match || match.test(item.url) || match.test(item.title))
    .filter((item) => {
      if (!item.at) return true
      const t = new Date(item.at).getTime()
      return Number.isNaN(t) || t >= cutoff
    })
    .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
    .slice(0, source.limit ?? 25)

  const enriched =
    source.type === 'sitemap' && source.titles !== false ? await enrich(fresh, source.render) : fresh
  return { source, items: enriched }
}

// ── --check: is one URL fetchable and allowed? ───────────────────────────────
const checkUrl = flag('check')
if (typeof checkUrl === 'string') {
  const allowed = await robotsAllows(checkUrl)
  let status = 'unreachable'
  try {
    await get(checkUrl)
    status = 'HTTP 200'
  } catch (error) {
    status = error.message
  }
  console.log(`${checkUrl}\n  robots: ${allowed.reason}\n  fetch:  ${status}`)
  console.log(allowed.allowed && status === 'HTTP 200' ? '  → 🟢 可以加进 sources.json' : '  → 🔴 不要加')
  process.exit(0)
}

// ── Normal run ───────────────────────────────────────────────────────────────
const config = JSON.parse(await readFile(resolve('scripts/sources.json'), 'utf8'))
const only = flag('only')
const sources = config.sources.filter((s) => !only || s.id === only)

const leads = []
for (const source of sources) {
  const { skipped, items } = await pull(source)
  if (skipped) {
    console.log(`✗ ${source.name}: ${skipped}`)
    continue
  }
  console.log(`✓ ${source.name}：${items.length} 条`)
  for (const item of items) {
    // A lead with nothing but a URL still costs a click to triage, which is
    // exactly the work this is supposed to remove.
    if (!item.title && !item.summary) continue
    leads.push({
      id: `ing_${source.id}_${Buffer.from(item.url).toString('base64url').slice(0, 10)}`,
      capturedAt: new Date().toISOString(),
      kind: source.kind ?? 'web',
      raw: [item.title, item.summary].filter(Boolean).join('\n').slice(0, 600) || item.url,
      url: item.url,
      status: 'new',
    })
  }
  await sleep(POLITE_DELAY_MS)
}

const out = resolve('leads.json')
await writeFile(out, JSON.stringify({ generatedAt: new Date().toISOString(), leads }, null, 2))
console.log(`\n共 ${leads.length} 条线索 → ${out}`)
console.log('在 /admin.html 的收件箱里「导入线索」，重复的会自动跳过。')
