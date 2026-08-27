import { useRef, useState } from 'react'
import { readiness } from './logic'
import type { AdminState } from './types'

/**
 * localStorage is one browser on one machine. Export is not a nice-to-have —
 * it is the only thing standing between a cleared profile and losing every
 * verified fact you collected by hand.
 */
export function Backup({
  state,
  onReplace,
}: {
  state: AdminState
  onReplace: (next: AdminState) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const ready = state.drafts.filter((d) => readiness(d).ready)

  const download = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wolfgrandma-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('已导出全部数据')
  }

  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as AdminState
      if (!Array.isArray(parsed.drafts) || !Array.isArray(parsed.channels)) {
        throw new Error('文件里没有 drafts / channels')
      }
      onReplace(parsed)
      setMessage(`已导入：${parsed.drafts.length} 条草稿、${parsed.channels.length} 个渠道`)
    } catch (error) {
      setMessage(`导入失败：${error instanceof Error ? error.message : '文件读不出来'}`)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-[12px] font-bold text-fg">备份</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-faint">
          数据只存在这台机器的浏览器里。换机器、清缓存、换浏览器都会丢——
          <strong className="text-fg">每次录完记得导出一次</strong>。
          等 P0 接上 D1，这份 JSON 可以直接灌进去。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            className="rounded bg-accent px-4 py-1.5 text-[12px] font-bold text-accent-ink transition hover:bg-accent-dim"
          >
            导出 JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded border border-line bg-surface-2 px-4 py-1.5 text-[12px] font-semibold text-fg transition hover:border-accent"
          >
            导入并覆盖
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importFile(file)
              e.target.value = ''
            }}
          />
        </div>
        {message && <p className="mt-2 text-[11px] text-muted">{message}</p>}
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-[12px] font-bold text-fg">现状</h2>
        <div className="mt-2 grid gap-x-6 gap-y-1 text-[12px] sm:grid-cols-2">
          <Row label="待处理线索" value={state.leads.filter((l) => l.status === 'new').length} />
          <Row label="草稿" value={state.drafts.length} />
          <Row label="其中可发布" value={ready.length} tone={ready.length > 0 ? 'text-easy' : undefined} />
          <Row label="渠道档案" value={state.channels.length} />
          <Row label="巡回源" value={state.patrol.length} />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-[12px] font-bold text-fg">可发布的草稿</h2>
        {ready.length === 0 ? (
          <p className="mt-1 text-[11px] text-faint">还没有草稿把必填项确认齐。</p>
        ) : (
          <pre className="scroll-x mt-2 max-h-80 overflow-auto rounded border border-line bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-muted">
{JSON.stringify(
  ready.map((d) => ({
    slug: d.slug,
    title: d.title,
    brand: d.brand,
    category: d.category,
    mechanic: d.mechanic.value,
    opensAt: d.opensAt.value,
    closesAt: d.closesAt.value,
    releaseAt: d.releaseAt.value,
    price: d.price.value,
    channelIds: d.channelIds,
  })),
  null,
  2,
)}
          </pre>
        )}
      </section>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line-soft py-1.5">
      <span className="text-muted">{label}</span>
      <span className={`font-mono tabular-nums ${tone ?? 'text-fg'}`}>{value}</span>
    </div>
  )
}
