const VISITOR_STORAGE_KEY = 'bookingflow-visitor-id'

export function getVisitorId() {
  if (typeof window === 'undefined') {
    return 'bookingflow-server'
  }

  const existingVisitorId = window.localStorage.getItem(VISITOR_STORAGE_KEY)
  if (existingVisitorId) {
    return existingVisitorId
  }

  const nextVisitorId = window.crypto?.randomUUID?.() ?? `visitor-${Date.now()}`
  window.localStorage.setItem(VISITOR_STORAGE_KEY, nextVisitorId)
  return nextVisitorId
}
