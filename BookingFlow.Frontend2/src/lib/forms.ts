import type {
  EventPayload,
  LocalizedStringCollectionSet,
  LocalizedTextSet,
  OrganizationContent,
  OrganizationPayload,
  ProviderContent,
  ProviderProfilePayload,
  ProviderResourcePayload,
  ResourceContent,
  ResourcePayload,
} from '../types/api'

export function emptyLocalizedText(): LocalizedTextSet {
  return { ru: '', en: '', vi: '' }
}

export function emptyLocalizedList(): LocalizedStringCollectionSet {
  return { ru: [], en: [], vi: [] }
}

export function emptyOrganizationContent(): OrganizationContent {
  return {
    heroTitle: emptyLocalizedText(),
    heroSubtitle: emptyLocalizedText(),
    summary: emptyLocalizedText(),
    description: emptyLocalizedText(),
    atmosphere: emptyLocalizedText(),
    amenities: emptyLocalizedList(),
    serviceHighlights: emptyLocalizedList(),
  }
}

export function emptyProviderContent(): ProviderContent {
  return {
    summary: emptyLocalizedText(),
    biography: emptyLocalizedText(),
    approach: emptyLocalizedText(),
    quote: emptyLocalizedText(),
    specialties: emptyLocalizedList(),
    highlights: emptyLocalizedList(),
  }
}

export function emptyResourceContent(): ResourceContent {
  return {
    summary: emptyLocalizedText(),
    biography: emptyLocalizedText(),
    approach: emptyLocalizedText(),
    quote: emptyLocalizedText(),
    specialties: emptyLocalizedList(),
    achievements: emptyLocalizedList(),
    formats: emptyLocalizedList(),
  }
}

export function buildOrganizationForm(): OrganizationPayload {
  return {
    name: '',
    type: 'FitnessClub',
    description: '',
    timeZone: 'Asia/Ho_Chi_Minh',
    address: '',
    city: '',
    phone: '',
    email: '',
    websiteUrl: '',
    logoImageUrl: '',
    coverImageUrl: '',
    gallery: [],
    documents: [],
    content: emptyOrganizationContent(),
    isActive: true,
  }
}

export function buildProviderProfileForm(): ProviderProfilePayload {
  return {
    displayName: '',
    headline: '',
    city: '',
    timeZone: 'Asia/Ho_Chi_Minh',
    location: '',
    avatarImageUrl: '',
    coverImageUrl: '',
    gallery: [],
    documents: [],
    content: emptyProviderContent(),
  }
}

export function buildOrganizationResourceForm(organizationId = ''): ResourcePayload {
  return {
    organizationId,
    name: '',
    type: 'Trainer',
    description: '',
    location: '',
    capacity: 1,
    slotSizeMinutes: 60,
    experienceYears: undefined,
    priceFrom: undefined,
    avatarImageUrl: '',
    coverImageUrl: '',
    gallery: [],
    documents: [],
    content: emptyResourceContent(),
    isActive: true,
  }
}

export function buildProviderResourceForm(): ProviderResourcePayload {
  return {
    name: '',
    type: 'Trainer',
    description: '',
    location: '',
    capacity: 1,
    slotSizeMinutes: 60,
    experienceYears: undefined,
    priceFrom: undefined,
    avatarImageUrl: '',
    coverImageUrl: '',
    gallery: [],
    documents: [],
    content: emptyResourceContent(),
  }
}

export function buildEventForm(organizationId = ''): EventPayload {
  const startAt = new Date()
  startAt.setDate(startAt.getDate() + 7)
  startAt.setHours(18, 0, 0, 0)
  const endAt = new Date(startAt)
  endAt.setHours(20, 0, 0, 0)

  return {
    organizationId,
    name: '',
    description: '',
    location: '',
    posterImageUrl: '',
    gallery: [],
    documents: [],
    content: {
      summary: emptyLocalizedText(),
      description: emptyLocalizedText(),
      notes: emptyLocalizedText(),
      agenda: emptyLocalizedList(),
      includedItems: emptyLocalizedList(),
    },
    startAtUtc: startAt.toISOString(),
    endAtUtc: endAt.toISOString(),
    capacity: 20,
    isActive: true,
  }
}

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeOptionalNumber(value?: number | null) {
  return value === undefined || value === null || Number.isNaN(value) ? undefined : value
}

