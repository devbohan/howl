import type { Meta, StoryObj } from '@storybook/react-vite'
import { MediaLinks } from './MediaLinks'
import { makeMedia } from '../test/fixtures'

const meta = {
  title: 'Coverage/MediaLinks',
  component: MediaLinks,
  parameters: {
    docs: {
      description: {
        component:
          'Third-party coverage on a drop page. Titles are localised gloss, not the original video title, so a reader can tell what a Japanese video is about before opening it.',
      },
    },
  },
  args: { items: [makeMedia()] },
} satisfies Meta<typeof MediaLinks>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {}

export const MixedSources: Story = {
  args: {
    items: [
      makeMedia({ id: 'a', featured: true }),
      makeMedia({
        id: 'b',
        lang: 'ja',
        platform: 'youtube',
        source: '@atmos_tokyo_ch',
        audience: '38.4万',
        duration: '8:02',
        title: { en: 'Sizing and materials, straight from the Tokyo floor', ja: '東京店頭から：サイズ感と素材をチェック' },
      }),
      makeMedia({
        id: 'c',
        kind: 'article',
        platform: 'web',
        source: 'Hypebeast',
        audience: undefined,
        duration: undefined,
        title: { en: 'Official release info and every confirmed stockist' },
      }),
      makeMedia({
        id: 'd',
        kind: 'social',
        platform: 'x',
        source: '@snkr_alerts',
        audience: '412K',
        duration: undefined,
        title: { en: 'Live thread: raffles as they open' },
      }),
    ],
  },
}

export const Empty: Story = {
  args: { items: [] },
  parameters: {
    docs: { description: { story: 'Renders nothing at all rather than an empty heading.' } },
  },
}
