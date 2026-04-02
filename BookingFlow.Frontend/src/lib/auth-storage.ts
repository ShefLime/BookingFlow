import type { AuthSession } from '../types/api'

const STORAGE_KEY = 'bookingflow.session'

export function loadSession(): AuthSession | null {
  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const session = JSON.parse(rawValue) as AuthSession
    if (new Date(session.expiresAtUtc).getTime() <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return session
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY)
}
