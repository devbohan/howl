import { useState } from 'react'
import { useT } from '../lib/i18n'
import { hasVoted, submitWant } from '../lib/wantsClient'
import type { Category } from '../lib/types'

/** One-tap vote. Optimistic: the count moves immediately, retry is silent. */
export function WantVote({
  wantId,
  name,
  category,
  count,
  compact = false,
}: {
  wantId: string
  name: string
  category: Category
  count: number
  compact?: boolean
}) {
  const { t } = useT()
  /**
   * Whether this device had already voted when the component mounted. Captured
   * once, because voting writes to localStorage — reading it again afterwards
   * would say "already counted" and cancel the optimistic +1 it just showed.
   */
  const [votedBefore] = useState(() => hasVoted(wantId))
  const [voted, setVoted] = useState(votedBefore)
  const [queued, setQueued] = useState(false)

  const vote = async () => {
    if (voted) return
    setVoted(true)
    const result = await submitWant({ wantId, name, category })
    if (result === 'queued') setQueued(true)
  }

  return (
    <div className={`flex shrink-0 items-center ${compact ? 'gap-2' : 'gap-3'}`}>
      <div className="text-right">
        <div className="font-mono text-[15px] font-bold text-fg tabular-nums">
          {(count + (voted && !votedBefore ? 1 : 0)).toLocaleString()}
        </div>
        <div className="text-[10px] text-faint">{t('wantsCount')}</div>
      </div>
      <button
        type="button"
        onClick={vote}
        disabled={voted}
        title={queued ? t('wantsPending') : undefined}
        className={`rounded border px-3 py-1.5 text-[11px] font-semibold transition ${
          voted
            ? 'border-easy/40 bg-easy/10 text-easy'
            : 'border-line bg-surface-2 text-fg hover:border-accent hover:bg-accent hover:text-accent-ink'
        }`}
      >
        {voted ? t('wantsMeDone') : t('wantsMe')}
      </button>
    </div>
  )
}
