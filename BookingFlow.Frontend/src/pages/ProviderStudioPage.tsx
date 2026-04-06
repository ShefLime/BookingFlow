import { useEffect, useMemo, useState } from 'react'
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
  const copy = {
    ru: {
      loading: 'Загружаю кабинет исполнителя...',
      loadFailed: 'Не удалось загрузить кабинет исполнителя.',
      uploadSuccess: 'Файл загружен. URL можно вставить в поля профиля или услуги.',
      uploadFailed: 'Не удалось загрузить медиа.',
      profileSaved: 'Профиль исполнителя сохранён и отправлен на модерацию.',
      profileSaveFailed: 'Не удалось сохранить профиль исполнителя.',
      serviceSaved: 'Услуга сохранена и отправлена на модерацию.',
      serviceSaveFailed: 'Не удалось создать услугу.',
      ruleAdded: 'Правило доступности добавлено.',
      ruleFailed: 'Не удалось создать правило доступности.',
      title: 'Кабинет исполнителя',
      subtitle: 'Независимые исполнители могут публиковать услуги без организации. Профиль и услуги станут видны после одобрения администратором.',
      noProfile: 'Пока нет профиля исполнителя. Создайте его, чтобы начать публиковать свои услуги.',
      profile: 'Профиль',
      publicPage: 'Публичная страница исполнителя',
      displayName: 'Отображаемое имя',
      headline: 'Позиционирование',
      city: 'Город',
      timeZone: 'Часовой пояс',
      location: 'Локация',
      avatarUrl: 'URL аватара',
      coverUrl: 'URL обложки',
      summary: 'Краткое описание',
      biography: 'Биография',
      specialties: 'Специализация',
      highlights: 'Сильные стороны',
      saveProfile: 'Сохранить профиль',
      media: 'Медиа',
      uploadTitle: 'Загрузка в S3 / MinIO',
      uploadLabel: 'Загрузить изображение или документ',
      openMedia: 'Открыть файл',
      uploadHint: 'Загрузите файл и вставьте полученный URL в поля аватара, обложки или галереи.',
      services: 'Услуги',
      createService: 'Создать услугу для записи',
      serviceName: 'Название услуги',
      type: 'Тип',
      capacity: 'Вместимость',
      slotMinutes: 'Размер слота, минут',
      priceFrom: 'Цена от',
      description: 'Описание',
      serviceSummary: 'Краткое описание услуги',
      formats: 'Форматы',
      createServiceAction: 'Создать услугу',
      myServices: 'Мои услуги',
      moderationAndSchedule: 'Модерация и расписание',
      noServices: 'Пока нет услуг',
      createAfterProfile: 'Сохраните профиль исполнителя, а затем создайте первое предложение.',
      manageSchedule: 'Управлять расписанием',
      availability: 'Доступность',
      chooseService: 'Выберите услугу, чтобы управлять расписанием',
      newProvider: 'Новый исполнитель',
      dayOfWeek: 'День недели',
      start: 'Начало',
      end: 'Окончание',
      selectedService: 'Выбранная услуга',
      addRule: 'Добавить правило доступности',
      active: 'Активно',
      inactive: 'Неактивно',
      window: 'Интервал',
      chooseFirst: 'Сначала выберите или создайте услугу',
    },
    en: {
      loading: 'Loading provider studio...',
      loadFailed: 'Failed to load provider studio.',
      uploadSuccess: 'File uploaded. You can paste the URL into the profile or service form.',
      uploadFailed: 'Failed to upload media.',
      profileSaved: 'Provider profile saved and sent for moderation.',
      profileSaveFailed: 'Failed to save provider profile.',
      serviceSaved: 'Service saved and sent for moderation.',
      serviceSaveFailed: 'Failed to create service.',
      ruleAdded: 'Availability rule added.',
      ruleFailed: 'Failed to create availability rule.',
      title: 'Provider Studio',
      subtitle: 'Independent providers can publish services without an organization. Profiles and services stay hidden until an administrator approves them.',
      noProfile: 'No provider profile yet. Create one to start offering your own services.',
      profile: 'Profile',
      publicPage: 'Public provider page',
      displayName: 'Display name',
      headline: 'Headline',
      city: 'City',
      timeZone: 'Time zone',
      location: 'Location',
      avatarUrl: 'Avatar URL',
      coverUrl: 'Cover URL',
      summary: 'Summary',
      biography: 'Biography',
      specialties: 'Specialties',
      highlights: 'Highlights',
      saveProfile: 'Save provider profile',
      media: 'Media',
      uploadTitle: 'Upload to S3 / MinIO',
      uploadLabel: 'Upload image or document',
      openMedia: 'Open media',
      uploadHint: 'Upload a file here, then paste the generated URL into the avatar, cover or gallery fields.',
      services: 'Services',
      createService: 'Create a bookable service',
      serviceName: 'Service name',
      type: 'Type',
      capacity: 'Capacity',
      slotMinutes: 'Slot size, minutes',
      priceFrom: 'Price from',
      description: 'Description',
      serviceSummary: 'Service summary',
      formats: 'Formats',
      createServiceAction: 'Create service',
      myServices: 'My services',
      moderationAndSchedule: 'Moderation and schedule',
      noServices: 'No services yet',
      createAfterProfile: 'Create your first offer after saving the provider profile.',
      manageSchedule: 'Manage schedule',
      availability: 'Availability',
      chooseService: 'Choose a service to manage the schedule',
      newProvider: 'New provider',
      dayOfWeek: 'Day of week',
      start: 'Start',
      end: 'End',
      selectedService: 'Selected service',
      addRule: 'Add availability rule',
      active: 'Active',
      inactive: 'Inactive',
      window: 'Window',
      chooseFirst: 'Choose or create a service first',
    },
    vi: {
      loading: 'Dang tai khu nha cung cap...',
      loadFailed: 'Khong the tai khu nha cung cap.',
      uploadSuccess: 'Da tai file. Ban co the dan URL vao truong ho so hoac dich vu.',
      uploadFailed: 'Khong the tai media.',
      profileSaved: 'Da luu ho so nha cung cap va gui di kiem duyet.',
      profileSaveFailed: 'Khong the luu ho so nha cung cap.',
      serviceSaved: 'Da luu dich vu va gui di kiem duyet.',
      serviceSaveFailed: 'Khong the tao dich vu.',
      ruleAdded: 'Da them quy tac kha dung.',
      ruleFailed: 'Khong the tao quy tac kha dung.',
      title: 'Khu nha cung cap',
      subtitle: 'Nha cung cap doc lap co the dang dich vu ma khong can to chuc. Ho so va dich vu se hien thi sau khi duoc quan tri vien duyet.',
      noProfile: 'Chua co ho so nha cung cap. Hay tao ho so de bat dau dang dich vu.',
      profile: 'Ho so',
      publicPage: 'Trang cong khai cua nha cung cap',
      displayName: 'Ten hien thi',
      headline: 'Dinh vi',
      city: 'Thanh pho',
      timeZone: 'Mui gio',
      location: 'Dia diem',
      avatarUrl: 'URL avatar',
      coverUrl: 'URL anh bia',
      summary: 'Tom tat',
      biography: 'Tieu su',
      specialties: 'Chuyen mon',
      highlights: 'Diem nhan',
      saveProfile: 'Luu ho so',
      media: 'Media',
      uploadTitle: 'Tai len S3 / MinIO',
      uploadLabel: 'Tai anh hoac tai lieu',
      openMedia: 'Mo file',
      uploadHint: 'Tai file tai day roi dan URL vao cac truong avatar, anh bia hoac gallery.',
      services: 'Dich vu',
      createService: 'Tao dich vu dat lich',
      serviceName: 'Ten dich vu',
      type: 'Loai',
      capacity: 'Suc chua',
      slotMinutes: 'Do dai khung gio, phut',
      priceFrom: 'Gia tu',
      description: 'Mo ta',
      serviceSummary: 'Tom tat dich vu',
      formats: 'Hinh thuc',
      createServiceAction: 'Tao dich vu',
      myServices: 'Dich vu cua toi',
      moderationAndSchedule: 'Kiem duyet va lich',
      noServices: 'Chua co dich vu',
      createAfterProfile: 'Hay luu ho so nha cung cap truoc khi tao dich vu dau tien.',
      manageSchedule: 'Quan ly lich',
      availability: 'Do kha dung',
      chooseService: 'Chon dich vu de quan ly lich',
      newProvider: 'Nha cung cap moi',
      dayOfWeek: 'Thu trong tuan',
      start: 'Bat dau',
      end: 'Ket thuc',
      selectedService: 'Dich vu da chon',
      addRule: 'Them quy tac kha dung',
      active: 'Dang hoat dong',
      inactive: 'Khong hoat dong',
      window: 'Khoang gio',
      chooseFirst: 'Hay chon hoac tao dich vu truoc',
    },
  }[locale]
  const token = session?.accessToken
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

  useEffect(() => {
    if (!token) {
      return
    }

    const accessToken = token
    let isMounted = true

    async function loadProviderStudio() {
      try {
        setLoading(true)
        const [nextProfile, nextServices, nextOrganizations] = await Promise.all([
          api.getMyProviderProfile(accessToken),
          api.getMyProviderResources(accessToken),
          api.getOrganizations(),
        ])

        if (!isMounted) {
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
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : copy.loadFailed)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadProviderStudio()

    return () => {
      isMounted = false
    }
  }, [copy.loadFailed, token])

  useEffect(() => {
    let isMounted = true

    async function loadRules() {
      if (!selectedServiceId) {
        if (isMounted) {
          setRules([])
        }
        return
      }

      try {
        const nextRules = await api.getAvailabilityRules(selectedServiceId)
        if (isMounted) {
          setRules(nextRules)
        }
      } catch {
        if (isMounted) {
          setRules([])
        }
      }
    }

    void loadRules()

    return () => {
      isMounted = false
    }
  }, [selectedServiceId])

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
      setMessage(copy.uploadSuccess)
      setError(null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : copy.uploadFailed)
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
      setMessage(copy.profileSaved)
      setError(null)
      await refreshProfile()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.profileSaveFailed)
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
      setMessage(copy.serviceSaved)
      setError(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.serviceSaveFailed)
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
      setMessage(copy.ruleAdded)
      setError(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.ruleFailed)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingBlock label={copy.loading} />
  }

  if (!token) {
    return <LoadingBlock label={copy.loading} />
  }

  return (
    <div className="page-stack">
      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{copy.title}</span>
          <h1 className="section-title">
            {profile?.displayName ?? `${user?.firstName ?? ''} ${user?.lastName ?? copy.newProvider}`.trim()}
          </h1>
          <p className="section-subtitle">
            {copy.subtitle}
          </p>
        </header>

        {profile ? (
          <div className="info-banner">
            {formatModerationStatus(profile.approvalStatus, locale)}
            {profile.moderationNote ? `: ${profile.moderationNote}` : ''}
          </div>
        ) : (
          <div className="info-banner">
            {copy.noProfile}
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
            <span className="section-kicker">{copy.profile}</span>
            <h2 className="section-title">{copy.publicPage}</h2>
          </header>

          <form className="form-stack" onSubmit={handleSaveProfile}>
            <div className="form-grid">
              <div className="field-group">
                <label htmlFor="provider-display-name">{copy.displayName}</label>
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
                <label htmlFor="provider-headline">{copy.headline}</label>
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
                <label htmlFor="provider-city">{copy.city}</label>
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
                <label htmlFor="provider-time-zone">{copy.timeZone}</label>
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
                <label htmlFor="provider-location">{copy.location}</label>
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
                <label htmlFor="provider-avatar">{copy.avatarUrl}</label>
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
                <label htmlFor="provider-cover">{copy.coverUrl}</label>
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
              label={copy.summary}
              value={profileForm.content.summary}
              onChange={(value) =>
                setProfileForm((current) => ({
                  ...current,
                  content: { ...current.content, summary: value },
                }))
              }
            />

            <LocalizedTextEditor
              label={copy.biography}
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
              label={copy.specialties}
              value={profileForm.content.specialties}
              onChange={(value) =>
                setProfileForm((current) => ({
                  ...current,
                  content: { ...current.content, specialties: value },
                }))
              }
            />

            <LocalizedListEditor
              label={copy.highlights}
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
                {copy.saveProfile}
              </button>
            </div>
          </form>
        </section>

        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.media}</span>
            <h2 className="section-title">{copy.uploadTitle}</h2>
          </header>

          <div className="field-group">
            <label htmlFor="provider-upload">{copy.uploadLabel}</label>
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
                {copy.openMedia}
              </a>
            </article>
          ) : null}

          <div className="info-banner">
            {copy.uploadHint}
          </div>
        </section>
      </div>

      <div className="admin-grid">
        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.services}</span>
            <h2 className="section-title">{copy.createService}</h2>
          </header>

          <form className="form-stack" onSubmit={handleCreateService}>
            <div className="form-grid">
              <div className="field-group">
                <label htmlFor="service-name">{copy.serviceName}</label>
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
                <label htmlFor="service-type">{copy.type}</label>
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
                      {formatResourceType(resourceType, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="service-location">{copy.location}</label>
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
                <label htmlFor="service-capacity">{copy.capacity}</label>
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
                <label htmlFor="service-slot">{copy.slotMinutes}</label>
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
                <label htmlFor="service-price">{copy.priceFrom}</label>
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
                <label htmlFor="service-description">{copy.description}</label>
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
              label={copy.serviceSummary}
              value={serviceForm.content.summary}
              onChange={(value) =>
                setServiceForm((current) => ({
                  ...current,
                  content: { ...current.content, summary: value },
                }))
              }
            />

            <LocalizedListEditor
              label={copy.formats}
              value={serviceForm.content.formats}
              onChange={(value) =>
                setServiceForm((current) => ({
                  ...current,
                  content: { ...current.content, formats: value },
                }))
              }
            />

            <LocalizedListEditor
              label={copy.specialties}
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
                {copy.createServiceAction}
              </button>
            </div>
          </form>
        </section>

        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.myServices}</span>
            <h2 className="section-title">{copy.moderationAndSchedule}</h2>
          </header>

          {services.length === 0 ? (
            <div className="empty-state">
              <h3>{copy.noServices}</h3>
              <p>{copy.createAfterProfile}</p>
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
                      {copy.manageSchedule}
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
          <span className="section-kicker">{copy.availability}</span>
          <h2 className="section-title">{selectedService?.name ?? copy.chooseService}</h2>
        </header>

        {selectedService ? (
          <>
            <form className="form-grid" onSubmit={handleCreateRule}>
              <div className="field-group">
                <label htmlFor="rule-day">{copy.dayOfWeek}</label>
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
                <label htmlFor="rule-start">{copy.start}</label>
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
                <label htmlFor="rule-end">{copy.end}</label>
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
                <label htmlFor="rule-resource">{copy.selectedService}</label>
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
                  {copy.addRule}
                </button>
              </div>
            </form>

            <div className="table-like">
              {rules.map((rule) => (
                <article key={rule.id} className="table-row">
                  <header>
                    <strong>{formatDayOfWeek(rule.dayOfWeek, locale)}</strong>
                    <span className={rule.isActive ? 'status-pill success' : 'status-pill warning'}>
                      {rule.isActive ? copy.active : copy.inactive}
                    </span>
                  </header>
                  <div className="meta-line">
                    <span className="inline-pill">{copy.window}</span>
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
            <h3>{copy.chooseFirst}</h3>
          </div>
        )}
      </section>
    </div>
  )
}
