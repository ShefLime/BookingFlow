import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LoadingBlock } from '../components/LoadingBlock'
import { useLocale } from '../i18n/LocaleContext'
import { api } from '../lib/api'
import {
  formatDateTime,
  formatOrganizationType,
  formatResourceType,
  pickLocalizedList,
  pickLocalizedText,
} from '../lib/format'
import type { EventSession, Organization, ProviderProfile, Resource } from '../types/api'

export function HomePage() {
  const { isAuthenticated, hasRole, user } = useAuth()
  const { locale, t } = useLocale()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [featuredCoaches, setFeaturedCoaches] = useState<Resource[]>([])
  const [providerProfiles, setProviderProfiles] = useState<ProviderProfile[]>([])
  const [providerServices, setProviderServices] = useState<Resource[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<EventSession[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let isMounted = true

    async function loadHome() {
      try {
        setLoading(true)

        const [nextOrganizations, nextProviderProfiles, nextProviderServices] = await Promise.all([
          api.getOrganizations(),
          api.getProviders(),
          api.discoverResources('provider'),
        ])

        const resourceGroups = await Promise.all(
          nextOrganizations.map((organization) => api.getResources(organization.id)),
        )

        const eventGroups = await Promise.all(
          nextOrganizations.map((organization) => api.getEvents(organization.id)),
        )

        if (!isMounted) {
          return
        }

        const coaches = resourceGroups
          .flat()
          .filter((resource) => resource.type === 'Trainer')
          .sort((left, right) => (right.experienceYears ?? 0) - (left.experienceYears ?? 0))

        const events = eventGroups
          .flat()
          .filter((eventSession) => new Date(eventSession.endAtUtc).getTime() > Date.now())
          .sort(
            (left, right) =>
              new Date(left.startAtUtc).getTime() - new Date(right.startAtUtc).getTime(),
          )

        setOrganizations(nextOrganizations)
        setFeaturedCoaches(coaches.slice(0, 3))
        setProviderProfiles(nextProviderProfiles.slice(0, 4))
        setProviderServices(nextProviderServices.slice(0, 4))
        setFeaturedEvents(events.slice(0, 4))
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load the homepage.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadHome()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredOrganizations = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase()
    if (!normalized) {
      return organizations
    }

    return organizations.filter((organization) => {
      const summary = pickLocalizedText(organization.content.summary, locale, organization.description)
      return [organization.name, summary, organization.address, organization.city ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    })
  }, [deferredSearch, locale, organizations])

  const heroOrganization = organizations[0]
  const dashboardHref = hasRole('Admin', 'Manager')
    ? '/admin'
    : user?.providerProfile
      ? '/provider'
      : '/bookings'
  const dashboardLabel = hasRole('Admin', 'Manager')
    ? t('home.admin')
    : user?.providerProfile
      ? t('home.provider')
      : t('home.bookings')

  if (loading) {
    return <LoadingBlock label={t('common.loading')} />
  }

  return (
    <div className="page-stack">
      <section
        className="immersive-hero"
        style={
          heroOrganization?.coverImageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(10,14,22,0.42), rgba(10,14,22,0.76)), url(${heroOrganization.coverImageUrl})`,
              }
            : undefined
        }
      >
        <div className="immersive-overlay">
          <div className="hero-split">
            <div className="section-stack">
              <span className="section-kicker">{t('home.heroKicker')}</span>
              <h1 className="display-title">{t('home.heroTitle')}</h1>
              <p className="hero-lead">{t('home.heroSubtitle')}</p>

              <div className="hero-actions">
                <Link to="/" className="solid-button">
                  {t('home.explore')}
                </Link>

                {isAuthenticated ? (
                  <Link to={dashboardHref} className="ghost-button">
                    {dashboardLabel}
                  </Link>
                ) : (
                  <Link to="/auth" className="ghost-button">
                    {t('home.login')}
                  </Link>
                )}
              </div>
            </div>

            <aside className="glass-panel section-stack">
              {heroOrganization ? (
                <>
                  <span className="type-pill">{formatOrganizationType(heroOrganization.type, locale)}</span>
                  <h2 className="section-title">{heroOrganization.name}</h2>
                  <p>
                    {pickLocalizedText(
                      heroOrganization.content.heroSubtitle,
                      locale,
                      heroOrganization.description,
                    )}
                  </p>
                  <div className="pill-row">
                    {pickLocalizedList(heroOrganization.content.amenities, locale)
                      .slice(0, 3)
                      .map((item) => (
                        <span key={item} className="chip-pill">
                          {item}
                        </span>
                      ))}
                  </div>
                  <Link to={`/organizations/${heroOrganization.id}`} className="primary-link-button">
                    {t('organization.bookNow')}
                  </Link>
                </>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="surface-card section-stack">
        <header className="toolbar">
          <div>
            <span className="section-kicker">{t('home.popularOrgs')}</span>
            <h2 className="section-title">{t('nav.catalog')}</h2>
          </div>

          <input
            className="search-input"
            type="search"
            placeholder={t('home.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </header>

        {filteredOrganizations.length === 0 ? (
          <div className="empty-state">
            <h3>{t('home.noResults')}</h3>
          </div>
        ) : (
          <div className="editorial-grid">
            {filteredOrganizations.map((organization) => (
              <article key={organization.id} className="showcase-card">
                {organization.coverImageUrl ? (
                  <img
                    className="showcase-image"
                    src={organization.coverImageUrl}
                    alt={organization.name}
                  />
                ) : null}

                <div className="showcase-body">
                  <div className="pill-row">
                    <span className="type-pill">{formatOrganizationType(organization.type, locale)}</span>
                    <span className="metric-pill">{organization.resourcesCount}</span>
                  </div>
                  <h3>{organization.name}</h3>
                  <p>
                    {pickLocalizedText(
                      organization.content.summary,
                      locale,
                      organization.description,
                    )}
                  </p>
                  <div className="pill-row">
                    {pickLocalizedList(organization.content.serviceHighlights, locale)
                      .slice(0, 3)
                      .map((item) => (
                        <span key={item} className="chip-pill">
                          {item}
                        </span>
                      ))}
                  </div>
                  <div className="card-actions">
                    <Link to={`/organizations/${organization.id}`} className="solid-button">
                      {t('organization.bookNow')}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{t('home.coaches')}</span>
          <h2 className="section-title">{t('home.coaches')}</h2>
        </header>
        <div className="three-column-grid">
          {featuredCoaches.map((coach) => (
            <article key={coach.id} className="coach-card">
              {coach.avatarImageUrl ? (
                <img className="coach-avatar" src={coach.avatarImageUrl} alt={coach.name} />
              ) : null}
              <div className="section-stack">
                <div className="pill-row">
                  {coach.organizationName ? <span className="type-pill">{coach.organizationName}</span> : null}
                  {coach.experienceYears ? <span className="metric-pill">{coach.experienceYears}+</span> : null}
                  {coach.priceFrom ? <span className="metric-pill">${coach.priceFrom}</span> : null}
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
      </section>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">Provider Spotlight</span>
          <h2 className="section-title">Independent experiences</h2>
        </header>
        <div className="three-column-grid">
          {providerProfiles.map((provider) => (
            <article key={provider.id} className="coach-card">
              {provider.avatarImageUrl ? (
                <img className="coach-avatar" src={provider.avatarImageUrl} alt={provider.displayName} />
              ) : null}
              <div className="section-stack">
                <div className="pill-row">
                  <span className="type-pill">{provider.city ?? provider.timeZone}</span>
                  <span className="metric-pill">{provider.servicesCount}</span>
                </div>
                <h3>{provider.displayName}</h3>
                <p>{pickLocalizedText(provider.content.summary, locale, provider.headline)}</p>
                <div className="pill-row">
                  {pickLocalizedList(provider.content.specialties, locale)
                    .slice(0, 3)
                    .map((item) => (
                      <span key={item} className="chip-pill">
                        {item}
                      </span>
                    ))}
                </div>
                <div className="card-actions">
                  <Link to={`/providers/${provider.id}`} className="ghost-button">
                    View profile
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">Curated services</span>
          <h2 className="section-title">Approved independent sessions</h2>
        </header>
        <div className="two-column-grid">
          {providerServices.map((service) => (
            <article key={service.id} className="event-banner">
              {service.coverImageUrl ? (
                <img className="event-banner-image" src={service.coverImageUrl} alt={service.name} />
              ) : null}
              <div className="section-stack">
                <div className="pill-row">
                  <span className="type-pill">{service.providerDisplayName}</span>
                  <span className="metric-pill">{formatResourceType(service.type, locale)}</span>
                </div>
                <h3>{service.name}</h3>
                <p>{pickLocalizedText(service.content.summary, locale, service.description ?? '')}</p>
                <div className="pill-row">
                  {pickLocalizedList(service.content.formats, locale)
                    .slice(0, 3)
                    .map((item) => (
                      <span key={item} className="chip-pill">
                        {item}
                      </span>
                    ))}
                </div>
                <div className="card-actions">
                  <Link to={`/resources/${service.id}`} className="solid-button">
                    {t('organization.bookNow')}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{t('home.events')}</span>
          <h2 className="section-title">{t('common.upcomingEvents')}</h2>
        </header>
        <div className="two-column-grid">
          {featuredEvents.map((eventSession) => (
            <article key={eventSession.id} className="event-banner">
              {eventSession.posterImageUrl ? (
                <img
                  className="event-banner-image"
                  src={eventSession.posterImageUrl}
                  alt={eventSession.name}
                />
              ) : null}
              <div className="section-stack">
                <div className="pill-row">
                  <span className="type-pill">{eventSession.organizationName}</span>
                  <span className="metric-pill">{eventSession.remainingCapacity}</span>
                </div>
                <h3>{eventSession.name}</h3>
                <p>
                  {pickLocalizedText(
                    eventSession.content.summary,
                    locale,
                    eventSession.description,
                  )}
                </p>
                <div className="meta-line">{formatDateTime(eventSession.startAtUtc, locale)}</div>
                <div className="card-actions">
                  <Link to={`/events/${eventSession.id}`} className="ghost-button">
                    View event
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
