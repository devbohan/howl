import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logo } from './Logo'

const meta = {
  title: 'Brand/Logo',
  component: Logo,
  parameters: {
    docs: {
      description: {
        component:
          'Strokes in currentColor, so the mark inherits its colour from whatever it sits in and flips with the theme by itself. Below roughly 28px tall the lettering stops reading — use the favicon silhouette instead.',
      },
    },
  },
  args: { className: 'h-24 w-auto text-fg' },
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SizeRamp: Story = {
  render: () => (
    <div className="flex items-end gap-8 text-fg">
      {['h-24', 'h-12', 'h-9', 'h-7'].map((h) => (
        <Logo key={h} className={`${h} w-auto`} />
      ))}
    </div>
  ),
}

export const OnAFill: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="rounded-lg bg-accent p-5">
        <Logo className="h-12 w-auto text-accent-ink" />
      </div>
      <div className="rounded-lg border border-line bg-surface p-5">
        <Logo className="h-12 w-auto text-fg" />
      </div>
    </div>
  ),
}

export const AsAWatermark: Story = {
  render: () => (
    <div className="relative h-40 overflow-hidden rounded-xl border border-line bg-surface p-6">
      <p className="relative text-sm text-muted">Content sits above the mark.</p>
      <Logo className="pointer-events-none absolute -right-10 -top-6 h-40 w-auto text-fg opacity-[0.06]" />
    </div>
  ),
}
