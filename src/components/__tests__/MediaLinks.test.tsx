import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { MediaLinks } from '../MediaLinks'
import { renderApp } from '../../test/render'
import type { MediaLink } from '../../lib/types'

const link = (overrides: Partial<MediaLink> = {}): MediaLink => ({
  id: 'm1',
  kind: 'video',
  platform: 'youtube',
  source: '@tester',
  title: { en: 'English title', ja: '日本語タイトル' },
  url: 'https://example.test/video',
  lang: 'en',
  ...overrides,
})

describe('MediaLinks', () => {
  it('renders nothing when there is no coverage', () => {
    const { container } = renderApp(<MediaLinks items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('heads the section and carries the disclaimer', () => {
    renderApp(<MediaLinks items={[link()]} />)
    expect(screen.getByText('Unboxings & coverage')).toBeInTheDocument()
    expect(screen.getByText(/neither owns nor endorses/)).toBeInTheDocument()
  })

  it('puts the featured pick first regardless of input order', () => {
    const { container } = renderApp(
      <MediaLinks
        items={[
          link({ id: 'a', title: { en: 'first in' } }),
          link({ id: 'b', title: { en: 'the pick' }, featured: true }),
        ]}
      />,
    )
    const titles = Array.from(container.querySelectorAll('a p')).map((n) => n.textContent)
    expect(titles[0]).toBe('the pick')
    expect(screen.getByText('Start here')).toBeInTheDocument()
  })

  it('prefers the reader’s own language after featured', () => {
    const { container } = renderApp(
      <MediaLinks
        items={[link({ id: 'a', lang: 'en', title: { en: 'english one' } }), link({ id: 'b', lang: 'ja', title: { en: 'japanese one' } })]}
      />,
      { locale: 'ja' },
    )
    const titles = Array.from(container.querySelectorAll('a p')).map((n) => n.textContent)
    expect(titles[0]).toBe('japanese one')
  })

  it('flags a foreign-language item but not a matching one', () => {
    renderApp(<MediaLinks items={[link({ lang: 'ja' })]} />, { locale: 'en' })
    expect(screen.getByText('日本語')).toBeInTheDocument()
  })

  it('shows the duration only for videos', () => {
    renderApp(
      <MediaLinks items={[link({ id: 'v', duration: '12:04' }), link({ id: 'a', kind: 'article', platform: 'web' })]} />,
    )
    expect(screen.getByText('12:04')).toBeInTheDocument()
    expect(screen.getByText('Article')).toBeInTheDocument()
  })

  it('links out safely', () => {
    const { container } = renderApp(<MediaLinks items={[link()]} />)
    const anchor = container.querySelector('a')!
    expect(anchor).toHaveAttribute('href', 'https://example.test/video')
    expect(anchor).toHaveAttribute('target', '_blank')
    expect(anchor.getAttribute('rel')).toContain('nofollow')
  })
})
