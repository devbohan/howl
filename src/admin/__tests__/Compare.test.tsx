import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Compare, type CaptureRecord } from '../Compare'
import { EMPTY, emptyChannel, emptyDraft } from '../store'
import type { AdminState } from '../types'

const capture = (over: Partial<CaptureRecord> = {}): CaptureRecord => ({
  id: 'cap1',
  url: 'https://shop.example/item/1',
  host: 'shop.example',
  name: '限定セット',
  brand: null,
  price: 12_800,
  currency: 'JPY',
  availability: 'in-stock',
  gtin: null,
  sku: null,
  via: { name: 'json-ld', price: 'json-ld' },
  capturedAt: '2026-01-01T00:00:00.000Z',
  ...over,
})

function setup(captures: CaptureRecord[] = [], state: AdminState = { ...EMPTY, drafts: [emptyDraft({ title: 'Target' })] }) {
  const update = vi.fn()
  const setCaptures = vi.fn()
  const utils = render(
    <Compare state={state} update={update} captures={captures} setCaptures={setCaptures} />,
  )
  return { update, setCaptures, state, ...utils }
}

let opened: string[] = []

beforeEach(() => {
  opened = []
  vi.stubGlobal(
    'open',
    vi.fn((url: string) => {
      opened.push(url)
      return {} as Window
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('opening a round of shops', () => {
  it('will not open anything without a query', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /全部打开/ }))
    expect(opened).toEqual([])
  })

  it('opens every shop with the product pre-searched', async () => {
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByPlaceholderText(/商品名/), 'ポケモンカード 151')
    await user.click(screen.getByRole('button', { name: /全部打开/ }))

    expect(opened.length).toBeGreaterThan(4)
    for (const url of opened) {
      expect(url).toMatch(/^https:\/\//)
      expect(url).toContain(encodeURIComponent('ポケモンカード 151'))
    }
  })

  it('can open one shop at a time', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByPlaceholderText(/商品名/), 'x')
    await user.click(screen.getByRole('button', { name: '駿河屋' }))
    expect(opened).toHaveLength(1)
    expect(opened[0]).toContain('suruga-ya')
  })
})

describe('the comparison table', () => {
  it('invites you to start when nothing has been captured', () => {
    setup()
    expect(screen.getByText(/还没抓到东西/)).toBeInTheDocument()
  })

  it('shows price, stock and how complete each capture is', () => {
    setup([capture()])
    expect(screen.getByText('shop.example')).toBeInTheDocument()
    expect(screen.getByText('in-stock')).toBeInTheDocument()
    expect(screen.getByText('4/4')).toBeInTheDocument()
  })

  it('marks the cheapest after converting currencies', () => {
    setup([
      capture({ id: 'a', host: 'jp.example', price: 20_000, currency: 'JPY' }),
      capture({ id: 'b', host: 'us.example', price: 100, currency: 'USD' }),
    ])
    // 100 USD is under 20,000 JPY at the app's rate, so the USD row wins.
    const cheapest = screen.getByText('最低').closest('tr')!
    expect(cheapest).toHaveTextContent('us.example')
  })

  it('ignores a capture with no price when picking the cheapest', () => {
    setup([
      capture({ id: 'a', host: 'unknown.example', price: null, currency: null }),
      capture({ id: 'b', host: 'priced.example', price: 9_000, currency: 'JPY' }),
    ])
    expect(screen.getByText('最低').closest('tr')).toHaveTextContent('priced.example')
  })

  it('says a field is unknown rather than guessing it', () => {
    setup([capture({ availability: null, price: null, currency: null })])
    expect(screen.getByText('未知')).toBeInTheDocument()
  })
})

describe('attaching a capture', () => {
  it('cannot attach until a draft is chosen', () => {
    setup([capture()])
    expect(screen.getByRole('button', { name: /挂上并建渠道/ })).toBeDisabled()
  })

  it('attaches to the chosen draft and opens a channel profile to research', async () => {
    const user = userEvent.setup()
    const { update, setCaptures, state } = setup([capture()])

    await user.selectOptions(screen.getByRole('combobox'), state.drafts[0].id)
    await user.click(screen.getByRole('button', { name: /挂上并建渠道/ }))

    expect(setCaptures.mock.calls[0][0][0]).toMatchObject({ draftId: state.drafts[0].id })

    // The channel is what carries friction, so capturing a price has to create
    // one — otherwise the questions that matter never get asked.
    const next = update.mock.calls[0][0](state)
    expect(next.channels).toHaveLength(1)
    expect(next.channels[0].name).toBe('shop.example')
    expect(next.channels[0].acceptsForeignCard.confidence).toBe('unknown')
  })

  it('does not create a second profile for a shop already researched', async () => {
    const user = userEvent.setup()
    const existing = { ...emptyChannel('shop.example'), url: 'https://shop.example' }
    const state: AdminState = { ...EMPTY, drafts: [emptyDraft({ title: 'T' })], channels: [existing] }
    const { update } = setup([capture()], state)

    await user.selectOptions(screen.getByRole('combobox'), state.drafts[0].id)
    await user.click(screen.getByRole('button', { name: /挂上并建渠道/ }))

    expect(update).not.toHaveBeenCalled()
  })

  it('shows an already-attached capture as attached', async () => {
    const user = userEvent.setup()
    const draft = emptyDraft({ title: 'Target' })
    const state: AdminState = { ...EMPTY, drafts: [draft] }
    setup([capture({ draftId: draft.id })], state)

    // The bench is scoped to one draft, so pick the one it belongs to.
    await user.selectOptions(screen.getByRole('combobox'), draft.id)
    expect(screen.getByText('已挂')).toBeInTheDocument()
  })

  it('hides a capture belonging to a different draft', async () => {
    const user = userEvent.setup()
    const mine = emptyDraft({ title: 'Mine' })
    const other = emptyDraft({ title: 'Other' })
    setup([capture({ draftId: other.id })], { ...EMPTY, drafts: [mine, other] })

    await user.selectOptions(screen.getByRole('combobox'), mine.id)
    expect(screen.getByText(/还没抓到东西/)).toBeInTheDocument()
  })
})

describe('clearing', () => {
  it('drops every capture on request', async () => {
    const user = userEvent.setup()
    const { setCaptures } = setup([capture()])
    await user.click(screen.getByRole('button', { name: '清空' }))
    expect(setCaptures).toHaveBeenCalledWith([])
  })
})

describe('what the bench cannot do', () => {
  it('says outright that friction is not capturable', () => {
    setup([capture()])
    expect(screen.getByText(/海淘难度抓不到/)).toBeInTheDocument()
  })
})
