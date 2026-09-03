import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminApp from '../AdminApp'
import { loadState } from '../store'

/**
 * Drives WolfGrandma the way it is actually operated: catch something, turn it
 * into a draft, confirm the facts, research the channel. These are integration
 * tests on purpose — the risk is in the wiring between tabs, not in any one
 * component's markup.
 */
const tab = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('button', { name: new RegExp(name) }))
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the inbox', () => {
  it('opens on the inbox, because catching things is the urgent part', () => {
    render(<AdminApp />)
    expect(screen.getByPlaceholderText('原文粘贴到这里…')).toBeInTheDocument()
  })

  it('captures pasted text with no required fields', async () => {
    const user = userEvent.setup()
    render(<AdminApp />)

    await user.type(screen.getByPlaceholderText('原文粘贴到这里…'), '11/20 10:00 抽選開始')
    await user.click(screen.getByRole('button', { name: '存入' }))

    expect(screen.getByText(/11\/20 10:00 抽選開始/)).toBeInTheDocument()
    expect(loadState().leads).toHaveLength(1)
  })

  it('refuses to store an empty capture', async () => {
    const user = userEvent.setup()
    render(<AdminApp />)
    await user.click(screen.getByRole('button', { name: '存入' }))
    expect(loadState().leads).toHaveLength(0)
  })

  it('shows the patrol list, ordered by how overdue each source is', () => {
    render(<AdminApp />)
    // Seeded sources are the ones a crawler cannot reach.
    expect(screen.getAllByText(/LINE|Instagram|Discord/).length).toBeGreaterThan(0)
  })

  it('records a patrol round so the next one is scheduled from now', async () => {
    const user = userEvent.setup()
    render(<AdminApp />)

    const before = loadState().patrol.filter((p) => p.lastCheckedAt).length
    await user.click(screen.getAllByRole('button', { name: '查过了' })[0])
    expect(loadState().patrol.filter((p) => p.lastCheckedAt).length).toBe(before + 1)
  })

  it('drops a lead that turned out to be nothing', async () => {
    const user = userEvent.setup()
    render(<AdminApp />)

    await user.type(screen.getByPlaceholderText('原文粘贴到这里…'), 'noise')
    await user.click(screen.getByRole('button', { name: '存入' }))
    await user.click(screen.getByRole('button', { name: '不追' }))

    expect(loadState().leads[0].status).toBe('dropped')
  })
})

describe('promoting a lead', () => {
  it('carries the source across and lands on the verify tab', async () => {
    const user = userEvent.setup()
    render(<AdminApp />)

    await user.type(screen.getByPlaceholderText('原文粘贴到这里…'), 'a real drop')
    await user.type(screen.getByPlaceholderText('链接（可选）'), 'https://shop.example/x')
    await user.click(screen.getByRole('button', { name: '存入' }))
    await user.click(screen.getByRole('button', { name: '转为草稿' }))

    expect(screen.getByPlaceholderText('商品名')).toBeInTheDocument()
    const draft = loadState().drafts[0]
    expect(draft.sourceUrl).toBe('https://shop.example/x')
    expect(draft.leadId).toBe(loadState().leads[0].id)
  })
})

describe('verifying a draft', () => {
  const newDraft = async (user: ReturnType<typeof userEvent.setup>) => {
    render(<AdminApp />)
    await tab(user, '核对')
    await user.click(screen.getByRole('button', { name: '新建' }))
  }

  it('starts with every fact unknown', async () => {
    const user = userEvent.setup()
    await newDraft(user)
    const draft = loadState().drafts[0]
    expect(draft.opensAt.confidence).toBe('unknown')
    expect(draft.mechanic.confidence).toBe('unknown')
  })

  it('will not call a draft ready until the acted-on facts are confirmed', async () => {
    const user = userEvent.setup()
    await newDraft(user)

    await user.type(screen.getByPlaceholderText('商品名'), '限定セット')
    // Naming it is not enough — the dates and the format still block it.
    expect(screen.getAllByText(/开始时间/).length).toBeGreaterThan(0)
    expect(loadState().drafts[0].status).not.toBe('ready')
  })

  it('persists edits as they are made', async () => {
    const user = userEvent.setup()
    await newDraft(user)

    await user.type(screen.getByPlaceholderText('商品名'), 'Kept')
    expect(loadState().drafts[0].title).toBe('Kept')
  })
})

