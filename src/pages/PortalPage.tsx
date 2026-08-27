import { Link } from 'react-router-dom'
import { DROPS } from '../data/mock'
import { useT } from '../lib/i18n'
import { CATEGORIES, CATEGORY_ART, CATEGORY_ICON, CATEGORY_KEY } from '../lib/labels'
import { dropState, isAvailableNow } from '../lib/schedule'
import { useNow } from '../lib/useNow'
import type { Category } from '../lib/types'

function CategoryTile({ category, now }: { category: Category; now: number }) {
  const { t, locale } = useT()
  const items = DROPS.filter((d) => d.category === category)
  const live = items.filter((d) => dropState(d, now).phase === 'open').length
  const inStock = items.filter((d) => dropState(d, now).phase === 'in-stock').length
  const art = CATEGORY_ART[category]

  return (
    <Link
      to={`/${locale}/c/${category}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line p-5 transition
        hover:-translate-y-1 hover:border-accent/50 sm:p-6"
      style={{ background: `radial-gradient(120% 130% at 25% 15%, ${art.from} 0%, ${art.to} 75%)` }}
    >
      <span className="text-4xl leading-none transition-transform duration-500 group-hover:scale-110 sm:text-5xl">
        {CATEGORY_ICON[category]}
      </span>

      <div className="mt-8">
        <h2 className="text-[15px] font-bold leading-snug text-white sm:text-lg">{t(CATEGORY_KEY[category])}</h2>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/60">
          <span className="font-mono tabular-nums">
            {items.length} {t('portalTracked')}
          </span>
          {live > 0 && (
            <span className="inline-flex items-center gap-1.5 text-accent">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-mono tabular-nums">{live}</span> {t('heroLive')}
            </span>
          )}
          {inStock > 0 && (
            <span className="inline-flex items-center gap-1.5 text-easy">
              <span className="h-1.5 w-1.5 rounded-full bg-easy" />
              <span className="font-mono tabular-nums">{inStock}</span> {t('cdInStock')}
            </span>
          )}
        </div>
      </div>

      <span className="absolute right-5 top-5 text-lg text-white/40 transition group-hover:translate-x-0.5 group-hover:text-accent">
        →
      </span>
    </Link>
  )
}

export function PortalPage() {
  const { t } = useT()
  const now = useNow(30_000)
  const live = DROPS.filter((d) => dropState(d, now).phase === 'open').length
  const inStock = DROPS.filter((d) => isAvailableNow(d)).length

  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="pt-14 pb-9 md:pt-20 md:pb-12">
        <h1 className="max-w-2xl text-[28px] font-extrabold leading-[1.2] tracking-tight text-fg md:text-[38px]">
          {t('heroTitle')}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
          <span className="font-mono tabular-nums">
            {DROPS.length} {t('portalTracked')}
          </span>
          <span className="inline-flex items-center gap-1.5 text-accent-fg">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent-fg" />
            <span className="font-mono tabular-nums">{live}</span> {t('heroLive')}
          </span>
          <span className="inline-flex items-center gap-1.5 text-easy">
            <span className="h-1.5 w-1.5 rounded-full bg-easy" />
            <span className="font-mono tabular-nums">{inStock}</span> {t('cdInStock')}
          </span>
        </div>
      </section>

      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">{t('portalPick')}</p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {CATEGORIES.map((category) => (
          <CategoryTile key={category} category={category} now={now} />
        ))}
      </div>
    </div>
  )
}
