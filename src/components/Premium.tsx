import { useT } from '../lib/i18n'

/** `premium` is a fraction: 1.8 renders as +180% over retail. */
export function PremiumTag({ premium, size = 'sm' }: { premium: number; size?: 'sm' | 'md' }) {
  const { t } = useT()
  const over = premium > 0.02
  const under = premium < -0.02
  const pct = Math.round(Math.abs(premium) * 100)
  const tone = over ? 'text-hard' : under ? 'text-easy' : 'text-muted'

  return (
    <span className={`font-mono ${size === 'md' ? 'text-[12px]' : 'text-[11px]'} ${tone} tabular-nums`}>
      {over ? '+' : under ? '−' : '±'}
      {pct}% {over ? t('detOverRetail') : under ? t('detUnderRetail') : ''}
    </span>
  )
}
