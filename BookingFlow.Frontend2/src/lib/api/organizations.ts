import { request, toQuery } from './client'
import type {
  Organization,
  OrganizationAnalytics,
  OrganizationPayload,
  OrganizationSubscription,
  UpsertOrganizationSubscriptionPayload,
} from '../../types/api'

export const organizationsApi = {
  getOrganizations(includeInactive = false) {
    return request<Organization[]>(
      `/api/organizations${toQuery({ includeInactive: includeInactive || undefined })}`,
    )
  },
  getOrganization(organizationId: string) {
    return request<Organization>(`/api/organizations/${organizationId}`)
  },
  createOrganization(payload: OrganizationPayload, token: string) {
    return request<Organization>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
  updateOrganization(organizationId: string, payload: OrganizationPayload, token: string) {
    return request<Organization>(`/api/organizations/${organizationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        isActive: payload.isActive ?? true,
      }),
      token,
    })
  },
  getOrganizationSubscription(organizationId: string, token: string) {
    return request<OrganizationSubscription | null>(`/api/organizations/${organizationId}/subscription`, {
      token,
    })
  },
  upsertOrganizationSubscription(
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
  getOrganizationAnalytics(
    organizationId: string,
    token: string,
    params?: { fromUtc?: string; toUtc?: string; forecastDays?: number },
  ) {
    return request<OrganizationAnalytics>(
      `/api/organizations/${organizationId}/analytics${toQuery({
        fromUtc: params?.fromUtc,
        toUtc: params?.toUtc,
        forecastDays: params?.forecastDays,
      })}`,
      { token },
    )
  },
}
