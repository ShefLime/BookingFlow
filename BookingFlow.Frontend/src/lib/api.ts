import type {
  AdminUser,
  CreateProviderOrganizationJoinRequestPayload,
  AssignManagerMembershipPayload,
  OrganizationAnalytics,
  OrganizationSubscription,
  ProviderOrganizationJoinRequest,
  ReviewProviderOrganizationJoinRequestPayload,
  AvailabilityRule,
  AvailabilityRulePayload,
  AvailableSlot,
  Booking,
  CurrentUser,
  DiscoveryOwnerType,
  EventBookingPayload,
  EventPayload,
  EventSession,
  Organization,
  OrganizationPayload,
  ProviderProfile,
  ProviderProfilePayload,
  ProviderResourcePayload,
  TrackAnalyticsViewPayload,
  UpsertOrganizationSubscriptionPayload,
  RescheduleBookingPayload,
  Resource,
  ResourceBookingPayload,
  ResourcePayload,
  ReviewPayload,
  UploadedMediaResponse,
} from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface RequestOptions extends RequestInit {
  token?: string
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options
  const isFormData = rest.body instanceof FormData
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    let message = 'Не удалось выполнить запрос.'

    try {
      const payload = (await response.json()) as { message?: string; title?: string }
      if (payload.message) {
        message = payload.message
      } else if (payload.title) {
        message = payload.title
      }
    } catch {
      if (response.statusText) {
        message = response.statusText
      }
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const responseText = await response.text()
  if (!responseText) {
    return undefined as T
  }

  return JSON.parse(responseText) as T
}

function toQuery(params: Record<string, string | boolean | undefined>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) {
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const api = {
  async getCurrentUser(token: string) {
    return request<CurrentUser>('/api/auth/me', { token })
  },

  async getOrganizations(includeInactive = false) {
    return request<Organization[]>(
      `/api/organizations${toQuery({ includeInactive: includeInactive || undefined })}`,
    )
  },

  async getOrganization(id: string) {
    return request<Organization>(`/api/organizations/${id}`)
  },

  async createOrganization(payload: OrganizationPayload, token: string) {
    return request<Organization>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async updateOrganization(id: string, payload: OrganizationPayload, token: string) {
    return request<Organization>(`/api/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        isActive: payload.isActive ?? true,
      }),
      token,
    })
  },

  async discoverResources(ownerType?: DiscoveryOwnerType) {
    return request<Resource[]>(
      `/api/resources/discover${toQuery({ ownerType })}`,
    )
  },

  async getResources(organizationId: string, includeInactive = false) {
    return request<Resource[]>(
      `/api/organizations/${organizationId}/resources${toQuery({
        includeInactive: includeInactive || undefined,
      })}`,
    )
  },

  async getResource(id: string) {
    return request<Resource>(`/api/resources/${id}`)
  },

  async getAvailability(resourceId: string, date: string) {
    return request<AvailableSlot[]>(
      `/api/resources/${resourceId}/availability${toQuery({ date })}`,
    )
  },

  async getAvailabilityRules(resourceId: string) {
    return request<AvailabilityRule[]>(`/api/resources/${resourceId}/availability-rules`)
  },

  async createResource(payload: ResourcePayload, token: string) {
    return request<Resource>(`/api/organizations/${payload.organizationId}/resources`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async updateResource(id: string, payload: ResourcePayload, token: string) {
    return request<Resource>(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        isActive: payload.isActive ?? true,
      }),
      token,
    })
  },

  async createAvailabilityRule(payload: AvailabilityRulePayload, token: string) {
    return request<AvailabilityRule>(`/api/resources/${payload.resourceId}/availability-rules`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async getEvents(organizationId: string, includeInactive = false) {
    return request<EventSession[]>(
      `/api/organizations/${organizationId}/events${toQuery({
        includeInactive: includeInactive || undefined,
      })}`,
    )
  },

  async getEvent(eventId: string) {
    return request<EventSession>(`/api/events/${eventId}`)
  },

  async createEvent(payload: EventPayload, token: string) {
    return request<EventSession>(`/api/organizations/${payload.organizationId}/events`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async updateEvent(id: string, payload: EventPayload, token: string) {
    return request<EventSession>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        isActive: payload.isActive ?? true,
      }),
      token,
    })
  },

  async getProviders() {
    return request<ProviderProfile[]>('/api/providers/discover')
  },

  async getProviderProfile(providerProfileId: string) {
    return request<ProviderProfile>(`/api/providers/${providerProfileId}`)
  },

  async getMyProviderProfile(token: string) {
    return request<ProviderProfile | null>('/api/provider/profile', { token })
  },

  async upsertProviderProfile(payload: ProviderProfilePayload, token: string) {
    return request<ProviderProfile>('/api/provider/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    })
  },

  async getMyProviderResources(token: string) {
    return request<Resource[]>('/api/provider/resources', { token })
  },

  async getMyProviderOrganizationRequests(token: string) {
    return request<ProviderOrganizationJoinRequest[]>('/api/provider/organization-requests', { token })
  },

  async createProviderOrganizationRequest(
    payload: CreateProviderOrganizationJoinRequestPayload,
    token: string,
  ) {
    return request<ProviderOrganizationJoinRequest>('/api/provider/organization-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async createProviderResource(payload: ProviderResourcePayload, token: string) {
    return request<Resource>('/api/provider/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async updateProviderResource(resourceId: string, payload: ProviderResourcePayload, token: string) {
    return request<Resource>(`/api/provider/resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    })
  },

  async getAdminUsers(token: string) {
    return request<AdminUser[]>('/api/admin/users', { token })
  },

  async getOrganizationSubscription(organizationId: string, token: string) {
    return request<OrganizationSubscription | null>(`/api/organizations/${organizationId}/subscription`, {
      token,
    })
  },

  async upsertOrganizationSubscription(
    organizationId: string,
    payload: UpsertOrganizationSubscriptionPayload,
    token: string,
  ) {
    return request<OrganizationSubscription>(`/api/organizations/${organizationId}/subscription`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    })
  },

  async getOrganizationAnalytics(
    organizationId: string,
    token: string,
    params?: { fromUtc?: string; toUtc?: string; forecastDays?: number },
  ) {
    return request<OrganizationAnalytics>(
      `/api/organizations/${organizationId}/analytics${toQuery({
        fromUtc: params?.fromUtc,
        toUtc: params?.toUtc,
        forecastDays: params?.forecastDays === undefined ? undefined : String(params.forecastDays),
      })}`,
      { token },
    )
  },

  async getOrganizationProviderJoinRequests(
    organizationId: string,
    token: string,
    status?: string,
  ) {
    return request<ProviderOrganizationJoinRequest[]>(
      `/api/organizations/${organizationId}/provider-join-requests${toQuery({ status })}`,
      { token },
    )
  },

  async reviewOrganizationProviderJoinRequest(
    organizationId: string,
    requestId: string,
    payload: ReviewProviderOrganizationJoinRequestPayload,
    token: string,
  ) {
    return request<ProviderOrganizationJoinRequest>(
      `/api/organizations/${organizationId}/provider-join-requests/${requestId}/review`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      },
    )
  },

  async assignManagerMembership(payload: AssignManagerMembershipPayload, token: string) {
    return request<void>('/api/admin/memberships', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async getProviderProfilesForReview(token: string, status?: string) {
    return request<ProviderProfile[]>(
      `/api/admin/provider-profiles${toQuery({ status })}`,
      { token },
    )
  },

  async reviewProviderProfile(providerProfileId: string, payload: ReviewPayload, token: string) {
    return request<ProviderProfile>(`/api/admin/provider-profiles/${providerProfileId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async getProviderResourcesForReview(token: string, status?: string) {
    return request<Resource[]>(
      `/api/admin/provider-resources${toQuery({ status })}`,
      { token },
    )
  },

  async reviewProviderResource(resourceId: string, payload: ReviewPayload, token: string) {
    return request<Resource>(`/api/admin/provider-resources/${resourceId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async uploadMedia(file: File, folder: string, token: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    return request<UploadedMediaResponse>('/api/media/upload', {
      method: 'POST',
      body: formData,
      token,
    })
  },

  async createResourceBooking(payload: ResourceBookingPayload, token: string) {
    return request<Booking>('/api/bookings/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async createEventBooking(payload: EventBookingPayload, token: string) {
    return request<Booking>('/api/bookings/events', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },

  async trackAnalyticsView(payload: TrackAnalyticsViewPayload) {
    return request<void>('/api/analytics/views', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getMyBookings(token: string) {
    return request<Booking[]>('/api/bookings/my', { token })
  },

  async cancelBooking(bookingId: string, reason: string | undefined, token: string) {
    return request<Booking>(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      token,
    })
  },

  async rescheduleBooking(
    bookingId: string,
    payload: RescheduleBookingPayload,
    token: string,
  ) {
    return request<Booking>(`/api/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
}

export { ApiError }
