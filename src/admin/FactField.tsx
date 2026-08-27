import { CONFIDENCE_LABEL, type Confidence, type Fact } from './types'

const ORDER: Confidence[] = ['unknown', 'reported', 'confirmed', 'disputed']

const TONE: Record<Confidence, string> = {
  unknown: 'border-line text-faint',
  reported: 'border-medium/40 text-medium',
  confirmed: 'border-easy/40 text-easy',
  disputed: 'border-hard/40 text-hard',
}

const ACTIVE: Record<Confidence, string> = {
  unknown: 'border-faint bg-surface-2 text-fg',
  reported: 'border-medium bg-medium/15 text-medium',
  confirmed: 'border-easy bg-easy/15 text-easy',
  disputed: 'border-hard bg-hard/15 text-hard',
}

/**
 * One field plus its evidence. Setting a value never implies confidence —
 * you have to say separately whether you actually checked, which is the whole
 * point: an extractor can fill the box, only a person can confirm it.
 */
export function FactField<T extends string | number | boolean>({
  label,
  hint,
  fact,
  onChange,
  input,
}: {
  label: string
  hint?: string
  fact: Fact<T>
  onChange: (next: Fact<T>) => void
  /** Renders the value editor; omitted for pure yes/no facts. */
  input?: (value: T | null, set: (value: T | null) => void) => React.ReactNode
}) {
  const setConfidence = (confidence: Confidence) =>
    onChange({
      ...fact,
      confidence,
      checkedAt: confidence === 'confirmed' ? new Date().toISOString() : fact.checkedAt,
    })

  return (
    <div className="border-b border-line-soft py-3 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[12px] font-semibold text-fg">{label}</span>
        {hint && <span className="text-[11px] text-faint">{hint}</span>}
        {fact.checkedAt && fact.confidence === 'confirmed' && (
          <span className="ml-auto font-mono text-[10px] text-faint">
            {new Date(fact.checkedAt).toLocaleDateString()} 确认
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {input ? (
          input(fact.value, (value) => onChange({ ...fact, value }))
        ) : (
          <div className="flex gap-1">
            {[true, false].map((option) => (
              <button
                key={String(option)}
                type="button"
                onClick={() => onChange({ ...fact, value: option as T })}
                className={`rounded border px-2.5 py-1 text-[11px] font-semibold transition ${
                  fact.value === option
                    ? 'border-fg bg-surface-2 text-fg'
                    : 'border-line text-faint hover:text-fg'
                }`}
              >
                {option ? '是' : '否'}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex gap-1">
          {ORDER.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setConfidence(level)}
              title={level === 'confirmed' ? '我刚在真实页面上看过' : undefined}
              className={`rounded border px-2 py-1 text-[10px] font-semibold transition ${
                fact.confidence === level ? ACTIVE[level] : TONE[level] + ' hover:text-fg'
              }`}
            >
              {CONFIDENCE_LABEL[level]}
            </button>
          ))}
        </div>
      </div>

      <input
        value={fact.source ?? ''}
        onChange={(e) => onChange({ ...fact, source: e.target.value })}
        placeholder="来源：URL、LINE 公式、Discord #announcements、用户投稿…"
        className="mt-2 w-full rounded border border-line bg-surface-2 px-2 py-1.5 text-[11px] text-fg outline-none placeholder:text-faint focus:border-faint"
      />
    </div>
  )
}

export const textInput = (value: string | null, set: (v: string | null) => void, placeholder?: string) => (
  <input
    value={value ?? ''}
    onChange={(e) => set(e.target.value || null)}
    placeholder={placeholder}
    className="min-w-0 flex-1 rounded border border-line bg-surface-2 px-2 py-1.5 text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
  />
)
