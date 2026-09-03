import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Backup } from '../Backup'
import { EMPTY, emptyChannel, emptyDraft } from '../store'
import type { AdminState } from '../types'

const state = (over: Partial<AdminState> = {}): AdminState => ({
  ...EMPTY,
  drafts: [emptyDraft({ title: 'A draft' })],
  channels: [emptyChannel('A channel')],
  ...over,
})

const file = (contents: unknown) =>
  new File([JSON.stringify(contents)], 'backup.json', { type: 'application/json' })

let created: string[] = []

beforeEach(() => {
  created = []
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => {
      const url = `blob:mock-${created.length}`
      created.push(url)
      return url
    }),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('export', () => {
  it('hands over the whole state as a dated file', async () => {
    const user = userEvent.setup()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<Backup state={state()} onReplace={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '导出 JSON' }))

    expect(click).toHaveBeenCalledOnce()
    expect(created).toHaveLength(1)
    expect(screen.getByText('已导出全部数据')).toBeInTheDocument()
  })

  it('releases the blob url rather than leaking it', async () => {
    const user = userEvent.setup()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<Backup state={state()} onReplace={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '导出 JSON' }))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-0')
  })
})

describe('import', () => {
  const upload = async (user: ReturnType<typeof userEvent.setup>, contents: unknown) => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file(contents))
  }

  it('replaces everything and says what came in', async () => {
    const user = userEvent.setup()
    const onReplace = vi.fn()
    render(<Backup state={EMPTY} onReplace={onReplace} />)

    const incoming = state({ drafts: [emptyDraft({ title: 'From file' }), emptyDraft()] })
    await upload(user, incoming)

    await waitFor(() => expect(onReplace).toHaveBeenCalledOnce())
    expect(onReplace.mock.calls[0][0].drafts[0].title).toBe('From file')
    expect(await screen.findByText(/已导入：2 条草稿、1 个渠道/)).toBeInTheDocument()
  })

  it('refuses a file that is not a WolfGrandma backup', async () => {
    const user = userEvent.setup()
    const onReplace = vi.fn()
    render(<Backup state={state()} onReplace={onReplace} />)

    await upload(user, { something: 'else' })

    // Overwriting good data with a wrong file is the one unrecoverable mistake
    // here, so a shape that is not recognised must not be applied at all.
    expect(await screen.findByText(/导入失败/)).toBeInTheDocument()
    expect(onReplace).not.toHaveBeenCalled()
  })

  it('refuses unparseable content without wiping anything', async () => {
    const user = userEvent.setup()
    const onReplace = vi.fn()
    render(<Backup state={state()} onReplace={onReplace} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['{ broken'], 'x.json', { type: 'application/json' }))

    expect(await screen.findByText(/导入失败/)).toBeInTheDocument()
    expect(onReplace).not.toHaveBeenCalled()
  })

  it('round-trips an export back into itself', async () => {
    const user = userEvent.setup()
    const original = state()
    const onReplace = vi.fn()
    render(<Backup state={original} onReplace={onReplace} />)

    await upload(user, original)
    await waitFor(() => expect(onReplace).toHaveBeenCalled())
    expect(onReplace.mock.calls[0][0]).toEqual(original)
  })
})

describe('the publishable set', () => {
  const confirmed = () =>
    emptyDraft({
      title: 'Ready',
      slug: 'ready-drop',
      channelIds: ['ch1'],
      opensAt: { value: '2026-01-01T00:00:00.000Z', confidence: 'confirmed' },
      mechanic: { value: 'web-raffle', confidence: 'confirmed' },
    })

  it('says nothing is publishable while facts are only reported', () => {
    const reported = emptyDraft({
      title: 'Not ready',
      channelIds: ['ch1'],
      opensAt: { value: '2026-01-01T00:00:00.000Z', confidence: 'reported' },
      mechanic: { value: 'web-raffle', confidence: 'confirmed' },
    })
    render(<Backup state={state({ drafts: [reported] })} onReplace={vi.fn()} />)
    expect(screen.getByText('还没有草稿把必填项确认齐。')).toBeInTheDocument()
  })

  it('exports only the confirmed drafts, in the shape the site consumes', () => {
    render(<Backup state={state({ drafts: [confirmed(), emptyDraft()] })} onReplace={vi.fn()} />)

    const payload = JSON.parse(screen.getByText(/"slug"/).textContent!)
    expect(payload).toHaveLength(1)
    expect(payload[0]).toMatchObject({ slug: 'ready-drop', mechanic: 'web-raffle' })
    // Confidence is an editorial concern; the site only ever sees the values.
    expect(payload[0].opensAt).toBe('2026-01-01T00:00:00.000Z')
  })
})
