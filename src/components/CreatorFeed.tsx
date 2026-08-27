import { useMemo } from 'react'
import { CATEGORY_MEDIA } from '../data/creators'
import { HeatMark } from './icons'
import { formatCount, rankFeed } from '../lib/feed'
import { formatRelative } from '../lib/format'
import { LOCALE_LABELS, useT } from '../lib/i18n'
import { PLATFORM_LABEL } from '../lib/labels'
import { useNow } from '../lib/useNow'
import { useRefresh } from '../lib/useRefresh'
import { VerticalMarquee } from './VerticalMarquee'
import type { Category, MediaLink } from '../lib/types'

/** How many of the top-ranked rows get the flame. */
const HOT_ROWS = 2

function Row({ item, hot }: { item: MediaLink; hot: boolean }) {
  const { t, tl, locale } = useT()
  const heatTitle = item.heat
    ? `${t('feedHotSite')} ${formatCount(item.heat.site, locale)} · ${t('feedHotExternal')} ${formatCount(item.heat.external, locale)}`
    : undefined

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group flex h-[52px] shrink-0 items-center gap-2.5 px-3.5 transition hover:bg-surface-2"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border transition ${
          item.kind === 'video'
            ? 'border-line bg-surface-2 text-fg group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink'
            : 'border-line bg-surface-2 text-faint'
        }`}
      >
        {item.kind === 'video' ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
            <path d="M3 1.8 10 6l-7 4.2Z" fill="currentColor" />
          </svg>
        ) : (
          <span className="text-[11px] leading-none">↗</span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-fg">{tl(item.title)}</span>
        <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-faint">
          <span>{PLATFORM_LABEL[item.platform]}</span>
          <span className="text-line">·</span>
          <span className="truncate text-muted">{item.source}</span>
          {item.audience && (
            <>
              <span className="text-line">·</span>
              <span className="font-mono tabular-nums">{item.audience}</span>
            </>
          )}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-0.5 text-[11px] text-faint" title={heatTitle}>
        <span className="flex items-center gap-1">
          {/* Marked only on the hottest few — the ordering carries the rest. */}
          {hot && (
            <span className="text-fg">
              <HeatMark />
            </span>
          )}
          {item.duration && <span className="font-mono tabular-nums">{item.duration}</span>}
        </span>
        {/* Only worth flagging when it isn't the language you're reading in. */}
        {item.lang !== locale && (
          <span className="rounded border border-line px-1 py-px text-[10px]">{LOCALE_LABELS[item.lang]}</span>
        )}
      </span>
    </a>
  )
}

/** Creators and outlets that cover the whole genre, not one specific drop. */
export function CreatorFeed({ category }: { category: Category }) {
  const { t, locale } = useT()
  const now = useNow(30_000)
  const refreshedAt = useRefresh()

  const items = CATEGORY_MEDIA[category] ?? []
  // refreshedAt is the seam where each platform's latest-upload pull goes.
  const ranked = useMemo(() => rankFeed(items), [items, refreshedAt])

  if (ranked.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2">
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-fg" aria-hidden="true">
          <path d="M3 1.8 10 6l-7 4.2Z" fill="currentColor" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg">{t('feedLabel')}</span>
        <span className="flex-1 font-mono text-[11px] text-faint tabular-nums">{ranked.length}</span>
        <span className="truncate font-mono text-[10.5px] text-faint">
          {t('feedUpdated')} {formatRelative(refreshedAt, locale, now)}
        </span>
      </div>

      {/* Rows are 52px, so just under three are in view at a time. */}
      <VerticalMarquee className="h-36">
        {ranked.map(({ item }, i) => (
          <Row key={item.id} item={item} hot={i < HOT_ROWS} />
        ))}
      </VerticalMarquee>
    </div>
  )
}
