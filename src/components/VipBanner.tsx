import { useT } from '../lib/i18n'
import { MovingBorder } from './ui/MovingBorder'
import { Logo } from './Logo'

export function VipBanner() {
  const { t } = useT()
  return (
    <div className="relative overflow-hidden rounded-xl border border-fg/20 bg-gradient-to-br from-fg/5 via-surface to-surface p-6">
      <div className="relative max-w-2xl">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-fg">VIP</span>
        <h3 className="mt-2 text-xl font-bold text-fg">{t('vipTitle')}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{t('vipBody')}</p>
        <MovingBorder
          as="button"
          className="mt-4 bg-accent px-4 py-2 text-[13px] font-bold text-accent-ink transition hover:bg-accent-dim"
        >
          {t('vipCta')}
        </MovingBorder>
      </div>
      {/* The mark itself as a watermark — no borrowed emoji. */}
      <Logo className="pointer-events-none absolute -right-10 -top-6 h-40 w-auto text-fg opacity-[0.06]" />
    </div>
  )
}
