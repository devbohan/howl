import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { EMPTY_FILTERS, FilterBar, type Filters } from './FilterBar'

const meta = {
  title: 'Controls/FilterBar',
  component: FilterBar,
  parameters: {
    docs: {
      description: {
        component:
          'Collapsed by default so a category page opens on the drops, not on the controls. Only the in-stock toggle stays out, because it is the one filter people reach for constantly.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[720px]">
        <Story />
      </div>
    ),
  ],
  args: { filters: EMPTY_FILTERS, count: 21, showCategory: true, onChange: () => {} },
} satisfies Meta<typeof FilterBar>

export default meta
type Story = StoryObj<typeof meta>

/** Interactive: the story owns the filter state so the chips really respond. */
export const Interactive: Story = {
  render: (args) => {
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
    return <FilterBar {...args} filters={filters} onChange={setFilters} />
  },
}

export const OnACategoryPage: Story = {
  args: { showCategory: false, count: 5 },
}

export const WithActiveFilters: Story = {
  args: { filters: { ...EMPTY_FILTERS, region: 'JP', friction: 'hard' }, count: 2 },
}

export const StockOnly: Story = {
  args: { filters: { ...EMPTY_FILTERS, stockOnly: true }, count: 8 },
}
