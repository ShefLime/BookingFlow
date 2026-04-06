import { request } from './client'
import type { Booking, EventBookingPayload, ResourceBookingPayload, RescheduleBookingPayload } from '../../types/api'

export const bookingsApi = {
  createResourceBooking(payload: ResourceBookingPayload, token: string) {
    return request<Booking>('/api/bookings/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
  createEventBooking(payload: EventBookingPayload, token: string) {
    return request<Booking>('/api/bookings/events', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
  getMyBookings(token: string) {
    return request<Booking[]>('/api/bookings/my', { token })
  },
  cancelBooking(bookingId: string, reason: string | undefined, token: string) {
    return request<Booking>(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      token,
    })
  },
  rescheduleBooking(bookingId: string, payload: RescheduleBookingPayload, token: string) {
    return request<Booking>(`/api/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
}
