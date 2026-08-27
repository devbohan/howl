import { LOCALE_LABELS, useT } from '../lib/i18n'
import { MEDIA_KIND_KEY, PLATFORM_LABEL } from '../lib/labels'
import type { MediaLink } from '../lib/types'

/** Play triangle for video rows; everything else gets an outbound arrow. */
function KindMark({ kind }: { kind: MediaLink['kind'] }) {
  if (kind !== 'video') {
    return <span className="text-[13px] leading-none text-faint">↗</span>
  }
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
      <path d="M3 1.8 10 6l-7 4.2Z" fill="currentColor" />
    </svg>
  )
}

function MediaRow({ item }: { item: MediaLink }) {
  const { t, tl, locale } = useT()
  const foreign = item.lang !== locale

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group flex items-start gap-3 border-b border-line-soft py-3 last:border-b-0"
    >
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border transition ${
          item.kind === 'video'
            ? 'border-line bg-surface-2 text-fg group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink'
            : 'border-line bg-surface-2'
        }`}
      >
        <KindMark kind={item.kind} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-fg transition group-hover:text-accent-fg">
            {tl(item.title)}
          </p>
          {item.featured && (
            <span className="mt-px shrink-0 rounded border border-accent-fg/40 px-1.5 py-0.5 text-[10px] font-semibold text-accent-fg">
              {t('mediaPick')}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
          <span>{PLATFORM_LABEL[item.platform]}</span>
          <span className="text-line">·</span>
          <span className="text-muted">{item.source}</span>
          {item.audience && (
            <>
              <span className="text-line">·</span>
              <span className="font-mono tabular-nums">{item.audience}</span>
            </>
          )}
          {item.duration && (
            <>
              <span className="text-line">·</span>
              <span className="font-mono tabular-nums">{item.duration}</span>
            </>
          )}
          <span className="text-line">·</span>
          <span>{t(MEDIA_KIND_KEY[item.kind])}</span>
          {/* Flagged only when it isn't the language you're reading the site in. */}
          {foreign && (
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px]">{LOCALE_LABELS[item.lang]}</span>
          )}
        </div>
      </div>
    </a>
  )
}

export function MediaLinks({ items }: { items: MediaLink[] }) {
  const { t, locale } = useT()
  if (items.length === 0) return null

  // Featured first, then the site's own language, so the useful row is on top.
  const sorted = [...items].sort(
    (a, b) =>
      Number(b.featured ?? false) - Number(a.featured ?? false) ||
      Number(b.lang === locale) - Number(a.lang === locale),
  )

  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-faint">{t('detCoverage')}</h2>
      <div className="mt-3 rounded-xl border border-line bg-surface px-4">
        {sorted.map((item) => (
          <MediaRow key={item.id} item={item} />
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-faint">{t('detCoverageNote')}</p>
    </section>
  )
}
