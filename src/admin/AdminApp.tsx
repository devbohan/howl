import { useState } from 'react'
import { Backup } from './Backup'
import { Channels } from './Channels'
import { Inbox } from './Inbox'
import { Verify } from './Verify'
import { emptyDraft, useAdminState } from './store'
import type { AdminState, Lead } from './types'

type Tab = 'inbox' | 'verify' | 'channels' | 'backup'

const TABS: [Tab, string, string][] = [
  ['inbox', '收件箱', '爬虫拿不到的，先手动接住'],
  ['verify', '核对', '到页面上确认，默认未知'],
  ['channels', '渠道', '门槛只研究一次，商品继承'],
  ['backup', '备份', '导出，别让数据困在浏览器里'],
]

export default function AdminApp() {
  const { state, setState, update } = useAdminState()
  const [tab, setTab] = useState<Tab>('inbox')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [channelId, setChannelId] = useState<string | null>(null)

  /** A lead becomes a draft with its text kept as the source trail. */
  const promote = (lead: Lead) => {
    const draft = emptyDraft({ sourceUrl: lead.url, leadId: lead.id })
    update((prev: AdminState) => ({ ...prev, drafts: [draft, ...prev.drafts] }))
    setDraftId(draft.id)
    setTab('verify')
  }

  return (
    <div className="page-grid min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-extrabold tracking-tight text-fg">WolfGrandma</span>
            <span className="text-[10px] text-faint">HOWL 录入后台</span>
          </div>
          <nav className="ml-auto flex flex-wrap gap-1">
            {TABS.map(([key, name]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded border px-3 py-1.5 text-[11px] font-semibold transition ${
                  tab === key ? 'border-accent bg-accent text-accent-ink' : 'border-line text-muted hover:text-fg'
                }`}
              >
                {name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <p className="mb-4 text-[11px] text-faint">{TABS.find(([k]) => k === tab)?.[2]}</p>

        {tab === 'inbox' && <Inbox state={state} update={update} onPromote={promote} />}
        {tab === 'verify' && (
          <Verify state={state} update={update} selectedId={draftId} onSelect={setDraftId} />
        )}
        {tab === 'channels' && (
          <Channels state={state} update={update} selectedId={channelId} onSelect={setChannelId} />
        )}
        {tab === 'backup' && <Backup state={state} onReplace={setState} />}
      </main>
    </div>
  )
}
