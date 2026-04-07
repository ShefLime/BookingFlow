import { request, toQuery } from './client'
import type { EventPayload, EventSession } from '../../types/api'

export const eventsApi = {
  getEvents(organizationId: string, includeInactive = false, fromUtc?: string) {
    return request<EventSession[]>(
      `/api/organizations/${organizationId}/events${toQuery({
        includeInactive: includeInactive || undefined,
        fromUtc,
      })}`,
    )
  },
  getEvent(eventId: string) {
    return request<EventSession>(`/api/events/${eventId}`)
  },
  createEvent(payload: EventPayload, token: string) {
    return request<EventSession>(`/api/organizations/${payload.organizationId}/events`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
  updateEvent(eventId: string, payload: EventPayload, token: string) {
    return request<EventSession>(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        isActive: payload.isActive ?? true,
      }),
      token,
    })
  },
}
