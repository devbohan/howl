import type { ReactNode } from 'react'
import { useT } from '../lib/i18n'
import { hostOf, trackOutbound, type OutboundKind } from '../lib/outbound'

/**
 * An external link that reports the click before the browser leaves. Tracking
 * never blocks navigation — if the beacon fails the click is queued, and the
 * href works regardless.
 */
export function OutboundLink({
  href,
  kind,
  context,
  channelId,
  affiliate,
  sponsored = false,
  className,
  children,
  title,
}: {
  href: string
  kind: OutboundKind
  context?: string
  channelId?: string
  affiliate?: boolean
  /** Store links are paid placements; search engines need that declared. */
  sponsored?: boolean
  className?: string
  children: ReactNode
  title?: string
}) {
  const { locale } = useT()

  return (
    <a
      href={href}
      target="_blank"
      rel={`noopener noreferrer nofollow${sponsored ? ' sponsored' : ''}`}
      className={className}
      title={title}
      data-outbound={kind}
      onClick={() => {
        trackOutbound({ kind, host: hostOf(href), locale, context, channelId, affiliate })
      }}
    >
      {children}
    </a>
  )
}
