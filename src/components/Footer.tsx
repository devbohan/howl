import { useT } from '../lib/i18n'
import { localTimeZone } from '../lib/format'

export function Footer() {
  const { t } = useT()
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="max-w-2xl text-[12px] leading-relaxed text-faint">{t('footNote')}</p>
        <p className="mt-3 font-mono text-[11px] text-faint/70">
          {t('detYourTime')} · {localTimeZone()}
        </p>
      </div>
    </footer>
  )
}
