// JWT auth store: tokens persisted in localStorage, user hydrated from the
// API, all components kept in sync via useSyncExternalStore.

import { useSyncExternalStore } from 'react'
import { DEMO_MODE } from './config'

export interface AuthUser {
  id: number
  email: string
  name: string
  is_admin: boolean
}

interface TokenPair {
  access_token: string
  refresh_token: string
}

interface AuthState {
  access: string | null
  refresh: string | null
  user: AuthUser | null
}

const KEY = 'travelrec:auth'
const listeners = new Set<() => void>()

function loadTokens(): AuthState {
  if (DEMO_MODE) return { access: null, refresh: null, user: null }
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (typeof parsed?.access === 'string' && typeof parsed?.refresh === 'string' && parsed.access && parsed.refresh) {
      return { access: parsed.access, refresh: parsed.refresh, user: null }
    }
  } catch {
    // fall through to signed-out state
  }
  return { access: null, refresh: null, user: null }
}

let state: AuthState = loadTokens()

function setState(next: AuthState) {
  state = next
  try {
    if (next.access) {
      localStorage.setItem(KEY, JSON.stringify({ access: next.access, refresh: next.refresh }))
    } else {
      localStorage.removeItem(KEY)
    }
  } catch {
    // storage unavailable — session-only auth still works
  }
  listeners.forEach((notify) => notify())
}

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return typeof body.detail === 'string' ? body.detail : fallback
  } catch {
    return fallback
  }
}

async function hydrateUser(): Promise<void> {
  const res = await authFetch('/api/users/me')
  if (res.ok) {
    setState({ ...state, user: await res.json() })
  }
}

export async function login(email: string, password: string): Promise<void> {
  if (DEMO_MODE) throw new Error('Accounts require the connected backend.')
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(await parseError(res, 'Could not sign in'))
  const tokens: TokenPair = await res.json()
  setState({ access: tokens.access_token, refresh: tokens.refresh_token, user: null })
  await hydrateUser().catch(() => { /* Account remains signed in; profile can retry hydration. */ })
}

export async function register(email: string, password: string, name: string): Promise<void> {
  if (DEMO_MODE) throw new Error('Accounts require the connected backend.')
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(await parseError(res, 'Could not create account'))
  const tokens: TokenPair = await res.json()
  setState({ access: tokens.access_token, refresh: tokens.refresh_token, user: null })
  await hydrateUser().catch(() => { /* Account remains signed in; profile can retry hydration. */ })
}

export function logout(): void {
  setState({ access: null, refresh: null, user: null })
}

let refreshing: Promise<boolean> | null = null
async function tryRefresh(): Promise<boolean> {
  if (!state.refresh) return false
  if (refreshing) return refreshing
  const refreshToken = state.refresh
  refreshing = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }), signal: AbortSignal.timeout(15000),
      })
      if (!res.ok || state.refresh !== refreshToken) return false
      const tokens: TokenPair = await res.json()
      setState({ ...state, access: tokens.access_token, refresh: tokens.refresh_token })
      return true
    } catch { return false }
    finally { refreshing = null }
  })()
  return refreshing
}

/** fetch with Authorization header; retries once through a token refresh on 401. */
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (): RequestInit => {
    const headers = new Headers(init.headers)
    if (state.access) headers.set('Authorization', `Bearer ${state.access}`)
    return { ...init, headers, signal: init.signal ?? AbortSignal.timeout(30000) }
  }
  let res = await fetch(url, withAuth())
  if (res.status === 401 && (await tryRefresh())) {
    res = await fetch(url, withAuth())
  }
  if (res.status === 401) logout()
  return res
}

export function useAuth() {
  const current = useSyncExternalStore(subscribe, () => state)
  return {
    user: current.user,
    isAuthed: current.access !== null,
  }
}

// hydrate the user on app load when tokens survived a reload
if (state.access) {
  void hydrateUser().catch(() => { /* An unavailable API must not create an unhandled rejection. */ })
}
