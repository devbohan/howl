import { useState } from 'react'
import { openQuestions } from './logic'
import { FIELD_QUESTION, policyUrls, scanPolicy, type Finding } from './policy'
import { emptyChannel, replaceById } from './store'
import { FactField, textInput } from './FactField'
import { FRICTION_FIELDS, type AdminState, type ChannelProfile } from './types'
import { REGIONS, REGION_KEY } from '../lib/labels'
import { DICT } from '../lib/i18n'
import type { Region } from '../lib/types'

/**
 * The friction knowledge base. This is the asset — "Pokémon Center Online
 * requires a Japanese phone number" is worth verifying once and reusing on
 * every drop that channel will ever carry.
 */
export function Channels({
  state,
  update,
  selectedId,
  onSelect,
}: {
  state: AdminState
  update: (patch: (prev: AdminState) => AdminState) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const current = state.channels.find((c) => c.id === selectedId) ?? null

  const save = (next: ChannelProfile) =>
    update((prev) => ({
      ...prev,
      channels: replaceById(prev.channels, { ...next, updatedAt: new Date().toISOString() }),
    }))

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            const channel = emptyChannel('')
            update((prev) => ({ ...prev, channels: [...prev.channels, channel] }))
            onSelect(channel.id)
          }}
          className="rounded bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-ink"
        >
          新建渠道
        </button>

        {state.channels.length === 0 && (
          <p className="rounded-lg border border-line bg-surface p-4 text-[12px] text-faint">
            一个渠道搞清楚一次，之后所有走这个渠道的商品都继承。几十个渠道就够覆盖全部品类。
          </p>
        )}

        {state.channels.map((c) => {
          const open = openQuestions(c).length
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={`rounded-lg border bg-surface p-3 text-left transition ${
                c.id === selectedId ? 'border-accent' : 'border-line hover:border-faint'
              }`}
            >
              <div className="truncate text-[12px] font-semibold text-fg">{c.name || '（未命名渠道）'}</div>
              <div className="mt-1 text-[10px]">
                {open === 0 ? (
                  <span className="text-easy">全部已确认</span>
                ) : (
                  <span className="text-medium">还有 {open} 个问题没答</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {current ? (
        <ChannelEditor key={current.id} channel={current} onChange={save} />
      ) : (
        <p className="rounded-lg border border-line bg-surface p-6 text-[12px] text-faint">
          选一个渠道，或新建一个。
        </p>
      )}
    </div>
  )
}

function ChannelEditor({
  channel,
  onChange,
}: {
  channel: ChannelProfile
  onChange: (next: ChannelProfile) => void
}) {
  const questions = openQuestions(channel)
  const set = <K extends keyof ChannelProfile>(key: K, value: ChannelProfile[K]) =>
    onChange({ ...channel, [key]: value })

  /**
   * A scanner finding is only ever `reported`. It found a sentence; it did not
   * verify that the sentence is current, applies to your country, or is not
   * contradicted three pages later. Marking it confirmed stays your call.
   */
  const applyFinding = (finding: Finding) =>
    onChange({
      ...channel,
      [finding.field]: {
        value: finding.value,
        confidence: 'reported',
        source: finding.evidence,
      },
      updatedAt: new Date().toISOString(),
    })

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-line bg-surface p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={channel.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="渠道名，如 Pokémon Center Online"
            className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
          />
          <input
            value={channel.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="URL"
            className="rounded border border-line bg-surface-2 px-2 py-1.5 text-[12px] text-fg outline-none placeholder:text-faint focus:border-faint"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REGIONS.map((r: Region) => (
            <button
              key={r}
              type="button"
              onClick={() => set('region', r)}
              className={`rounded border px-2.5 py-1 text-[11px] transition ${
                channel.region === r ? 'border-fg bg-surface-2 text-fg' : 'border-line text-faint hover:text-fg'
              }`}
            >
              {DICT['zh-CN'][REGION_KEY[r]]}
            </button>
          ))}
        </div>
      </section>

      {questions.length > 0 && (
        <section className="rounded-lg border border-medium/40 bg-medium/5 p-4">
          <h3 className="text-[12px] font-bold text-fg">还没答的问题</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            商品页上通常没有，但<strong className="text-fg">店铺的政策页上经常有</strong>——
            配送・送料、お支払い方法、会員登録、FAQ。下面帮你把这几页找出来。
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {questions.map((q) => (
              <li key={q} className="text-[12px] text-fg">
                · {q}
              </li>
            ))}
          </ul>
        </section>
      )}

      <PolicyScanner channel={channel} onApply={applyFinding} />

      <section className="rounded-lg border border-line bg-surface px-4">
        {FRICTION_FIELDS.map(([key, label]) => (
          <FactField
            key={key}
            label={label}
            fact={channel[key]}
            onChange={(f) => set(key, f)}
          />
        ))}
        <FactField
          label="可用代购 / 转运"
          fact={channel.proxies}
          onChange={(f) => set('proxies', f)}
          input={(v, setV) => textInput(v, setV, '如 Buyee、ZenMarket、Tenso')}
        />
        <FactField
          label="关税备注"
          fact={channel.dutyNote}
          onChange={(f) => set('dutyNote', f)}
          input={(v, setV) => textInput(v, setV, '目的地关税与税率')}
        />
      </section>

      <section className="rounded-lg border border-hard/35 bg-hard/5 p-4">
        <h3 className="text-[12px] font-bold text-fg">我能不能亲自代拍？</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          这是商业判断，不是技术字段。你人在日本，是这个渠道最大的门槛（本地手机号、本地卡）
          对你恰好不成立——这确实是机会。但一旦你收钱代拍，
          <strong className="text-fg">你就从资讯服务变成了交易一方</strong>，
          而「不代抽、不代付款」正是当初让这个产品法律与支付风险归零的那条边界。
          <br />
          代拍（Yahoo 拍卖、Mercari 这类公开市场）和代抽（替人参加官方抽选）不是一回事：
          前者是 Buyee 那种成熟合法的生意，后者违反 SNKRS / Supreme / Pokémon Center 的 ToS。
          要做，先把这两件事分清楚，并且单独走法务判断。
        </p>
        <div className="mt-2">
          <FactField
            label="这个渠道适合由我代拍"
            hint="先当作待验证的假设记下来，不要当成已定方针"
            fact={channel.selfProxyViable}
            onChange={(f) => set('selfProxyViable', f)}
          />
        </div>
      </section>
    </div>
  )
}

/**
 * Finds the shop's policy pages and highlights the sentences that answer each
 * friction question. You open the page (in your browser, as a visitor), paste
 * it back, and the scanner points at the relevant line — it never decides.
 */
function PolicyScanner({
  channel,
  onApply,
}: {
  channel: ChannelProfile
  onApply: (finding: Finding) => void
}) {
  const [text, setText] = useState('')
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const candidates = policyUrls(channel.url)

  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h3 className="text-[12px] font-bold text-fg">从政策页找答案</h3>

      {candidates.length === 0 ? (
        <p className="mt-1 text-[11px] text-faint">先填上这个渠道的 URL。</p>
      ) : (
        <>
          <p className="mt-1 text-[11px] text-faint">
            常见路径，未必都存在——打开看一眼，把相关那页的文字粘回来。
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {candidates.slice(0, 10).map((c) => (
              <a
                key={c.url}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-line px-2 py-1 text-[10px] text-muted transition hover:border-accent hover:text-fg"
              >
                {c.label}
                <span className="ml-1 font-mono text-faint">{new URL(c.url).pathname}</span>
              </a>
            ))}
          </div>
        </>
      )}

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setFindings(null)
        }}
        rows={4}
        placeholder="把政策页的文字整段粘到这里…"
        className="mt-3 w-full rounded border border-line bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-fg outline-none placeholder:text-faint focus:border-faint"
      />
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => setFindings(scanPolicy(text))}
        className="mt-2 rounded bg-accent px-4 py-1.5 text-[12px] font-bold text-accent-ink transition hover:bg-accent-dim disabled:opacity-40"
      >
        扫描
      </button>

      {findings && findings.length === 0 && (
        <p className="mt-2 text-[12px] text-medium">
          这段文字里没找到相关表述。换一页试试，或者这家店确实没写——那就只能试或者问。
        </p>
      )}

      {findings && findings.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {findings.map((f) => (
            <li key={f.field} className="rounded border border-line bg-surface-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold text-fg">{FIELD_QUESTION[f.field]}</span>
                <span className={`text-[12px] font-bold ${f.value ? 'text-easy' : 'text-hard'}`}>
                  {f.value ? '是' : '否'}
                </span>
                <button
                  type="button"
                  onClick={() => onApply(f)}
                  className="ml-auto rounded border border-line px-2.5 py-1 text-[10px] text-fg transition hover:border-accent"
                >
                  记为「有说法」
                </button>
              </div>
              <p className="mt-1.5 border-l-2 border-line pl-2 text-[11px] leading-relaxed text-muted">
                {f.evidence}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        扫描结果一律记为<strong className="text-fg">「有说法」而不是「已确认」</strong>——
        它只是找到了一句话，没验证这句话是不是最新的、适不适用于你的国家、
        或者三页之后有没有被推翻。
      </p>
    </section>
  )
}
