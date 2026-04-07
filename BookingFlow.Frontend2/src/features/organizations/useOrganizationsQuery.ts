import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export function useOrganizationsQuery() {
  return useQuery({
    queryKey: ['organizations', 'public'],
    queryFn: () => api.organizations.getOrganizations(),
  })
}
