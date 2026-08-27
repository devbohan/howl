import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { localTimeZone } from '../lib/format'

export function Footer() {
  const { t, locale } = useT()
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="max-w-2xl text-[12px] leading-relaxed text-faint">{t('footNote')}</p>
        {/* The header link is hidden on narrow phones, so this is where the
            wantlist stays reachable at every width. */}
        <Link
          to={`/${locale}/wants`}
          className="mt-4 inline-block text-[12px] font-medium text-fg underline underline-offset-4"
        >
          {t('wantsNav')}
        </Link>
        <p className="mt-3 font-mono text-[11px] text-faint">
          {t('detYourTime')} · {localTimeZone()}
        </p>
      </div>
    </footer>
  )
}
