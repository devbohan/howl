import { useEffect, useState } from 'react'
import { BOOKMARKLET_HREF, BOOKMARKLET_TARGET } from './bookmarklet/generated'
import { completeness, type Captured } from './capture'
import { convert, formatPrice } from '../lib/format'
import { newId } from './store'
import type { AdminState, ChannelProfile } from './types'
import { unknownFact } from './types'

/** Where to look for the same product. Opened in your browser, by you. */
const SEARCH_SITES = [
  { name: '駿河屋', url: (q: string) => `https://www.suruga-ya.jp/search?category=&search_word=${q}` },
  { name: 'AmiAmi', url: (q: string) => `https://www.amiami.com/eng/search/list/?s_keywords=${q}` },
  { name: 'メルカリ', url: (q: string) => `https://jp.mercari.com/search?keyword=${q}` },
  { name: 'Yahoo!オク', url: (q: string) => `https://auctions.yahoo.co.jp/search/search?p=${q}` },
  { name: '楽天', url: (q: string) => `https://search.rakuten.co.jp/search/mall/${q}/` },
  { name: 'StockX', url: (q: string) => `https://stockx.com/search?s=${q}` },
  { name: 'eBay', url: (q: string) => `https://www.ebay.com/sch/i.html?_nkw=${q}` },
]

export interface CaptureRecord extends Captured {
  id: string
  draftId?: string
}

/**
 * The price-and-friction workbench. You open the shops, the bookmarklet reads
 * each page, and everything lands here side by side — which is the comparison
 * the whole product is built on, and the one thing a retailer's own page will
 * never show you.
 */
