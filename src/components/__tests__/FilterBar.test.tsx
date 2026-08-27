import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EMPTY_FILTERS, FilterBar, type Filters } from '../FilterBar'
import { renderApp } from '../../test/render'

const setup = (filters: Filters = EMPTY_FILTERS, showCategory = true) => {
  const onChange = vi.fn()
  const utils = renderApp(
    <FilterBar filters={filters} onChange={onChange} count={7} showCategory={showCategory} />,
  )
  return { onChange, ...utils }
}

describe('FilterBar', () => {
  it('starts collapsed with only the stock toggle and the result count visible', () => {
    setup()
    expect(screen.getByText('7 drops')).toBeInTheDocument()
    expect(screen.getByText(/In stock only/)).toBeInTheDocument()
    expect(screen.queryByText('Region')).not.toBeInTheDocument()
  })

  it('expands and collapses on the toggle', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.getByText('Region')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.queryByText('Region')).not.toBeInTheDocument()
  })

  it('toggles stock-only without expanding the panel', async () => {
    const user = userEvent.setup()
    const { onChange } = setup()
    await user.click(screen.getByText(/In stock only/))
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, stockOnly: true })
  })

  it('hides the category row when the route already fixes the category', async () => {
    const user = userEvent.setup()
    setup(EMPTY_FILTERS, false)
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.queryByText('Category')).not.toBeInTheDocument()
    expect(screen.getByText('Region')).toBeInTheDocument()
  })

  it('picks a value, and clicking the active chip clears it', async () => {
    const user = userEvent.setup()
    const { onChange } = setup()
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    await user.click(screen.getByRole('button', { name: /Japan only/ }))
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, region: 'JP' })

    onChange.mockClear()
    setup({ ...EMPTY_FILTERS, region: 'JP' })
  })

  it('counts active filters in a badge and offers a reset', async () => {
    const user = userEvent.setup()
    const { onChange } = setup({ ...EMPTY_FILTERS, region: 'JP', friction: 'hard' })
    expect(screen.getByText('2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS)
  })

  it('offers no reset when nothing is filtered', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument()
  })
})
