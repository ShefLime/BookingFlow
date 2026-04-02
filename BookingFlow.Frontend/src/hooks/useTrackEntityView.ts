import { useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { getVisitorId } from '../lib/visitor'
import type { AnalyticsEntityType } from '../types/api'

export function useTrackEntityView(entityType: AnalyticsEntityType, entityId?: string | null) {
  const trackedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!entityId) {
      return
    }

    const trackingKey = `${entityType}:${entityId}`
    if (trackedKeyRef.current === trackingKey) {
      return
    }

    trackedKeyRef.current = trackingKey

    void api.trackAnalyticsView({
      entityType,
      entityId,
      visitorId: getVisitorId(),
      path: window.location.pathname,
      referrer: document.referrer || undefined,
    })
  }, [entityId, entityType])
}
