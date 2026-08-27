import type { Meta, StoryObj } from '@storybook/react-vite'
import { PremiumTag } from './Premium'

const meta = {
  title: 'Signals/PremiumTag',
  component: PremiumTag,
  parameters: {
    docs: {
      description: {
        component:
          'Resale premium against MSRP. Below retail turns green — for mass-produced figures that is common, and it is exactly the thing a buyer wants to notice.',
      },
    },
  },
  args: { premium: 1.5, size: 'sm' },
} satisfies Meta<typeof PremiumTag>

export default meta
type Story = StoryObj<typeof meta>

export const HugeMarkup: Story = { args: { premium: 12.35 } }
export const ModerateMarkup: Story = { args: { premium: 0.32 } }
export const AtRetail: Story = { args: { premium: 0.004 } }
export const BelowRetail: Story = { args: { premium: -0.1 } }
export const Large: Story = { args: { premium: 1.5, size: 'md' } }
