import { request, toQuery } from './client'
import type {
  CreateProviderOrganizationJoinRequestPayload,
  ProviderOrganizationJoinRequest,
  ProviderProfile,
  ProviderProfilePayload,
  ProviderResourcePayload,
  Resource,
  ReviewProviderOrganizationJoinRequestPayload,
} from '../../types/api'

export const providersApi = {
  getProviders() {
    return request<ProviderProfile[]>('/api/providers/discover')
  },
  getProviderProfile(providerProfileId: string) {
    return request<ProviderProfile>(`/api/providers/${providerProfileId}`)
  },
  getMyProviderProfile(token: string) {
    return request<ProviderProfile | null>('/api/provider/profile', { token }).then((profile) => profile ?? null)
  },
  upsertProviderProfile(payload: ProviderProfilePayload, token: string) {
    return request<ProviderProfile>('/api/provider/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    })
  },
  getMyProviderResources(token: string) {
    return request<Resource[]>('/api/provider/resources', { token })
  },
  createProviderResource(payload: ProviderResourcePayload, token: string) {
    return request<Resource>('/api/provider/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
  updateProviderResource(resourceId: string, payload: ProviderResourcePayload, token: string) {
    return request<Resource>(`/api/provider/resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    })
  },
  getMyProviderOrganizationRequests(token: string) {
    return request<ProviderOrganizationJoinRequest[]>('/api/provider/organization-requests', { token })
  },
  createProviderOrganizationRequest(payload: CreateProviderOrganizationJoinRequestPayload, token: string) {
    return request<ProviderOrganizationJoinRequest>('/api/provider/organization-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
  getOrganizationProviderJoinRequests(organizationId: string, token: string, status?: string) {
    return request<ProviderOrganizationJoinRequest[]>(
      `/api/organizations/${organizationId}/provider-join-requests${toQuery({ status })}`,
      { token },
    )
  },
  reviewOrganizationProviderJoinRequest(
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
}