describe('researching a channel', () => {
  const newChannel = async (user: ReturnType<typeof userEvent.setup>) => {
    render(<AdminApp />)
    await tab(user, '渠道')
    await user.click(screen.getByRole('button', { name: '新建渠道' }))
  }

  it('lists what is still unanswered', async () => {
    const user = userEvent.setup()
    await newChannel(user)
    expect(screen.getByText('还没答的问题')).toBeInTheDocument()
    expect(screen.getByText(/海外发行的卡能不能付款/)).toBeInTheDocument()
  })

  it('records a policy-page finding as reported, never as confirmed', async () => {
    const user = userEvent.setup()
    await newChannel(user)

    await user.type(
      screen.getByPlaceholderText('把政策页的文字整段粘到这里…'),
      '海外で発行されたクレジットカードはご利用いただけません。',
    )
    await user.click(screen.getByRole('button', { name: '扫描' }))
    await user.click(screen.getByRole('button', { name: '记为「有说法」' }))

    // Finding a sentence is not the same as verifying it still applies.
    const channel = loadState().channels[0]
    expect(channel.acceptsForeignCard.value).toBe(false)
    expect(channel.acceptsForeignCard.confidence).toBe('reported')
    expect(channel.acceptsForeignCard.source).toContain('海外')
  })

  it('says so plainly when the pasted page answers nothing', async () => {
    const user = userEvent.setup()
    await newChannel(user)

    await user.type(screen.getByPlaceholderText('把政策页的文字整段粘到这里…'), '本日は晴天なり。')
    await user.click(screen.getByRole('button', { name: '扫描' }))
    expect(screen.getByText(/没找到相关表述/)).toBeInTheDocument()
  })
})

describe('backup', () => {
  it('offers an export, so the evening’s work is not trapped in one browser', async () => {
    const user = userEvent.setup()
    render(<AdminApp />)
    await tab(user, '备份')
    expect(screen.getByRole('button', { name: '导出 JSON' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导入并覆盖' })).toBeInTheDocument()
  })
})

describe('the compare bench', () => {
  it('takes a capture handed over through the URL fragment', async () => {
    const payload = {
      url: 'https://shop.example/item/1',
      host: 'shop.example',
      name: '限定フィギュア',
      brand: null,
      price: 12800,
      currency: 'JPY',
      availability: 'in-stock',
      gtin: null,
      sku: null,
      via: { name: 'json-ld' },
      capturedAt: new Date().toISOString(),
    }
    window.location.hash = `#capture=${encodeURIComponent(JSON.stringify(payload))}`

    const user = userEvent.setup()
    render(<AdminApp />)
    await tab(user, '比价台')

    expect(screen.getByText('shop.example')).toBeInTheDocument()
    expect(screen.getByText('限定フィギュア')).toBeInTheDocument()
    // The fragment is cleared so a reload does not double-count the capture.
    expect(window.location.hash).toBe('')
  })

  it('ignores a malformed fragment instead of breaking the page', async () => {
    window.location.hash = '#capture=not%20json'
    const user = userEvent.setup()
    render(<AdminApp />)
    await tab(user, '比价台')
    expect(screen.getByText(/还没抓到东西/)).toBeInTheDocument()
  })

  it('offers the bookmarklet as something to drag, not click', async () => {
    const user = userEvent.setup()
    render(<AdminApp />)
    await tab(user, '比价台')
    const link = screen.getByText(/抓这一页/).closest('a')!
    expect(link.getAttribute('href')).toMatch(/^javascript:/)
    expect(screen.getAllByText(/拖到书签栏/).length).toBeGreaterThan(0)
  })
})
