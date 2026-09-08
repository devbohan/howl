import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Want } from '../../lib/wants'

/** Fixtures: the live wantlist is legitimately empty before launch. */
const WANTS: Want[] = [
  { id: 'w1', name: '151 UPC 再販', category: 'tcg', count: 400, firstAskedAt: '2026-01-01T00:00:00.000Z', lastAskedAt: '2026-02-01T00:00:00.000Z', note: '転売価格が高すぎる' },
  { id: 'w2', name: 'KAWS 1000%', category: 'arttoy', count: 250, firstAskedAt: '2026-01-05T00:00:00.000Z', lastAskedAt: '2026-03-01T00:00:00.000Z' },
  { id: 'w3', name: 'Zelda Switch OLED', category: 'hardware', count: 10, firstAskedAt: '2026-01-09T00:00:00.000Z', lastAskedAt: '2026-04-01T00:00:00.000Z', matchedSlug: 'a-real-drop' },
]

vi.mock('../../data/wants', () => ({ WANTS }))

const { WantsPage } = await import('../WantsPage')
const { renderApp } = await import('../../test/render')

const rows = () => screen.getAllByRole('listitem')

/** The page carries two category pickers — filtering, and the new request. */
const filters = () => screen.getByRole('group', { name: 'Filter by category' })
const formCategories = () => screen.getByRole('group', { name: 'Category' })

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('WantsPage', () => {
  it('leads with the argument for asking at all', () => {
    renderApp(<WantsPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What should come back')
    expect(screen.getByText(/The count is the argument/)).toBeInTheDocument()
  })

  it('lists every request, most wanted first', () => {
    renderApp(<WantsPage />)
    expect(rows()).toHaveLength(3)
    expect(rows()[0]).toHaveTextContent('151 UPC 再販')
    expect(rows()[2]).toHaveTextContent('Zelda Switch OLED')
  })

  it('re-sorts by newest on request', async () => {
    const user = userEvent.setup()
    renderApp(<WantsPage />)
    await user.click(screen.getByRole('button', { name: 'Newest' }))
    expect(rows()[0]).toHaveTextContent('Zelda Switch OLED')
  })

  it('filters by category, and back to all', async () => {
    const user = userEvent.setup()
    renderApp(<WantsPage />)
    await user.click(within(filters()).getByRole('button', { name: 'Art Toys' }))
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('KAWS 1000%')

    await user.click(within(filters()).getByRole('button', { name: 'All' }))
    expect(rows()).toHaveLength(3)
  })

  it('invites a first request instead of showing a bare empty list', async () => {
    const user = userEvent.setup()
    renderApp(<WantsPage />)
    await user.click(within(filters()).getByRole('button', { name: 'Sneakers' }))
    expect(screen.getByText('Nothing requested yet. Be the first.')).toBeInTheDocument()
  })

  it('links a request to the drop once an editor has matched it', () => {
    renderApp(<WantsPage />)
    const matched = rows().find((r) => r.textContent?.includes('Zelda'))!
    expect(within(matched).getByRole('link')).toHaveAttribute('href', '/en/drop/a-real-drop')
  })

  it('shows the asker’s own note', () => {
    renderApp(<WantsPage />)
    expect(screen.getByText('転売価格が高すぎる')).toBeInTheDocument()
  })

  it('replaces the snapshot with live counts when the API answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ ...WANTS[0], count: 999 }],
      }),
    )
    renderApp(<WantsPage />)
    expect(await screen.findByText('999')).toBeInTheDocument()
    expect(rows()).toHaveLength(1)
  })
})

describe('the request form', () => {
  const type = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
    await user.type(screen.getByPlaceholderText(/Pokémon Card 151 UPC/), text)
  }

  it('labels both category pickers, so they are distinguishable', () => {
    renderApp(<WantsPage />)
    expect(filters()).toBeInTheDocument()
    expect(formCategories()).toBeInTheDocument()
  })

  it('will not submit an empty or one-character request', async () => {
    const user = userEvent.setup()
    renderApp(<WantsPage />)
    const submit = screen.getByRole('button', { name: 'Add my request' })
    expect(submit).toBeDisabled()

    await type(user, 'x')
    expect(submit).toBeDisabled()

    await type(user, 'y')
    expect(submit).toBeEnabled()
  })

  it('rejects a request that is just a link', async () => {
    const user = userEvent.setup()
    renderApp(<WantsPage />)
    await type(user, 'https://spam.example/buy')
    expect(screen.getByRole('button', { name: 'Add my request' })).toBeDisabled()
  })

  it('recognises an existing request and shows its count instead of duplicating', async () => {
    const user = userEvent.setup()
    renderApp(<WantsPage />)
    // Same thing, differently written — normalisation should collapse them.
    await type(user, '151upc　再販')
    const form = screen.getByRole('button', { name: 'Add my request' }).closest('form')!
    expect(within(form).getByText(/151 UPC 再販/)).toBeInTheDocument()
    expect(within(form).getByText(/400/)).toBeInTheDocument()
  })

  it('sends a vote for the duplicate rather than a new entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderApp(<WantsPage />)

    await type(user, '151 UPC 再販')
    await user.click(screen.getByRole('button', { name: 'Add my request' }))

    const posts = fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST')
    expect(JSON.parse(posts[0][1].body)).toMatchObject({ wantId: 'w1' })
  })

  it('confirms a new request and clears the field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const user = userEvent.setup()
    renderApp(<WantsPage />)

    await type(user, 'Something brand new')
    await user.click(screen.getByRole('button', { name: 'Add my request' }))

    expect(await screen.findByText('Added. Your request is counted.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Pokémon Card 151 UPC/)).toHaveValue('')
  })

  it('says so honestly when the request could not be sent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const user = userEvent.setup()
    renderApp(<WantsPage />)

    await type(user, 'Something brand new')
    await user.click(screen.getByRole('button', { name: 'Add my request' }))

    expect(await screen.findByText(/it is saved on this device and will retry/)).toBeInTheDocument()
  })
})
