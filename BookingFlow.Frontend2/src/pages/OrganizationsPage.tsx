import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SeoMeta } from '../components/SeoMeta'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useOrganizationsQuery } from '../features/organizations/useOrganizationsQuery'
import { buildLocalePath } from '../app/router'
import { getOrganizationTypeLabel, normalizeSeededContent } from '../lib/display'
import { resolveLocalizedText } from '../lib/i18n-content'
import { getOrganizationImageUrl } from '../lib/placeholders'
import type { AppLocale } from '../features/i18n/config'

export function OrganizationsPage() {
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

  return (
    <>
      <SeoMeta title={t('public.organizationsTitle')} description={t('public.organizationsDescription')} />
      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="eyebrow">{t('public.organizationsEyebrow')}</p>
            <h1>{t('public.organizationsTitle')}</h1>
            <p>{t('public.organizationsDescription')}</p>
          </div>
          <span className="workspace-chip">{organizations.length}</span>
        </div>

        <div className="public-stack">
          {organizations.map((organization) => (
            <Link
              key={organization.id}
              className="public-list-item"
              to={buildLocalePath(currentLocale, `organizations/${organization.id}`)}
            >
              <div className="public-list-item__media">
                <img src={getOrganizationImageUrl(organization)} alt={organization.name} />
              </div>
              <div className="public-list-item__body">
                <p className="workspace-card__label">{getOrganizationTypeLabel(organization.type)}</p>
                <h2>{organization.name}</h2>
                <p>{normalizeSeededContent(resolveLocalizedText(organization.content.summary, currentLocale) || organization.description)}</p>
                <div className="public-meta-row">
                  <span>{organization.city}</span>
                  <span>{organization.resourcesCount} {t('public.resourcesUnit')}</span>
                  <span>{organization.eventsCount} {t('public.eventsUnit')}</span>
                </div>
              </div>
              <span className="workspace-chip">{t('public.openVenue')}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
