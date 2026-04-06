import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { HeroSection } from '../components/HeroSection'
import { LoadingBlock } from '../components/LoadingBlock'
import { useTrackEntityView } from '../hooks/useTrackEntityView'
import { useLocale } from '../i18n/LocaleContext'
import { api } from '../lib/api'
import {
  formatDateTime,
  formatMoney,
  formatOrganizationType,
  formatResourceType,
  getDefaultBookingDate,
  pickLocalizedList,
  pickLocalizedText,
} from '../lib/format'
import type { AvailableSlot, EventSession, Organization, Resource } from '../types/api'

type SlotsByResource = Record<string, AvailableSlot[]>
type DatesByResource = Record<string, string>

function getOrganizationCopy(locale: 'ru' | 'en' | 'vi') {
  return {
    ru: {
      notFound: 'Организация не найдена',
      loadFailed: 'Не удалось загрузить организацию.',
      slotsFailed: 'Не удалось загрузить слоты.',
      bookingFailed: 'Не удалось создать бронь.',
      eventBookingFailed: 'Не удалось записаться на событие.',
      noCoaches: 'Пока нет тренеров',
      noResources: 'Пока нет доступных форматов',
      noEvents: 'Пока нет событий',
      date: 'Дата',
      details: 'Подробнее',
      resourcesTitle: 'Запись по форматам',
      minutes: 'мин',
    },
    en: {
      notFound: 'Organization not found',
      loadFailed: 'Failed to load organization.',
      slotsFailed: 'Failed to load slots.',
      bookingFailed: 'Booking failed.',
      eventBookingFailed: 'Event booking failed.',
      noCoaches: 'No coaches yet',
      noResources: 'No bookable formats yet',
      noEvents: 'No events yet',
      date: 'Date',
      details: 'Details',
      resourcesTitle: 'Book available formats',
      minutes: 'min',
    },
    vi: {
      notFound: 'Khong tim thay to chuc',
      loadFailed: 'Khong the tai to chuc.',
      slotsFailed: 'Khong the tai khung gio.',
      bookingFailed: 'Khong the tao lich dat.',
      eventBookingFailed: 'Khong the dat su kien.',
      noCoaches: 'Chua co huong dan vien',
      noResources: 'Chua co hinh thuc dat lich',
      noEvents: 'Chua co su kien',
      date: 'Ngay',
      details: 'Chi tiet',
      resourcesTitle: 'Dat theo hinh thuc',
      minutes: 'phut',
    },
  }[locale]
}

