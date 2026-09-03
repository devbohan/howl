import { useT } from '../lib/i18n'
import { splitDuration, type DropState } from '../lib/schedule'

function Unit({ value, label, pad = 2 }: { value: number; label: string; pad?: number }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="font-mono text-inherit tabular-nums">{String(value).padStart(pad, '0')}</span>
      <span className="text-[0.62em] font-semibold text-faint">{label}</span>
    </span>
  )
}

export function Countdown({ state, size = 'md' }: { state: DropState; size?: 'sm' | 'md' | 'lg' }) {
  const { t } = useT()
  const { days, hours, minutes, seconds } = splitDuration(state.msLeft)

  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-3xl',
  }

  if (state.phase === 'ended') {
    return (
      <span data-testid="countdown" className={`${sizes[size]} font-mono font-bold text-faint`}>
        —— {t('cdEnded')}
      </span>
    )
  }

  if (state.phase === 'in-stock') {
    return (
      <span data-testid="countdown" className={`inline-flex items-center gap-1.5 font-bold text-easy ${sizes[size]}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-easy" />
        {t('cdInStock')}
      </span>
    )
  }

  const tone = state.urgent ? 'text-hard' : state.phase === 'open' ? 'text-live-fg' : 'text-fg'

  /**
   * With only a day announced, showing minutes and seconds would dress a
   * guess up as precision. Days and hours to the start of that day is the
   * most the source actually supports.
   */
  if (state.dateOnly) {
    return (
      <span data-testid="countdown" className={`inline-flex items-baseline gap-2 font-bold ${sizes[size]} ${tone}`}>
        {days > 0 && <Unit value={days} label={t('cdDay')} pad={1} />}
        <Unit value={hours} label={t('cdHour')} />
        <span className="text-[0.6em] font-semibold text-faint">{t('cdTimeUnknown')}</span>
      </span>
    )
  }

  return (
    <span data-testid="countdown" className={`inline-flex items-baseline gap-2 font-bold ${sizes[size]} ${tone}`}>
      {days > 0 && <Unit value={days} label={t('cdDay')} pad={1} />}
      <Unit value={hours} label={t('cdHour')} />
      <Unit value={minutes} label={t('cdMin')} />
      {days === 0 && <Unit value={seconds} label={t('cdSec')} />}
    </span>
  )
}

export function CountdownLabel({ state }: { state: DropState }) {
  const { t } = useT()
  if (state.phase === 'ended' || state.phase === 'in-stock') return null
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
      {state.phase === 'open' ? t('cdClosesIn') : t('cdOpensIn')}
    </span>
  )
}
