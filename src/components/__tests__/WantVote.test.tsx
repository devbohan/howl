import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WantVote } from '../WantVote'
import { renderApp } from '../../test/render'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const show = (count = 40) =>
  renderApp(<WantVote wantId="w1" name="151 UPC" category="tcg" count={count} />)

describe('WantVote', () => {
  it('shows the current count and an invitation to add to it', () => {
    show(1240)
    expect(screen.getByText('1,240')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I want this too' })).toBeInTheDocument()
  })

  it('moves the count immediately, before the request resolves', async () => {
    let resolve: (v: unknown) => void = () => {}
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise((r) => (resolve = r))))
    const user = userEvent.setup()
    show(40)

    await user.click(screen.getByRole('button', { name: 'I want this too' }))
    expect(screen.getByText('41')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Counted' })).toBeDisabled()

    resolve({ ok: true })
  })

  it('keeps the optimistic count after the write lands', async () => {
    // Regression: reading localStorage again after voting used to report
    // "already counted" and quietly undo the +1 it had just shown.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const user = userEvent.setup()
    show(40)

    await user.click(screen.getByRole('button', { name: 'I want this too' }))
    expect(await screen.findByText('41')).toBeInTheDocument()
    expect(screen.getByText('41')).toBeInTheDocument()
  })

  it('does not add to the count for a device that already voted earlier', () => {
    localStorage.setItem('howl-wants-voted', JSON.stringify(['w1']))
    show(40)
    // That earlier vote is already inside the snapshot count.
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Counted' })).toBeDisabled()
  })

  it('cannot be voted twice in one sitting', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    show()

    const button = screen.getByRole('button', { name: 'I want this too' })
    await user.click(button)
    await user.click(button).catch(() => {})
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('still counts the vote when the request fails, and flags it as pending', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const user = userEvent.setup()
    show(40)

    await user.click(screen.getByRole('button', { name: 'I want this too' }))
    expect(await screen.findByText('41')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Counted' })).toHaveAttribute(
      'title',
      'saved on this device',
    )
  })

  it('translates', () => {
    renderApp(<WantVote wantId="w2" name="x" category="tcg" count={5} />, { locale: 'ja' })
    expect(screen.getByRole('button', { name: '自分も欲しい' })).toBeInTheDocument()
  })
})
