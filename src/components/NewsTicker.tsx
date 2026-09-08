import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { NEWS } from '../data/live'
import { HeatMark } from './icons'
import { OutboundLink } from './OutboundLink'
import { formatCount, rankFeed } from '../lib/feed'
import { formatRelative } from '../lib/format'
import { useT, type Key } from '../lib/i18n'
import { useNow } from '../lib/useNow'
import { useRefresh } from '../lib/useRefresh'
import { VerticalMarquee } from './VerticalMarquee'
import type { Category, NewsItem } from '../lib/types'

const KIND_KEY: Record<NewsItem['kind'], Key> = {
  confirmed: 'newsConfirmed',
  rumor: 'newsRumor',
  restock: 'newsRestock',
  leak: 'newsLeak',
  result: 'newsResult',
}

/** How many of the top-ranked rows get the flame. */
const HOT_ROWS = 3

const KIND_STYLE: Record<NewsItem['kind'], string> = {
  confirmed: 'border-easy/40 text-easy',
  rumor: 'border-medium/40 text-medium',
  restock: 'border-live-fg/40 text-live-fg',
  leak: 'border-hard/40 text-hard',
  result: 'border-line text-muted',
}

function Row({ item, now, hot }: { item: NewsItem; now: number; hot: boolean }) {
  const { t, tl, locale } = useT()
  const heatTitle = item.heat
    ? `${t('feedHotSite')} ${formatCount(item.heat.site, locale)} · ${t('feedHotExternal')} ${formatCount(item.heat.external, locale)}`
    : undefined

  const body = (
    <>
      <span
        className={`mt-px shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${KIND_STYLE[item.kind]}`}
      >
        {t(KIND_KEY[item.kind])}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-[12.5px] ${item.urgent ? 'font-semibold text-fg' : 'text-muted'}`}
      >
        {tl(item.text)}
      </span>
      {/* Marked only on the hottest few — the ordering carries the rest. */}
      {hot && (
        <span className="shrink-0 text-fg" title={heatTitle}>
          <HeatMark />
        </span>
      )}
      <span className="shrink-0 font-mono text-[11px] text-faint tabular-nums" title={heatTitle}>
        {formatRelative(item.at, locale, now)}
      </span>
    </>
  )

  const className = 'flex h-9 shrink-0 items-center gap-2 px-3.5'

  if (item.dropSlug) {
    return (
      <Link to={`/${locale}/drop/${item.dropSlug}`} className={`${className} transition hover:bg-surface-2`}>
        {body}
      </Link>
    )
  }
  if (item.url) {
    return (
      <OutboundLink
        href={item.url}
        kind="news"
        context={item.id}
        className={`${className} transition hover:bg-surface-2`}
      >
        {body}
      </OutboundLink>
    )
  }
  return <span className={className}>{body}</span>
}

export function NewsTicker({ category, compact = false }: { category: Category; compact?: boolean }) {
  const { t, locale } = useT()
  // Minute granularity is enough for "12 min ago" — no need to re-render at 1Hz.
  const now = useNow(30_000)
  const refreshedAt = useRefresh()

  // refreshedAt is the seam where the CMS fetch goes; today it re-reads statics.
  const ranked = useMemo(
    () => rankFeed(NEWS.filter((n) => n.category === category)),
    [category, refreshedAt],
  )

  if (ranked.length === 0) return null

  return (
    <div className={compact ? 'overflow-hidden' : 'overflow-hidden border border-line bg-surface'}>
      <div className={`flex items-center gap-2 px-3.5 py-2 ${compact ? '' : 'border-b border-line'}`}>
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-hard" />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg">{t('newsLabel')}</span>
        <span className="flex-1 font-mono text-[11px] text-faint tabular-nums">{ranked.length}</span>
        <span className="truncate font-mono text-[10.5px] text-faint">
          {t('feedUpdated')} {formatRelative(refreshedAt, locale, now)}
        </span>
      </div>

      {/* Four 36px rows in view; the rest arrive as it scrolls. */}
      <VerticalMarquee label={t('newsLabel')} className="h-36">
        {ranked.map(({ item }, i) => (
          <Row key={item.id} item={item} now={now} hot={i < HOT_ROWS} />
        ))}
      </VerticalMarquee>
    </div>
  )
}
