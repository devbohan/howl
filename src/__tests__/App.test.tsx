import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { LOCALES } from '../lib/types'

const show = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )

describe('App routing', () => {
  it.each(LOCALES)('mounts the portal at /%s', async (locale) => {
    show(`/${locale}`)
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument())
  })

  it('redirects the bare root to a locale', async () => {
    show('/')
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument())
  })

  it('redirects an unknown locale rather than rendering a broken shell', async () => {
    show('/klingon')
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument())
  })

  it('redirects an unknown path inside a valid locale back to the portal', async () => {
    show('/en/nonsense/deep')
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument())
  })

  it('reflects the locale on the html element for screen readers and search engines', async () => {
    show('/ja')
    await waitFor(() => expect(document.documentElement.lang).toBe('ja'))
  })

  it('defaults the currency to the one that locale prices in', async () => {
    show('/ja')
    await waitFor(() => expect((screen.getByLabelText('Currency') as HTMLSelectElement).value).toBe('JPY'))
  })

  it('renders the compliance disclaimer on every page', async () => {
    show('/en')
    await waitFor(() => expect(screen.getByText(/never enter raffles or handle payments/)).toBeInTheDocument())
  })
})
