import { useState } from 'react'
import { CATEGORIES, CATEGORY_KEY, MECHANICS, MECHANIC_KEY } from '../lib/labels'
import { DICT } from '../lib/i18n'
import { frictionOf, readiness } from './logic'
import { emptyDraft, replaceById } from './store'
import { FactField } from './FactField'
import type { AdminState, DropDraft } from './types'
import type { Category, Mechanic } from '../lib/types'

/** ISO in, `datetime-local` out — the input needs local time without the zone. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function Verify({
  state,
  update,
  selectedId,
  onSelect,
}: {
  state: AdminState
  update: (patch: (prev: AdminState) => AdminState) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'ready'>('all')

  const drafts = state.drafts.filter((d) => (filter === 'all' ? true : d.status === filter))
  const current = state.drafts.find((d) => d.id === selectedId) ?? null

  const save = (next: DropDraft) =>
    update((prev) => ({
      ...prev,
      drafts: replaceById(prev.drafts, { ...next, updatedAt: new Date().toISOString() }),
    }))

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5">
          {(['all', 'draft', 'ready'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded border px-2.5 py-1 text-[11px] font-medium transition ${
                filter === f ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
              }`}
            >
              {f === 'all' ? '全部' : f === 'draft' ? '草稿' : '可发布'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const draft = emptyDraft()
              update((prev) => ({ ...prev, drafts: [draft, ...prev.drafts] }))
              onSelect(draft.id)
            }}
            className="ml-auto rounded bg-accent px-3 py-1 text-[11px] font-bold text-accent-ink"
          >
            新建
          </button>
        </div>

        {drafts.length === 0 && (
          <p className="rounded-lg border border-line bg-surface p-4 text-[12px] text-faint">
            还没有草稿。从收件箱把线索转过来，或直接新建。
          </p>
        )}

        {drafts.map((draft) => {
          const r = readiness(draft)
          return (
            <button
              key={draft.id}
              type="button"
              onClick={() => onSelect(draft.id)}
              className={`rounded-lg border bg-surface p-3 text-left transition ${
                draft.id === selectedId ? 'border-accent' : 'border-line hover:border-faint'
              }`}
            >
              <div className="truncate text-[12px] font-semibold text-fg">
                {draft.title || '（未命名）'}
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                <span className={r.ready ? 'text-easy' : 'text-medium'}>
                  {r.ready ? '可发布' : `缺 ${r.missing.length} 项`}
                </span>
                <span className="font-mono text-faint tabular-nums">
                  {r.confirmed}/{r.total} 已确认
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {current ? (
        <DraftEditor key={current.id} state={state} draft={current} onChange={save} />
      ) : (
        <p className="rounded-lg border border-line bg-surface p-6 text-[12px] text-faint">
          选一条草稿开始核对。<strong className="text-fg">所有字段默认「未知」</strong>——
          只有你真的在页面上看过之后，才把它标成「已确认」。
        </p>
      )}
    </div>
  )
}

function DraftEditor({
  state,
  draft,
  onChange,
}: {
  state: AdminState
  draft: DropDraft
  onChange: (next: DropDraft) => void
}) {
  const r = readiness(draft)
  const lead = state.leads.find((l) => l.id === draft.leadId)
  const attached = state.channels.filter((c) => draft.channelIds.includes(c.id))
  const { friction, why } = frictionOf(attached)

  const set = <K extends keyof DropDraft>(key: K, value: DropDraft[K]) =>
    onChange({ ...draft, [key]: value })

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded border px-2 py-1 text-[11px] font-semibold ${
              r.ready ? 'border-easy/40 bg-easy/10 text-easy' : 'border-medium/40 bg-medium/10 text-medium'
            }`}
          >
            {r.ready ? '可发布' : '还不能发'}
          </span>
          {r.missing.map((m) => (
            <span key={m} className="rounded border border-line px-2 py-1 text-[11px] text-faint">
              缺 {m}
            </span>
          ))}
          {draft.sourceUrl && (
            <a
              href={draft.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto rounded border border-line bg-surface-2 px-3 py-1 text-[11px] font-semibold text-fg transition hover:border-accent"
            >
              打开来源核对 ↗
            </a>
          )}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="商品名"
            className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
          />
          <input
            value={draft.brand}
            onChange={(e) => set('brand', e.target.value)}
            placeholder="品牌 / 发售方"
            className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
          />
          <input
            value={draft.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="slug（url 用）"
            className="rounded border border-line bg-surface-2 px-2 py-1.5 font-mono text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
          />
          <input
            value={draft.sourceUrl ?? ''}
            onChange={(e) => set('sourceUrl', e.target.value || undefined)}
            placeholder="官方来源 URL"
            className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c: Category) => (
            <button
              key={c}
              type="button"
              onClick={() => set('category', c)}
              className={`rounded border px-2.5 py-1 text-[11px] transition ${
                draft.category === c ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
              }`}
            >
              {DICT['zh-CN'][CATEGORY_KEY[c]]}
            </button>
          ))}
        </div>
      </section>

      {lead?.raw && (
        <section className="rounded-lg border border-medium/40 bg-medium/5 p-4">
          <h3 className="text-[12px] font-bold text-fg">原文（只作参考）</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            日期、价格、商品名这些<strong className="text-fg">事实</strong>可以照抄——事实不受版权保护。
            但<strong className="text-fg">别照抄它的句子和图片</strong>：那是对方的著作权，而且重复内容在
            搜索里排不上去，等于白做。用自己的话写，再链回来源。
          </p>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-line bg-surface p-3 text-[11px] leading-relaxed text-muted">
{lead.raw}
          </pre>
          {lead.url && (
            <a
              href={lead.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[11px] text-fg underline underline-offset-4"
            >
              打开原帖 ↗
            </a>
          )}
        </section>
      )}

      <section className="rounded-lg border border-line bg-surface px-4">
        <FactField
          label="开始时间"
          hint="必填 · 错的时间比没有更糟"
          fact={draft.opensAt}
          onChange={(f) => set('opensAt', f)}
          input={(value, setValue) => (
            <input
              type="datetime-local"
              value={toLocalInput(value)}
              onChange={(e) => setValue(e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="rounded border border-line bg-surface-2 px-2 py-1.5 font-mono text-[12px] text-fg outline-none focus:border-faint"
            />
          )}
        />
        <FactField
          label="截止时间"
          fact={draft.closesAt}
          onChange={(f) => set('closesAt', f)}
          input={(value, setValue) => (
            <input
              type="datetime-local"
              value={toLocalInput(value)}
              onChange={(e) => setValue(e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="rounded border border-line bg-surface-2 px-2 py-1.5 font-mono text-[12px] text-fg outline-none focus:border-faint"
            />
          )}
        />
        <FactField
          label="发售 / 开奖"
          fact={draft.releaseAt}
          onChange={(f) => set('releaseAt', f)}
          input={(value, setValue) => (
            <input
              type="datetime-local"
              value={toLocalInput(value)}
              onChange={(e) => setValue(e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="rounded border border-line bg-surface-2 px-2 py-1.5 font-mono text-[12px] text-fg outline-none focus:border-faint"
            />
          )}
        />
        <FactField
          label="发售形式"
          hint="必填"
          fact={draft.mechanic}
          onChange={(f) => set('mechanic', f)}
          input={(value, setValue) => (
            <div className="flex flex-wrap gap-1.5">
              {MECHANICS.map((m: Mechanic) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setValue(m)}
                  className={`rounded border px-2 py-1 text-[11px] transition ${
                    value === m ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
                  }`}
                >
                  {DICT['zh-CN'][MECHANIC_KEY[m]]}
                </button>
              ))}
            </div>
          )}
        />
        <FactField
          label="定价"
          fact={draft.price}
          onChange={(f) => set('price', f)}
          input={(value, setValue) => (
            <input
              type="number"
              value={value ?? ''}
              onChange={(e) => setValue(e.target.value === '' ? null : Number(e.target.value))}
              placeholder="JPY"
              className="w-32 rounded border border-line bg-surface-2 px-2 py-1.5 font-mono text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
            />
          )}
        />
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <h3 className="text-[12px] font-bold text-fg">购买渠道</h3>
        <p className="mt-1 text-[11px] text-faint">
          海淘难度由渠道决定，不用在这里逐件填 —— 勾上渠道，难度自动继承。
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {state.channels.length === 0 && (
            <span className="text-[12px] text-medium">还没有渠道档案，先去「渠道」页建一个。</span>
          )}
          {state.channels.map((c) => {
            const on = draft.channelIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  set('channelIds', on ? draft.channelIds.filter((id) => id !== c.id) : [...draft.channelIds, c.id])
                }
                className={`rounded border px-2.5 py-1 text-[11px] transition ${
                  on ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
                }`}
              >
                {c.name}
              </button>
            )
          })}
        </div>

        <div className="mt-3 border-t border-line-soft pt-3">
          <span className="text-[11px] text-faint">推算难度：</span>{' '}
          {friction === null ? (
            <span className="text-[12px] font-semibold text-faint">未知 —— 渠道信息还不够</span>
          ) : (
            <span
              className={`text-[12px] font-semibold ${
                friction === 'easy' ? 'text-easy' : friction === 'medium' ? 'text-medium' : 'text-hard'
              }`}
            >
              {friction === 'easy' ? '友好' : friction === 'medium' ? '中等' : '困难'}
            </span>
          )}
          {why.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {why.map((w) => (
                <li key={w} className="text-[11px] text-muted">
                  · {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
