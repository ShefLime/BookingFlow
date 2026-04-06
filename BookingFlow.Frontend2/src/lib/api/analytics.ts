import { request } from './client'
import type { TrackAnalyticsViewPayload } from '../../types/api'

export const analyticsApi = {
  trackAnalyticsView(payload: TrackAnalyticsViewPayload) {
    return request<void>('/api/analytics/views', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
