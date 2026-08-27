/**
 * Outbound click recorder and the report built on it.
 *
 * POST /api/clicks           → record a batch (sent by navigator.sendBeacon)
 * GET  /api/clicks?days=30   → per-channel totals, i.e. the number you show a
 *                              retailer when you ask them to list with you
 *
 * Nothing stored identifies a person: destination host, channel, locale, day.
 *
 * Setup: bind a D1 database as CLICKS_DB, then
 *   CREATE TABLE clicks (
 *     day TEXT NOT NULL, kind TEXT NOT NULL, host TEXT NOT NULL,
 *     locale TEXT NOT NULL, context TEXT, channel_id TEXT,
 *     affiliate INTEGER NOT NULL DEFAULT 0, hits INTEGER NOT NULL DEFAULT 0,
 *     PRIMARY KEY (day, kind, host, locale, context, channel_id)
 *   );
 *
 * Rows are pre-aggregated by day, so the table stays small no matter how much
 * traffic arrives — a year of heavy use is thousands of rows, not millions.
 */

interface Env {
  CLICKS_DB: D1Database
}

const KINDS = ['store', 'coverage', 'news', 'proxy']
const MAX_BATCH = 50

interface Incoming {
  kind?: string
  host?: string
  locale?: string
  context?: string
  channelId?: string
  affiliate?: boolean
  at?: string
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
  let batch: Incoming[]
  try {
    const parsed = await request.json()
    batch = Array.isArray(parsed) ? parsed : [parsed as Incoming]
  } catch {
    return json({ error: 'bad-json' }, 400)
  }

  const rows = batch
    .slice(0, MAX_BATCH)
    .filter((c) => KINDS.includes(c.kind ?? '') && typeof c.host === 'string' && c.host.length < 128)

  if (rows.length === 0) return json({ recorded: 0 })

  // One upsert per row; D1 batches them into a single round trip.
  await env.CLICKS_DB.batch(
    rows.map((c) =>
      env.CLICKS_DB.prepare(
        `INSERT INTO clicks (day, kind, host, locale, context, channel_id, affiliate, hits)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON CONFLICT (day, kind, host, locale, context, channel_id)
         DO UPDATE SET hits = hits + 1`,
      ).bind(
        day(c.at),
        c.kind,
        c.host,
        (c.locale ?? '').slice(0, 8),
        (c.context ?? '').slice(0, 96),
        (c.channelId ?? '').slice(0, 32),
        c.affiliate ? 1 : 0,
      ),
    ),
  )

  return json({ recorded: rows.length })
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get('days') ?? 30)))
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  const byHost = await env.CLICKS_DB.prepare(
    `SELECT host, SUM(hits) AS hits, SUM(CASE WHEN affiliate = 1 THEN hits ELSE 0 END) AS affiliate_hits
     FROM clicks WHERE kind = 'store' AND day >= ?
     GROUP BY host ORDER BY hits DESC LIMIT 100`,
  )
    .bind(since)
    .all()

  const byKind = await env.CLICKS_DB.prepare(
    `SELECT kind, SUM(hits) AS hits FROM clicks WHERE day >= ? GROUP BY kind`,
  )
    .bind(since)
    .all()

  const byDrop = await env.CLICKS_DB.prepare(
    `SELECT context AS slug, SUM(hits) AS hits FROM clicks
     WHERE kind = 'store' AND day >= ? AND context <> ''
     GROUP BY context ORDER BY hits DESC LIMIT 50`,
  )
    .bind(since)
    .all()

  return json({ since, days, byHost: byHost.results, byKind: byKind.results, byDrop: byDrop.results })
}
