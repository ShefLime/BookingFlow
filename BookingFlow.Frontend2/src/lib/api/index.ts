import { ApiError } from '../errors'
import { adminApi } from './admin'
import { analyticsApi } from './analytics'
import { authApi } from './auth'
import { bookingsApi } from './bookings'
import { eventsApi } from './events'
import { mediaApi } from './media'
import { organizationsApi } from './organizations'
import { providersApi } from './providers'
import { resourcesApi } from './resources'

export const api = {
  auth: authApi,
  organizations: organizationsApi,
  providers: providersApi,
  resources: resourcesApi,
  events: eventsApi,
  bookings: bookingsApi,
  analytics: analyticsApi,
  media: mediaApi,
  admin: adminApi,
}

export { ApiError }
