import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FactField, textInput } from '../FactField'
import { useState } from 'react'
import { unknownFact, type Fact } from '../types'

/** A stateful harness, so typing behaves the way it does in the real editor. */
function Controlled<T extends string | boolean>({
  initial,
  onEach,
  input,
}: {
  initial: Fact<T>
  onEach: (next: Fact<T>) => void
  input?: (value: T | null, set: (value: T | null) => void) => React.ReactNode
}) {
  const [fact, setFact] = useState(initial)
  return (
    <FactField
      label="字段"
      fact={fact}
      onChange={(next) => {
        setFact(next)
        onEach(next)
      }}
      input={input}
    />
  )
}

const setup = (fact: Fact<boolean> = unknownFact<boolean>()) => {
  const onChange = vi.fn()
  render(<FactField label="全球直邮" fact={fact} onChange={onChange} />)
  return { onChange }
}

describe('FactField', () => {
  it('offers all four confidence levels', () => {
    setup()
    for (const label of ['未知', '有说法', '已确认', '存疑']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('setting a value does not imply any confidence in it', async () => {
    const user = userEvent.setup()
    const { onChange } = setup()

    await user.click(screen.getByRole('button', { name: '是' }))

    // The whole design rests on this: an extractor can fill the box, only a
    // person can confirm it, so the two must move independently.
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: true, confidence: 'unknown' }))
  })

  it('stamps the time only when a human confirms', async () => {
    const user = userEvent.setup()
    const { onChange } = setup()

    await user.click(screen.getByRole('button', { name: '已确认' }))
    const confirmed = onChange.mock.calls[0][0]
    expect(confirmed.confidence).toBe('confirmed')
    expect(typeof confirmed.checkedAt).toBe('string')

    onChange.mockClear()
    await user.click(screen.getByRole('button', { name: '有说法' }))
    expect(onChange.mock.calls[0][0].checkedAt).toBeUndefined()
  })

  it('keeps an earlier check time when dropping back from confirmed', async () => {
    const user = userEvent.setup()
    const checkedAt = '2026-01-01T00:00:00.000Z'
    const { onChange } = setup({ value: true, confidence: 'confirmed', checkedAt })

    await user.click(screen.getByRole('button', { name: '存疑' }))
    expect(onChange.mock.calls[0][0]).toMatchObject({ confidence: 'disputed', checkedAt })
  })

  it('shows when a confirmed fact was checked', () => {
    setup({ value: true, confidence: 'confirmed', checkedAt: '2026-03-04T00:00:00.000Z' })
    // The stamp carries a date; the button next to it is just the word.
    expect(screen.getByText(/\d+.*确认/)).toBeInTheDocument()
  })

  it('does not claim a check date for a fact nobody confirmed', () => {
    setup({ value: true, confidence: 'reported', checkedAt: '2026-03-04T00:00:00.000Z' })
    expect(screen.queryByText(/\d+.*确认/)).not.toBeInTheDocument()
  })

  it('records where a claim came from', async () => {
    const user = userEvent.setup()
    const onEach = vi.fn()
    render(<Controlled initial={unknownFact<boolean>()} onEach={onEach} />)

    await user.type(screen.getByPlaceholderText(/来源/), 'LINE 公式')
    expect(onEach).toHaveBeenLastCalledWith(expect.objectContaining({ source: 'LINE 公式' }))
  })

  it('accepts a custom value editor for non-boolean facts', async () => {
    const user = userEvent.setup()
    const onEach = vi.fn()
    render(
      <Controlled
        initial={unknownFact<string>()}
        onEach={onEach}
        input={(value, set) => textInput(value, set, '写点什么')}
      />,
    )
    await user.type(screen.getByPlaceholderText('写点什么'), '関税 10%')
    expect(onEach).toHaveBeenLastCalledWith(expect.objectContaining({ value: '関税 10%' }))
  })

  it('turns an emptied text field back into null, not an empty string', async () => {
    const user = userEvent.setup()
    const onEach = vi.fn()
    render(
      <Controlled
        initial={{ value: 'a', confidence: 'reported' } as Fact<string>}
        onEach={onEach}
        input={(value, set) => textInput(value, set)}
      />,
    )
    await user.clear(screen.getByDisplayValue('a'))
    expect(onEach).toHaveBeenLastCalledWith(expect.objectContaining({ value: null }))
  })
})
