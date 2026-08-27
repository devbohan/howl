import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { ProxyRoute } from '../ProxyRoute'
import { makeChannel, makeDrop } from '../../test/fixtures'
import { renderApp } from '../../test/render'

const drop = (shipsWorldwide: boolean, acceptsForeignCard: boolean) =>
  makeDrop({ channels: [makeChannel({ shipsWorldwide, acceptsForeignCard })] })

describe('ProxyRoute', () => {
  it('stays out of the way when the drop can already be bought from abroad', () => {
    const { container } = renderApp(<ProxyRoute drop={drop(true, true)} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('appears when nothing ships out, and explains which blocker it is', () => {
    renderApp(<ProxyRoute drop={drop(false, true)} />)
    expect(screen.getByText(/No tracked seller ships outside/)).toBeInTheDocument()
  })

  it('names the payment blocker when that is the real problem', () => {
    renderApp(<ProxyRoute drop={drop(true, false)} />)
    expect(screen.getByText(/No tracked seller accepts a foreign card/)).toBeInTheDocument()
  })

  it('offers no forwarder once payment is blocked — one would not help', () => {
    const { container } = renderApp(<ProxyRoute drop={drop(false, false)} />)
    const text = container.textContent ?? ''
    expect(text).toContain('Proxy buyer')
    expect(text).not.toContain('Forwarder')
  })

  it('offers forwarders when shipping is the only blocker', () => {
    const { container } = renderApp(<ProxyRoute drop={drop(false, true)} />)
    expect(container.textContent).toContain('Forwarder')
  })

  it('tracks these clicks separately from store clicks', () => {
    const { container } = renderApp(<ProxyRoute drop={drop(false, false)} />)
    const links = container.querySelectorAll('a[data-outbound="proxy"]')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link.getAttribute('rel')).toContain('sponsored')
      expect(link.getAttribute('href')).toMatch(/^https:\/\//)
    }
  })

  it('pre-searches the product name at the proxy', () => {
    const named = makeDrop({
      title: { en: 'Pokemon Card 151' },
      channels: [makeChannel({ shipsWorldwide: false, acceptsForeignCard: false })],
    })
    const { container } = renderApp(<ProxyRoute drop={named} />)
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '')
    expect(hrefs.some((h) => h.includes(encodeURIComponent('Pokemon Card 151')))).toBe(true)
  })

  it('says plainly that these are other people’s services', () => {
    renderApp(<ProxyRoute drop={drop(false, false)} />)
    expect(screen.getByText(/independent services, not ours/)).toBeInTheDocument()
  })

  it('translates', () => {
    renderApp(<ProxyRoute drop={drop(false, false)} />, { locale: 'zh-CN' })
    expect(screen.getByText('这件你没法直接买')).toBeInTheDocument()
    expect(screen.getAllByText(/代购/).length).toBeGreaterThan(0)
  })
})
