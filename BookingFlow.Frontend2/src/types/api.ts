export type Locale = 'ru' | 'en' | 'vi'
export type UserRole = 'Client' | 'Provider' | 'Admin' | 'Manager'
export type ModerationStatus = 'PendingApproval' | 'Approved' | 'Rejected'
export type DiscoveryOwnerType = 'organization' | 'provider'
export type AnalyticsEntityType = 'Organization' | 'Resource' | 'EventSession'
export type OrganizationSubscriptionPlan = 'Starter' | 'Growth' | 'Premium'
export type ProviderOrganizationJoinRequestStatus = 'Pending' | 'Approved' | 'Rejected'
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Expired'

export type OrganizationType =
  | 'FitnessClub'
  | 'Bar'
  | 'NightClub'
  | 'EventVenue'
  | 'Restaurant'
  | 'SportsCenter'
  | 'Other'

export type ResourceType =
  | 'Trainer'
  | 'Table'
  | 'Room'
  | 'Court'
  | 'Hall'
  | 'ServiceSpot'
  | 'VipTable'

export type DayOfWeekName =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'

export interface LocalizedTextSet {
  ru?: string | null
  en?: string | null
  vi?: string | null
}

export interface LocalizedStringCollectionSet {
  ru: string[]
  en: string[]
  vi: string[]
}

export interface MediaAssetItem {
  url: string
  kind: string
  title?: string | null
}

export interface OrganizationContent {
  heroTitle: LocalizedTextSet
  heroSubtitle: LocalizedTextSet
  summary: LocalizedTextSet
  description: LocalizedTextSet
  atmosphere: LocalizedTextSet
  amenities: LocalizedStringCollectionSet
  serviceHighlights: LocalizedStringCollectionSet
}

export interface ProviderContent {
  summary: LocalizedTextSet
  biography: LocalizedTextSet
  approach: LocalizedTextSet
  quote: LocalizedTextSet
  specialties: LocalizedStringCollectionSet
  highlights: LocalizedStringCollectionSet
}

export interface ResourceContent {
  summary: LocalizedTextSet
  biography: LocalizedTextSet
  approach: LocalizedTextSet
  quote: LocalizedTextSet
  specialties: LocalizedStringCollectionSet
  achievements: LocalizedStringCollectionSet
  formats: LocalizedStringCollectionSet
}

export interface EventContent {
  summary: LocalizedTextSet
  description: LocalizedTextSet
  notes: LocalizedTextSet
  agenda: LocalizedStringCollectionSet
  includedItems: LocalizedStringCollectionSet
}

export interface UserMembership {
  organizationId: string
  organizationName: string
  title: string
}

export interface CurrentProviderProfileSummary {
  id: string
  displayName: string
  approvalStatus: ModerationStatus
}

export interface CurrentUser {
  userId: string
  keycloakSubject: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  roles: UserRole[]
  memberships: UserMembership[]
  providerProfile: CurrentProviderProfileSummary | null
}

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  description: string
  timeZone: string
  address: string
  city?: string | null
  phone?: string | null
  email?: string | null
  websiteUrl?: string | null
  logoImageUrl?: string | null
  coverImageUrl?: string | null
  gallery: MediaAssetItem[]
  documents: MediaAssetItem[]
  content: OrganizationContent
  isActive: boolean
  resourcesCount: number
  eventsCount: number
}

export interface OrganizationPayload {
  name: string
  type: OrganizationType
  description: string
  timeZone: string
  address: string
  city?: string
  phone?: string
  email?: string
  websiteUrl?: string
  logoImageUrl?: string
  coverImageUrl?: string
  gallery: MediaAssetItem[]
  documents: MediaAssetItem[]
  content: OrganizationContent
  isActive?: boolean
}

export interface ProviderOrganizationAffiliation {
  organizationId: string
  organizationName: string
  title: string
  isPrimary: boolean
  isActive: boolean
}

export interface ProviderProfile {
  id: string
  userId: string
  displayName: string
  headline: string
  city?: string | null
  timeZone: string
  location?: string | null
  avatarImageUrl?: string | null
  coverImageUrl?: string | null
  gallery: MediaAssetItem[]
  documents: MediaAssetItem[]
  content: ProviderContent
  approvalStatus: ModerationStatus
  moderationNote?: string | null
  servicesCount: number
  affiliations: ProviderOrganizationAffiliation[]
}

export interface ProviderProfilePayload {
  displayName: string
  headline: string
  city?: string
  timeZone: string
  location?: string
  avatarImageUrl?: string
  coverImageUrl?: string
  gallery: MediaAssetItem[]
  documents: MediaAssetItem[]
  content: ProviderContent
}

export interface ProviderOrganizationJoinRequest {
  id: string
  providerProfileId: string
  providerDisplayName: string
  organizationId: string
  organizationName: string
  message?: string | null
  status: ProviderOrganizationJoinRequestStatus
  reviewNote?: string | null
  createdAtUtc: string
  reviewedAtUtc?: string | null
  affiliation?: ProviderOrganizationAffiliation | null
}

export interface CreateProviderOrganizationJoinRequestPayload {
  organizationId: string
  message?: string
}

export interface ReviewProviderOrganizationJoinRequestPayload {
  status: ProviderOrganizationJoinRequestStatus
  title?: string
  isPrimary: boolean
  note?: string
}

export interface Resource {
  id: string
  organizationId?: string | null
  organizationName?: string | null
  providerProfileId?: string | null
  providerDisplayName?: string | null
  providerAvatarImageUrl?: string | null
  name: string
  type: ResourceType
  description?: string | null
  location?: string | null
  capacity: number
  slotSizeMinutes: number
  experienceYears?: number | null
  priceFrom?: number | null
  avatarImageUrl?: string | null
  coverImageUrl?: string | null
  gallery: MediaAssetItem[]
  documents: MediaAssetItem[]
  content: ResourceContent
  isActive: boolean
  approvalStatus: ModerationStatus
  moderationNote?: string | null
  availabilityRulesCount: number
}

