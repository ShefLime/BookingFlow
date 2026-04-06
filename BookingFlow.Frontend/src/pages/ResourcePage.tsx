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
  formatModerationStatus,
  formatResourceType,
  getDefaultBookingDate,
  pickLocalizedList,
  pickLocalizedText,
} from '../lib/format'
import type { AvailableSlot, Organization, ProviderProfile, Resource } from '../types/api'

function getResourceCopy(locale: 'ru' | 'en' | 'vi') {
  return {
    ru: {
      notFound: 'Ресурс не найден',
      loadFailed: 'Не удалось загрузить ресурс.',
      bookingFailed: 'Не удалось создать бронь.',
      date: 'Дата',
      place: 'Локация',
      from: 'от',
    },
    en: {
      notFound: 'Resource not found',
      loadFailed: 'Failed to load resource.',
      bookingFailed: 'Booking failed.',
      date: 'Date',
      place: 'Location',
      from: 'from',
    },
    vi: {
      notFound: 'Khong tim thay dich vu',
      loadFailed: 'Khong the tai dich vu.',
      bookingFailed: 'Khong the tao lich dat.',
      date: 'Ngay',
      place: 'Dia diem',
      from: 'tu',
    },
  }[locale]
}

export function ResourcePage() {
  const { resourceId } = useParams()
  const navigate = useNavigate()
  const { locale, t } = useLocale()
  const copy = getResourceCopy(locale)
  const { session, isAuthenticated } = useAuth()
  const [resource, setResource] = useState<Resource | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null)
  const [date, setDate] = useState(getDefaultBookingDate())
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!resourceId) {
      setError(copy.notFound)
      setLoading(false)
      return
    }

    const currentResourceId = resourceId
    let isMounted = true

    async function loadResource() {
      try {
        setLoading(true)
        const nextResource = await api.getResource(currentResourceId)

        const [nextOrganization, nextProviderProfile, nextSlots] = await Promise.all([
          nextResource.organizationId ? api.getOrganization(nextResource.organizationId) : Promise.resolve(null),
          nextResource.providerProfileId
            ? api.getProviderProfile(nextResource.providerProfileId)
            : Promise.resolve(null),
          api.getAvailability(nextResource.id, getDefaultBookingDate()),
        ])

        if (!isMounted) {
          return
        }

        setResource(nextResource)
        setOrganization(nextOrganization)
        setProviderProfile(nextProviderProfile)
        setSlots(nextSlots.filter((slot) => slot.isAvailable))
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

    void loadResource()

    return () => {
      isMounted = false
    }
  }, [copy.loadFailed, copy.notFound, resourceId])

  useTrackEntityView('Resource', resource?.id)

  async function refreshSlots(selectedDate: string) {
    if (!resource) {
      return
    }

    const nextSlots = await api.getAvailability(resource.id, selectedDate)
    setSlots(nextSlots.filter((slot) => slot.isAvailable))
  }

  async function handleBook(slot: AvailableSlot) {
    if (!resource || !session) {
      await navigate('/auth')
      return
    }

    try {
      setBooking(true)
      const response = await api.createResourceBooking(
        {
          organizationId: organization?.id ?? null,
          resourceId: resource.id,
          startAtUtc: slot.startAtUtc,
          endAtUtc: slot.endAtUtc,
          guestCount: 1,
        },
        session.accessToken,
      )

      setMessage(`${response.resourceName ?? resource.name}: ${t('common.confirmed')}.`)
      await refreshSlots(date)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.bookingFailed)
    } finally {
      setBooking(false)
    }
  }

  const ownerName = organization?.name ?? providerProfile?.displayName ?? resource?.providerDisplayName ?? ''
  const ownerLocation = organization?.city ?? organization?.address ?? providerProfile?.location ?? resource?.location

  const ownerGallery = useMemo(() => {
    if (resource?.gallery && resource.gallery.length > 0) {
      return resource.gallery
    }

    if (organization?.gallery && organization.gallery.length > 0) {
      return organization.gallery
    }

    return providerProfile?.gallery ?? []
  }, [organization?.gallery, providerProfile?.gallery, resource?.gallery])

  if (loading) {
    return <LoadingBlock label={t('common.loading')} />
  }

  if (!resource) {
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

  const summary = pickLocalizedText(resource.content.summary, locale, resource.description ?? '')
  const biography = pickLocalizedText(resource.content.biography, locale, resource.description ?? '')
  const approach = pickLocalizedText(resource.content.approach, locale)
  const quote = pickLocalizedText(resource.content.quote, locale)
  const specialties = pickLocalizedList(resource.content.specialties, locale)
  const achievements = pickLocalizedList(resource.content.achievements, locale)
  const formats = pickLocalizedList(resource.content.formats, locale)
  const heroImage =
    resource.coverImageUrl ?? resource.avatarImageUrl ?? organization?.coverImageUrl ?? providerProfile?.coverImageUrl ?? ''
  const ownerLink = organization
    ? `/organizations/${organization.id}`
    : providerProfile
      ? `/providers/${providerProfile.id}`
      : '/'

  return (
    <div className="page-stack">
      <HeroSection imageUrl={heroImage} imageAlt={resource.name}>
        <div className="section-stack">
          <div className="pill-row">
            <span className="type-pill">{formatResourceType(resource.type, locale)}</span>
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
            {resource.experienceYears ? (
              <span className="metric-pill">
                {resource.experienceYears} {t('coach.experience')}
              </span>
            ) : null}
          </div>

          <div className="hero-split">
            <div className="section-stack">
              <Link to={ownerLink} className="back-link">
                {ownerName}
              </Link>
              <h1 className="display-title">{resource.name}</h1>
              <p className="hero-lead">{summary}</p>
              <div className="hero-actions">
                <a href="#booking-panel" className="solid-button">
                  {t('coach.bookSession')}
                </a>
              </div>
            </div>

            <aside className="glass-panel section-stack">
              {resource.avatarImageUrl ? (
                <img className="portrait-image" src={resource.avatarImageUrl} alt={resource.name} />
              ) : null}
              <div className="stacked-meta">
                {ownerLocation ? (
                  <div className="meta-line">
                    <span className="inline-pill">{t('common.city')}</span>
                    <span>{ownerLocation}</span>
                  </div>
                ) : null}
                {resource.location ? (
                  <div className="meta-line">
                    <span className="inline-pill">{copy.place}</span>
                    <span>{resource.location}</span>
                  </div>
                ) : null}
                {resource.priceFrom ? (
                  <div className="meta-line">
                    <span className="inline-pill">{copy.from}</span>
                    <span>{formatMoney(resource.priceFrom, 'USD', locale)}</span>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </HeroSection>

      {message ? <div className="message-banner">{message}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <section className="two-column-grid">
        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{t('coach.about')}</span>
            <h2 className="section-title">{resource.name}</h2>
          </header>
          <p>{biography}</p>
          {approach ? <div className="info-banner">{approach}</div> : null}
          {quote ? <blockquote className="quote-block">{quote}</blockquote> : null}
        </article>

        <article className="surface-card section-stack" id="booking-panel">
          <header>
            <span className="section-kicker">{t('organization.slots')}</span>
            <h2 className="section-title">{t('coach.bookSession')}</h2>
          </header>

          <div className="field-group">
            <label htmlFor="resource-date">{copy.date}</label>
            <input
              id="resource-date"
              className="input-field"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="card-actions">
            <button className="ghost-button" type="button" onClick={() => void refreshSlots(date)}>
              {t('organization.bookNow')}
            </button>
            {!isAuthenticated ? (
              <Link to="/auth" className="chip-button">
                {t('organization.loginToBook')}
              </Link>
            ) : null}
          </div>

          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                key={slot.startAtUtc}
                type="button"
                className="slot-button"
                disabled={booking}
                onClick={() => void handleBook(slot)}
              >
                {formatDateTime(slot.startAtUtc, locale)}
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="three-column-grid">
        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{t('coach.specialties')}</span>
          </header>
          <div className="pill-row">
            {specialties.map((item) => (
              <span key={item} className="chip-pill">
                {item}
              </span>
            ))}
          </div>
        </article>

        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{t('coach.achievements')}</span>
          </header>
          <div className="bullet-stack">
            {achievements.map((item) => (
              <div key={item} className="bullet-line">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{t('coach.formats')}</span>
          </header>
          <div className="bullet-stack">
            {formats.map((item) => (
              <div key={item} className="bullet-line">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{t('common.gallery')}</span>
          <h2 className="section-title">{resource.name}</h2>
        </header>
        <div className="gallery-grid">
          {ownerGallery.map((item) => (
            <img key={item.url} className="gallery-image" src={item.url} alt={item.title ?? resource.name} />
          ))}
        </div>
      </section>
    </div>
  )
}
