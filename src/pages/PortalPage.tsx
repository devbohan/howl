import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { DROPS } from '../data/live'
import { useT } from '../lib/i18n'
import { NewsTicker } from '../components/NewsTicker'
import { CATEGORIES, CATEGORY_BLURB_KEY, CATEGORY_FIELD, CATEGORY_KEY } from '../lib/labels'
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
 * A category plate. Bigger than a row because this is the only page where the
 * reader is choosing rather than working, and a name alone does not tell an
 * outsider what a category involves — the blurb is what makes "Trading Cards"
 * mean "pre-order lotteries you probably cannot enter from abroad".
 *
 * The field behind it is a generated mesh rather than a photograph: at this
 * blur radius a stock photo is a colour field anyway, and generating it costs
 * no request, no licence and no layout shift.
 */
function CategoryPlate({ category, now }: { category: Category; now: number }) {
  const { t, locale } = useT()
  const items = DROPS.filter((d) => d.category === category)
  const live = items.filter((d) => dropState(d, now).phase === 'open').length
  const inStock = items.filter(isAvailableNow).length
  const [a, b, c] = CATEGORY_FIELD[category]

  return (
    <div className="relative overflow-hidden border border-line bg-surface">
      <div
        className="pointer-events-none absolute inset-0 opacity-45 blur-2xl"
        aria-hidden="true"
        style={{
          background: `radial-gradient(60% 70% at 18% 22%, ${a} 0%, transparent 70%),
                       radial-gradient(55% 65% at 82% 30%, ${c} 0%, transparent 68%),
                       radial-gradient(70% 80% at 50% 90%, ${b} 0%, transparent 72%)`,
        }}
      />

      <Link
        to={`/${locale}/c/${category}`}
        data-category={category}
        className="relative block min-w-0 p-5 transition hover:bg-fg/[0.03] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[17px] font-bold tracking-tight text-fg sm:text-[19px]">
            {t(CATEGORY_KEY[category])}
          </h2>
          <div className="flex shrink-0 items-center gap-2 font-mono text-[12px]">
            <Stat value={items.length} className="text-muted" label={t('portalTracked')} name="tracked" />
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${live > 0 ? 'live-dot bg-live-fg' : 'bg-line'}`} />
              <Stat value={live} className="text-live-fg" label={t('heroLive')} name="live" />
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${inStock > 0 ? 'bg-easy' : 'bg-line'}`} />
              <Stat value={inStock} className="text-easy" label={t('cdInStock')} name="stock" />
            </span>
          </div>
        </div>

        <p className="mt-2 max-w-prose text-[12.5px] leading-relaxed text-muted">
          {t(CATEGORY_BLURB_KEY[category])}
        </p>
      </Link>

      {/* The same ticker as the category page — it hides itself when empty. */}
      <div className="relative border-t border-line-soft">
        <NewsTicker category={category} compact />
      </div>
    </div>
  )
}

export function PortalPage() {
  const { t, locale } = useT()
  const now = useNow(30_000)
  useHead(locale, portalHead(locale, DROPS))
  const live = DROPS.filter((d) => dropState(d, now).phase === 'open').length
  const inStock = DROPS.filter(isAvailableNow).length

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/*
        Same treatment as the VIP panel: a bordered plate with the mark itself
        watermarked into the corner. That mark is the one piece of this design
        nobody else has — a glow or an aurora is available to every site on the
        internet, which is exactly why they stopped reading as a choice.
      */}
      <section className="relative overflow-hidden border border-fg/20 bg-gradient-to-br from-fg/5 via-surface to-surface p-6 md:p-8">
        <div className="relative max-w-2xl">
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
        </div>
        {/* Sized to the plate, not to the page: the hero panel is short, and a
            mark taller than its container reads as a mistake rather than a
            watermark. */}
        <Logo className="pointer-events-none absolute -right-6 top-1/2 h-24 w-auto -translate-y-1/2 text-fg opacity-[0.07] sm:h-28" />
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

      <div className="grid items-start gap-3 lg:grid-cols-2">
        {CATEGORIES.map((category) => (
          <CategoryPlate key={category} category={category} now={now} />
        ))}
      </div>
    </div>
  )
}
