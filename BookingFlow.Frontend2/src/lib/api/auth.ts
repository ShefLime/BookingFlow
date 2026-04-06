import { request } from './client'
import type { CurrentUser } from '../../types/api'

export const authApi = {
  getCurrentUser(token: string) {
    return request<CurrentUser>('/api/auth/me', { token })
  },
}
