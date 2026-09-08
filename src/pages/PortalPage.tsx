import { Link } from 'react-router-dom'
import { Aurora, Spotlight } from '../components/ui/Spotlight'
import { DROPS } from '../data/mock'
import { useT } from '../lib/i18n'
import { CATEGORIES, CATEGORY_KEY } from '../lib/labels'
import { dropState, isAvailableNow } from '../lib/schedule'
import { useHead } from '../lib/useHead'
import { portalHead } from '../lib/seo'
import { useNow } from '../lib/useNow'
import type { Category } from '../lib/types'

/**
 * Zeros stay in place rather than disappearing, so the columns stay scannable.
 * They are dimmed by dropping to the faint token rather than by lowering
 * opacity — a translucent digit falls below the contrast floor.
 */
function Stat({
  value,
  className,
  label,
  name,
}: {
  value: number
  className: string
  label: string
  /** Stable hook for tests; the visual columns carry no text of their own. */
  name: string
}) {
  return (
    <span
      title={label}
      data-stat={name}
      className={`flex w-8 items-center justify-end gap-1.5 tabular-nums ${
        value === 0 ? 'text-faint' : className
      }`}
    >
      {value}
    </span>
  )
}

/**
 * One flat row per category, carrying the same three numbers as the header —
 * tracked / live / buyable — so you can tell which genre is worth opening.
 */
function CategoryRow({ category, now }: { category: Category; now: number }) {
  const { t, locale } = useT()
  const items = DROPS.filter((d) => d.category === category)
  const live = items.filter((d) => dropState(d, now).phase === 'open').length
  const inStock = items.filter(isAvailableNow).length

  return (
    <Link
      to={`/${locale}/c/${category}`}
      data-category={category}
      // min-w-0 lets the row shrink inside the grid; without it the fixed-width
      // stat columns push the whole card past a narrow viewport.
      className="flex min-w-0 items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3.5 transition hover:border-accent"
    >
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-fg">
        {t(CATEGORY_KEY[category])}
      </span>

      <div className="flex shrink-0 items-center gap-2 font-mono text-[12px]">
        <Stat value={items.length} className="text-muted" label={t('portalTracked')} name="tracked" />
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${live > 0 ? 'live-dot bg-live-fg' : 'bg-line'}`}
          />
          <Stat value={live} className="text-live-fg" label={t('heroLive')} name="live" />
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${inStock > 0 ? 'bg-easy' : 'bg-line'}`} />
          <Stat value={inStock} className="text-easy" label={t('cdInStock')} name="stock" />
        </span>
      </div>
    </Link>
  )
}

export function PortalPage() {
  const { t, locale } = useT()
  const now = useNow(30_000)
  useHead(locale, portalHead(locale, DROPS))
  const live = DROPS.filter((d) => dropState(d, now).phase === 'open').length
  const inStock = DROPS.filter(isAvailableNow).length

  return (
    <div className="mx-auto max-w-3xl px-4">
      {/*
        The wash sits behind the hero and never over the copy — contrast is
        still decided by the page background, which is what keeps the axe pass
        green in both themes.
      */}
      {/* overflow-hidden is load-bearing: the spotlight is wider than the
          viewport by design, and without clipping it widens the document. */}
      <section className="relative overflow-hidden pt-10 pb-6 md:pt-12 md:pb-7">
        <Aurora className="-z-10" />
        <Spotlight className="-top-40 left-0 -z-10 text-fg md:-top-20 md:left-60" />
        {/*
          Deliberately the same size as the rest of the page. The headline gets
          its weight from the shimmer travelling across it, not from scale —
          which also means it never wraps in any of the four languages.
        */}
        {/* w-fit so the gradient box matches the text, not the column — otherwise
            the streak spends most of its travel over empty space. */}
        <h1 className="shimmer w-fit whitespace-nowrap text-[12px] font-bold tracking-tight text-fg">
          {t('heroTitle')}
        </h1>
        {/* Doubles as the legend for the per-category columns below. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
          <span className="font-mono tabular-nums">
            <span data-stat="tracked-total">{DROPS.length}</span> {t('portalTracked')}
          </span>
          <span className="inline-flex items-center gap-1.5 text-live-fg">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-live-fg" />
            <span className="font-mono tabular-nums" data-stat="live-total">
              {live}
            </span>{' '}
            {t('heroLive')}
          </span>
          <span className="inline-flex items-center gap-1.5 text-easy">
            <span className="h-1.5 w-1.5 rounded-full bg-easy" />
            <span className="font-mono tabular-nums" data-stat="stock-total">
              {inStock}
            </span>{' '}
            {t('cdInStock')}
          </span>
        </div>
      </section>

      {/*
        All zeros is honest but reads as abandoned. Saying what is happening —
        and pointing at the one thing that works with no catalogue at all —
        is the difference between "new" and "broken".
      */}
      {DROPS.length === 0 && (
        <div className="mb-4 rounded-lg border border-line bg-surface p-4">
          <p className="text-[12px] leading-relaxed text-muted">{t('portalSeeding')}</p>
          <Link
            to={`/${locale}/wants`}
            className="mt-2 inline-block text-[12px] font-semibold text-fg underline underline-offset-4"
          >
            {t('portalSeedingCta')} →
          </Link>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <CategoryRow key={category} category={category} now={now} />
        ))}
      </div>
    </div>
  )
}
