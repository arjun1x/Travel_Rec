// Saved-destinations shortlist persisted in localStorage.
// useSyncExternalStore keeps every heart/badge in sync across components.

import { useSyncExternalStore } from 'react'

const KEY = 'travelrec:shortlist'
const listeners = new Set<() => void>()

function load(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? [...new Set<number>(parsed.filter((x) => Number.isSafeInteger(x) && x > 0))] : []
  } catch {
    return []
  }
}

let snapshot: number[] = load()
window.addEventListener('storage', (event) => {
  if (event.key === KEY || event.key === null) { snapshot = load(); listeners.forEach((notify) => notify()) }
})

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
      persist(snapshot.includes(id) ? snapshot.filter((i) => i !== id) : [...snapshot, id]),
  }
}
