import { openQuestions } from './logic'
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
          <p className="mt-1 text-[11px] text-muted">
            这些答案不印在商品页上。渠道来源：注册页 / 结算页试一次、FAQ、代购商的说明页、或问买过的人。
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
