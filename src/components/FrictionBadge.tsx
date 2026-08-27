import { useT } from '../lib/i18n'
import { FRICTION_DESC_KEY, FRICTION_KEY } from '../lib/labels'
import type { Friction } from '../lib/types'

const STYLES: Record<Friction, string> = {
  easy: 'border-easy/35 bg-easy/10 text-easy',
  medium: 'border-medium/35 bg-medium/10 text-medium',
  hard: 'border-hard/35 bg-hard/10 text-hard',
}

export function FrictionBadge({ friction, withDesc = false }: { friction: Friction; withDesc?: boolean }) {
  const { t } = useT()
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${STYLES[friction]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(FRICTION_KEY[friction])}
      {withDesc && <span className="font-normal opacity-70">· {t(FRICTION_DESC_KEY[friction])}</span>}
    </span>
  )
}
