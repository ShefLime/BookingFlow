import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { LoadingBlock } from '../components/LoadingBlock'
import { ProviderOrganizationRequestsPanel } from '../components/ProviderOrganizationRequestsPanel'
import { useLocale } from '../i18n/LocaleContext'
import { api } from '../lib/api'
import {
  formatDayOfWeek,
  formatModerationStatus,
  formatResourceType,
  pickLocalizedText,
} from '../lib/format'
import type {
  AvailabilityRule,
  AvailabilityRulePayload,
  DayOfWeekName,
  LocalizedStringCollectionSet,
  LocalizedTextSet,
  Locale,
  Organization,
  ProviderContent,
  ProviderProfile,
  ProviderProfilePayload,
  ProviderResourcePayload,
  Resource,
  ResourceContent,
  ResourceType,
  UploadedMediaResponse,
} from '../types/api'

const resourceTypes: ResourceType[] = [
  'Trainer',
  'Table',
  'Room',
  'Court',
  'Hall',
  'ServiceSpot',
  'VipTable',
]

const weekDays: DayOfWeekName[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const locales: Locale[] = ['ru', 'en', 'vi']

function emptyLocalizedText(): LocalizedTextSet {
  return { ru: '', en: '', vi: '' }
}

function emptyLocalizedList(): LocalizedStringCollectionSet {
  return { ru: [], en: [], vi: [] }
}

function emptyProviderContent(): ProviderContent {
  return {
    summary: emptyLocalizedText(),
    biography: emptyLocalizedText(),
    approach: emptyLocalizedText(),
    quote: emptyLocalizedText(),
    specialties: emptyLocalizedList(),
    highlights: emptyLocalizedList(),
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

function buildProfileForm(): ProviderProfilePayload {
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

function buildServiceForm(): ProviderResourcePayload {
  return {
    name: '',
    type: 'ServiceSpot',
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

function buildRuleForm(resourceId: string): AvailabilityRulePayload {
  return {
    resourceId,
    dayOfWeek: 'Saturday',
    startTime: '06:00:00',
    endTime: '09:00:00',
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

function toProviderPayload(form: ProviderProfilePayload): ProviderProfilePayload {
  return {
    ...form,
    city: normalizeOptionalText(form.city),
    location: normalizeOptionalText(form.location),
    avatarImageUrl: normalizeOptionalText(form.avatarImageUrl),
    coverImageUrl: normalizeOptionalText(form.coverImageUrl),
    content: {
      summary: normalizeLocalizedText(form.content.summary),
      biography: normalizeLocalizedText(form.content.biography),
      approach: normalizeLocalizedText(form.content.approach),
      quote: normalizeLocalizedText(form.content.quote),
      specialties: normalizeLocalizedList(form.content.specialties),
      highlights: normalizeLocalizedList(form.content.highlights),
    },
  }
}

function toProviderResourcePayload(form: ProviderResourcePayload): ProviderResourcePayload {
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
            <label htmlFor={`${label}-list-${locale}`}>{locale.toUpperCase()}</label>
            <textarea
              id={`${label}-list-${locale}`}
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

export function ProviderStudioPage() {
  const { session, refreshProfile, user } = useAuth()
  const { locale } = useLocale()
  const token = session?.accessToken
  const hasToken = Boolean(token)
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [services, setServices] = useState<Resource[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [profileForm, setProfileForm] = useState<ProviderProfilePayload>(() => buildProfileForm())
  const [serviceForm, setServiceForm] = useState<ProviderResourcePayload>(() => buildServiceForm())
  const [ruleForm, setRuleForm] = useState<AvailabilityRulePayload>(() => buildRuleForm(''))
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMediaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProviderStudio = useEffectEvent(async (isMounted: () => boolean) => {
    if (!token) {
      return
    }

    try {
      setLoading(true)
      const [nextProfile, nextServices, nextOrganizations] = await Promise.all([
        api.getMyProviderProfile(token),
        api.getMyProviderResources(token),
        api.getOrganizations(),
      ])

      if (!isMounted()) {
        return
      }

      setProfile(nextProfile)
      setOrganizations(nextOrganizations)
      setServices(nextServices)
      setSelectedServiceId((current) => current || nextServices[0]?.id || '')
      setRuleForm(buildRuleForm(nextServices[0]?.id ?? ''))

      if (nextProfile) {
        setProfileForm({
          displayName: nextProfile.displayName,
          headline: nextProfile.headline,
          city: nextProfile.city ?? '',
          timeZone: nextProfile.timeZone,
          location: nextProfile.location ?? '',
          avatarImageUrl: nextProfile.avatarImageUrl ?? '',
          coverImageUrl: nextProfile.coverImageUrl ?? '',
          gallery: nextProfile.gallery,
          documents: nextProfile.documents,
          content: nextProfile.content,
        })
      }

      setError(null)
    } catch (loadError) {
      if (isMounted()) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load provider studio.')
      }
    } finally {
      if (isMounted()) {
        setLoading(false)
      }
    }
  })

  const loadRules = useEffectEvent(async (isMounted: () => boolean) => {
    if (!selectedServiceId) {
      if (isMounted()) {
        setRules([])
      }
      return
    }

    try {
      const nextRules = await api.getAvailabilityRules(selectedServiceId)
      if (isMounted()) {
        setRules(nextRules)
      }
    } catch {
      if (isMounted()) {
        setRules([])
      }
    }
  })

  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true

    void loadProviderStudio(() => isMounted)

    return () => {
      isMounted = false
    }
  }, [hasToken, loadProviderStudio])

  useEffect(() => {
    let isMounted = true

    void loadRules(() => isMounted)

    return () => {
      isMounted = false
    }
  }, [selectedServiceId, loadRules])

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  )

  if (!token) {
    return null
  }

  const accessToken = token

  async function handleUpload(file: File) {
    try {
      const response = await api.uploadMedia(file, 'providers', accessToken)
      setUploadedMedia(response)
      setMessage('File uploaded. You can paste the URL into the profile or service form.')
      setError(null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload media.')
    }
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSaving(true)
      const nextProfile = await api.upsertProviderProfile(
        toProviderPayload(profileForm),
        accessToken,
      )
      setProfile(nextProfile)
      setMessage('Provider profile saved and sent for moderation.')
      setError(null)
      await refreshProfile()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save provider profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSaving(true)
      const nextService = await api.createProviderResource(
        toProviderResourcePayload(serviceForm),
        accessToken,
      )
      const nextServices = [...services, nextService]
      setServices(nextServices)
      setSelectedServiceId(nextService.id)
      setRuleForm(buildRuleForm(nextService.id))
      setServiceForm(buildServiceForm())
      setMessage('Service saved and sent for moderation.')
      setError(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create service.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedServiceId) {
      return
    }

    try {
      setSaving(true)
      const nextRule = await api.createAvailabilityRule(
        {
          ...ruleForm,
          resourceId: selectedServiceId,
        },
        accessToken,
      )
      setRules((current) => [...current, nextRule])
      setMessage('Availability rule added.')
      setError(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create availability rule.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading provider studio..." />
  }

  if (!token) {
    return <LoadingBlock label="Loading provider studio..." />
  }

  return (
    <div className="page-stack">
      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">Provider Studio</span>
          <h1 className="section-title">
            {profile?.displayName ?? `${user?.firstName ?? 'New'} ${user?.lastName ?? 'provider'}`}
          </h1>
          <p className="section-subtitle">
            Independent providers can publish services without an organization. Profiles and services stay hidden until an administrator approves them.
          </p>
        </header>

        {profile ? (
          <div className="info-banner">
            {formatModerationStatus(profile.approvalStatus, locale)}
            {profile.moderationNote ? `: ${profile.moderationNote}` : ''}
          </div>
        ) : (
          <div className="info-banner">
            No provider profile yet. Create one to start offering your own services.
          </div>
        )}

        {message ? <div className="message-banner">{message}</div> : null}
        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      <ProviderOrganizationRequestsPanel
        organizations={organizations}
        affiliations={profile?.affiliations ?? []}
        token={token}
      />

      <div className="admin-grid">
        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">Profile</span>
            <h2 className="section-title">Public provider page</h2>
          </header>

          <form className="form-stack" onSubmit={handleSaveProfile}>
            <div className="form-grid">
              <div className="field-group">
                <label htmlFor="provider-display-name">Display name</label>
                <input
                  id="provider-display-name"
                  className="input-field"
                  value={profileForm.displayName}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, displayName: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="provider-headline">Headline</label>
                <input
                  id="provider-headline"
                  className="input-field"
                  value={profileForm.headline}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, headline: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="provider-city">City</label>
                <input
                  id="provider-city"
                  className="input-field"
                  value={profileForm.city ?? ''}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="provider-time-zone">Time zone</label>
                <input
                  id="provider-time-zone"
                  className="input-field"
                  value={profileForm.timeZone}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, timeZone: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-group wide-span">
                <label htmlFor="provider-location">Location</label>
                <input
                  id="provider-location"
                  className="input-field"
                  value={profileForm.location ?? ''}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, location: event.target.value }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="provider-avatar">Avatar URL</label>
                <input
                  id="provider-avatar"
                  className="input-field"
                  value={profileForm.avatarImageUrl ?? ''}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, avatarImageUrl: event.target.value }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="provider-cover">Cover URL</label>
                <input
                  id="provider-cover"
                  className="input-field"
                  value={profileForm.coverImageUrl ?? ''}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, coverImageUrl: event.target.value }))
                  }
                />
              </div>
            </div>

            <LocalizedTextEditor
              label="Summary"
              value={profileForm.content.summary}
              onChange={(value) =>
                setProfileForm((current) => ({
                  ...current,
                  content: { ...current.content, summary: value },
                }))
              }
            />

            <LocalizedTextEditor
              label="Biography"
              rows={4}
              value={profileForm.content.biography}
              onChange={(value) =>
                setProfileForm((current) => ({
                  ...current,
                  content: { ...current.content, biography: value },
                }))
              }
            />

            <LocalizedListEditor
              label="Specialties"
              value={profileForm.content.specialties}
              onChange={(value) =>
                setProfileForm((current) => ({
                  ...current,
                  content: { ...current.content, specialties: value },
                }))
              }
            />

            <LocalizedListEditor
              label="Highlights"
              value={profileForm.content.highlights}
              onChange={(value) =>
                setProfileForm((current) => ({
                  ...current,
                  content: { ...current.content, highlights: value },
                }))
              }
            />

            <div className="card-actions">
              <button className="solid-button" type="submit" disabled={saving}>
                Save provider profile
              </button>
            </div>
          </form>
        </section>

        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">Media</span>
            <h2 className="section-title">Upload to S3 / MinIO</h2>
          </header>

          <div className="field-group">
            <label htmlFor="provider-upload">Upload image or document</label>
            <input
              id="provider-upload"
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
              <a href={uploadedMedia.url} target="_blank" rel="noreferrer" className="primary-link-button">
                Open media
              </a>
            </article>
          ) : null}

          <div className="info-banner">
            Upload a file here, then paste the generated URL into the avatar, cover or gallery fields.
          </div>
        </section>
      </div>

      <div className="admin-grid">
        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">Services</span>
            <h2 className="section-title">Create a bookable service</h2>
          </header>

          <form className="form-stack" onSubmit={handleCreateService}>
            <div className="form-grid">
              <div className="field-group">
                <label htmlFor="service-name">Service name</label>
                <input
                  id="service-name"
                  className="input-field"
                  value={serviceForm.name}
                  onChange={(event) =>
                    setServiceForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="service-type">Type</label>
                <select
                  id="service-type"
                  className="select-field"
                  value={serviceForm.type}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      type: event.target.value as ResourceType,
                    }))
                  }
                >
                  {resourceTypes.map((resourceType) => (
                    <option key={resourceType} value={resourceType}>
                      {resourceType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="service-location">Location</label>
                <input
                  id="service-location"
                  className="input-field"
                  value={serviceForm.location ?? ''}
                  onChange={(event) =>
                    setServiceForm((current) => ({ ...current, location: event.target.value }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="service-capacity">Capacity</label>
                <input
                  id="service-capacity"
                  className="input-field"
                  type="number"
                  min={1}
                  value={serviceForm.capacity}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      capacity: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="service-slot">Slot size, minutes</label>
                <input
                  id="service-slot"
                  className="input-field"
                  type="number"
                  min={15}
                  step={15}
                  value={serviceForm.slotSizeMinutes}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      slotSizeMinutes: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="service-price">Price from</label>
                <input
                  id="service-price"
                  className="input-field"
                  type="number"
                  min={0}
                  value={serviceForm.priceFrom ?? ''}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      priceFrom: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-group wide-span">
                <label htmlFor="service-description">Description</label>
                <textarea
                  id="service-description"
                  className="textarea-field"
                  rows={4}
                  value={serviceForm.description ?? ''}
                  onChange={(event) =>
                    setServiceForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </div>
            </div>

            <LocalizedTextEditor
              label="Service summary"
              value={serviceForm.content.summary}
              onChange={(value) =>
                setServiceForm((current) => ({
                  ...current,
                  content: { ...current.content, summary: value },
                }))
              }
            />

            <LocalizedListEditor
              label="Formats"
              value={serviceForm.content.formats}
              onChange={(value) =>
                setServiceForm((current) => ({
                  ...current,
                  content: { ...current.content, formats: value },
                }))
              }
            />

            <LocalizedListEditor
              label="Specialties"
              value={serviceForm.content.specialties}
              onChange={(value) =>
                setServiceForm((current) => ({
                  ...current,
                  content: { ...current.content, specialties: value },
                }))
              }
            />

            <div className="card-actions">
              <button className="solid-button" type="submit" disabled={saving || !profile}>
                Create service
              </button>
            </div>
          </form>
        </section>

        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">My services</span>
            <h2 className="section-title">Moderation and schedule</h2>
          </header>

          {services.length === 0 ? (
            <div className="empty-state">
              <h3>No services yet</h3>
              <p>Create your first offer after saving the provider profile.</p>
            </div>
          ) : (
            <div className="table-like">
              {services.map((service) => (
                <article key={service.id} className="table-row">
                  <header>
                    <div className="section-stack">
                      <div className="pill-row">
                        <span className="type-pill">{formatResourceType(service.type, locale)}</span>
                        <span
                          className={
                            service.approvalStatus === 'Approved'
                              ? 'status-pill success'
                              : service.approvalStatus === 'Rejected'
                                ? 'status-pill danger'
                                : 'status-pill warning'
                          }
                        >
                          {formatModerationStatus(service.approvalStatus, locale)}
                        </span>
                      </div>
                      <strong>{service.name}</strong>
                    </div>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setSelectedServiceId(service.id)
                        setRuleForm(buildRuleForm(service.id))
                      }}
                    >
                      Manage schedule
                    </button>
                  </header>
                  <p>{pickLocalizedText(service.content.summary, locale, service.description ?? '')}</p>
                  {service.moderationNote ? (
                    <div className="info-banner">{service.moderationNote}</div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">Availability</span>
          <h2 className="section-title">{selectedService?.name ?? 'Choose a service to manage the schedule'}</h2>
        </header>

        {selectedService ? (
          <>
            <form className="form-grid" onSubmit={handleCreateRule}>
              <div className="field-group">
                <label htmlFor="rule-day">Day of week</label>
                <select
                  id="rule-day"
                  className="select-field"
                  value={ruleForm.dayOfWeek}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      dayOfWeek: event.target.value as DayOfWeekName,
                    }))
                  }
                >
                  {weekDays.map((day) => (
                    <option key={day} value={day}>
                      {formatDayOfWeek(day, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="rule-start">Start</label>
                <input
                  id="rule-start"
                  className="input-field"
                  type="time"
                  step={60}
                  value={ruleForm.startTime.slice(0, 5)}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      startTime: `${event.target.value}:00`,
                    }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="rule-end">End</label>
                <input
                  id="rule-end"
                  className="input-field"
                  type="time"
                  step={60}
                  value={ruleForm.endTime.slice(0, 5)}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      endTime: `${event.target.value}:00`,
                    }))
                  }
                />
              </div>

              <div className="field-group">
                <label htmlFor="rule-resource">Selected service</label>
                <select
                  id="rule-resource"
                  className="select-field"
                  value={selectedServiceId}
                  onChange={(event) => {
                    setSelectedServiceId(event.target.value)
                    setRuleForm(buildRuleForm(event.target.value))
                  }}
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wide-span card-actions">
                <button className="solid-button" type="submit" disabled={saving}>
                  Add availability rule
                </button>
              </div>
            </form>

            <div className="table-like">
              {rules.map((rule) => (
                <article key={rule.id} className="table-row">
                  <header>
                    <strong>{formatDayOfWeek(rule.dayOfWeek, locale)}</strong>
                    <span className={rule.isActive ? 'status-pill success' : 'status-pill warning'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </header>
                  <div className="meta-line">
                    <span className="inline-pill">Window</span>
                    <span>
                      {rule.startTime.slice(0, 5)} - {rule.endTime.slice(0, 5)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>Choose or create a service first</h3>
          </div>
        )}
      </section>
    </div>
  )
}
