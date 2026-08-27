import { useCallback, useEffect, useState } from 'react'
import type { AdminState, ChannelProfile, DropDraft, Lead, PatrolSource } from './types'
import { unknownFact } from './types'

const KEY = 'wolfgrandma'

/**
 * localStorage for now. Everything is shaped like the D1 tables it will become,
 * and export/import means the data is never trapped in one browser.
 */
export const EMPTY: AdminState = { leads: [], drafts: [], channels: [], patrol: [] }

export function loadState(): AdminState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as Partial<AdminState>
    return {
      leads: parsed.leads ?? [],
      drafts: parsed.drafts ?? [],
      channels: parsed.channels ?? [],
      patrol: parsed.patrol ?? [],
    }
  } catch {
    return EMPTY
  }
}

export function saveState(state: AdminState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

/** Deterministic-enough id; this never leaves one operator's machine. */
export function newId(prefix: string) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9)
}

export function emptyChannel(name = ''): ChannelProfile {
  return {
    id: newId('ch'),
    name,
    region: 'JP',
    url: '',
    shipsWorldwide: unknownFact(),
    acceptsForeignCard: unknownFact(),
    requiresLocalPhone: unknownFact(),
    requiresLocalId: unknownFact(),
    purchaseHistoryGated: unknownFact(),
    proxies: unknownFact(),
    dutyNote: unknownFact(),
    selfProxyViable: unknownFact(),
    updatedAt: new Date().toISOString(),
  }
}

export function emptyDraft(overrides: Partial<DropDraft> = {}): DropDraft {
  return {
    id: newId('d'),
    slug: '',
    title: '',
    brand: '',
    category: 'sneakers',
    channelIds: [],
    opensAt: unknownFact(),
    closesAt: unknownFact(),
    releaseAt: unknownFact(),
    price: unknownFact(),
    mechanic: unknownFact(),
    status: 'draft',
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/** The starting patrol list: the sources CLAUDE.md flags as un-crawlable. */
function seed(): AdminState {
  const patrol: PatrolSource[] = [
    { id: newId('p'), name: 'Pokémon Center 公式 LINE', kind: 'line', everyHours: 12 },
    { id: newId('p'), name: 'atmos Instagram Story', kind: 'instagram', url: 'https://www.instagram.com/atmos_japan/', everyHours: 12 },
    { id: newId('p'), name: 'Supreme Japan Instagram', kind: 'instagram', everyHours: 24 },
    { id: newId('p'), name: 'GSC / WF 公式 X', kind: 'x', url: 'https://x.com/', everyHours: 24 },
    { id: newId('p'), name: 'POP MART 中国小程序公告', kind: 'web', everyHours: 24 },
    { id: newId('p'), name: '球鞋情报 Discord', kind: 'discord', everyHours: 24 },
  ]
  return { ...EMPTY, patrol }
}

/** Single owner of admin state, persisted on every change. */
export function useAdminState() {
  const [state, setState] = useState<AdminState>(() => (typeof window === 'undefined' ? EMPTY : loadState()))

  useEffect(() => {
    saveState(state)
  }, [state])

  const update = useCallback((patch: (prev: AdminState) => AdminState) => setState(patch), [])

  return { state, setState, update }
}

export function replaceById<T extends { id: string }>(list: T[], next: T): T[] {
  return list.some((item) => item.id === next.id)
    ? list.map((item) => (item.id === next.id ? next : item))
    : [...list, next]
}

export type { AdminState, ChannelProfile, DropDraft, Lead, PatrolSource }