export function Compare({
  state,
  update,
  captures,
  setCaptures,
}: {
  state: AdminState
  update: (patch: (prev: AdminState) => AdminState) => void
  captures: CaptureRecord[]
  setCaptures: (next: CaptureRecord[]) => void
}) {
  const [draftId, setDraftId] = useState<string>('')
  const [query, setQuery] = useState('')
  const draft = state.drafts.find((d) => d.id === draftId) ?? null

  // Captures arrive through the URL fragment, which is why no server is needed.
  useEffect(() => {
    const match = location.hash.match(/#capture=(.+)$/)
    if (!match) return
    try {
      const incoming = JSON.parse(decodeURIComponent(match[1])) as Captured
      setCaptures([{ ...incoming, id: newId('cap') }, ...captures])
    } catch {
      /* a malformed fragment is not worth interrupting the page for */
    }
    history.replaceState(null, '', location.pathname + location.search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mine = captures.filter((c) => !c.draftId || c.draftId === draftId)
  const cheapest = mine
    .filter((c) => c.price && c.currency)
    .reduce<CaptureRecord | null>(
      (best, c) =>
        !best || convert(c.price!, c.currency!, 'JPY') < convert(best.price!, best.currency!, 'JPY') ? c : best,
      null,
    )

  /** Turns a capture into a channel profile so its friction gets researched. */
  const promoteToChannel = (c: CaptureRecord) => {
    const existing = state.channels.find((ch) => {
      try {
        return new URL(ch.url).host === c.host
      } catch {
        return false
      }
    })
    if (existing) return

    const channel: ChannelProfile = {
      id: newId('ch'),
      name: c.host,
      region: 'JP',
      url: `https://${c.host}`,
      shipsWorldwide: unknownFact(),
      acceptsForeignCard: unknownFact(),
      requiresLocalPhone: unknownFact(),
      requiresLocalId: unknownFact(),
      purchaseHistoryGated: unknownFact(),
      proxies: unknownFact(),
      dutyNote: unknownFact(),
      selfProxyViable: unknownFact(),
      updatedAt: new Date().toISOString(),
    }
    update((prev) => ({ ...prev, channels: [...prev.channels, channel] }))
  }

  const attach = (c: CaptureRecord) => {
    if (!draft) return
    setCaptures(captures.map((x) => (x.id === c.id ? { ...x, draftId: draft.id } : x)))
    promoteToChannel(c)
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-[12px] font-bold text-fg">一次装好：把书签拖到书签栏</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          在任何商品页点它，就把商品名、价格、库存、JAN 码抓回这里。
          <strong className="text-fg">它读的是你已经打开的页面</strong>
          ——不是爬虫，所以那些封机器人的店照样能用。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line react/jsx-no-script-url */}
          <a
            href={BOOKMARKLET_HREF}
            onClick={(e) => e.preventDefault()}
            className="cursor-grab rounded border border-accent bg-accent px-4 py-2 text-[12px] font-bold text-accent-ink"
          >
            ⇱ 抓这一页
          </a>
          <span className="text-[11px] text-faint">← 拖到书签栏（点它没用，要拖）</span>
        </div>
        <p className="mt-2 text-[11px] text-faint">
          当前指向 <code className="font-mono">{BOOKMARKLET_TARGET}</code>。换了地址就重新生成：
          <code className="font-mono">ADMIN_URL=… npm run build:bookmarklet</code>
        </p>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-[12px] font-bold text-fg">开一圈店</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="商品名 / JAN 码"
            className="min-w-0 flex-1 rounded border border-line bg-surface-2 px-3 py-2 text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
          />
          <button
            type="button"
            disabled={!query.trim()}
            onClick={() => {
              const q = encodeURIComponent(query.trim())
              // Opened one at a time by an explicit click — this is you browsing.
              for (const site of SEARCH_SITES) window.open(site.url(q), '_blank', 'noopener')
            }}
            className="shrink-0 rounded bg-accent px-4 py-2 text-[12px] font-bold text-accent-ink transition hover:bg-accent-dim disabled:opacity-40"
          >
            全部打开（{SEARCH_SITES.length}）
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SEARCH_SITES.map((site) => (
            <button
              key={site.name}
              type="button"
              disabled={!query.trim()}
              onClick={() => window.open(site.url(encodeURIComponent(query.trim())), '_blank', 'noopener')}
              className="rounded border border-line px-2.5 py-1 text-[11px] text-faint transition hover:text-fg disabled:opacity-40"
            >
              {site.name}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[12px] font-bold text-fg">抓到的（{mine.length}）</h2>
          <select
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[11px] text-fg outline-none"
          >
            <option value="">挂到哪个草稿…</option>
            {state.drafts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title || '（未命名）'}
              </option>
            ))}
          </select>
          {captures.length > 0 && (
            <button
              type="button"
              onClick={() => setCaptures([])}
              className="ml-auto rounded border border-line px-2.5 py-1 text-[11px] text-faint transition hover:text-fg"
            >
              清空
            </button>
          )}
        </div>

        {mine.length === 0 ? (
          <p className="mt-3 text-[12px] text-faint">
            还没抓到东西。上面「全部打开」，然后在每个商品页点书签。
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.12em] text-faint">
                  <th className="border-b border-line py-2 text-left">店</th>
                  <th className="border-b border-line py-2 text-left">商品名</th>
                  <th className="border-b border-line py-2 text-right">价格</th>
                  <th className="border-b border-line py-2 text-left">库存</th>
                  <th className="border-b border-line py-2 text-left">来源</th>
                  <th className="border-b border-line py-2"></th>
                </tr>
              </thead>
              <tbody>
                {mine.map((c) => {
                  const done = completeness(c)
                  const isCheapest = cheapest?.id === c.id
                  return (
                    <tr key={c.id} className={isCheapest ? 'bg-easy/5' : ''}>
                      <td className="border-b border-line-soft py-2 align-top">
                        <a href={c.url} target="_blank" rel="noreferrer" className="text-fg underline underline-offset-4">
                          {c.host}
                        </a>
                        {isCheapest && <span className="ml-1.5 text-[10px] font-bold text-easy">最低</span>}
                      </td>
                      <td className="max-w-[18rem] border-b border-line-soft py-2 align-top text-muted">
                        <span className="line-clamp-2">{c.name ?? '—'}</span>
                        {c.gtin && <span className="mt-0.5 block font-mono text-[10px] text-faint">JAN {c.gtin}</span>}
                      </td>
                      <td className="border-b border-line-soft py-2 text-right align-top font-mono tabular-nums text-fg">
                        {c.price && c.currency ? formatPrice(c.price, c.currency, 'JPY', 'ja') : '—'}
                      </td>
                      <td className="border-b border-line-soft py-2 align-top">
                        <span
                          className={
                            c.availability === 'in-stock'
                              ? 'text-easy'
                              : c.availability === 'sold-out'
                                ? 'text-hard'
                                : 'text-faint'
                          }
                        >
                          {c.availability ?? '未知'}
                        </span>
                      </td>
                      <td className="border-b border-line-soft py-2 align-top text-[10px] text-faint">
                        {done.got}/{done.total}
                        <span className="ml-1">{Object.values(c.via)[0] ?? '—'}</span>
                      </td>
                      <td className="border-b border-line-soft py-2 text-right align-top">
                        {c.draftId ? (
                          <span className="text-[10px] text-easy">已挂</span>
                        ) : (
                          <button
                            type="button"
                            disabled={!draft}
                            onClick={() => attach(c)}
                            className="rounded border border-line px-2 py-1 text-[10px] text-fg transition hover:border-accent disabled:opacity-40"
                          >
                            挂上并建渠道
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              价格和库存抓到了，<strong className="text-fg">但海淘难度抓不到</strong>——
              「要不要日本手机号」「海外卡能不能付」哪个页面都不会写。挂上之后去「渠道」页把那几个问题答掉，
              之后所有走这家店的商品都自动继承。
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
