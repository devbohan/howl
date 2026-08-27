import type { Meta, StoryObj } from '@storybook/react-vite'
import { VerticalMarquee } from './VerticalMarquee'

const rows = Array.from({ length: 8 }, (_, i) => (
  <span key={i} className="flex h-9 items-center px-3.5 text-[12.5px] text-muted">
    Row {i + 1} — scrolls on its own, pauses on hover, scrolls by hand
  </span>
))

const meta = {
  title: 'Primitives/VerticalMarquee',
  component: VerticalMarquee,
  parameters: {
    docs: {
      description: {
        component:
          'Driven by scrollTop rather than a CSS transform, so the panel is a real scroll container: it has a working scrollbar and the wheel takes over mid-animation. Under prefers-reduced-motion it stops moving and drops the duplicate copy.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[420px] overflow-hidden rounded-lg border border-line bg-surface">
        <Story />
      </div>
    ),
  ],
  args: { children: rows, className: 'h-36', speed: 14 },
} satisfies Meta<typeof VerticalMarquee>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Fast: Story = { args: { speed: 60 } }
export const Tall: Story = { args: { className: 'h-64' } }
