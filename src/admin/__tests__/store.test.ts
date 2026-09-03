import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  EMPTY,
  emptyChannel,
  emptyDraft,
  loadState,
  newId,
  replaceById,
  saveState,
  useAdminState,
} from '../store'

const KEY = 'wolfgrandma'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadState', () => {
  it('seeds the patrol list on a first visit, so the tool is not blank', () => {
    const state = loadState()
    expect(state.patrol.length).toBeGreaterThan(0)
    expect(state.leads).toEqual([])
    expect(state.drafts).toEqual([])
  })

  it('seeds only sources that genuinely cannot be crawled', () => {
    const kinds = new Set(loadState().patrol.map((p) => p.kind))
    // A crawlable source belongs in scripts/sources.json, not on a human's
    // rounds — seeding one here would spend the operator's time for nothing.
    expect(kinds.has('instagram') || kinds.has('line') || kinds.has('discord')).toBe(true)
  })

  it('round-trips what was saved', () => {
    const state = { ...EMPTY, drafts: [emptyDraft({ title: 'Kept' })] }
    saveState(state)
    expect(loadState().drafts[0].title).toBe('Kept')
  })

  it('fills in a key the stored shape is missing rather than crashing', () => {
    localStorage.setItem(KEY, JSON.stringify({ leads: [{ id: 'l1' }] }))
    const state = loadState()
    expect(state.leads).toHaveLength(1)
    expect(state.drafts).toEqual([])
    expect(state.channels).toEqual([])
    expect(state.patrol).toEqual([])
  })

  it('falls back to empty on corrupt storage instead of throwing', () => {
    localStorage.setItem(KEY, 'not json at all')
    expect(loadState()).toEqual(EMPTY)
  })

  it('falls back to empty when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadState()).toEqual(EMPTY)
  })
})

describe('saveState', () => {
  it('reports success and failure honestly', () => {
    expect(saveState(EMPTY)).toBe(true)

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(saveState(EMPTY)).toBe(false)
  })
})

describe('newId', () => {
  it('keeps the prefix and does not collide in bulk', () => {
    const ids = Array.from({ length: 500 }, () => newId('ch'))
    expect(ids.every((id) => id.startsWith('ch_'))).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('blank records claim nothing', () => {
  it('gives a new channel unknown confidence on every friction field', () => {
    const channel = emptyChannel('PCO')
    expect(channel.name).toBe('PCO')
    for (const key of [
      'shipsWorldwide',
      'acceptsForeignCard',
      'requiresLocalPhone',
      'requiresLocalId',
      'purchaseHistoryGated',
      'proxies',
      'dutyNote',
      'selfProxyViable',
    ] as const) {
      expect(channel[key], key).toMatchObject({ value: null, confidence: 'unknown' })
    }
  })

  it('gives a new draft unknown dates and no channels', () => {
    const draft = emptyDraft()
    expect(draft.opensAt.confidence).toBe('unknown')
    expect(draft.channelIds).toEqual([])
    expect(draft.status).toBe('draft')
  })

  it('lets overrides through', () => {
    expect(emptyDraft({ title: 'Set', category: 'tcg' })).toMatchObject({ title: 'Set', category: 'tcg' })
  })
})

describe('replaceById', () => {
  it('appends an item that is not in the list', () => {
    expect(replaceById([{ id: 'a' }], { id: 'b' })).toEqual([{ id: 'a' }, { id: 'b' }])
  })

  it('replaces in place, preserving order', () => {
    const out = replaceById([{ id: 'a' }, { id: 'b' }, { id: 'c' }], { id: 'b', extra: 1 } as { id: string })
    expect(out.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(out[1]).toMatchObject({ extra: 1 })
  })

  it('does not mutate the input', () => {
    const input = [{ id: 'a' }]
    replaceById(input, { id: 'b' })
    expect(input).toHaveLength(1)
  })
})

describe('useAdminState', () => {
  it('persists every change, so a closed tab does not lose the evening', () => {
    const { result } = renderHook(() => useAdminState())

    act(() => {
      result.current.update((prev) => ({ ...prev, drafts: [emptyDraft({ title: 'Survives' })] }))
    })

    expect(result.current.state.drafts[0].title).toBe('Survives')
    expect(JSON.parse(localStorage.getItem(KEY)!).drafts[0].title).toBe('Survives')
  })

  it('reloads what a previous session stored', () => {
    saveState({ ...EMPTY, channels: [emptyChannel('Earlier')] })
    const { result } = renderHook(() => useAdminState())
    expect(result.current.state.channels[0].name).toBe('Earlier')
  })
})
