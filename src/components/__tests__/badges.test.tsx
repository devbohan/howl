import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { FrictionBadge } from '../FrictionBadge'
import { PremiumTag } from '../Premium'
import { renderApp } from '../../test/render'

describe('FrictionBadge', () => {
  it.each([
    ['easy', 'Easy', 'text-easy'],
    ['medium', 'Medium', 'text-medium'],
    ['hard', 'Hard', 'text-hard'],
  ] as const)('renders %s with its own tone', (friction, label, tone) => {
    const { container } = renderApp(<FrictionBadge friction={friction} />)
    expect(screen.getByText(new RegExp(label))).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain(tone)
  })

  it('hides the description by default and shows it on request', () => {
    const { container: bare } = renderApp(<FrictionBadge friction="hard" />)
    expect(bare.textContent).not.toContain('·')

    renderApp(<FrictionBadge friction="hard" withDesc />)
    expect(screen.getByText(/Local SMS/)).toBeInTheDocument()
  })

  it('translates', () => {
    renderApp(<FrictionBadge friction="easy" />, { locale: 'zh-CN' })
    expect(screen.getByText(/友好/)).toBeInTheDocument()
  })
})

describe('PremiumTag', () => {
  it('shows a plus and the over-retail wording above MSRP', () => {
    const { container } = renderApp(<PremiumTag premium={1.5} />)
    expect(container.textContent).toContain('+150%')
    expect(container.textContent).toContain('over retail')
    expect(container.firstElementChild?.className).toContain('text-hard')
  })

  it('shows a minus and the under-retail wording below MSRP', () => {
    const { container } = renderApp(<PremiumTag premium={-0.1} />)
    expect(container.textContent).toContain('−10%')
    expect(container.textContent).toContain('under retail')
    expect(container.firstElementChild?.className).toContain('text-easy')
  })

  it('treats anything within ±2% as at retail', () => {
    const { container } = renderApp(<PremiumTag premium={0.01} />)
    expect(container.textContent).toContain('±1%')
    expect(container.firstElementChild?.className).toContain('text-muted')
  })
})
