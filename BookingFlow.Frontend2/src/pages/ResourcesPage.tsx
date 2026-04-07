import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { SeoMeta } from '../components/SeoMeta'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { api } from '../lib/api'
import { buildLocalePath } from '../app/router'
import { formatPriceFrom, getResourceTypeLabel, normalizeSeededContent } from '../lib/display'
import { resolveLocalizedText } from '../lib/i18n-content'
import type { AppLocale } from '../features/i18n/config'

export function ResourcesPage() {
  const { t } = useTranslation()
  const { locale = 'ru' } = useParams()
  const currentLocale = locale as AppLocale
  const resourcesQuery = useQuery({
    queryKey: ['public', 'resources'],
    queryFn: () => api.resources.discoverResources(),
  })

  if (resourcesQuery.isLoading) {
    return <LoadingState label={t('states.loading')} />
  }

  if (resourcesQuery.isError) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        actionLabel={t('actions.retry')}
        onRetry={() => void resourcesQuery.refetch()}
      />
    )
  }

  return (
    <>
      <SeoMeta title={t('public.resourcesTitle')} description={t('public.resourcesDescription')} />
      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="eyebrow">{t('public.resourcesEyebrow')}</p>
            <h1>{t('public.resourcesTitle')}</h1>
            <p>{t('public.resourcesDescription')}</p>
          </div>
        </div>
        <div className="public-stack">
          {(resourcesQuery.data ?? []).map((resource) => (
            <Link key={resource.id} className="public-list-item" to={buildLocalePath(currentLocale, `resources/${resource.id}`)}>
              <div>
                <p className="workspace-card__label">{getResourceTypeLabel(resource.type)}</p>
                <h2>{resource.name}</h2>
                <p>{normalizeSeededContent(resolveLocalizedText(resource.content.summary, currentLocale) || resource.description || '')}</p>
              </div>
              <span className="workspace-chip">{formatPriceFrom(resource.priceFrom) ?? t('public.onRequest')}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
