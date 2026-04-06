import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { HeroSection } from '../components/HeroSection'
import { LoadingBlock } from '../components/LoadingBlock'
import { useTrackEntityView } from '../hooks/useTrackEntityView'
import { useLocale } from '../i18n/LocaleContext'
import { api } from '../lib/api'
import { formatDateTime, pickLocalizedList, pickLocalizedText } from '../lib/format'
import type { EventSession, Organization } from '../types/api'

export function EventPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { locale, t } = useLocale()
  const copy = {
    ru: {
      notFound: 'Событие не найдено',
      loadFailed: 'Не удалось загрузить событие.',
      bookingFailed: 'Не удалось создать бронь.',
      date: 'Дата',
      seats: 'Места',
      agenda: 'Программа',
      included: 'Что входит',
    },
    en: {
      notFound: 'Event not found',
      loadFailed: 'Failed to load event.',
      bookingFailed: 'Booking failed.',
      date: 'Date',
      seats: 'Seats',
      agenda: 'Agenda',
      included: 'What is included',
    },
    vi: {
      notFound: 'Khong tim thay su kien',
      loadFailed: 'Khong the tai su kien.',
      bookingFailed: 'Khong the tao lich dat.',
      date: 'Ngay',
      seats: 'Cho',
      agenda: 'Lich trinh',
      included: 'Bao gom gi',
    },
  }[locale]
  const { session, isAuthenticated } = useAuth()
  const [eventSession, setEventSession] = useState<EventSession | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
      setError(copy.notFound)
      setLoading(false)
      return
    }

    const currentEventId = eventId
    let isMounted = true

    async function loadEvent() {
      try {
        setLoading(true)
        const nextEvent = await api.getEvent(currentEventId)
        const nextOrganization = await api.getOrganization(nextEvent.organizationId)

        if (!isMounted) {
          return
        }

        setEventSession(nextEvent)
        setOrganization(nextOrganization)
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

    void loadEvent()

    return () => {
      isMounted = false
    }
  }, [copy.loadFailed, copy.notFound, eventId])

  useTrackEntityView('EventSession', eventSession?.id)

  async function handleBook() {
    if (!eventSession || !session) {
      await navigate('/auth')
      return
    }

    try {
      setSaving(true)
      await api.createEventBooking(
        {
          organizationId: eventSession.organizationId,
          eventSessionId: eventSession.id,
          guestCount: 1,
        },
        session.accessToken,
      )

      setMessage(`${eventSession.name}: ${t('common.confirmed')}.`)
      const nextEvent = await api.getEvent(eventSession.id)
      setEventSession(nextEvent)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.bookingFailed)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingBlock label={t('common.loading')} />
  }

  if (!eventSession) {
    return (
      <div className="empty-state">
        <h2>{copy.notFound}</h2>
        {error ? <p>{error}</p> : null}
        <div className="card-actions">
          <Link to="/" className="solid-button">
            {t('home.explore')}
          </Link>
        </div>
      </div>
    )
  }

  const summary = pickLocalizedText(eventSession.content.summary, locale, eventSession.description)
  const description = pickLocalizedText(eventSession.content.description, locale, eventSession.description)
  const notes = pickLocalizedText(eventSession.content.notes, locale)
  const agenda = pickLocalizedList(eventSession.content.agenda, locale)
  const includedItems = pickLocalizedList(eventSession.content.includedItems, locale)

  return (
    <div className="page-stack">
      <HeroSection imageUrl={eventSession.posterImageUrl} imageAlt={eventSession.name}>
        <div className="hero-split">
          <div className="section-stack">
            <Link to={`/organizations/${eventSession.organizationId}`} className="back-link">
              {organization?.name ?? eventSession.organizationName}
            </Link>
            <div className="pill-row">
              <span className="type-pill">{eventSession.location}</span>
              <span className="metric-pill">{eventSession.remainingCapacity}</span>
            </div>
            <h1 className="display-title">{eventSession.name}</h1>
            <p className="hero-lead">{summary}</p>
            <div className="hero-actions">
              <button
                className="solid-button"
                type="button"
                disabled={saving || eventSession.remainingCapacity < 1}
                onClick={() => void handleBook()}
              >
                {t('organization.bookNow')}
              </button>
              {!isAuthenticated ? (
                <Link to="/auth" className="ghost-button">
                  {t('auth.signIn')}
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="glass-panel section-stack">
            <div className="meta-line">
              <span className="inline-pill">{copy.date}</span>
              <span>{formatDateTime(eventSession.startAtUtc, locale)}</span>
            </div>
            <div className="meta-line">
              <span className="inline-pill">{t('common.address')}</span>
              <span>{eventSession.location}</span>
            </div>
            <div className="meta-line">
              <span className="inline-pill">{copy.seats}</span>
              <span>{eventSession.remainingCapacity}</span>
            </div>
          </aside>
        </div>
      </HeroSection>

      {message ? <div className="message-banner">{message}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <section className="two-column-grid">
        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{organization?.name ?? eventSession.organizationName}</span>
            <h2 className="section-title">{eventSession.name}</h2>
          </header>
          <p>{description}</p>
          {notes ? <div className="info-banner">{notes}</div> : null}
        </article>

        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.agenda}</span>
            <h2 className="section-title">{copy.included}</h2>
          </header>
          <div className="bullet-stack">
            {agenda.map((item) => (
              <div key={item} className="bullet-line">
                {item}
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="pill-row">
            {includedItems.map((item) => (
              <span key={item} className="chip-pill">
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>

      {eventSession.gallery.length > 0 ? (
        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">{t('common.gallery')}</span>
            <h2 className="section-title">{eventSession.name}</h2>
          </header>
          <div className="gallery-grid">
            {eventSession.gallery.map((item) => (
              <img key={item.url} className="gallery-image" src={item.url} alt={item.title ?? eventSession.name} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
