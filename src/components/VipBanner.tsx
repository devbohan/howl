import { useT } from '../lib/i18n'

export function VipBanner() {
  const { t } = useT()
  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/10 via-surface to-surface p-6">
      <div className="relative max-w-2xl">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent-fg">VIP</span>
        <h3 className="mt-2 text-xl font-bold text-fg">{t('vipTitle')}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{t('vipBody')}</p>
        <button
          type="button"
          className="mt-4 rounded-md bg-accent px-4 py-2 text-[13px] font-bold text-accent-ink transition hover:bg-accent-dim"
        >
          {t('vipCta')}
        </button>
      </div>
      <span className="pointer-events-none absolute -right-6 -top-8 text-[140px] leading-none opacity-[0.07]">⚡️</span>
    </div>
  )
}
