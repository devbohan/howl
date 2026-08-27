import { Link, useParams } from 'react-router-dom'
import { Countdown, CountdownLabel } from '../components/Countdown'
import { FrictionBadge } from '../components/FrictionBadge'
import { MediaLinks } from '../components/MediaLinks'
import { VipBanner } from '../components/VipBanner'
import { DROPS } from '../data/mock'
import { useT } from '../lib/i18n'
import { CATEGORY_KEY, MECHANIC_KEY, REGION_FLAG, REGION_KEY } from '../lib/labels'
import { convert, formatDateTime, formatPrice } from '../lib/format'
import { useCurrency } from '../lib/prefs'
import { bestOffer, dropState } from '../lib/schedule'
import { useNow } from '../lib/useNow'
import { PremiumTag } from '../components/Premium'
import type { Channel, Drop } from '../lib/types'

const STOCK_STYLE = {
  'in-stock': 'border-easy/40 bg-easy/10 text-easy',
  low: 'border-medium/40 bg-medium/10 text-medium',
  'sold-out': 'border-line bg-surface-2 text-faint',
} as const

const STOCK_KEY = { 'in-stock': 'stockIn', low: 'stockLow', 'sold-out': 'stockOut' } as const

function ChannelRow({ channel, drop }: { channel: Channel; drop: Drop }) {
  const { t, tl, locale } = useT()
  const currency = useCurrency()
  const resale = channel.market === 'resale'
  const ask = channel.askPrice ?? (channel.stock ? drop.price : undefined)
  const askCurrency = channel.askCurrency ?? drop.currency
  const premium =
    ask !== undefined && drop.price > 0
      ? convert(ask, askCurrency, 'JPY') / convert(drop.price, drop.currency, 'JPY') - 1
      : null

  return (
    <div className="flex flex-col gap-3 border-b border-line-soft py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-fg">{channel.name}</span>
          <span className="text-[11px] text-faint">{REGION_FLAG[channel.region]}</span>
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
              resale ? 'border-medium/40 bg-medium/10 text-medium' : 'border-line bg-surface-2 text-muted'
            }`}
          >
            {resale ? t('marketResale') : t('marketRetail')}
          </span>
          {channel.stock && (
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${STOCK_STYLE[channel.stock]}`}>
              {t(STOCK_KEY[channel.stock])}
            </span>
          )}
          {channel.affiliate && (
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-faint">{t('detAffiliate')}</span>
          )}
        </div>

        {channel.stock && channel.stock !== 'sold-out' && ask !== undefined && (
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-fg tabular-nums">
              {formatPrice(ask, askCurrency, currency, locale)}
            </span>
            {premium !== null && <PremiumTag premium={premium} />}
          </div>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className={channel.shipsWorldwide ? 'text-easy' : 'text-medium'}>
            {channel.shipsWorldwide ? '✓ ' : '✕ '}
            {channel.shipsWorldwide ? t('detShipsWorldwide') : t('detShipsDomestic')}
          </span>
          <span className={channel.acceptsForeignCard ? 'text-easy' : 'text-hard'}>
            {channel.acceptsForeignCard ? '✓ ' : '✕ '}
            {channel.acceptsForeignCard ? t('detForeignCard') : t('detNoForeignCard')}
          </span>
        </div>

        {channel.note && <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{tl(channel.note)}</p>}
      </div>

      <a
        href={channel.url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="shrink-0 rounded-md border border-line bg-surface-2 px-3.5 py-2 text-[12px] font-semibold text-fg transition hover:border-accent hover:bg-accent hover:text-accent-ink"
      >
        {t('detGoToStore')} ↗
      </a>
    </div>
  )
}

function TimelineRow({ label, iso }: { label: string; iso?: string }) {
  const { locale } = useT()
  if (!iso) return null
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft py-2.5 last:border-b-0">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="font-mono text-[12px] text-fg tabular-nums">{formatDateTime(iso, locale)}</span>
    </div>
  )
}

