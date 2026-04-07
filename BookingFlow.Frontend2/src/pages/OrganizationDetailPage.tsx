import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { SeoMeta } from '../components/SeoMeta'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { api } from '../lib/api'
import { buildLocalePath } from '../app/router'
import { formatCurrentTimeInTimeZone, formatUtcInTimeZone } from '../lib/timezone'
import { getOrganizationTypeLabel, normalizeSeededContent } from '../lib/display'
import { resolveLocalizedCollection, resolveLocalizedText } from '../lib/i18n-content'
import { getEventImageUrl, getOrganizationImageUrl, getResourceImageUrl } from '../lib/placeholders'
import { useAuth } from '../features/auth/AuthProvider'
import type { EventSession } from '../types/api'
import type { AppLocale } from '../features/i18n/config'

interface EventBookingFormValues {
  guestCount: number
  comment: string
}

export function OrganizationDetailPage() {
  const { t } = useTranslation()
  const { locale = 'ru', organizationId = '' } = useParams()
  const currentLocale = locale as AppLocale

  const organizationQuery = useQuery({
    queryKey: ['public', 'organization', organizationId],
    queryFn: () => api.organizations.getOrganization(organizationId),
  })

  const resourcesQuery = useQuery({
    queryKey: ['public', 'organization-resources', organizationId],
    queryFn: () => api.resources.getResources(organizationId),
    enabled: Boolean(organizationId),
  })

  const eventsQuery = useQuery({
    queryKey: ['public', 'organization-events', organizationId],
    queryFn: () => api.events.getEvents(organizationId, false),
    enabled: Boolean(organizationId),
  })

  if (organizationQuery.isLoading) {
    return <LoadingState label={t('states.loading')} />
  }

  if (organizationQuery.isError || !organizationQuery.data) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        actionLabel={t('actions.retry')}
        onRetry={() => void organizationQuery.refetch()}
      />
    )
  }

  const organization = organizationQuery.data
  const highlights = resolveLocalizedCollection(
    organization.content.serviceHighlights,
    currentLocale,
  )
  const amenities = resolveLocalizedCollection(organization.content.amenities, currentLocale)

  return (
    <>
      <SeoMeta
        title={normalizeSeededContent(
          resolveLocalizedText(organization.content.heroTitle, currentLocale) ||
            organization.name,
        )}
        description={normalizeSeededContent(
          resolveLocalizedText(organization.content.summary, currentLocale) ||
            organization.description,
        )}
      />

      <section className="hero-panel hero-panel--detail">
        <div className="hero-panel__content">
          <p className="eyebrow">{getOrganizationTypeLabel(organization.type)}</p>
          <h1>
            {normalizeSeededContent(
              resolveLocalizedText(organization.content.heroTitle, currentLocale) ||
                organization.name,
            )}
          </h1>
          <p className="hero-panel__lead">
            {normalizeSeededContent(
              resolveLocalizedText(organization.content.summary, currentLocale) ||
                organization.description,
            )}
          </p>
          <div className="hero-metrics">
            <div className="hero-metric">
              <span className="hero-metric__value">{organization.resourcesCount}</span>
              <span className="hero-metric__label">{t('home.resources')}</span>
            </div>
            <div className="hero-metric">
              <span className="hero-metric__value">{organization.eventsCount}</span>
              <span className="hero-metric__label">{t('home.events')}</span>
            </div>
            <div className="hero-metric">
              <span className="hero-metric__value">
                {formatCurrentTimeInTimeZone(organization.timeZone, currentLocale)}
              </span>
              <span className="hero-metric__label">{t('home.timezone')}</span>
            </div>
          </div>
        </div>

        <div className="hero-panel__aside">
          <div className="hero-figure">
            <img src={getOrganizationImageUrl(organization)} alt={organization.name} />
          </div>
          <p className="workspace-card__label">{t('public.locationLabel')}</p>
          <h2>{organization.city || organization.name}</h2>
          <p>{organization.address}</p>
          <div className="hero-aside-list">
            {organization.phone ? <span>{organization.phone}</span> : null}
            {organization.email ? <span>{organization.email}</span> : null}
          </div>
          {organization.websiteUrl ? (
            <a
              className="secondary-button"
              href={organization.websiteUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('public.openWebsite')}
            </a>
          ) : null}
        </div>
      </section>

      <section className="workspace-quick-grid">
        <article className="workspace-panel">
          <p className="workspace-card__label">{t('public.aboutVenue')}</p>
          <h2>{t('public.descriptionTitle')}</h2>
          <p>
            {normalizeSeededContent(
              resolveLocalizedText(organization.content.description, currentLocale) ||
                organization.description,
            )}
          </p>
        </article>
        <article className="workspace-panel">
          <p className="workspace-card__label">{t('public.highlightsTitle')}</p>
          <h2>{t('public.serviceHighlights')}</h2>
          <ul className="workspace-list">
            {highlights.map((item) => (
              <li key={item}>{normalizeSeededContent(item)}</li>
            ))}
            {amenities.map((item) => (
              <li key={item}>{normalizeSeededContent(item)}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-card__label">{t('public.resourcesEyebrow')}</p>
            <h2>{t('public.resourcesTitle')}</h2>
          </div>
        </div>
        <div className="public-stack">
          {(resourcesQuery.data ?? []).map((resource) => (
            <Link
              key={resource.id}
              className="public-list-item"
              to={buildLocalePath(currentLocale, `resources/${resource.id}`)}
            >
              <div className="public-list-item__media">
                <img src={getResourceImageUrl(resource)} alt={resource.name} />
              </div>
              <div className="public-list-item__body">
                <p className="workspace-card__label">{resource.name}</p>
                <h3>
                  {normalizeSeededContent(
                    resolveLocalizedText(resource.content.summary, currentLocale) ||
                      resource.description ||
                      resource.name,
                  )}
                </h3>
                <p>{resource.location}</p>
                <div className="public-meta-row">
                  <span>{resource.capacity} {t('public.peopleUnit')}</span>
                  <span>{resource.slotSizeMinutes} {t('public.minutesUnit')}</span>
                </div>
              </div>
              <span className="workspace-chip">{t('public.openService')}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-card__label">{t('public.eventsEyebrow')}</p>
            <h2>{t('public.eventsTitle')}</h2>
          </div>
          <span className="workspace-chip">{organization.timeZone}</span>
        </div>
        <div className="public-stack">
          {(eventsQuery.data ?? []).map((event) => (
            <EventBookingCard
              key={event.id}
              event={event}
              organizationId={organization.id}
              timeZone={organization.timeZone}
              locale={currentLocale}
            />
          ))}
        </div>
      </section>
    </>
  )
}

function EventBookingCard({
  event,
  organizationId,
  timeZone,
  locale,
}: {
  event: EventSession
  organizationId: string
  timeZone: string
  locale: AppLocale
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isAuthenticated, token, login } = useAuth()
  const [notice, setNotice] = useState<string | null>(null)
  const hasStarted = new Date(event.startAtUtc).getTime() <= Date.now()

  const bookingForm = useForm<EventBookingFormValues>({
    defaultValues: {
      guestCount: 1,
      comment: '',
    },
  })

  const bookingMutation = useMutation({
    mutationFn: async (values: EventBookingFormValues) => {
      if (!token) {
        throw new Error(t('workspace.authRequiredDescription'))
      }

      return api.bookings.createEventBooking(
        {
          organizationId,
          eventSessionId: event.id,
          guestCount: values.guestCount,
          comment: values.comment.trim() || undefined,
        },
        token,
      )
    },
    onSuccess: async () => {
      setNotice(t('public.eventBookingSuccess'))
      bookingForm.reset({
        guestCount: 1,
        comment: '',
      })
      await queryClient.invalidateQueries({
        queryKey: ['public', 'organization-events', organizationId],
      })
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  const handleSubmit = bookingForm.handleSubmit((values) => {
    setNotice(null)

    if (!isAuthenticated || !token) {
      login(locale)
      return
    }

    bookingMutation.mutate(values)
  })

  return (
    <article className="public-list-item public-list-item--stacked">
      <div className="event-poster">
        <img src={getEventImageUrl(event)} alt={event.name} />
      </div>
      <div className="public-list-item__body">
        <p className="workspace-card__label">
          {formatUtcInTimeZone(event.startAtUtc, timeZone, locale)}
        </p>
        <h3>
          {normalizeSeededContent(
            resolveLocalizedText(event.content.summary, locale) || event.name,
          )}
        </h3>
        <p>{event.location}</p>
      </div>

      <div className="event-booking-card">
        <div className="event-booking-card__meta">
          <span className="workspace-chip">
            {t('public.seatsLeft', { count: event.remainingCapacity })}
          </span>
          {hasStarted ? (
            <span className="workspace-chip workspace-chip--muted">
              {t('public.eventStarted')}
            </span>
          ) : null}
        </div>

        <p className="workspace-empty">{t('public.eventBookingHint')}</p>

        <form className="event-booking-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>{t('public.guestsLabel')}</span>
            <input
              className="text-field"
              type="number"
              min={1}
              max={Math.max(event.remainingCapacity, 1)}
              disabled={hasStarted || event.remainingCapacity < 1 || bookingMutation.isPending}
              {...bookingForm.register('guestCount', {
                required: true,
                min: 1,
                max: Math.max(event.remainingCapacity, 1),
                valueAsNumber: true,
              })}
            />
          </label>
          <label className="field-group field-group--full">
            <span>{t('public.commentLabel')}</span>
            <textarea
              className="textarea-field"
              rows={2}
              disabled={bookingMutation.isPending}
              {...bookingForm.register('comment')}
            />
          </label>
          {notice ? (
            <p
              className={`booking-notice ${bookingMutation.isSuccess ? 'booking-notice--success' : ''}`}
            >
              {notice}
            </p>
          ) : null}
          <div className="booking-panel__actions">
            {!isAuthenticated ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => login(locale)}
              >
                {t('public.loginToBook')}
              </button>
            ) : null}
            <button
              className="primary-button"
              type="submit"
              disabled={
                hasStarted ||
                event.remainingCapacity < 1 ||
                bookingMutation.isPending
              }
            >
              {bookingMutation.isPending ? t('states.loading') : t('actions.bookEvent')}
            </button>
          </div>
        </form>
      </div>
    </article>
  )
}