function normalizeTextSet(value: LocalizedTextSet) {
  return {
    ru: value.ru?.trim() ?? '',
    en: value.en?.trim() ?? '',
    vi: value.vi?.trim() ?? '',
  }
}

function normalizeListSet(value: LocalizedStringCollectionSet) {
  return {
    ru: value.ru.map((item) => item.trim()).filter(Boolean),
    en: value.en.map((item) => item.trim()).filter(Boolean),
    vi: value.vi.map((item) => item.trim()).filter(Boolean),
  }
}

export function toOrganizationPayload(form: OrganizationPayload): OrganizationPayload {
  return {
    ...form,
    city: normalizeOptionalText(form.city),
    phone: normalizeOptionalText(form.phone),
    email: normalizeOptionalText(form.email),
    websiteUrl: normalizeOptionalText(form.websiteUrl),
    logoImageUrl: normalizeOptionalText(form.logoImageUrl),
    coverImageUrl: normalizeOptionalText(form.coverImageUrl),
    content: {
      heroTitle: normalizeTextSet(form.content.heroTitle),
      heroSubtitle: normalizeTextSet(form.content.heroSubtitle),
      summary: normalizeTextSet(form.content.summary),
      description: normalizeTextSet(form.content.description),
      atmosphere: normalizeTextSet(form.content.atmosphere),
      amenities: normalizeListSet(form.content.amenities),
      serviceHighlights: normalizeListSet(form.content.serviceHighlights),
    },
  }
}

export function toProviderPayload(form: ProviderProfilePayload): ProviderProfilePayload {
  return {
    ...form,
    city: normalizeOptionalText(form.city),
    location: normalizeOptionalText(form.location),
    avatarImageUrl: normalizeOptionalText(form.avatarImageUrl),
    coverImageUrl: normalizeOptionalText(form.coverImageUrl),
    content: {
      summary: normalizeTextSet(form.content.summary),
      biography: normalizeTextSet(form.content.biography),
      approach: normalizeTextSet(form.content.approach),
      quote: normalizeTextSet(form.content.quote),
      specialties: normalizeListSet(form.content.specialties),
      highlights: normalizeListSet(form.content.highlights),
    },
  }
}

export function toResourcePayload(form: ResourcePayload): ResourcePayload {
  return {
    ...form,
    description: normalizeOptionalText(form.description),
    location: normalizeOptionalText(form.location),
    experienceYears: normalizeOptionalNumber(form.experienceYears),
    priceFrom: normalizeOptionalNumber(form.priceFrom),
    avatarImageUrl: normalizeOptionalText(form.avatarImageUrl),
    coverImageUrl: normalizeOptionalText(form.coverImageUrl),
    content: {
      summary: normalizeTextSet(form.content.summary),
      biography: normalizeTextSet(form.content.biography),
      approach: normalizeTextSet(form.content.approach),
      quote: normalizeTextSet(form.content.quote),
      specialties: normalizeListSet(form.content.specialties),
      achievements: normalizeListSet(form.content.achievements),
      formats: normalizeListSet(form.content.formats),
    },
  }
}

export function toProviderResourcePayload(form: ProviderResourcePayload): ProviderResourcePayload {
  return {
    ...toResourcePayload({
      ...form,
      organizationId: '',
    }),
  }
}

export function toEventPayload(form: EventPayload): EventPayload {
  return {
    ...form,
    posterImageUrl: normalizeOptionalText(form.posterImageUrl),
    content: {
      summary: normalizeTextSet(form.content.summary),
      description: normalizeTextSet(form.content.description),
      notes: normalizeTextSet(form.content.notes),
      agenda: normalizeListSet(form.content.agenda),
      includedItems: normalizeListSet(form.content.includedItems),
    },
  }
}
