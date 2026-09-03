import { useRef, useState } from 'react'
import { overdueLabel, patrolStatus } from './logic'
import { newId } from './store'
import { SOURCE_LABEL, WHY_MANUAL, type AdminState, type Lead, type SourceKind } from './types'

const KINDS: SourceKind[] = ['instagram', 'line', 'mail', 'discord', 'x', 'app', 'web', 'store', 'tip']

/**
 * Capture first, structure later. The cost of losing an Instagram Story is
 * total — it is gone in 24 hours — so this box takes anything at all and
 * never blocks on a required field.
 */
export function Inbox({
  state,
  update,
  onPromote,
}: {
  state: AdminState
  update: (patch: (prev: AdminState) => AdminState) => void
  onPromote: (lead: Lead) => void
}) {
  const [raw, setRaw] = useState('')
  const [url, setUrl] = useState('')
  const [kind, setKind] = useState<SourceKind>('instagram')
  const [imported, setImported] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const now = Date.now()

  /**
   * Merges a leads.json from `npm run ingest`. Appends rather than replaces,
   * and skips anything already captured — running the ingester twice in a day
   * should not fill the inbox with the same items.
   */
  const importLeads = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { leads?: Lead[] }
      const incoming = parsed.leads ?? []
      if (incoming.length === 0) throw new Error('文件里没有 leads')

      let added = 0
      update((prev) => {
        const seen = new Set(prev.leads.map((l) => l.url ?? l.id))
        const fresh = incoming.filter((l) => !seen.has(l.url ?? l.id))
        added = fresh.length
        return { ...prev, leads: [...fresh, ...prev.leads] }
      })
      setImported(`导入 ${added} 条，跳过 ${incoming.length - added} 条重复`)
    } catch (error) {
      setImported(`导入失败：${error instanceof Error ? error.message : '文件读不出来'}`)
    }
  }

  const capture = () => {
    if (!raw.trim() && !url.trim()) return
    const lead: Lead = {
      id: newId('l'),
      capturedAt: new Date().toISOString(),
      kind,
      raw: raw.trim(),
      url: url.trim() || undefined,
      status: 'new',
    }
    update((prev) => ({ ...prev, leads: [lead, ...prev.leads] }))
    setRaw('')
    setUrl('')
  }

  const setStatus = (id: string, status: Lead['status']) =>
    update((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => (l.id === id ? { ...l, status } : l)),
    }))

  const due = patrolStatus(state.patrol, now).filter((p) => p.due)
  const open = state.leads.filter((l) => l.status === 'new')

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        <section className="rounded-lg border border-line bg-surface p-4">
          <h2 className="text-[12px] font-bold text-fg">快速捕获</h2>
          <p className="mt-1 text-[11px] text-faint">
            粘贴任何东西：Story 截图里的文字、LINE 转发、Discord 公告。先存下来，之后再整理。
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded border px-2.5 py-1 text-[11px] font-medium transition ${
                  kind === k ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
                }`}
              >
                {SOURCE_LABEL[k]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-faint">{WHY_MANUAL[kind]}</p>

          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={4}
            placeholder="原文粘贴到这里…"
            className="mt-3 w-full rounded border border-line bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-fg outline-none placeholder:text-faint focus:border-faint"
          />
          <div className="mt-2 flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="链接（可选）"
              className="min-w-0 flex-1 rounded border border-line bg-surface-2 px-2 py-1.5 text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
            />
            <button
              type="button"
              onClick={capture}
              className="shrink-0 rounded bg-accent px-4 py-1.5 text-[12px] font-bold text-accent-ink transition hover:bg-accent-dim"
            >
              存入
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded border border-line bg-surface-2 px-3 py-1.5 text-[11px] font-semibold text-fg transition hover:border-accent"
            >
              导入线索文件
            </button>
            <span className="text-[11px] text-faint">
              先跑 <code className="font-mono">npm run ingest</code>，再把 leads.json 拖进来
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void importLeads(file)
                e.target.value = ''
              }}
            />
          </div>
          {imported && <p className="mt-1.5 text-[11px] text-muted">{imported}</p>}
        </section>

        <section>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-faint">待处理线索</h2>
            <span className="font-mono text-[11px] text-faint tabular-nums">{open.length}</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {open.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface p-4 text-[12px] text-faint">
              没有待处理的线索。去右边的巡回清单跑一轮。
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {open.map((lead) => (
                <article key={lead.id} className="rounded-lg border border-line bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded border border-line px-1.5 py-0.5 text-faint">
                      {SOURCE_LABEL[lead.kind]}
                    </span>
                    <span className="font-mono text-faint">
                      {new Date(lead.capturedAt).toLocaleString()}
                    </span>
                    {lead.url && (
                      <a
                        href={lead.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-fg underline underline-offset-4"
                      >
                        打开来源 ↗
                      </a>
                    )}
                  </div>
                  {lead.raw && (
                    <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-muted">{lead.raw}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onPromote(lead)
                        setStatus(lead.id, 'promoted')
                      }}
                      className="rounded border border-line bg-surface-2 px-3 py-1.5 text-[11px] font-semibold text-fg transition hover:border-accent"
                    >
                      转为草稿
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(lead.id, 'dropped')}
                      className="rounded border border-line px-3 py-1.5 text-[11px] text-faint transition hover:text-fg"
                    >
                      不追
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-[12px] font-bold text-fg">今天该看的</h2>
        <p className="mt-1 text-[11px] text-faint">
          这些源爬虫拿不到，只能你自己去看一眼。
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {due.length === 0 && <p className="text-[12px] text-easy">全部都在周期内，没有逾期的。</p>}
          {due.map((status) => {
            const { source } = status
            return (
            <div key={source.id} className="flex items-center gap-2 rounded border border-line px-2.5 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-fg">{source.name}</div>
                <div className="text-[10px] text-faint">
                  {SOURCE_LABEL[source.kind]} · {overdueLabel(status)}
                </div>
                <div className="text-[10px] text-faint/80">{WHY_MANUAL[source.kind]}</div>
              </div>
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-[11px] text-fg underline underline-offset-4"
                >
                  开
                </a>
              )}
              <button
                type="button"
                onClick={() =>
                  update((prev) => ({
                    ...prev,
                    patrol: prev.patrol.map((p) =>
                      p.id === source.id ? { ...p, lastCheckedAt: new Date().toISOString() } : p,
                    ),
                  }))
                }
                className="shrink-0 rounded border border-line px-2 py-1 text-[10px] text-faint transition hover:text-fg"
              >
                查过了
              </button>
            </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
