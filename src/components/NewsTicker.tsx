import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { NEWS } from '../data/news'
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
  restock: 'border-accent-fg/40 text-accent-fg',
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
      {/* Flame only on the hottest few — the ordering carries the rest. */}
      {hot && (
        <span className="shrink-0 text-[10px]" title={heatTitle}>
          🔥
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
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={`${className} transition hover:bg-surface-2`}
      >
        {body}
      </a>
    )
  }
  return <span className={className}>{body}</span>
}

export function NewsTicker({ category }: { category: Category }) {
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
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-hard" />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg">{t('newsLabel')}</span>
        <span className="flex-1 font-mono text-[11px] text-faint tabular-nums">{ranked.length}</span>
        <span className="truncate font-mono text-[10.5px] text-faint">
          {t('feedUpdated')} {formatRelative(refreshedAt, locale, now)}
        </span>
      </div>

      {/* Four 36px rows in view; the rest arrive as it scrolls. */}
      <VerticalMarquee className="h-36">
        {ranked.map(({ item }, i) => (
          <Row key={item.id} item={item} now={now} hot={i < HOT_ROWS} />
        ))}
      </VerticalMarquee>
    </div>
  )
}
