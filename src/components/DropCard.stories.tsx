import type { Meta, StoryObj } from '@storybook/react-vite'
import { DropCard } from './DropCard'
import { makeChannel, makeDrop, at } from '../test/fixtures'

const meta = {
  title: 'Cards/DropCard',
  component: DropCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[340px]">
        <Story />
      </div>
    ),
  ],
  args: { drop: makeDrop(), now: Date.now(), currency: 'JPY' },
} satisfies Meta<typeof DropCard>

export default meta
type Story = StoryObj<typeof meta>

export const Upcoming: Story = {}

export const Live: Story = {
  args: { drop: makeDrop({ opensAt: at(-3_600_000), closesAt: at(5 * 3_600_000), hot: true }) },
}

export const ClosingWithinTheHour: Story = {
  args: { drop: makeDrop({ opensAt: at(-9 * 3_600_000), closesAt: at(18 * 60_000) }) },
}

export const InStockAtAPremium: Story = {
  args: {
    drop: makeDrop({
      opensAt: at(-9 * 86_400_000),
      closesAt: at(-8 * 86_400_000),
      price: 24_200,
      channels: [
        makeChannel({ name: 'StockX', market: 'resale', stock: 'in-stock', askPrice: 324_000, status: 'sold-out' }),
      ],
    }),
  },
}

export const InStockBelowRetail: Story = {
  args: {
    drop: makeDrop({
      opensAt: at(-9 * 86_400_000),
      closesAt: at(-8 * 86_400_000),
      price: 7_800,
      channels: [makeChannel({ name: 'AmiAmi', stock: 'in-stock', askPrice: 7_020, status: 'open' })],
    }),
  },
}

export const Ended: Story = {
  args: { drop: makeDrop({ opensAt: at(-30 * 86_400_000), closesAt: at(-29 * 86_400_000) }) },
}

export const FreeEntry: Story = { args: { drop: makeDrop({ price: 0, mechanic: 'offline-ticket' }) } }

export const ConvertedToUsd: Story = { args: { currency: 'USD' } }
