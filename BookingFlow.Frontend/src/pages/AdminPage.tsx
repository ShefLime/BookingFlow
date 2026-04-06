import { useEffect, useMemo, useState } from 'react'
import { LoadingBlock } from '../components/LoadingBlock'
import { OrganizationAnalyticsPanel } from '../components/OrganizationAnalyticsPanel'
import { OrganizationJoinRequestsPanel } from '../components/OrganizationJoinRequestsPanel'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../i18n/LocaleContext'
import { api } from '../lib/api'
import {
  formatDateTime,
  formatModerationStatus,
  formatOrganizationType,
  formatResourceType,
  formatUserRole,
  getDefaultEventDateTime,
  pickLocalizedText,
  toDateTimeLocalValue,
} from '../lib/format'
import type {
  AdminUser,
  AssignManagerMembershipPayload,
  EventContent,
  EventPayload,
  EventSession,
  LocalizedStringCollectionSet,
  LocalizedTextSet,
  Locale,
  Organization,
  OrganizationContent,
  OrganizationPayload,
  OrganizationType,
  ProviderProfile,
  Resource,
  ResourceContent,
  ResourcePayload,
  ResourceType,
  ReviewPayload,
  UploadedMediaResponse,
} from '../types/api'

const organizationTypes: OrganizationType[] = [
  'FitnessClub',
  'Bar',
  'NightClub',
  'EventVenue',
  'Restaurant',
  'SportsCenter',
  'Other',
]

const resourceTypes: ResourceType[] = [
  'Trainer',
  'Table',
  'Room',
  'Court',
  'Hall',
  'ServiceSpot',
  'VipTable',
]

const locales: Locale[] = ['ru', 'en', 'vi']

function emptyLocalizedText(): LocalizedTextSet {
  return { ru: '', en: '', vi: '' }
}

function emptyLocalizedList(): LocalizedStringCollectionSet {
  return { ru: [], en: [], vi: [] }
}

