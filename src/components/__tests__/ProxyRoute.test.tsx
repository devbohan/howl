import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProxyRoute } from '../ProxyRoute'
import { makeChannel, makeDrop } from '../../test/fixtures'
import { renderApp } from '../../test/render'

const drop = (shipsWorldwide: boolean, acceptsForeignCard: boolean) =>
  makeDrop({ channels: [makeChannel({ shipsWorldwide, acceptsForeignCard })] })

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

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

describe('proxy demand tally', () => {
  const blocked = () => drop(false, false)

  it('asks the question only where someone is actually stuck', () => {
    const { container } = renderApp(<ProxyRoute drop={drop(true, true)} />)
    expect(container.textContent ?? '').not.toContain('Still stuck')
  })

  it('offers to be counted, and says plainly it is not a service', () => {
    renderApp(<ProxyRoute drop={blocked()} />)
    expect(screen.getByText(/Still stuck/)).toBeInTheDocument()
    expect(screen.getByText(/not a service, and nothing is promised/)).toBeInTheDocument()
  })

  it('collects no contact details — there is no input to fill in', () => {
    const { container } = renderApp(<ProxyRoute drop={blocked()} />)
    expect(container.querySelectorAll('input, textarea, form')).toHaveLength(0)
  })

  it('confirms the count and says nothing else will happen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const user = userEvent.setup()
    renderApp(<ProxyRoute drop={blocked()} />)

    await user.click(screen.getByRole('button', { name: /would want someone to buy/ }))
    expect(await screen.findByText(/we collect no contact details/)).toBeInTheDocument()
  })
})
