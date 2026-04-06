import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { SeoMeta } from '../components/SeoMeta'
import { useOrganizationsQuery } from '../features/organizations/useOrganizationsQuery'
import { buildLocalePath } from '../app/router'
import { getOrganizationTypeLabel, normalizeSeededContent } from '../lib/display'
import { resolveLocalizedCollection, resolveLocalizedText } from '../lib/i18n-content'
import { formatCurrentTimeInTimeZone } from '../lib/timezone'
import { getOrganizationImageUrl } from '../lib/placeholders'
import type { AppLocale } from '../features/i18n/config'

export function HomePage() {
  const { t } = useTranslation()
  const { locale = 'ru' } = useParams()
  const currentLocale = locale as AppLocale
  const organizationsQuery = useOrganizationsQuery()

  if (organizationsQuery.isLoading) {
    return <LoadingState label={t('states.loading')} />
  }

  if (organizationsQuery.isError) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        actionLabel={t('actions.retry')}
        onRetry={() => void organizationsQuery.refetch()}
      />
    )
  }

  const organizations = organizationsQuery.data ?? []
  const totalResources = organizations.reduce((sum, organization) => sum + organization.resourcesCount, 0)
  const totalEvents = organizations.reduce((sum, organization) => sum + organization.eventsCount, 0)

  return (
    <>
      <SeoMeta title={t('home.metaTitle')} description={t('home.metaDescription')} />

      <section className="hero-panel">
        <div className="hero-panel__content">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('home.title')}</h1>
          <p className="hero-panel__lead">{t('home.description')}</p>

          <div className="hero-metrics" aria-label="Метрики BookingFlow">
            <div className="hero-metric">
              <span className="hero-metric__value">{organizations.length}</span>
              <span className="hero-metric__label">{t('home.venues')}</span>
            </div>
            <div className="hero-metric">
              <span className="hero-metric__value">{totalResources}</span>
              <span className="hero-metric__label">{t('home.resources')}</span>
            </div>
            <div className="hero-metric">
              <span className="hero-metric__value">{totalEvents}</span>
              <span className="hero-metric__label">{t('home.events')}</span>
            </div>
          </div>

          <div className="hero-actions">
            <Link className="primary-button" to={buildLocalePath(currentLocale, 'organizations')}>
              {t('home.openCatalog')}
            </Link>
            <Link className="secondary-button" to={buildLocalePath(currentLocale, 'providers')}>
              {t('home.openProviders')}
            </Link>
          </div>
        </div>

        <div className="hero-panel__aside">
          <p className="workspace-card__label">{t('home.asideLabel')}</p>
          <h2>{t('home.asideTitle')}</h2>
          <p>{t('home.authHint')}</p>
          <div className="hero-aside-list">
            <span>{t('home.asidePointOne')}</span>
            <span>{t('home.asidePointTwo')}</span>
            <span>{t('home.asidePointThree')}</span>
          </div>
          <Link className="secondary-button" to={buildLocalePath(currentLocale, 'app')}>
            {t('home.openWorkspace')}
          </Link>
        </div>
      </section>

      {organizations.length === 0 ? (
        <EmptyState
          title={t('states.emptyTitle')}
          description={t('states.emptyDescription')}
        />
      ) : (
        <section className="list-grid">
          {organizations.map((organization) => {
            const heroTitle =
              normalizeSeededContent(
                resolveLocalizedText(organization.content.heroTitle, currentLocale) || organization.name,
              )
            const summary =
              normalizeSeededContent(
                resolveLocalizedText(organization.content.summary, currentLocale) || organization.description,
              )
            const highlights = resolveLocalizedCollection(
              organization.content.serviceHighlights,
              currentLocale,
            )
              .map(normalizeSeededContent)
              .slice(0, 3)

            return (
              <article key={organization.id} className="venue-card">
                <div className="venue-card__media">
                  {organization.coverImageUrl ? (
                  <img src={organization.coverImageUrl} alt={organization.name} />
                ) : (
                    <img src={getOrganizationImageUrl(organization)} alt={organization.name} />
                  )}
                </div>

                <div className="venue-card__body">
                  <div className="venue-card__header">
                    <p className="eyebrow">{getOrganizationTypeLabel(organization.type)}</p>
                    <span className="venue-card__status">{t('home.statusLive')}</span>
                  </div>
                  <h2>{heroTitle}</h2>
                  <p>{summary}</p>

                  <dl className="meta-strip">
                    <div>
                      <dt>{t('home.timezone')}</dt>
                      <dd>
                        {organization.timeZone}
                        <span>{formatCurrentTimeInTimeZone(organization.timeZone, currentLocale)}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>{t('home.resources')}</dt>
                      <dd>{organization.resourcesCount}</dd>
                    </div>
                    <div>
                      <dt>{t('home.events')}</dt>
                      <dd>{organization.eventsCount}</dd>
                    </div>
                  </dl>

                  {highlights.length > 0 ? (
                    <ul className="highlight-list">
                      {highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="venue-card__footer">
                    <span className="workspace-chip">
                      {organization.city || t('home.cityFallback')}
                    </span>
                    <Link className="secondary-button" to={buildLocalePath(currentLocale, `organizations/${organization.id}`)}>
                      {t('public.openVenue')}
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </>
  )
}
