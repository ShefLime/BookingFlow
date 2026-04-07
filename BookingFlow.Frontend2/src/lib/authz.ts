import type { CurrentUser, UserRole } from '../types/api'

const rolePriority: UserRole[] = ['Admin', 'Manager', 'Provider', 'Client']

export function hasRole(profile: CurrentUser | null | undefined, role: UserRole) {
  return profile?.roles.includes(role) ?? false
}

export function hasAnyRole(profile: CurrentUser | null | undefined, roles: UserRole[]) {
  return roles.some((role) => hasRole(profile, role))
}

export function getPrimaryRole(profile: CurrentUser | null | undefined) {
  return rolePriority.find((role) => profile?.roles.includes(role)) ?? null
}

export function canManageOrganizations(profile: CurrentUser | null | undefined) {
  return hasAnyRole(profile, ['Admin', 'Manager'])
}

export function canManageProviderArea(profile: CurrentUser | null | undefined) {
  return hasAnyRole(profile, ['Admin', 'Provider'])
}

export function canAccessAdminArea(profile: CurrentUser | null | undefined) {
  return hasRole(profile, 'Admin')
}
