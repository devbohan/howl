import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { DropCard } from '../components/DropCard'
import { EMPTY_FILTERS, FilterBar, type Filters } from '../components/FilterBar'
import { VipBanner } from '../components/VipBanner'
import { DROPS } from '../data/mock'
import { useT } from '../lib/i18n'
import { CATEGORIES, CATEGORY_ART, CATEGORY_ICON, CATEGORY_KEY } from '../lib/labels'
import { useCurrency } from '../lib/prefs'
import { dropState, isAvailableNow, sortWeight, type Phase } from '../lib/schedule'
import { useNow } from '../lib/useNow'
import type { Category } from '../lib/types'

export function CategoryPage() {
  const { category, locale: localeParam } = useParams()
  const { t, locale } = useT()
  const currency = useCurrency()
  const now = useNow()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const valid = CATEGORIES.includes(category as Category)

  useEffect(() => {
    setFilters(EMPTY_FILTERS)
    window.scrollTo(0, 0)
  }, [category])

  const visible = useMemo(() => {
    if (!valid) return []
    return DROPS.filter(
      (d) =>
        d.category === category &&
        (!filters.region || d.region === filters.region) &&
        (!filters.mechanic || d.mechanic === filters.mechanic) &&
        (!filters.friction || d.friction === filters.friction) &&
        (!filters.stockOnly || isAvailableNow(d)),
    )
      .map((drop) => ({ drop, state: dropState(drop, now) }))
      .sort((a, b) => sortWeight(a.state) - sortWeight(b.state))
  }, [category, valid, filters, now])

  if (!valid) return <Navigate to={`/${localeParam}`} replace />

  const cat = category as Category
  const art = CATEGORY_ART[cat]
  const liveCount = visible.filter((v) => v.state.phase === 'open').length

  const sectionTitle: Record<Phase, string> = {
    open: locale === 'ja' ? '受付中' : locale === 'en' ? 'Live now' : locale === 'zh-TW' ? '進行中' : '进行中',
    upcoming: locale === 'ja' ? '開始予定' : locale === 'en' ? 'Upcoming' : locale === 'zh-TW' ? '即將開始' : '即将开始',
    'in-stock': t('cdInStock'),
    ended: locale === 'ja' ? '終了' : locale === 'en' ? 'Closed' : locale === 'zh-TW' ? '已結束' : '已结束',
  }

  const grouped: [Phase, typeof visible][] = (['open', 'in-stock', 'upcoming', 'ended'] as Phase[]).map((phase) => [
    phase,
    visible.filter((v) => v.state.phase === phase),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4">
      <Link
        to={`/${locale}`}
        className="mt-6 inline-block text-[12px] text-faint transition hover:text-fg"
      >
        ← {t('portalAll')}
      </Link>

      <section
        className="mt-3 flex items-center gap-4 rounded-2xl border border-line px-5 py-6 sm:px-7"
        style={{ background: `radial-gradient(110% 160% at 12% 20%, ${art.from} 0%, ${art.to} 75%)` }}
      >
        <span className="text-4xl leading-none">{CATEGORY_ICON[cat]}</span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{t(CATEGORY_KEY[cat])}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/70">
            <span className="font-mono tabular-nums">
              {visible.length} {t('filterResults')}
            </span>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-accent">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="font-mono tabular-nums">{liveCount}</span> {t('heroLive')}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mt-5">
        <FilterBar filters={filters} onChange={setFilters} count={visible.length} showCategory={false} />
      </div>

      {visible.length === 0 && <p className="py-16 text-center text-sm text-faint">{t('filterEmpty')}</p>}

      {grouped.map(([phase, items]) =>
        items.length === 0 ? null : (
          <section key={phase} className="mt-9">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.18em] text-faint">{sectionTitle[phase]}</h2>
              <span className="font-mono text-[12px] text-faint/70 tabular-nums">{items.length}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ drop }) => (
                <DropCard key={drop.id} drop={drop} now={now} currency={currency} />
              ))}
            </div>
          </section>
        ),
      )}

      <div className="mt-12">
        <VipBanner />
      </div>
    </div>
  )
}