export function OrganizationPage() {
  const { organizationId } = useParams()
  const navigate = useNavigate()
  const { locale, t } = useLocale()
  const copy = getOrganizationCopy(locale)
  const { session, isAuthenticated } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [events, setEvents] = useState<EventSession[]>([])
  const [selectedDates, setSelectedDates] = useState<DatesByResource>({})
  const [slotsByResourceId, setSlotsByResourceId] = useState<SlotsByResource>({})
  const [loading, setLoading] = useState(true)
  const [savingResourceId, setSavingResourceId] = useState<string | null>(null)
  const [savingEventId, setSavingEventId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setError(copy.notFound)
      setLoading(false)
      return
    }

    const currentOrganizationId = organizationId
    let isMounted = true

    async function loadOrganization() {
      try {
        setLoading(true)
        const [nextOrganization, nextResources, nextEvents] = await Promise.all([
          api.getOrganization(currentOrganizationId),
          api.getResources(currentOrganizationId),
          api.getEvents(currentOrganizationId),
        ])

        const bookableResources = nextResources.filter((resource) => resource.type !== 'Trainer')
        const nextDates = bookableResources.reduce<DatesByResource>((accumulator, resource) => {
          accumulator[resource.id] = getDefaultBookingDate()
          return accumulator
        }, {})

        const slotResults = await Promise.all(
          bookableResources.map(async (resource) => {
            const slots = await api.getAvailability(resource.id, nextDates[resource.id])
            return [resource.id, slots] as const
          }),
        )

        if (!isMounted) {
          return
        }

        setOrganization(nextOrganization)
        setResources(nextResources)
        setEvents(nextEvents)
        setSelectedDates(nextDates)
        setSlotsByResourceId(Object.fromEntries(slotResults))
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

    void loadOrganization()

    return () => {
      isMounted = false
    }
  }, [copy.loadFailed, copy.notFound, organizationId])

  useTrackEntityView('Organization', organization?.id)

  const coaches = useMemo(
    () => resources.filter((resource) => resource.type === 'Trainer'),
    [resources],
  )

  const bookableResources = useMemo(
    () => resources.filter((resource) => resource.type !== 'Trainer'),
    [resources],
  )

  const upcomingEvents = useMemo(
    () => events.filter((eventSession) => new Date(eventSession.endAtUtc).getTime() > Date.now()),
    [events],
  )

  async function refreshAvailability(resourceId: string, date: string) {
    try {
      const slots = await api.getAvailability(resourceId, date)
      setSlotsByResourceId((current) => ({ ...current, [resourceId]: slots.filter((slot) => slot.isAvailable) }))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.slotsFailed)
    }
  }

  async function handleResourceBooking(resource: Resource, slot: AvailableSlot) {
    if (!organization || !session) {
      await navigate('/auth')
      return
    }

    try {
      setSavingResourceId(resource.id)
      const booking = await api.createResourceBooking(
        {
          organizationId: organization.id,
          resourceId: resource.id,
          startAtUtc: slot.startAtUtc,
          endAtUtc: slot.endAtUtc,
          guestCount: 1,
        },
        session.accessToken,
      )

      setMessage(`${booking.resourceName ?? resource.name}: ${t('common.confirmed')}.`)
      await refreshAvailability(resource.id, selectedDates[resource.id] ?? getDefaultBookingDate())
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.bookingFailed)
    } finally {
      setSavingResourceId(null)
    }
  }

  async function handleEventBooking(eventSession: EventSession) {
    if (!organization || !session) {
      await navigate('/auth')
      return
    }

    try {
      setSavingEventId(eventSession.id)
      await api.createEventBooking(
        {
          organizationId: organization.id,
          eventSessionId: eventSession.id,
          guestCount: 1,
        },
        session.accessToken,
      )

      setMessage(`${eventSession.name}: ${t('common.confirmed')}.`)
      const nextEvents = await api.getEvents(organization.id)
      setEvents(nextEvents)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.eventBookingFailed)
    } finally {
      setSavingEventId(null)
    }
  }

  if (loading) {
    return <LoadingBlock label={t('common.loading')} />
  }

  if (!organization) {
    return (
      <div className="empty-state">
        <h2>{copy.notFound}</h2>
        <div className="card-actions">
          <Link to="/" className="solid-button">
            {t('home.explore')}
          </Link>
        </div>
      </div>
    )
  }

  const heroImage = organization.coverImageUrl
  const heroTitle = pickLocalizedText(organization.content.heroTitle, locale, organization.name)
  const heroSubtitle = pickLocalizedText(
    organization.content.heroSubtitle,
    locale,
    organization.description,
  )
  const summary = pickLocalizedText(organization.content.summary, locale, organization.description)
  const fullDescription = pickLocalizedText(
    organization.content.description,
    locale,
    organization.description,
  )
  const atmosphere = pickLocalizedText(organization.content.atmosphere, locale)
  const amenities = pickLocalizedList(organization.content.amenities, locale)
  const highlights = pickLocalizedList(organization.content.serviceHighlights, locale)

  return (
    <div className="page-stack">
      <HeroSection imageUrl={heroImage} imageAlt={organization.name}>
        <div className="hero-split">
          <div className="section-stack">
            <div className="pill-row">
              <span className="type-pill">{formatOrganizationType(organization.type, locale)}</span>
              <span className={organization.isActive ? 'status-pill success' : 'status-pill danger'}>
                {organization.isActive ? t('organization.available') : t('organization.inactive')}
              </span>
            </div>
            <h1 className="display-title">{heroTitle}</h1>
            <p className="hero-lead">{heroSubtitle}</p>
            <div className="hero-actions">
              <a href="#book-section" className="solid-button">
                {t('organization.bookNow')}
              </a>
            </div>
          </div>

          <aside className="glass-panel section-stack">
            <h2 className="section-title">{organization.name}</h2>
            <p>{summary}</p>
            <div className="stacked-meta">
              <div className="meta-line">
                <span className="inline-pill">{t('common.address')}</span>
                <span>{organization.address}</span>
              </div>
              {organization.city ? (
                <div className="meta-line">
                  <span className="inline-pill">{t('common.city')}</span>
                  <span>{organization.city}</span>
                </div>
              ) : null}
              {organization.websiteUrl ? (
                <div className="meta-line">
                  <span className="inline-pill">{t('common.website')}</span>
                  <a href={organization.websiteUrl} target="_blank" rel="noreferrer">
                    {organization.websiteUrl}
                  </a>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </HeroSection>

      {message ? <div className="message-banner">{message}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <section className="two-column-grid">
        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{organization.name}</span>
            <h2 className="section-title">{fullDescription}</h2>
          </header>
          {atmosphere ? <div className="info-banner">{atmosphere}</div> : null}
        </article>

        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{t('organization.amenities')}</span>
          </header>
          <div className="bullet-stack">
            {amenities.map((item) => (
              <div key={item} className="bullet-line">
                {item}
              </div>
            ))}
          </div>
          <div className="divider" />
          <header>
            <span className="section-kicker">{t('organization.highlights')}</span>
          </header>
          <div className="pill-row">
            {highlights.map((item) => (
              <span key={item} className="chip-pill">
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{t('organization.gallery')}</span>
          <h2 className="section-title">{t('common.gallery')}</h2>
        </header>
        <div className="gallery-grid">
          {organization.gallery.map((item) => (
            <img key={item.url} className="gallery-image" src={item.url} alt={item.title ?? organization.name} />
          ))}
        </div>
      </section>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{t('organization.coaches')}</span>
          <h2 className="section-title">{t('home.coaches')}</h2>
        </header>

        {coaches.length === 0 ? (
          <div className="empty-state">
            <h3>{copy.noCoaches}</h3>
          </div>
        ) : (
          <div className="three-column-grid">
            {coaches.map((coach) => (
              <article key={coach.id} className="coach-card">
                {coach.avatarImageUrl ? (
                  <img className="coach-avatar" src={coach.avatarImageUrl} alt={coach.name} />
                ) : null}
                <div className="section-stack">
                  <div className="pill-row">
                    {coach.experienceYears ? (
                      <span className="metric-pill">
                        {coach.experienceYears}+
                      </span>
                    ) : null}
                    {coach.priceFrom ? (
                      <span className="metric-pill">{formatMoney(coach.priceFrom, 'USD', locale)}</span>
                    ) : null}
                  </div>
                  <h3>{coach.name}</h3>
                  <p>{pickLocalizedText(coach.content.summary, locale, coach.description ?? '')}</p>
                  <div className="pill-row">
                    {pickLocalizedList(coach.content.specialties, locale)
                      .slice(0, 3)
                      .map((item) => (
                        <span key={item} className="chip-pill">
                          {item}
                        </span>
                      ))}
                  </div>
                  <div className="card-actions">
                    <Link to={`/resources/${coach.id}`} className="ghost-button">
                      {t('coach.bookSession')}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="surface-card section-stack" id="book-section">
        <header>
          <span className="section-kicker">{t('organization.resources')}</span>
          <h2 className="section-title">{copy.resourcesTitle}</h2>
        </header>

        {bookableResources.length === 0 ? (
          <div className="empty-state">
            <h3>{copy.noResources}</h3>
          </div>
        ) : (
          <div className="two-column-grid">
            {bookableResources.map((resource) => (
              <article key={resource.id} className="surface-card">
                <header className="section-stack">
                  <div className="pill-row">
                    <span className="type-pill">{formatResourceType(resource.type, locale)}</span>
                    <span className="metric-pill">
                      {resource.slotSizeMinutes} {copy.minutes}
                    </span>
                    {resource.priceFrom ? (
                      <span className="metric-pill">{formatMoney(resource.priceFrom, 'USD', locale)}</span>
                    ) : null}
                  </div>
                  <h3>{resource.name}</h3>
                  <p>{pickLocalizedText(resource.content.summary, locale, resource.description ?? '')}</p>
                </header>

                <div className="field-group">
                  <label htmlFor={`resource-date-${resource.id}`}>{copy.date}</label>
                  <input
                    id={`resource-date-${resource.id}`}
                    className="input-field"
                    type="date"
                    value={selectedDates[resource.id] ?? getDefaultBookingDate()}
                    onChange={(event) =>
                      setSelectedDates((current) => ({
                        ...current,
                        [resource.id]: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="card-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => refreshAvailability(resource.id, selectedDates[resource.id] ?? getDefaultBookingDate())}
                  >
                    {t('organization.slots')}
                  </button>
                  {!isAuthenticated ? (
                    <Link to="/auth" className="chip-button">
                      {t('organization.loginToBook')}
                    </Link>
                  ) : null}
                </div>

                <div className="slot-grid">
                  {(slotsByResourceId[resource.id] ?? []).map((slot) => (
                    <button
                      key={slot.startAtUtc}
                      type="button"
                      className="slot-button"
                      disabled={savingResourceId === resource.id}
                      onClick={() => handleResourceBooking(resource, slot)}
                    >
                      {formatDateTime(slot.startAtUtc, locale)}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{t('organization.events')}</span>
          <h2 className="section-title">{t('common.upcomingEvents')}</h2>
        </header>

        {upcomingEvents.length === 0 ? (
          <div className="empty-state">
            <h3>{copy.noEvents}</h3>
          </div>
        ) : (
          <div className="two-column-grid">
            {upcomingEvents.map((eventSession) => (
              <article key={eventSession.id} className="event-banner">
                {eventSession.posterImageUrl ? (
                  <img className="event-banner-image" src={eventSession.posterImageUrl} alt={eventSession.name} />
                ) : null}
                <div className="section-stack">
                  <div className="pill-row">
                    <span className="metric-pill">{eventSession.remainingCapacity}</span>
                    <span className="type-pill">{eventSession.location}</span>
                  </div>
                  <h3>{eventSession.name}</h3>
                  <p>{pickLocalizedText(eventSession.content.summary, locale, eventSession.description)}</p>
                  <div className="meta-line">{formatDateTime(eventSession.startAtUtc, locale)}</div>
                  <div className="card-actions">
                    <Link to={`/events/${eventSession.id}`} className="ghost-button">
                      {copy.details}
                    </Link>
                    <button
                      type="button"
                      className="solid-button"
                      disabled={savingEventId === eventSession.id || eventSession.remainingCapacity < 1}
                      onClick={() => handleEventBooking(eventSession)}
                    >
                      {t('organization.bookNow')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
