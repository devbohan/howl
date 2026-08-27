import type { Meta, StoryObj } from '@storybook/react-vite'
import { CreatorFeed } from './CreatorFeed'

const meta = {
  title: 'Coverage/CreatorFeed',
  component: CreatorFeed,
  parameters: {
    docs: {
      description: {
        component:
          'Genre-level creators and outlets — the channels worth following for a whole category, as opposed to the per-drop coverage on an item page.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[520px]">
        <Story />
      </div>
    ),
  ],
  args: { category: 'sneakers' },
} satisfies Meta<typeof CreatorFeed>

export default meta
type Story = StoryObj<typeof meta>

export const Sneakers: Story = {}
export const TradingCards: Story = { args: { category: 'tcg' } }
export const Figures: Story = { args: { category: 'figure' } }
export const Goods: Story = { args: { category: 'goods' } }
