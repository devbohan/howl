import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { WANTS } from '../data/wants'
import { useT } from '../lib/i18n'
import { CATEGORIES, CATEGORY_KEY } from '../lib/labels'
import { sortWants, findDuplicate, validateWant, type Want, type WantSort } from '../lib/wants'
import { fetchWants, flushPending, submitWant } from '../lib/wantsClient'
import { WantVote } from '../components/WantVote'
import { useHead } from '../lib/useHead'
import { wantsHead } from '../lib/seo'
import type { Category } from '../lib/types'

export function WantsPage() {
  const { t, tl, locale } = useT()
  const [live, setLive] = useState<Want[] | null>(null)
  const [sort, setSort] = useState<WantSort>('count')
  const [category, setCategory] = useState<Category | null>(null)

  const wants = live ?? WANTS
  useHead(locale, wantsHead(locale, wants))

  // The prerendered snapshot renders first; live counts replace it if the API
  // is up. Crawlers keep the snapshot, which is the point of prerendering it.
  useEffect(() => {
    void flushPending()
    void fetchWants().then((remote) => remote && setLive(remote))
  }, [])

  const visible = useMemo(
    () => sortWants(category ? wants.filter((w) => w.category === category) : wants, sort),
    [wants, sort, category],
  )

  return (
    <div className="mx-auto max-w-3xl px-4">
      <section className="pt-10 pb-6 md:pt-12 md:pb-7">
        <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-fg md:text-[26px]">
          {t('wantsTitle')}
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">{t('wantsLead')}</p>
      </section>

      <WantForm wants={wants} />

      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex gap-1">
          {(['count', 'recent'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`rounded border px-2.5 py-1 text-[11px] font-medium transition ${
                sort === s ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
              }`}
            >
              {s === 'count' ? t('wantsSort') : t('wantsRecent')}
            </button>
          ))}
        </div>
        <span className="h-4 w-px bg-line" />
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`rounded border px-2.5 py-1 text-[11px] transition ${
              category === null ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
            }`}
          >
            {t('filterAll')}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded border px-2.5 py-1 text-[11px] transition ${
                category === c ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
              }`}
            >
              {t(CATEGORY_KEY[c])}
            </button>
          ))}
        </div>
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {visible.length === 0 && (
          <li className="rounded-lg border border-line bg-surface p-5 text-[13px] text-faint">
            {t('wantsEmpty')}
          </li>
        )}
        {visible.map((want) => (
          <li
            key={want.id}
            className="flex items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-snug text-fg">{want.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
                <span>{t(CATEGORY_KEY[want.category])}</span>
                {want.matchedSlug && (
                  <>
                    <span className="text-line">·</span>
                    <Link
                      to={`/${locale}/drop/${want.matchedSlug}`}
                      className="text-fg underline underline-offset-4"
                    >
                      {t('navCalendar')}
                    </Link>
                  </>
                )}
              </div>
              {want.note && <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{want.note}</p>}
              {want.status && <p className="mt-1.5 text-[12px] text-easy">{tl(want.status)}</p>}
            </div>
            <WantVote wantId={want.id} name={want.name} category={want.category} count={want.count} />
          </li>
        ))}
      </ol>
    </div>
  )
}

function WantForm({ wants }: { wants: Want[] }) {
  const { t } = useT()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<Category>('tcg')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'queued'>('idle')

  const duplicate = name.trim() ? findDuplicate(wants, name) : undefined
  const valid = validateWant(name).ok

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!valid || state === 'sending') return
    setState('sending')

    // Typing something that already exists is a vote, not a second entry.
    const result = duplicate
      ? await submitWant({ wantId: duplicate.id, name: duplicate.name, category: duplicate.category })
      : await submitWant({ name: name.trim(), category, note: note.trim() || undefined })

    setState(result === 'queued' ? 'queued' : 'done')
    setName('')
    setNote('')
  }

  return (
    <form onSubmit={send} className="rounded-lg border border-line bg-surface p-4">
      <h2 className="text-[12px] font-bold text-fg">{t('wantsFormTitle')}</h2>

      <label className="mt-3 block">
        <span className="text-[11px] text-faint">{t('wantsFieldName')}</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setState('idle')
          }}
          placeholder={t('wantsFieldNamePlaceholder')}
          className="mt-1 w-full rounded border border-line bg-surface-2 px-3 py-2 text-[13px] text-fg outline-none placeholder:text-faint focus:border-faint"
        />
      </label>

      {duplicate && (
        <p className="mt-2 text-[11px] text-medium">
          「{duplicate.name}」 — {duplicate.count.toLocaleString()} {t('wantsCount')}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded border px-2.5 py-1 text-[11px] transition ${
              category === c ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
            }`}
          >
            {t(CATEGORY_KEY[c])}
          </button>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="text-[11px] text-faint">{t('wantsFieldNote')}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('wantsFieldNotePlaceholder')}
          className="mt-1 w-full rounded border border-line bg-surface-2 px-3 py-2 text-[13px] text-fg outline-none placeholder:text-faint focus:border-faint"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!valid || state === 'sending'}
          className="rounded bg-accent px-4 py-2 text-[12px] font-bold text-accent-ink transition hover:bg-accent-dim disabled:opacity-40"
        >
          {state === 'sending' ? t('wantsSubmitting') : t('wantsSubmit')}
        </button>
        {state === 'done' && <span className="text-[12px] text-easy">{t('wantsThanks')}</span>}
        {state === 'queued' && <span className="text-[12px] text-medium">{t('wantsFailed')}</span>}
      </div>
    </form>
  )
}