export interface ResourcePayload {
  organizationId: string
  name: string
  type: ResourceType
  description?: string
  location?: string
  capacity: number
  slotSizeMinutes: number
  experienceYears?: number
  priceFrom?: number
  avatarImageUrl?: string
  coverImageUrl?: string
  gallery: MediaAssetItem[]
  documents: MediaAssetItem[]
  content: ResourceContent
  isActive?: boolean
}

export interface ProviderResourcePayload {
  name: string
  type: ResourceType
  description?: string
  location?: string
  capacity: number
  slotSizeMinutes: number
  experienceYears?: number
  priceFrom?: number
  avatarImageUrl?: string
  coverImageUrl?: string
  gallery: MediaAssetItem[]
  documents: MediaAssetItem[]
  content: ResourceContent
}

export interface AvailabilityRule {
  id: string
  resourceId: string
  dayOfWeek: DayOfWeekName
  startTime: string
  endTime: string
  isActive: boolean
}

export interface AvailabilityRulePayload {
  resourceId: string
  dayOfWeek: DayOfWeekName
  startTime: string
  endTime: string
}

export interface AvailableSlot {
  startAtUtc: string
  endAtUtc: string
  isAvailable: boolean
  organizationTimeZone: string
}

export interface EventSession {
  id: string
  organizationId: string
  organizationName: string
  name: string
  description: string
  location: string
  posterImageUrl?: string | null
  gallery: MediaAssetItem[]
  documents: MediaAssetItem[]
  content: EventContent
  startAtUtc: string
  endAtUtc: string
  capacity: number
  remainingCapacity: number
  isActive: boolean
}

export interface EventPayload {
  organizationId: string
  name: string
  description: string
  location: string
  posterImageUrl?: string
  gallery: MediaAssetItem[]
  documents: MediaAssetItem[]
  content: EventContent
  startAtUtc: string
  endAtUtc: string
  capacity: number
  isActive?: boolean
}

export interface Booking {
  id: string
  userId: string
  organizationId?: string | null
  organizationName?: string | null
  providerProfileId?: string | null
  providerDisplayName?: string | null
  resourceId?: string | null
  resourceName?: string | null
  eventSessionId?: string | null
  eventName?: string | null
  startAtUtc: string
  endAtUtc: string
  guestCount: number
  status: BookingStatus
  comment?: string | null
  cancellationReason?: string | null
  price?: number | null
  currency?: string | null
  confirmedAtUtc?: string | null
  cancelledAtUtc?: string | null
}

export interface ResourceBookingPayload {
  organizationId?: string | null
  resourceId: string
  startAtUtc: string
  endAtUtc: string
  guestCount: number
  comment?: string
}

export interface EventBookingPayload {
  organizationId: string
  eventSessionId: string
  guestCount: number
  comment?: string
}

export interface RescheduleBookingPayload {
  newStartAtUtc: string
  newEndAtUtc: string
}

export interface OrganizationSubscription {
  organizationId: string
  plan: OrganizationSubscriptionPlan
  isAnalyticsEnabled: boolean
  isActive: boolean
  startsAtUtc: string
  endsAtUtc?: string | null
  monthlyPrice?: number | null
  currency?: string | null
}

export interface UpsertOrganizationSubscriptionPayload {
  plan: OrganizationSubscriptionPlan
  isAnalyticsEnabled: boolean
  startsAtUtc: string
  endsAtUtc?: string
  monthlyPrice?: number
  currency?: string
}

export interface AnalyticsRankingItem {
  entityType: AnalyticsEntityType
  entityId: string
  name: string
  category?: string | null
  views: number
  bookings: number
  uniqueClients: number
  expectedRevenue: number
}

export interface AnalyticsAtRiskClient {
  userId: string
  fullName: string
  email: string
  phone?: string | null
  lastBookingAtUtc: string
  lastBookingName: string
  lifetimeBookings: number
  lifetimeValue: number
}

export interface OrganizationAnalytics {
  hasAccess: boolean
  accessMessage?: string | null
  fromUtc: string
  toUtc: string
  forecastDays: number
  subscription?: OrganizationSubscription | null
  totalViews: number
  organizationViews: number
  resourceViews: number
  eventViews: number
  bookingsInPeriod: number
  upcomingBookings: number
  staffBookings: number
  newClients: number
  repeatClients: number
  atRiskClients: number
  expectedRevenue: number
  currency: string
  occupancyRatePercent: number
  eventFillRatePercent: number
  conversionRatePercent: number
  cancellationRatePercent: number
  averageLeadTimeDays: number
  staffLeaderboard: AnalyticsRankingItem[]
  topServices: AnalyticsRankingItem[]
  topViewedItems: AnalyticsRankingItem[]
  retentionCandidates: AnalyticsAtRiskClient[]
}

export interface TrackAnalyticsViewPayload {
  entityType: AnalyticsEntityType
  entityId: string
  visitorId: string
  path?: string
  referrer?: string
}

export interface UploadedMediaResponse {
  url: string
  objectKey: string
  fileName: string
  contentType: string
  sizeBytes: number
  storageProvider: string
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  roles: UserRole[]
  hasProviderProfile: boolean
  isActive: boolean
}

export interface AssignManagerMembershipPayload {
  userId: string
  organizationId: string
  title: string
}

export interface ReviewPayload {
  status: ModerationStatus
  note?: string
}
