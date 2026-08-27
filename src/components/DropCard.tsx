import { Link } from 'react-router-dom'
import { Countdown, CountdownLabel } from './Countdown'
import { FrictionBadge } from './FrictionBadge'
import { useT } from '../lib/i18n'
import { CATEGORY_KEY, MECHANIC_KEY, REGION_FLAG, REGION_KEY } from '../lib/labels'
import { formatPrice } from '../lib/format'
import { bestOffer, dropState } from '../lib/schedule'
import { PremiumTag } from './Premium'
import type { Currency, Drop } from '../lib/types'

export function DropCard({ drop, now, currency }: { drop: Drop; now: number; currency: Currency }) {
  const { t, tl, locale } = useT()
  const state = dropState(drop, now)
  const dim = state.phase === 'ended'
  const offer = state.phase === 'in-stock' ? bestOffer(drop) : null

  return (
    <Link
      to={`/${locale}/drop/${drop.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition
        hover:border-line/0 hover:ring-1 hover:ring-accent/40 hover:-translate-y-0.5 ${dim ? 'opacity-55' : ''}`}
    >
      <div
        className="relative flex h-36 items-center justify-center overflow-hidden"
        style={{ background: `radial-gradient(120% 120% at 30% 20%, ${drop.art.from} 0%, ${drop.art.to} 70%)` }}
      >
        <span className="text-5xl opacity-90 transition-transform duration-500 group-hover:scale-110">{drop.art.glyph}</span>

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {(state.phase === 'open' || state.phase === 'in-stock') && !dim && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur ${
                state.phase === 'open' ? 'text-accent' : 'text-easy'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  state.phase === 'open' ? 'live-dot bg-accent' : 'bg-easy'
                }`}
              />
              {state.phase === 'open' ? t('cdLive') : t('cdInStock')}
            </span>
          )}
          {drop.hot && (
            <span className="rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-hard backdrop-blur">
              HOT
            </span>
          )}
        </div>

        <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold tracking-wide text-fg/85 backdrop-blur">
          {REGION_FLAG[drop.region]} {t(REGION_KEY[drop.region])}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-[11px] font-medium text-faint">
          <span className="uppercase tracking-[0.12em]">{drop.brand}</span>
          <span className="h-3 w-px bg-line" />
          <span>{t(CATEGORY_KEY[drop.category])}</span>
        </div>

        <h3 className="text-[15px] font-semibold leading-snug text-fg line-clamp-2">{tl(drop.title)}</h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded border border-line bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
            {t(MECHANIC_KEY[drop.mechanic])}
          </span>
          <FrictionBadge friction={drop.friction} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line-soft pt-3">
          <div className="flex flex-col gap-0.5">
            <CountdownLabel state={state} />
            <Countdown state={state} />
          </div>
          <div className="text-right">
            <div className="font-mono text-sm font-bold text-fg tabular-nums">
              {offer
                ? formatPrice(offer.price, offer.currency, currency, locale)
                : drop.price === 0
                  ? 'FREE'
                  : formatPrice(drop.price, drop.currency, currency, locale)}
            </div>
            <div className="text-[11px] text-faint">
              {offer ? <PremiumTag premium={offer.premium} /> : `${drop.channels.length} ${t('cardChannels')}`}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
