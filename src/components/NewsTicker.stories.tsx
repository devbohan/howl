import type { Meta, StoryObj } from '@storybook/react-vite'
import { NewsTicker } from './NewsTicker'

const meta = {
  title: 'Coverage/NewsTicker',
  component: NewsTicker,
  parameters: {
    docs: {
      description: {
        component:
          'Per-category ticker. Rows are ranked by combined on-site and off-site heat, capped at 50, and the top three carry a flame. Reads from the shared news fixture, so each category shows real variety.',
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
} satisfies Meta<typeof NewsTicker>

export default meta
type Story = StoryObj<typeof meta>

export const Sneakers: Story = {}
export const TradingCards: Story = { args: { category: 'tcg' } }
export const ArtToys: Story = { args: { category: 'arttoy' } }
export const Hardware: Story = { args: { category: 'hardware' } }
