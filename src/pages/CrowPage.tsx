import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Countdown, CountdownLabel } from '../components/Countdown'
import { OutboundLink } from '../components/OutboundLink'
import { DROPS } from '../data/live'
import { closingWithin, crowQueue, NO_FILTERS, type CrowFilters } from '../lib/crow'
import { FREE_PREVIEW_ROWS, useTier } from '../lib/entitlement'
import { formatPrice } from '../lib/format'
import { useT } from '../lib/i18n'
import { CATEGORIES, CATEGORY_KEY, MECHANIC_KEY, REGION_KEY } from '../lib/labels'
import { useCurrency } from '../lib/prefs'
import { crowHead } from '../lib/seo'
import { useHead } from '../lib/useHead'
import { useNow } from '../lib/useNow'

/**
 * CROW — the queue for people who enter many raffles.
 *
 * The value is a shorter list, not a robot. See src/lib/crow.ts for why the
 * arithmetic works and R0.2 for why the forms stay yours to fill.
 */
export function CrowPage() {
  const { t, tl, locale } = useT()
  const currency = useCurrency()
  const tier = useTier()
  const now = useNow()
  const [filters, setFilters] = useState<CrowFilters>(NO_FILTERS)

  const all = useMemo(() => crowQueue(DROPS, now, NO_FILTERS), [now])
  const rows = useMemo(() => crowQueue(DROPS, now, filters), [now, filters])

  const openNow = all.filter((r) => r.state.phase === 'open').length
  useHead(locale, crowHead(locale, openNow, closingWithin(all, 48)))

  const gated = tier === 'free'
  const visible = gated ? rows.slice(0, FREE_PREVIEW_ROWS) : rows

  return (
    <div className="mx-auto max-w-4xl px-4">
      <section className="pt-10 pb-6 md:pt-12 md:pb-7">
        <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-fg md:text-[26px]">
          {t('crowTitle')}
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">{t('crowLead')}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
          <span className="inline-flex items-center gap-1.5 text-live-fg">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-live-fg" />
            <span className="font-mono tabular-nums" data-stat="crow-open">
              {openNow}
            </span>{' '}
            {t('crowOpenNow')}
          </span>
          <span className="inline-flex items-center gap-1.5 text-hard">
            <span className="font-mono tabular-nums">{closingWithin(all, 48)}</span> {t('crowClosingSoon')}
          </span>
        </div>
      </section>

      {/* The premise, stated plainly — and the line we do not cross with it. */}
      <section className="rounded-lg border border-line bg-surface p-4">
        <p className="text-[12px] leading-relaxed text-muted">{t('crowMath')}</p>
        <p className="mt-2 border-t border-line-soft pt-2 text-[12px] leading-relaxed text-fg">{t('crowNoBots')}</p>
      </section>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => setFilters((f) => ({ ...f, enterableOnly: !f.enterableOnly }))}
          className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
            filters.enterableOnly
              ? 'border-accent bg-accent text-accent-ink'
              : 'border-line bg-surface text-muted hover:border-faint hover:text-fg'
          }`}
        >
          {t('crowEnterableOnly')}
        </button>

        <div className="flex flex-wrap gap-1" role="group" aria-label={t('filterCategory')}>
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, category: null }))}
            className={`rounded border px-2.5 py-1 text-[11px] transition ${
              filters.category === null ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
            }`}
          >
            {t('filterAll')}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, category: c }))}
              className={`rounded border px-2.5 py-1 text-[11px] transition ${
                filters.category === c ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
              }`}
            >
              {t(CATEGORY_KEY[c])}
            </button>
          ))}
        </div>
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {rows.length === 0 && (
          <li className="rounded-lg border border-line bg-surface p-5 text-[13px] text-faint">{t('crowEmpty')}</li>
        )}

        {visible.map(({ drop, state, barrier }) => (
          <li key={drop.id} className="rounded-lg border border-line bg-surface px-4 py-3.5">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
                  <span className="uppercase tracking-[0.12em]">{drop.brand}</span>
                  <span className="text-line">·</span>
                  <span>{t(CATEGORY_KEY[drop.category])}</span>
                  <span className="text-line">·</span>
                  <span>{t(MECHANIC_KEY[drop.mechanic])}</span>
                  <span className="text-line">·</span>
                  <span>{t(REGION_KEY[drop.region])}</span>
                </div>

                <Link
                  to={`/${locale}/drop/${drop.slug}`}
                  className="mt-1 block text-[13px] font-semibold leading-snug text-fg underline-offset-4 hover:underline"
                >
                  {tl(drop.title)}
                </Link>

                {/* Requirements first: the point is to skip fast. */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                  {barrier.localCardOnly && (
                    <span className="rounded border border-hard/40 px-1.5 py-0.5 font-semibold text-hard">
                      {t('crowBarrierCard')}
                    </span>
                  )}
                  {barrier.localShippingOnly && (
                    <span className="rounded border border-medium/40 px-1.5 py-0.5 font-semibold text-medium">
                      {t('crowBarrierShipping')}
                    </span>
                  )}
                  {barrier.unresearched && (
                    <span className="rounded border border-line px-1.5 py-0.5 text-faint">
                      {t('crowBarrierUnknown')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <CountdownLabel state={state} />
                <Countdown state={state} size="sm" />
                <span className="font-mono text-[11px] text-faint tabular-nums">
                  {drop.price > 0 ? formatPrice(drop.price, drop.currency, currency, locale) : ''}
                </span>
                {drop.channels[0] && (
                  <OutboundLink
                    href={drop.channels[0].url}
                    kind="store"
                    context={drop.slug}
                    channelId={drop.channels[0].id}
                    affiliate={drop.channels[0].affiliate}
                    sponsored
                    className="rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[11px] font-semibold text-fg transition hover:border-accent hover:bg-accent hover:text-accent-ink"
                  >
                    {t('crowEnter')} ↗
                  </OutboundLink>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {gated && rows.length > visible.length && (
        <section className="mt-3 rounded-lg border border-fg/20 bg-gradient-to-br from-fg/5 via-surface to-surface p-5">
          <p className="font-mono text-[11px] text-faint">
            {t('crowGatePreview').replace('{n}', String(visible.length)).replace('{total}', String(rows.length))}
          </p>
          <h2 className="mt-2 text-[15px] font-bold text-fg">{t('crowGateTitle')}</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{t('crowGateBody')}</p>
          <button
            type="button"
            className="mt-3 rounded-md bg-accent px-4 py-2 text-[12px] font-bold text-accent-ink transition hover:bg-accent-dim"
          >
            {t('crowGateCta')}
          </button>
        </section>
      )}

      <p className="mt-6 text-[11px] leading-relaxed text-faint">{t('crowFuture')}</p>
    </div>
  )
}
