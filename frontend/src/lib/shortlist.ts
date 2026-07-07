// Saved-destinations shortlist persisted in localStorage.
// useSyncExternalStore keeps every heart/badge in sync across components.

import { useSyncExternalStore } from 'react'

const KEY = 'travelrec:shortlist'
const listeners = new Set<() => void>()

function load(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : []
  } catch {
    return []
  }
}

let snapshot: number[] = load()

function persist(ids: number[]) {
  snapshot = ids
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    // storage full/blocked — state still works for this session
  }
  listeners.forEach((notify) => notify())
}

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

export function useShortlist() {
  const ids = useSyncExternalStore(subscribe, () => snapshot)
  return {
    ids,
    has: (id: number) => ids.includes(id),
    toggle: (id: number) =>
      persist(ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]),
  }
}
