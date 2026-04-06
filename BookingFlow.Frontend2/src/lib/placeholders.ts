import type { EventSession, Organization, OrganizationType, ProviderProfile, Resource, ResourceType } from '../types/api'

const organizationPlaceholderByType: Record<OrganizationType, string> = {
  FitnessClub: '/placeholders/organization-fitness.svg',
  Bar: '/placeholders/organization-bar.svg',
  NightClub: '/placeholders/organization-bar.svg',
  EventVenue: '/placeholders/organization-event.svg',
  Restaurant: '/placeholders/organization-restaurant.svg',
  SportsCenter: '/placeholders/organization-sports.svg',
  Other: '/placeholders/organization-event.svg',
}

export function getOrganizationImageUrl(organization: Pick<Organization, 'type' | 'coverImageUrl'>) {
  return organization.coverImageUrl || organizationPlaceholderByType[organization.type] || '/placeholders/organization-event.svg'
}

export function getProviderImageUrl(provider: Pick<ProviderProfile, 'coverImageUrl' | 'avatarImageUrl'>) {
  return provider.coverImageUrl || provider.avatarImageUrl || '/placeholders/provider.svg'
}

export function getResourceImageUrl(resource: Pick<Resource, 'coverImageUrl' | 'avatarImageUrl' | 'type'>) {
  if (resource.coverImageUrl || resource.avatarImageUrl) {
    return resource.coverImageUrl || resource.avatarImageUrl || '/placeholders/resource.svg'
  }

  return getResourcePlaceholderByType(resource.type)
}

export function getEventImageUrl(event: Pick<EventSession, 'posterImageUrl'>) {
  return event.posterImageUrl || '/placeholders/event.svg'
}

function getResourcePlaceholderByType(type: ResourceType) {
  switch (type) {
    case 'Trainer':
    case 'ServiceSpot':
      return '/placeholders/provider.svg'
    default:
      return '/placeholders/resource.svg'
  }
}
