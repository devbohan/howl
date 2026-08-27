import type { Meta, StoryObj } from '@storybook/react-vite'
import { FrictionBadge } from './FrictionBadge'

const meta = {
  title: 'Signals/FrictionBadge',
  component: FrictionBadge,
  parameters: {
    docs: {
      description: {
        component:
          'The Friction Index in one chip: how hard it is to actually buy this from abroad. Green means a foreign card and worldwide shipping both work; red means a local phone number and a local card are required.',
      },
    },
  },
  args: { friction: 'medium', withDesc: false },
} satisfies Meta<typeof FrictionBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Easy: Story = { args: { friction: 'easy' } }
export const Medium: Story = { args: { friction: 'medium' } }
export const Hard: Story = { args: { friction: 'hard' } }

export const WithDescription: Story = {
  args: { friction: 'hard', withDesc: true },
  parameters: {
    docs: { description: { story: 'Detail-page variant — spells out why it is hard.' } },
  },
}

export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <FrictionBadge friction="easy" withDesc />
      <FrictionBadge friction="medium" withDesc />
      <FrictionBadge friction="hard" withDesc />
    </div>
  ),
}
