import type { Meta, StoryObj } from '@storybook/react-vite'
import { Countdown, CountdownLabel } from './Countdown'
import type { DropState } from '../lib/schedule'

const state = (overrides: Partial<DropState> = {}): DropState => ({
  phase: 'upcoming',
  target: new Date().toISOString(),
  msLeft: 0,
  urgent: false,
  ...overrides,
})

const meta = {
  title: 'Signals/Countdown',
  component: Countdown,
  parameters: {
    docs: {
      description: {
        component:
          'Seconds are dropped once a day or more is left, because at that range they are noise. Under an hour the whole thing turns red.',
      },
    },
  },
  args: { state: state({ msLeft: 3 * 3_600_000 }), size: 'md' },
} satisfies Meta<typeof Countdown>

export default meta
type Story = StoryObj<typeof meta>

export const Upcoming: Story = { args: { state: state({ msLeft: 3 * 3_600_000 + 240_000 }) } }
export const DaysOut: Story = { args: { state: state({ msLeft: 6 * 86_400_000 + 5 * 3_600_000 }) } }
export const Open: Story = { args: { state: state({ phase: 'open', msLeft: 5 * 3_600_000 }) } }
export const ClosingSoon: Story = {
  args: { state: state({ phase: 'open', msLeft: 12 * 60_000, urgent: true }) },
}
export const InStock: Story = { args: { state: state({ phase: 'in-stock' }) } }
export const Ended: Story = { args: { state: state({ phase: 'ended' }) } }
export const Large: Story = {
  args: { state: state({ phase: 'open', msLeft: 2 * 3_600_000 }), size: 'lg' },
}

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1">
      <CountdownLabel state={args.state} />
      <Countdown {...args} />
    </div>
  ),
  args: { state: state({ phase: 'open', msLeft: 40 * 60_000, urgent: true }), size: 'lg' },
}