export function ItemPage() {
  const { slug } = useParams()
  const { t, tl, locale } = useT()
  const currency = useCurrency()
  const now = useNow()

  const drop = DROPS.find((d) => d.slug === slug)
  if (!drop) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-sm text-muted">Not found.</p>
        <Link to={`/${locale}`} className="mt-4 inline-block text-sm text-accent-fg underline underline-offset-4">
          {t('detBack')}
        </Link>
      </div>
    )
  }

  const state = dropState(drop, now)
  const offer = state.phase === 'in-stock' ? bestOffer(drop) : null

  return (
    <div className="mx-auto max-w-6xl px-4 pb-4">
      <Link
        to={`/${locale}/c/${drop.category}`}
        className="mt-6 inline-block text-[12px] text-faint transition hover:text-fg"
      >
        ← {t(CATEGORY_KEY[drop.category])}
      </Link>

      <div
        className="mt-4 flex h-52 items-center justify-center rounded-xl border border-line md:h-64"
        style={{ background: `radial-gradient(120% 120% at 30% 20%, ${drop.art.from} 0%, ${drop.art.to} 70%)` }}
      >
        <span className="text-7xl opacity-90">{drop.art.glyph}</span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-medium text-faint">
            <span className="uppercase tracking-[0.14em]">{drop.brand}</span>
            <span className="h-3 w-px bg-line" />
            <span>{t(CATEGORY_KEY[drop.category])}</span>
            <span className="h-3 w-px bg-line" />
            <span>
              {REGION_FLAG[drop.region]} {t(REGION_KEY[drop.region])}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-fg md:text-[32px]">
            {tl(drop.title)}
          </h1>
          {drop.subtitle && <p className="mt-2 text-[13px] text-muted">{tl(drop.subtitle)}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded border border-line bg-surface-2 px-2.5 py-1 text-[12px] text-muted">
              {t(MECHANIC_KEY[drop.mechanic])}
            </span>
            <FrictionBadge friction={drop.friction} withDesc />
            {drop.tags?.map((tag) => (
              <span key={tag} className="rounded border border-line-soft px-2 py-1 text-[11px] text-faint">
                #{tag}
              </span>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-faint">{t('detChannels')}</h2>
            <div className="mt-3 rounded-xl border border-line bg-surface px-4">
              {drop.channels.map((channel) => (
                <ChannelRow key={channel.id} channel={channel} drop={drop} />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-faint">{t('detFriction')}</h2>
            <ul className="mt-3 space-y-2.5">
              {drop.frictionNotes.map((note, i) => (
                <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-fg" />
                  <span>{tl(note)}</span>
                </li>
              ))}
            </ul>
          </section>

          {(drop.dutyNote || drop.forwarders) && (
            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              {drop.dutyNote && (
                <div className="rounded-xl border border-line bg-surface p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t('detDuty')}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{tl(drop.dutyNote)}</p>
                </div>
              )}
              {drop.forwarders && (
                <div className="rounded-xl border border-line bg-surface p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t('detForwarders')}</h3>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {drop.forwarders.map((f) => (
                      <span key={f} className="rounded border border-line bg-surface-2 px-2 py-1 text-[12px] text-fg">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {drop.media && <MediaLinks items={drop.media} />}

          <div className="mt-8">
            <VipBanner />
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <CountdownLabel state={state} />
            <div className="mt-1.5">
              <Countdown state={state} size="lg" />
            </div>

            <div className="mt-5 border-t border-line-soft pt-4">
              {offer ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-muted">{t('detLowest')}</span>
                    <span className="font-mono text-xl font-bold text-fg tabular-nums">
                      {formatPrice(offer.price, offer.currency, currency, locale)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-[11px] text-faint">
                      {offer.channel.name} ·{' '}
                      {offer.channel.market === 'resale' ? t('marketResale') : t('marketRetail')}
                    </span>
                    <PremiumTag premium={offer.premium} size="md" />
                  </div>
                  <div className="mt-2 text-[11px] text-faint">
                    MSRP {drop.currency} {drop.price.toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] text-muted">
                    {drop.currency} {drop.price === 0 ? '—' : drop.price.toLocaleString()}
                  </span>
                  <span className="font-mono text-xl font-bold text-fg tabular-nums">
                    {drop.price === 0 ? 'FREE' : formatPrice(drop.price, drop.currency, currency, locale)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-md bg-accent py-2.5 text-[13px] font-bold text-accent-ink transition hover:bg-accent-dim"
            >
              🔔 {t('cardNotify')}
            </button>

            <div className="mt-5 border-t border-line-soft pt-3">
              <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t('detTimeline')}</h3>
              <TimelineRow label={t('detEntryOpens')} iso={drop.opensAt} />
              <TimelineRow label={t('detEntryCloses')} iso={drop.closesAt} />
              <TimelineRow label={t('detRelease')} iso={drop.releaseAt} />
              <p className="mt-2 text-[11px] text-faint">{t('detYourTime')}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
