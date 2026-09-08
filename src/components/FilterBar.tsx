import { useState } from 'react'
import { useT, type Key } from '../lib/i18n'
import {
  CATEGORIES,
  CATEGORY_KEY,
  FRICTIONS,
  FRICTION_KEY,
  MECHANICS,
  MECHANIC_KEY,
  REGIONS,
  REGION_KEY,
} from '../lib/labels'
import type { Category, Friction, Mechanic, Region } from '../lib/types'

export interface Filters {
  category: Category | null
  region: Region | null
  mechanic: Mechanic | null
  friction: Friction | null
  /** Only drops that can be bought right now, retail or resale. */
  stockOnly: boolean
}

export const EMPTY_FILTERS: Filters = {
  category: null,
  region: null,
  mechanic: null,
  friction: null,
  stockOnly: false,
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-sm border px-3 py-1.5 text-[12px] font-medium transition ${
        active
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-line bg-surface text-muted hover:border-faint hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}

function Row<T extends string>({
  labelKey,
  values,
  current,
  keyMap,
  onPick,
}: {
  labelKey: Key
  values: T[]
  current: T | null
  keyMap: Record<T, Key>
  onPick: (value: T | null) => void
}) {
  const { t } = useT()
  return (
    <div className="flex items-start gap-3">
      <span className="w-16 shrink-0 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
        {t(labelKey)}
      </span>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={current === null} onClick={() => onPick(null)}>
          {t('filterAll')}
        </Chip>
        {values.map((value) => (
          <Chip key={value} active={current === value} onClick={() => onPick(current === value ? null : value)}>
            {t(keyMap[value])}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export function FilterBar({
  filters,
  onChange,
  count,
  showCategory = true,
}: {
  filters: Filters
  onChange: (next: Filters) => void
  count: number
  /** Hidden on a category page — the category is already fixed by the route. */
  showCategory?: boolean
}) {
  const { t } = useT()
  const active = Object.values(filters).filter(Boolean).length
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-line bg-surface/60 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted transition hover:text-fg"
        >
          <span className={`text-[10px] transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
          {t('filterToggle')}
          {active > 0 && (
            <span className="rounded-sm bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent-ink tabular-nums">
              {active}
            </span>
          )}
        </button>

        <Chip
          active={filters.stockOnly}
          onClick={() => onChange({ ...filters, stockOnly: !filters.stockOnly })}
        >
          ● {t('filterStock')}
        </Chip>
        </div>

        <span className="shrink-0 font-mono text-xs text-faint tabular-nums">
          {count} {t('filterResults')}
        </span>
      </div>

      {!open ? null : (
      <div className="flex flex-col gap-3 border-t border-line-soft p-4">
        {showCategory && (
          <Row
            labelKey="filterCategory"
            values={CATEGORIES}
            current={filters.category}
            keyMap={CATEGORY_KEY}
            onPick={(category) => onChange({ ...filters, category })}
          />
        )}
        <Row
          labelKey="filterRegion"
          values={REGIONS}
          current={filters.region}
          keyMap={REGION_KEY}
          onPick={(region) => onChange({ ...filters, region })}
        />
        <Row
          labelKey="filterMechanic"
          values={MECHANICS}
          current={filters.mechanic}
          keyMap={MECHANIC_KEY}
          onPick={(mechanic) => onChange({ ...filters, mechanic })}
        />
        <Row
          labelKey="filterFriction"
          values={FRICTIONS}
          current={filters.friction}
          keyMap={FRICTION_KEY}
          onPick={(friction) => onChange({ ...filters, friction })}
        />
        {active > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="self-start text-xs font-medium text-faint underline underline-offset-4 hover:text-fg"
          >
            {t('filterReset')}
          </button>
        )}
      </div>
      )}
    </div>
  )
}
