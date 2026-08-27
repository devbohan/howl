/**
 * Gate for everything that is not meant for the public.
 *
 * Two things need protecting and they are protected for different reasons:
 *   /admin.html   — the back office. Even though its data lives in the
 *                   operator's browser today, the tool itself should not be
 *                   open, and it will be backed by D1 soon enough.
 *   GET /api/clicks — the outbound-click report. This is the business: which
 *                   retailers we send buyers to and which drops convert. It is
 *                   the single most sensitive thing the site can serve.
 *
 * POST /api/clicks and both halves of /api/wants stay open — they are how
 * visitors contribute, and they are write-mostly.
 *
 * Basic auth is the floor, not the ceiling. Prefer Cloudflare Access in front
 * of /admin.html: real SSO, no shared secret sitting in an env var, and an
 * audit log. This middleware is what still holds if Access is misconfigured.
 */

interface Env {
  /** Set in Pages → Settings → Environment variables. Unset = locked shut. */
  ADMIN_PASSWORD?: string
}

const PROTECTED_PATHS = ['/admin.html', '/admin']

function isProtected(request: Request) {
  const url = new URL(request.url)
  if (PROTECTED_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))) return true
  // Reading the click report is privileged; recording a click is not.
  return url.pathname === '/api/clicks' && request.method === 'GET'
}

/** Constant-time compare, so the response time cannot leak the password. */
function matches(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function authorized(request: Request, password: string) {
  const header = request.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return false
  try {
    const decoded = atob(header.slice(6))
    const supplied = decoded.slice(decoded.indexOf(':') + 1)
    return matches(supplied, password)
  } catch {
    return false
  }
}

const deny = (status: number, body: string, headers: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex, nofollow', ...headers },
  })

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context

  if (!isProtected(request)) {
    const response = await next()
    // Blanket header so nothing under /api is ever indexed, whatever it returns.
    if (new URL(request.url).pathname.startsWith('/api/')) {
      const headers = new Headers(response.headers)
      headers.set('x-robots-tag', 'noindex, nofollow')
      return new Response(response.body, { status: response.status, headers })
    }
    return response
  }

  // No password configured means the gate stays shut, not open. Failing closed
  // is the only safe default for something that guards the back office.
  if (!env.ADMIN_PASSWORD) {
    return deny(503, 'ADMIN_PASSWORD is not configured. This route is closed until it is.')
  }

  if (!authorized(request, env.ADMIN_PASSWORD)) {
    return deny(401, 'Authentication required.', {
      'www-authenticate': 'Basic realm="WolfGrandma", charset="UTF-8"',
    })
  }

  return next()
}