function emptyOrganizationContent(): OrganizationContent {
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

function emptyResourceContent(): ResourceContent {
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

function emptyEventContent(): EventContent {
  return {
    summary: emptyLocalizedText(),
    description: emptyLocalizedText(),
    notes: emptyLocalizedText(),
    agenda: emptyLocalizedList(),
    includedItems: emptyLocalizedList(),
  }
}

function buildOrganizationForm(): OrganizationPayload {
  return {
    name: '',
    type: 'Bar',
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
  }
}

function buildResourceForm(organizationId = ''): ResourcePayload {
  return {
    organizationId,
    name: '',
    type: 'Table',
    description: '',
    location: '',
    capacity: 4,
    slotSizeMinutes: 120,
    experienceYears: undefined,
    priceFrom: undefined,
    avatarImageUrl: '',
    coverImageUrl: '',
    gallery: [],
    documents: [],
    content: emptyResourceContent(),
  }
}

function buildEventForm(organizationId = ''): EventPayload {
  return {
    organizationId,
    name: '',
    description: '',
    location: '',
    posterImageUrl: '',
    gallery: [],
    documents: [],
    content: emptyEventContent(),
    startAtUtc: new Date(getDefaultEventDateTime(7, 19)).toISOString(),
    endAtUtc: new Date(getDefaultEventDateTime(7, 21)).toISOString(),
    capacity: 40,
  }
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeOptionalNumber(value: number | undefined) {
  return value === undefined || Number.isNaN(value) ? undefined : value
}

function normalizeLocalizedText(value: LocalizedTextSet): LocalizedTextSet {
  return {
    ru: value.ru?.trim() ?? '',
    en: value.en?.trim() ?? '',
    vi: value.vi?.trim() ?? '',
  }
}

function normalizeLocalizedList(value: LocalizedStringCollectionSet): LocalizedStringCollectionSet {
  return {
    ru: value.ru.map((item) => item.trim()).filter(Boolean),
    en: value.en.map((item) => item.trim()).filter(Boolean),
    vi: value.vi.map((item) => item.trim()).filter(Boolean),
  }
}

function toOrganizationPayload(form: OrganizationPayload): OrganizationPayload {
  return {
    ...form,
    city: normalizeOptionalText(form.city),
    phone: normalizeOptionalText(form.phone),
    email: normalizeOptionalText(form.email),
    websiteUrl: normalizeOptionalText(form.websiteUrl),
    logoImageUrl: normalizeOptionalText(form.logoImageUrl),
    coverImageUrl: normalizeOptionalText(form.coverImageUrl),
    content: {
      heroTitle: normalizeLocalizedText(form.content.heroTitle),
      heroSubtitle: normalizeLocalizedText(form.content.heroSubtitle),
      summary: normalizeLocalizedText(form.content.summary),
      description: normalizeLocalizedText(form.content.description),
      atmosphere: normalizeLocalizedText(form.content.atmosphere),
      amenities: normalizeLocalizedList(form.content.amenities),
      serviceHighlights: normalizeLocalizedList(form.content.serviceHighlights),
    },
  }
}

function toResourcePayload(form: ResourcePayload): ResourcePayload {
  return {
    ...form,
    description: normalizeOptionalText(form.description),
    location: normalizeOptionalText(form.location),
    experienceYears: normalizeOptionalNumber(form.experienceYears),
    priceFrom: normalizeOptionalNumber(form.priceFrom),
    avatarImageUrl: normalizeOptionalText(form.avatarImageUrl),
    coverImageUrl: normalizeOptionalText(form.coverImageUrl),
    content: {
      summary: normalizeLocalizedText(form.content.summary),
      biography: normalizeLocalizedText(form.content.biography),
      approach: normalizeLocalizedText(form.content.approach),
      quote: normalizeLocalizedText(form.content.quote),
      specialties: normalizeLocalizedList(form.content.specialties),
      achievements: normalizeLocalizedList(form.content.achievements),
      formats: normalizeLocalizedList(form.content.formats),
    },
  }
}

function toEventPayload(form: EventPayload): EventPayload {
  return {
    ...form,
    posterImageUrl: normalizeOptionalText(form.posterImageUrl),
    content: {
      summary: normalizeLocalizedText(form.content.summary),
      description: normalizeLocalizedText(form.content.description),
      notes: normalizeLocalizedText(form.content.notes),
      agenda: normalizeLocalizedList(form.content.agenda),
      includedItems: normalizeLocalizedList(form.content.includedItems),
    },
  }
}

function LocalizedTextEditor({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  value: LocalizedTextSet
  onChange: (value: LocalizedTextSet) => void
  rows?: number
}) {
  return (
    <div className="editor-stack">
      <span className="stack-label">{label}</span>
      <div className="translation-grid">
        {locales.map((locale) => (
          <div key={locale} className="field-group">
            <label htmlFor={`${label}-${locale}`}>{locale.toUpperCase()}</label>
            <textarea
              id={`${label}-${locale}`}
              className="textarea-field"
              rows={rows}
              value={value[locale] ?? ''}
              onChange={(event) =>
                onChange({
                  ...value,
                  [locale]: event.target.value,
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function LocalizedListEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: LocalizedStringCollectionSet
  onChange: (value: LocalizedStringCollectionSet) => void
}) {
  return (
    <div className="editor-stack">
      <span className="stack-label">{label}</span>
      <div className="translation-grid">
        {locales.map((locale) => (
          <div key={locale} className="field-group">
            <label htmlFor={`${label}-${locale}`}>{locale.toUpperCase()}</label>
            <textarea
              id={`${label}-${locale}`}
              className="textarea-field"
              rows={4}
              value={value[locale].join('\n')}
              onChange={(event) =>
                onChange({
                  ...value,
                  [locale]: event.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminPage() {
  const { session, user } = useAuth()
  const { locale, t } = useLocale()
  const copy = {
    ru: {
      loading: 'Загружаю админ-панель...',
      mediaTitle: 'Центральная загрузка медиа',
      uploadLabel: 'Загрузить изображение или документ',
      scope: 'Область управления',
      managedOrganizations: 'Организации в управлении',
      currentOrganization: 'Текущая организация',
      create: 'Создание',
      newOrganization: 'Новая организация',
      organizationResource: 'Ресурс организации',
      eventSession: 'Событие',
      liveData: 'Актуальные данные',
      currentContent: 'Текущее содержимое организации',
      users: 'Пользователи',
      platformAccounts: 'Аккаунты платформы',
      memberships: 'Привязки',
      assignManager: 'Назначить менеджера в организацию',
      moderation: 'Модерация',
      providerProfiles: 'Профили исполнителей',
      providerServices: 'Услуги исполнителей',
      name: 'Название',
      type: 'Тип',
      address: 'Адрес',
      city: 'Город',
      description: 'Описание',
      capacity: 'Вместимость',
      slotMinutes: 'Размер слота, минут',
      location: 'Локация',
      start: 'Начало',
      end: 'Окончание',
      userLabel: 'Пользователь',
      organizationLabel: 'Организация',
      title: 'Роль',
      moderationNote: 'Комментарий модерации',
      summary: 'Краткое описание организации',
      amenities: 'Удобства',
      resourceSummary: 'Краткое описание ресурса',
      formats: 'Форматы',
      eventSummary: 'Краткое описание события',
      createOrganizationAction: 'Создать организацию',
      createResourceAction: 'Создать ресурс',
      createEventAction: 'Создать событие',
      assignAction: 'Назначить привязку',
      approve: 'Одобрить',
      reject: 'Отклонить',
      selectUser: 'Выберите пользователя',
      selectOrganization: 'Выберите организацию',
      minuteShort: 'мин',
    },
    en: {
      loading: 'Loading admin studio...',
      mediaTitle: 'Central media upload',
      uploadLabel: 'Upload image or document',
      scope: 'Scope',
      managedOrganizations: 'Managed organizations',
      currentOrganization: 'Current organization',
      create: 'Create',
      newOrganization: 'New organization',
      organizationResource: 'Organization resource',
      eventSession: 'Event session',
      liveData: 'Live data',
      currentContent: 'Current organization content',
      users: 'Users',
      platformAccounts: 'Platform accounts',
      memberships: 'Memberships',
      assignManager: 'Assign manager to organization',
      moderation: 'Moderation',
      providerProfiles: 'Provider profiles',
      providerServices: 'Provider services',
      name: 'Name',
      type: 'Type',
      address: 'Address',
      city: 'City',
      description: 'Description',
      capacity: 'Capacity',
      slotMinutes: 'Slot size, minutes',
      location: 'Location',
      start: 'Start',
      end: 'End',
      userLabel: 'User',
      organizationLabel: 'Organization',
      title: 'Title',
      moderationNote: 'Moderation note',
      summary: 'Organization summary',
      amenities: 'Amenities',
      resourceSummary: 'Resource summary',
      formats: 'Formats',
      eventSummary: 'Event summary',
      createOrganizationAction: 'Create organization',
      createResourceAction: 'Create resource',
      createEventAction: 'Create event',
      assignAction: 'Assign membership',
      approve: 'Approve',
      reject: 'Reject',
      selectUser: 'Select user',
      selectOrganization: 'Select organization',
      minuteShort: 'min',
    },
    vi: {
      loading: 'Dang tai khu quan tri...',
      mediaTitle: 'Tai media tap trung',
      uploadLabel: 'Tai anh hoac tai lieu',
      scope: 'Pham vi',
      managedOrganizations: 'To chuc dang quan ly',
      currentOrganization: 'To chuc hien tai',
      create: 'Tao moi',
      newOrganization: 'To chuc moi',
      organizationResource: 'Tai nguyen cua to chuc',
      eventSession: 'Phien su kien',
      liveData: 'Du lieu hien tai',
      currentContent: 'Noi dung hien tai cua to chuc',
      users: 'Nguoi dung',
      platformAccounts: 'Tai khoan nen tang',
      memberships: 'Lien ket',
      assignManager: 'Gan quan ly vao to chuc',
      moderation: 'Kiem duyet',
      providerProfiles: 'Ho so nha cung cap',
      providerServices: 'Dich vu nha cung cap',
      name: 'Ten',
      type: 'Loai',
      address: 'Dia chi',
      city: 'Thanh pho',
      description: 'Mo ta',
      capacity: 'Suc chua',
      slotMinutes: 'Do dai khung gio, phut',
      location: 'Dia diem',
      start: 'Bat dau',
      end: 'Ket thuc',
      userLabel: 'Nguoi dung',
      organizationLabel: 'To chuc',
      title: 'Chuc danh',
      moderationNote: 'Ghi chu kiem duyet',
      summary: 'Tom tat to chuc',
      amenities: 'Tien ich',
      resourceSummary: 'Tom tat tai nguyen',
      formats: 'Hinh thuc',
      eventSummary: 'Tom tat su kien',
      createOrganizationAction: 'Tao to chuc',
      createResourceAction: 'Tao tai nguyen',
      createEventAction: 'Tao su kien',
      assignAction: 'Gan lien ket',
      approve: 'Duyet',
      reject: 'Tu choi',
      selectUser: 'Chon nguoi dung',
      selectOrganization: 'Chon to chuc',
      minuteShort: 'phut',
    },
  }[locale]
  const token = session?.accessToken
  const isAdmin = session?.user.roles.includes('Admin') ?? false
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [organizationResources, setOrganizationResources] = useState<Resource[]>([])
  const [organizationEvents, setOrganizationEvents] = useState<EventSession[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [providerProfiles, setProviderProfiles] = useState<ProviderProfile[]>([])
  const [providerResources, setProviderResources] = useState<Resource[]>([])
  const [organizationForm, setOrganizationForm] = useState<OrganizationPayload>(() => buildOrganizationForm())
  const [resourceForm, setResourceForm] = useState<ResourcePayload>(() => buildResourceForm())
  const [eventForm, setEventForm] = useState<EventPayload>(() => buildEventForm())
  const [membershipForm, setMembershipForm] = useState<AssignManagerMembershipPayload>({
    userId: '',
    organizationId: '',
    title: 'Manager',
  })
  const [providerProfileReviewNote, setProviderProfileReviewNote] = useState<Record<string, string>>({})
  const [providerResourceReviewNote, setProviderResourceReviewNote] = useState<Record<string, string>>({})
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMediaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const manageableOrganizations = useMemo(() => {
    if (isAdmin) {
      return organizations
    }

    const allowedIds = new Set(user?.memberships.map((membership) => membership.organizationId) ?? [])
    return organizations.filter((organization) => allowedIds.has(organization.id))
  }, [isAdmin, organizations, user?.memberships])

  useEffect(() => {
    if (!token) {
      return
    }

    const accessToken = token
    let isMounted = true

    async function loadAdminStudio() {
      try {
        setLoading(true)
        const [nextOrganizations, nextUsers, nextProviderProfiles, nextProviderResources] =
          await Promise.all([
            api.getOrganizations(true),
            isAdmin ? api.getAdminUsers(accessToken) : Promise.resolve([]),
            isAdmin ? api.getProviderProfilesForReview(accessToken) : Promise.resolve([]),
            isAdmin ? api.getProviderResourcesForReview(accessToken) : Promise.resolve([]),
          ])

        if (!isMounted) {
          return
        }

        const initialOrganizationId =
          (selectedOrganizationId &&
          nextOrganizations.some((organization) => organization.id === selectedOrganizationId)
            ? selectedOrganizationId
            : '') ||
          nextOrganizations[0]?.id ||
          user?.memberships[0]?.organizationId ||
          ''

        setOrganizations(nextOrganizations)
        setUsers(nextUsers)
        setProviderProfiles(nextProviderProfiles)
        setProviderResources(nextProviderResources)
        setSelectedOrganizationId(initialOrganizationId)
        setResourceForm((current) => ({
          ...current,
          organizationId: initialOrganizationId,
        }))
        setEventForm((current) => ({
          ...current,
          organizationId: initialOrganizationId,
        }))
        setMembershipForm((current) => ({
          ...current,
          organizationId: initialOrganizationId,
        }))
        setError(null)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load admin studio.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadAdminStudio()

    return () => {
      isMounted = false
    }
  }, [isAdmin, selectedOrganizationId, token, user?.memberships])

  useEffect(() => {
    const accessToken = token
    let isMounted = true

    async function loadOrganizationDetails() {
      if (!accessToken || !selectedOrganizationId) {
        if (isMounted) {
          setOrganizationResources([])
          setOrganizationEvents([])
        }
        return
      }

      try {
        const [nextResources, nextEvents] = await Promise.all([
          api.getResources(selectedOrganizationId, true),
          api.getEvents(selectedOrganizationId, true),
        ])

        if (!isMounted) {
          return
        }

        setOrganizationResources(nextResources)
        setOrganizationEvents(nextEvents)
      } catch {
        if (isMounted) {
          setOrganizationResources([])
          setOrganizationEvents([])
        }
      }
    }

    void loadOrganizationDetails()

    return () => {
      isMounted = false
    }
  }, [selectedOrganizationId, token])

  if (!token) {
    return null
  }

  const accessToken = token

  async function handleUpload(file: File) {
    try {
      const response = await api.uploadMedia(file, 'admin', accessToken)
      setUploadedMedia(response)
      setMessage('Media uploaded. You can paste the URL into cover, logo, poster or avatar fields.')
      setError(null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload media.')
    }
  }

  async function handleCreateOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setWorking(true)
      const organization = await api.createOrganization(
        toOrganizationPayload(organizationForm),
        accessToken,
      )
      const nextOrganizations = [...organizations, organization].sort((left, right) =>
        left.name.localeCompare(right.name),
      )
      setOrganizations(nextOrganizations)
      setSelectedOrganizationId(organization.id)
      setOrganizationForm(buildOrganizationForm())
      setMessage(`Organization "${organization.name}" created.`)
      setError(null)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create organization.')
    } finally {
      setWorking(false)
    }
  }

  async function handleCreateResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrganizationId) {
      return
    }

    try {
      setWorking(true)
      const payload = toResourcePayload({
        ...resourceForm,
        organizationId: selectedOrganizationId,
      })
      const resource = await api.createResource(payload, accessToken)
      setOrganizationResources((current) => [...current, resource])
      setResourceForm(buildResourceForm(selectedOrganizationId))
      setMessage(`Resource "${resource.name}" created.`)
      setError(null)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create resource.')
    } finally {
      setWorking(false)
    }
  }

  async function handleCreateEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrganizationId) {
      return
    }

    try {
      setWorking(true)
      const payload = toEventPayload({
        ...eventForm,
        organizationId: selectedOrganizationId,
      })
      const nextEvent = await api.createEvent(payload, accessToken)
      setOrganizationEvents((current) => [...current, nextEvent])
      setEventForm(buildEventForm(selectedOrganizationId))
      setMessage(`Event "${nextEvent.name}" created.`)
      setError(null)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create event.')
    } finally {
      setWorking(false)
    }
  }

  async function handleAssignMembership(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isAdmin) {
      return
    }

    try {
      setWorking(true)
      await api.assignManagerMembership(
        {
          ...membershipForm,
          organizationId: membershipForm.organizationId || selectedOrganizationId,
        },
        accessToken,
      )
      setMessage('Manager membership assigned.')
      setError(null)
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Failed to assign membership.')
    } finally {
      setWorking(false)
    }
  }

  async function handleReviewProviderProfile(providerProfileId: string, status: ReviewPayload['status']) {
    try {
      setWorking(true)
      const updated = await api.reviewProviderProfile(
        providerProfileId,
        {
          status,
          note: providerProfileReviewNote[providerProfileId],
        },
        accessToken,
      )
      setProviderProfiles((current) =>
        current.map((item) => (item.id === providerProfileId ? updated : item)),
      )
      setMessage(`Provider profile ${formatModerationStatus(status, locale).toLowerCase()}.`)
      setError(null)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review provider profile.')
    } finally {
      setWorking(false)
    }
  }

  async function handleReviewProviderResource(resourceId: string, status: ReviewPayload['status']) {
    try {
      setWorking(true)
      const updated = await api.reviewProviderResource(
        resourceId,
        {
          status,
          note: providerResourceReviewNote[resourceId],
        },
        accessToken,
      )
      setProviderResources((current) =>
        current.map((item) => (item.id === resourceId ? updated : item)),
      )
      setMessage(`Provider service ${formatModerationStatus(status, locale).toLowerCase()}.`)
      setError(null)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review provider service.')
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return <LoadingBlock label={copy.loading} />
  }

  return (
    <div className="page-stack">
      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{t('nav.admin')}</span>
          <h1 className="section-title">{t('admin.title')}</h1>
          <p className="section-subtitle">
            {t('admin.subtitle')}
          </p>
        </header>

        <div className="dashboard-grid">
          <article className="metric-card">
            <span className="section-kicker">{t('admin.organizations')}</span>
            <strong className="metric-value">{organizations.length}</strong>
          </article>
          <article className="metric-card">
            <span className="section-kicker">{t('admin.resources')}</span>
            <strong className="metric-value">{organizationResources.length}</strong>
          </article>
          <article className="metric-card">
            <span className="section-kicker">{t('admin.events')}</span>
            <strong className="metric-value">{organizationEvents.length}</strong>
          </article>
        </div>

        {message ? <div className="message-banner">{message}</div> : null}
        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      <section className="admin-upload-card">
        <div className="section-stack">
          <span className="section-kicker">{t('admin.upload')}</span>
          <h2 className="section-title">{copy.mediaTitle}</h2>
        </div>

        <div className="field-group">
          <label htmlFor="admin-upload-file">{copy.uploadLabel}</label>
          <input
            id="admin-upload-file"
            className="input-field"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void handleUpload(file)
              }
            }}
          />
        </div>

        {uploadedMedia ? (
          <article className="compact-item">
            <div className="meta-line">
              <span className="type-pill">{uploadedMedia.storageProvider}</span>
              <strong>{uploadedMedia.fileName}</strong>
            </div>
            <p className="muted-code">{uploadedMedia.url}</p>
          </article>
        ) : null}
      </section>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{copy.scope}</span>
          <h2 className="section-title">{copy.managedOrganizations}</h2>
        </header>

        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="selected-organization">{copy.currentOrganization}</label>
            <select
              id="selected-organization"
              className="select-field"
              value={selectedOrganizationId}
              onChange={(event) => {
                const value = event.target.value
                setSelectedOrganizationId(value)
                setResourceForm((current) => ({ ...current, organizationId: value }))
                setEventForm((current) => ({ ...current, organizationId: value }))
                setMembershipForm((current) => ({ ...current, organizationId: value }))
              }}
            >
              {manageableOrganizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-like">
          {manageableOrganizations.map((organization) => (
            <article key={organization.id} className="table-row">
              <header>
                <div>
                  <strong>{organization.name}</strong>
                  <div className="meta-line">
                    <span className="type-pill">{formatOrganizationType(organization.type, locale)}</span>
                    <span className={organization.isActive ? 'status-pill success' : 'status-pill warning'}>
                      {organization.isActive ? t('organization.available') : t('organization.inactive')}
                    </span>
                  </div>
                </div>
              </header>
              <p>{pickLocalizedText(organization.content.summary, locale, organization.description)}</p>
            </article>
          ))}
        </div>
      </section>

      {selectedOrganizationId ? (
        <OrganizationAnalyticsPanel
          organizationId={selectedOrganizationId}
          token={token}
          isAdmin={isAdmin}
        />
      ) : null}

      {selectedOrganizationId ? (
        <OrganizationJoinRequestsPanel
          organizationId={selectedOrganizationId}
          token={token}
        />
      ) : null}

      <div className="admin-grid">
        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.create}</span>
            <h2 className="section-title">{copy.newOrganization}</h2>
          </header>

          <form className="form-stack" onSubmit={handleCreateOrganization}>
            <div className="form-grid">
              <div className="field-group">
                <label htmlFor="organization-name">{copy.name}</label>
                <input
                  id="organization-name"
                  className="input-field"
                  value={organizationForm.name}
                  onChange={(event) =>
                    setOrganizationForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="organization-type">{copy.type}</label>
                <select
                  id="organization-type"
                  className="select-field"
                  value={organizationForm.type}
                  onChange={(event) =>
                    setOrganizationForm((current) => ({
                      ...current,
                      type: event.target.value as OrganizationType,
                    }))
                  }
                >
                  {organizationTypes.map((organizationType) => (
                    <option key={organizationType} value={organizationType}>
                      {formatOrganizationType(organizationType, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="organization-address">{copy.address}</label>
                <input
                  id="organization-address"
                  className="input-field"
                  value={organizationForm.address}
                  onChange={(event) =>
                    setOrganizationForm((current) => ({ ...current, address: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="organization-city">{copy.city}</label>
                <input
                  id="organization-city"
                  className="input-field"
                  value={organizationForm.city ?? ''}
                  onChange={(event) =>
                    setOrganizationForm((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </div>

              <div className="field-group wide-span">
                <label htmlFor="organization-description">{copy.description}</label>
                <textarea
                  id="organization-description"
                  className="textarea-field"
                  rows={4}
                  value={organizationForm.description}
                  onChange={(event) =>
                    setOrganizationForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <LocalizedTextEditor
              label={copy.summary}
              value={organizationForm.content.summary}
              onChange={(value) =>
                setOrganizationForm((current) => ({
                  ...current,
                  content: { ...current.content, summary: value },
                }))
              }
            />

            <LocalizedListEditor
              label={copy.amenities}
              value={organizationForm.content.amenities}
              onChange={(value) =>
                setOrganizationForm((current) => ({
                  ...current,
                  content: { ...current.content, amenities: value },
                }))
              }
            />

            <div className="card-actions">
              <button className="solid-button" type="submit" disabled={working}>
                {copy.createOrganizationAction}
              </button>
            </div>
          </form>
        </section>

        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.create}</span>
            <h2 className="section-title">{copy.organizationResource}</h2>
          </header>

          <form className="form-stack" onSubmit={handleCreateResource}>
            <div className="form-grid">
              <div className="field-group">
                <label htmlFor="resource-name">{copy.name}</label>
                <input
                  id="resource-name"
                  className="input-field"
                  value={resourceForm.name}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="resource-type">{copy.type}</label>
                <select
                  id="resource-type"
                  className="select-field"
                  value={resourceForm.type}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      type: event.target.value as ResourceType,
                    }))
                  }
                >
                  {resourceTypes.map((resourceType) => (
                    <option key={resourceType} value={resourceType}>
                      {formatResourceType(resourceType, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="resource-capacity">{copy.capacity}</label>
                <input
                  id="resource-capacity"
                  className="input-field"
                  type="number"
                  min={1}
                  value={resourceForm.capacity}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      capacity: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="resource-slot">{copy.slotMinutes}</label>
                <input
                  id="resource-slot"
                  className="input-field"
                  type="number"
                  min={15}
                  step={15}
                  value={resourceForm.slotSizeMinutes}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      slotSizeMinutes: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-group wide-span">
                <label htmlFor="resource-description">{copy.description}</label>
                <textarea
                  id="resource-description"
                  className="textarea-field"
                  rows={4}
                  value={resourceForm.description ?? ''}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <LocalizedTextEditor
              label={copy.resourceSummary}
              value={resourceForm.content.summary}
              onChange={(value) =>
                setResourceForm((current) => ({
                  ...current,
                  content: { ...current.content, summary: value },
                }))
              }
            />

            <LocalizedListEditor
              label={copy.formats}
              value={resourceForm.content.formats}
              onChange={(value) =>
                setResourceForm((current) => ({
                  ...current,
                  content: { ...current.content, formats: value },
                }))
              }
            />

            <div className="card-actions">
              <button className="solid-button" type="submit" disabled={working || !selectedOrganizationId}>
                {copy.createResourceAction}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div className="admin-grid">
        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.create}</span>
            <h2 className="section-title">{copy.eventSession}</h2>
          </header>

          <form className="form-stack" onSubmit={handleCreateEvent}>
            <div className="form-grid">
              <div className="field-group">
                <label htmlFor="event-name">{copy.name}</label>
                <input
                  id="event-name"
                  className="input-field"
                  value={eventForm.name}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="event-location">{copy.location}</label>
                <input
                  id="event-location"
                  className="input-field"
                  value={eventForm.location}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, location: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="event-start">{copy.start}</label>
                <input
                  id="event-start"
                  className="input-field"
                  type="datetime-local"
                  value={toDateTimeLocalValue(eventForm.startAtUtc)}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      startAtUtc: new Date(event.target.value).toISOString(),
                    }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="event-end">{copy.end}</label>
                <input
                  id="event-end"
                  className="input-field"
                  type="datetime-local"
                  value={toDateTimeLocalValue(eventForm.endAtUtc)}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      endAtUtc: new Date(event.target.value).toISOString(),
                    }))
                  }
                />
              </div>

              <div className="field-group wide-span">
                <label htmlFor="event-description">{copy.description}</label>
                <textarea
                  id="event-description"
                  className="textarea-field"
                  rows={4}
                  value={eventForm.description}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <LocalizedTextEditor
              label={copy.eventSummary}
              value={eventForm.content.summary}
              onChange={(value) =>
                setEventForm((current) => ({
                  ...current,
                  content: { ...current.content, summary: value },
                }))
              }
            />

            <div className="card-actions">
              <button className="solid-button" type="submit" disabled={working || !selectedOrganizationId}>
                {copy.createEventAction}
              </button>
            </div>
          </form>
        </section>

        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.liveData}</span>
            <h2 className="section-title">{copy.currentContent}</h2>
          </header>

          <div className="table-like">
            {organizationResources.map((resource) => (
              <article key={resource.id} className="table-row">
                <header>
                  <div>
                    <strong>{resource.name}</strong>
                    <div className="meta-line">
                      <span className="type-pill">{formatResourceType(resource.type, locale)}</span>
                      <span className="metric-pill">{resource.slotSizeMinutes} {copy.minuteShort}</span>
                    </div>
                  </div>
                </header>
                <p>{pickLocalizedText(resource.content.summary, locale, resource.description ?? '')}</p>
              </article>
            ))}

            {organizationEvents.map((eventSession) => (
              <article key={eventSession.id} className="table-row">
                <header>
                  <div>
                    <strong>{eventSession.name}</strong>
                    <div className="meta-line">
                      <span className="type-pill">{eventSession.location}</span>
                    </div>
                  </div>
                </header>
                <p>{formatDateTime(eventSession.startAtUtc, locale)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {isAdmin ? (
        <>
          <div className="admin-grid">
            <section className="surface-card section-stack">
              <header>
                <span className="section-kicker">{copy.users}</span>
                <h2 className="section-title">{copy.platformAccounts}</h2>
              </header>

              <div className="table-like">
                {users.map((account) => (
                  <article key={account.id} className="table-row">
                    <header>
                      <div>
                        <strong>{account.email}</strong>
                        <div className="meta-line">
                          {account.roles.map((role) => (
                            <span key={role} className="type-pill">
                              {formatUserRole(role, locale)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </header>
                    <p>
                      {account.firstName} {account.lastName}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="surface-card section-stack">
              <header>
                <span className="section-kicker">{copy.memberships}</span>
                <h2 className="section-title">{copy.assignManager}</h2>
              </header>

              <form className="form-stack" onSubmit={handleAssignMembership}>
                <div className="field-group">
                  <label htmlFor="membership-user">{copy.userLabel}</label>
                  <select
                    id="membership-user"
                    className="select-field"
                    value={membershipForm.userId}
                    onChange={(event) =>
                      setMembershipForm((current) => ({ ...current, userId: event.target.value }))
                    }
                  >
                    <option value="">{copy.selectUser}</option>
                    {users.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="membership-organization">{copy.organizationLabel}</label>
                  <select
                    id="membership-organization"
                    className="select-field"
                    value={membershipForm.organizationId}
                    onChange={(event) =>
                      setMembershipForm((current) => ({
                        ...current,
                        organizationId: event.target.value,
                      }))
                    }
                  >
                    <option value="">{copy.selectOrganization}</option>
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="membership-title">{copy.title}</label>
                  <input
                    id="membership-title"
                    className="input-field"
                    value={membershipForm.title}
                    onChange={(event) =>
                      setMembershipForm((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                </div>

                <div className="card-actions">
                  <button className="solid-button" type="submit" disabled={working}>
                    {copy.assignAction}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="admin-grid">
            <section className="surface-card section-stack">
              <header>
                <span className="section-kicker">{copy.moderation}</span>
                <h2 className="section-title">{copy.providerProfiles}</h2>
              </header>

              <div className="table-like">
                {providerProfiles.map((providerProfile) => (
                  <article key={providerProfile.id} className="table-row">
                    <header>
                      <div className="section-stack">
                        <div className="pill-row">
                          <span className="type-pill">{providerProfile.city ?? providerProfile.timeZone}</span>
                          <span
                            className={
                              providerProfile.approvalStatus === 'Approved'
                                ? 'status-pill success'
                                : providerProfile.approvalStatus === 'Rejected'
                                  ? 'status-pill danger'
                                  : 'status-pill warning'
                            }
                          >
                            {formatModerationStatus(providerProfile.approvalStatus, locale)}
                          </span>
                        </div>
                        <strong>{providerProfile.displayName}</strong>
                      </div>
                    </header>

                    <p>{pickLocalizedText(providerProfile.content.summary, locale, providerProfile.headline)}</p>

                    <div className="field-group">
                      <label htmlFor={`provider-note-${providerProfile.id}`}>{copy.moderationNote}</label>
                      <textarea
                        id={`provider-note-${providerProfile.id}`}
                        className="textarea-field"
                        rows={3}
                        value={providerProfileReviewNote[providerProfile.id] ?? ''}
                        onChange={(event) =>
                          setProviderProfileReviewNote((current) => ({
                            ...current,
                            [providerProfile.id]: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="card-actions">
                      <button
                        type="button"
                        className="solid-button"
                        disabled={working}
                        onClick={() => void handleReviewProviderProfile(providerProfile.id, 'Approved')}
                      >
                        {copy.approve}
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        disabled={working}
                        onClick={() => void handleReviewProviderProfile(providerProfile.id, 'Rejected')}
                      >
                        {copy.reject}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="surface-card section-stack">
              <header>
                <span className="section-kicker">{copy.moderation}</span>
                <h2 className="section-title">{copy.providerServices}</h2>
              </header>

              <div className="table-like">
                {providerResources.map((resource) => (
                  <article key={resource.id} className="table-row">
                    <header>
                      <div className="section-stack">
                        <div className="pill-row">
                          <span className="type-pill">{resource.providerDisplayName}</span>
                          <span
                            className={
                              resource.approvalStatus === 'Approved'
                                ? 'status-pill success'
                                : resource.approvalStatus === 'Rejected'
                                  ? 'status-pill danger'
                                  : 'status-pill warning'
                            }
                          >
                            {formatModerationStatus(resource.approvalStatus, locale)}
                          </span>
                        </div>
                        <strong>{resource.name}</strong>
                      </div>
                    </header>

                    <p>{pickLocalizedText(resource.content.summary, locale, resource.description ?? '')}</p>

                    <div className="field-group">
                      <label htmlFor={`resource-note-${resource.id}`}>{copy.moderationNote}</label>
                      <textarea
                        id={`resource-note-${resource.id}`}
                        className="textarea-field"
                        rows={3}
                        value={providerResourceReviewNote[resource.id] ?? ''}
                        onChange={(event) =>
                          setProviderResourceReviewNote((current) => ({
                            ...current,
                            [resource.id]: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="card-actions">
                      <button
                        type="button"
                        className="solid-button"
                        disabled={working}
                        onClick={() => void handleReviewProviderResource(resource.id, 'Approved')}
                      >
                        {copy.approve}
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        disabled={working}
                        onClick={() => void handleReviewProviderResource(resource.id, 'Rejected')}
                      >
                        {copy.reject}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  )
}
