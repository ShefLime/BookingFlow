import { request, toQuery } from './client'
import type {
  AdminUser,
  AssignManagerMembershipPayload,
  ProviderProfile,
  Resource,
  ReviewPayload,
} from '../../types/api'

export const adminApi = {
  getAdminUsers(token: string) {
    return request<AdminUser[]>('/api/admin/users', { token })
  },
  assignManagerMembership(payload: AssignManagerMembershipPayload, token: string) {
    return request<void>('/api/admin/memberships', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
  getProviderProfilesForReview(token: string, status?: string) {
    return request<ProviderProfile[]>(`/api/admin/provider-profiles${toQuery({ status })}`, { token })
  },
  reviewProviderProfile(providerProfileId: string, payload: ReviewPayload, token: string) {
    return request<ProviderProfile>(`/api/admin/provider-profiles/${providerProfileId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
  getProviderResourcesForReview(token: string, status?: string) {
    return request<Resource[]>(`/api/admin/provider-resources${toQuery({ status })}`, { token })
  },
  reviewProviderResource(resourceId: string, payload: ReviewPayload, token: string) {
    return request<Resource>(`/api/admin/provider-resources/${resourceId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
}
