/**
 * Cloudflare Pages Function backing the wantlist.
 *
 * GET  /api/wants  → the current list with live counts
 * POST /api/wants  → add a request, or +1 an existing one
 *
 * Deliberately tiny and free-tier shaped: one D1 table, no accounts. Identity
 * is a hash of IP + User-Agent, which is enough to stop casual double-voting
 * without storing anything that identifies a person.
 *
 * Setup: create a D1 database, bind it as WANTS_DB in the Pages project, then
 *   CREATE TABLE wants (
 *     id TEXT PRIMARY KEY, name TEXT NOT NULL, norm TEXT NOT NULL UNIQUE,
 *     category TEXT NOT NULL, note TEXT,
 *     count INTEGER NOT NULL DEFAULT 1,
 *     first_asked_at TEXT NOT NULL, last_asked_at TEXT NOT NULL,
 *     matched_slug TEXT
 *   );
 *   CREATE TABLE want_votes (want_id TEXT NOT NULL, voter TEXT NOT NULL, PRIMARY KEY (want_id, voter));
 */

interface Env {
  WANTS_DB: D1Database
}

const CATEGORIES = ['sneakers', 'tcg', 'figure', 'arttoy', 'goods', 'hardware']

/** Mirrors normalizeName in src/lib/wants.ts — keep the two in step. */
function normalize(name: string) {
  return name
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s　]+/g, '')
    .replace(/[·・･\-—_/,.，。、!！?？"'“”‘’`()（）[\]【】]/g, '')
}

/** Coarse, salted, and never stored alongside anything else identifying. */
async function voterId(request: Request) {
  const raw = [
    request.headers.get('cf-connecting-ip') ?? '',
    request.headers.get('user-agent') ?? '',
  ].join('|')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.WANTS_DB.prepare(
    `SELECT id, name, category, note, count, first_asked_at, last_asked_at, matched_slug
     FROM wants ORDER BY count DESC LIMIT 300`,
  ).all()

  return json(
    (results ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      note: row.note ?? undefined,
      count: row.count,
      firstAskedAt: row.first_asked_at,
      lastAskedAt: row.last_asked_at,
      matchedSlug: row.matched_slug ?? undefined,
    })),
  )
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { name?: string; category?: string; note?: string; wantId?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad-json' }, 400)
  }

  const name = (body.name ?? '').trim()
  if (name.length < 2 || name.length > 120 || /https?:\/\//i.test(name)) {
    return json({ error: 'invalid-name' }, 400)
  }
  const category = CATEGORIES.includes(body.category ?? '') ? body.category! : 'sneakers'
  const note = (body.note ?? '').trim().slice(0, 300) || null
  const now = new Date().toISOString()
  const voter = await voterId(request)
  const norm = normalize(name)

  const existing = await env.WANTS_DB.prepare('SELECT id FROM wants WHERE norm = ?')
    .bind(norm)
    .first<{ id: string }>()

  const id = existing?.id ?? crypto.randomUUID().slice(0, 8)

  // One vote per device per request; a repeat is a no-op, not an error, so the
  // client never has to care whether it already sent this.
  const vote = await env.WANTS_DB.prepare(
    'INSERT OR IGNORE INTO want_votes (want_id, voter) VALUES (?, ?)',
  )
    .bind(id, voter)
    .run()
  const counted = (vote.meta?.changes ?? 0) > 0

  if (existing) {
    if (counted) {
      await env.WANTS_DB.prepare('UPDATE wants SET count = count + 1, last_asked_at = ? WHERE id = ?')
        .bind(now, id)
        .run()
    }
  } else {
    await env.WANTS_DB.prepare(
      `INSERT INTO wants (id, name, norm, category, note, count, first_asked_at, last_asked_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    )
      .bind(id, name, norm, category, note, now, now)
      .run()
  }

  return json({ id, counted })
}
