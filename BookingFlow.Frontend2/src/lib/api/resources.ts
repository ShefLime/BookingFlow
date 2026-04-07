import { request, toQuery } from './client'
import type {
  AvailabilityRule,
  AvailabilityRulePayload,
  AvailableSlot,
  DiscoveryOwnerType,
  Resource,
  ResourcePayload,
} from '../../types/api'

export const resourcesApi = {
  discoverResources(ownerType?: DiscoveryOwnerType) {
    return request<Resource[]>(`/api/resources/discover${toQuery({ ownerType })}`)
  },
  getResources(organizationId: string, includeInactive = false) {
    return request<Resource[]>(
      `/api/organizations/${organizationId}/resources${toQuery({
        includeInactive: includeInactive || undefined,
      })}`,
    )
  },
  getResource(resourceId: string) {
    return request<Resource>(`/api/resources/${resourceId}`)
  },
  createResource(payload: ResourcePayload, token: string) {
    return request<Resource>(`/api/organizations/${payload.organizationId}/resources`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
  updateResource(resourceId: string, payload: ResourcePayload, token: string) {
    return request<Resource>(`/api/resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        isActive: payload.isActive ?? true,
      }),
      token,
    })
  },
  getAvailability(resourceId: string, date: string) {
    return request<AvailableSlot[]>(`/api/resources/${resourceId}/availability${toQuery({ date })}`)
  },
  getAvailabilityRules(resourceId: string) {
    return request<AvailabilityRule[]>(`/api/resources/${resourceId}/availability-rules`)
  },
  createAvailabilityRule(payload: AvailabilityRulePayload, token: string) {
    return request<AvailabilityRule>(`/api/resources/${payload.resourceId}/availability-rules`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })
  },
}
