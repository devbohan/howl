import { useT } from '../lib/i18n'
import { proxiesFor, proxyUrl } from '../lib/proxies'
import { OutboundLink } from './OutboundLink'
import type { Drop } from '../lib/types'

/**
 * Shown only when the tracked channels genuinely leave an overseas buyer stuck.
 * On a drop anyone can order, this block would be noise — and it is the moment
 * someone learns they are blocked that makes it useful at all.
 */
export function ProxyRoute({ drop }: { drop: Drop }) {
  const { t, tl } = useT()
  const { blockers, services, needed } = proxiesFor(drop)
  if (!needed) return null

  const reason =
    blockers.shipping && blockers.payment
      ? t('proxyBoth')
      : blockers.payment
        ? t('proxyPayment')
        : t('proxyShipping')

  const query = tl(drop.title)

  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-faint">{t('proxyTitle')}</h2>

      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-[13px] leading-relaxed text-fg">{reason}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
          {blockers.payment ? t('proxyBuyerNote') : t('proxyForwarderNote')}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {services.map((service) => (
            <OutboundLink
              key={service.id}
              href={proxyUrl(service, query)}
              kind="proxy"
              context={drop.slug}
              channelId={service.id}
              affiliate={Boolean(service.affiliateParam)}
              sponsored
              className="group flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3.5 py-3 transition hover:border-accent"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-fg">{service.name}</span>
                <span className="mt-0.5 block text-[11px] text-faint">
                  {service.kind === 'buyer' ? t('proxyKindBuyer') : t('proxyKindForwarder')} · {service.fee}
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-muted transition group-hover:text-fg">
                {t('proxyGo')} ↗
              </span>
            </OutboundLink>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-faint">{t('proxyDisclaimer')}</p>
      </div>
    </section>
  )
}
