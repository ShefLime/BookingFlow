import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { SeoMeta } from '../components/SeoMeta'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { api } from '../lib/api'
import { buildLocalePath } from '../app/router'
import { normalizeSeededContent } from '../lib/display'
import { resolveLocalizedText } from '../lib/i18n-content'
import { getProviderImageUrl } from '../lib/placeholders'
import type { AppLocale } from '../features/i18n/config'

export function ProvidersPage() {
  const { t } = useTranslation()
  const { locale = 'ru' } = useParams()
  const currentLocale = locale as AppLocale
  const providersQuery = useQuery({
    queryKey: ['public', 'providers'],
    queryFn: () => api.providers.getProviders(),
  })

  if (providersQuery.isLoading) {
    return <LoadingState label={t('states.loading')} />
  }

  if (providersQuery.isError) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        actionLabel={t('actions.retry')}
        onRetry={() => void providersQuery.refetch()}
      />
    )
  }

  return (
    <>
      <SeoMeta title={t('public.providersTitle')} description={t('public.providersDescription')} />
      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="eyebrow">{t('public.providersEyebrow')}</p>
            <h1>{t('public.providersTitle')}</h1>
            <p>{t('public.providersDescription')}</p>
          </div>
          <span className="workspace-chip">{(providersQuery.data ?? []).length}</span>
        </div>
        <div className="public-stack">
          {(providersQuery.data ?? []).map((provider) => (
            <Link key={provider.id} className="public-list-item" to={buildLocalePath(currentLocale, `providers/${provider.id}`)}>
              <div className="public-list-item__media public-list-item__media--portrait">
                <img src={getProviderImageUrl(provider)} alt={provider.displayName} />
              </div>
              <div className="public-list-item__body">
                <p className="workspace-card__label">{provider.displayName}</p>
                <h2>{normalizeSeededContent(resolveLocalizedText(provider.content.summary, currentLocale) || provider.headline)}</h2>
                <p>{provider.city}</p>
                <div className="public-meta-row">
                  <span>{provider.location || t('public.cityOnRequest')}</span>
                  <span>{provider.servicesCount} {t('public.servicesUnit')}</span>
                </div>
              </div>
              <span className="workspace-chip">{t('public.openProfile')}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
