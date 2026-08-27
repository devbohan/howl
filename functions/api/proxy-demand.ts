/**
 * Counts people who, at the friction wall, said they would want someone to buy
 * on their behalf. A tally, nothing more — no contact details are collected, so
 * there is nothing here to leak and nothing implied to the person who clicked.
 *
 * POST /api/proxy-demand  → record (open; this is how visitors contribute)
 * GET  /api/proxy-demand  → totals per drop (gated: this is business data,
 *                           and it is the number that decides whether running
 *                           a proxy service ourselves would be worth it)
 *
 * Setup: bind a D1 database as DEMAND_DB, then
 *   CREATE TABLE proxy_demand (
 *     day TEXT NOT NULL, slug TEXT NOT NULL, locale TEXT NOT NULL,
 *     hits INTEGER NOT NULL DEFAULT 0,
 *     PRIMARY KEY (day, slug, locale)
 *   );
 */

interface Env {
  DEMAND_DB: D1Database
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

const day = (at?: string) => {
  const d = at ? new Date(at) : new Date()
  return (Number.isNaN(d.getTime()) ? new Date() : d).toISOString().slice(0, 10)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let batch: { slug?: string; locale?: string; at?: string }[]
  try {
    const parsed = await request.json()
    batch = Array.isArray(parsed) ? parsed : [parsed as { slug?: string }]
  } catch {
    return json({ error: 'bad-json' }, 400)
  }

  const rows = batch
    .slice(0, 50)
    .filter((v) => typeof v.slug === 'string' && v.slug.length > 0 && v.slug.length < 96)

  if (rows.length === 0) return json({ recorded: 0 })

  await env.DEMAND_DB.batch(
    rows.map((v) =>
      env.DEMAND_DB.prepare(
        `INSERT INTO proxy_demand (day, slug, locale, hits) VALUES (?, ?, ?, 1)
         ON CONFLICT (day, slug, locale) DO UPDATE SET hits = hits + 1`,
      ).bind(day(v.at), v.slug, (v.locale ?? '').slice(0, 8)),
    ),
  )

  return json({ recorded: rows.length })
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get('days') ?? 90)))
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  const byDrop = await env.DEMAND_DB.prepare(
    `SELECT slug, SUM(hits) AS hits FROM proxy_demand WHERE day >= ?
     GROUP BY slug ORDER BY hits DESC LIMIT 200`,
  )
    .bind(since)
    .all()

  const total = await env.DEMAND_DB.prepare(
    `SELECT SUM(hits) AS hits FROM proxy_demand WHERE day >= ?`,
  )
    .bind(since)
    .first<{ hits: number }>()

  return json({ since, days, total: total?.hits ?? 0, byDrop: byDrop.results })
}
