import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { SeoMeta } from '../components/SeoMeta'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { api } from '../lib/api'
import { buildLocalePath } from '../app/router'
import { normalizeSeededContent } from '../lib/display'
import { resolveLocalizedCollection, resolveLocalizedText } from '../lib/i18n-content'
import { getProviderImageUrl, getResourceImageUrl } from '../lib/placeholders'
import type { AppLocale } from '../features/i18n/config'

export function ProviderDetailPage() {
  const { t } = useTranslation()
  const { locale = 'ru', providerId = '' } = useParams()
  const currentLocale = locale as AppLocale
  const providerQuery = useQuery({
    queryKey: ['public', 'provider', providerId],
    queryFn: () => api.providers.getProviderProfile(providerId),
  })
  const resourcesQuery = useQuery({
    queryKey: ['public', 'resources-provider'],
    queryFn: () => api.resources.discoverResources('provider'),
  })

  if (providerQuery.isLoading) {
    return <LoadingState label={t('states.loading')} />
  }

  if (providerQuery.isError || !providerQuery.data) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        actionLabel={t('actions.retry')}
        onRetry={() => void providerQuery.refetch()}
      />
    )
  }

  const provider = providerQuery.data
  const providerResources = (resourcesQuery.data ?? []).filter((resource) => resource.providerProfileId === provider.id)
  const highlights = resolveLocalizedCollection(provider.content.highlights, currentLocale)

  return (
    <>
      <SeoMeta
        title={provider.displayName}
        description={normalizeSeededContent(resolveLocalizedText(provider.content.summary, currentLocale) || provider.headline)}
      />
      <section className="hero-panel hero-panel--detail">
        <div className="hero-panel__content">
          <p className="eyebrow">{t('public.providerLabel')}</p>
          <h1>{provider.displayName}</h1>
          <p className="hero-panel__lead">{normalizeSeededContent(resolveLocalizedText(provider.content.summary, currentLocale) || provider.headline)}</p>
        </div>
        <div className="hero-panel__aside">
          <div className="hero-figure hero-figure--portrait">
            <img src={getProviderImageUrl(provider)} alt={provider.displayName} />
          </div>
          <p className="workspace-card__label">{t('public.providerMeta')}</p>
          <h2>{provider.city || t('public.cityOnRequest')}</h2>
          <p>{provider.location}</p>
          <div className="hero-aside-list">
            <span>{t('public.servicesCountLabel', { count: provider.servicesCount })}</span>
            <span>{t('public.independentProvider')}</span>
          </div>
        </div>
      </section>

      <section className="workspace-quick-grid">
        <article className="workspace-panel">
          <p className="workspace-card__label">{t('public.biographyTitle')}</p>
          <h2>{t('public.aboutProvider')}</h2>
          <p>{normalizeSeededContent(resolveLocalizedText(provider.content.biography, currentLocale) || provider.headline)}</p>
        </article>
        <article className="workspace-panel">
          <p className="workspace-card__label">{t('public.highlightsTitle')}</p>
          <h2>{t('public.providerHighlights')}</h2>
          <ul className="workspace-list">
            {highlights.map((item) => (
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
          {providerResources.map((resource) => (
            <Link key={resource.id} className="public-list-item" to={buildLocalePath(currentLocale, `resources/${resource.id}`)}>
              <div className="public-list-item__media">
                <img src={getResourceImageUrl(resource)} alt={resource.name} />
              </div>
              <div className="public-list-item__body">
                <p className="workspace-card__label">{resource.name}</p>
                <h3>{normalizeSeededContent(resolveLocalizedText(resource.content.summary, currentLocale) || resource.description || resource.name)}</h3>
                <p>{resource.location}</p>
                <div className="public-meta-row">
                  <span>{resource.slotSizeMinutes} {t('public.minutesUnit')}</span>
                </div>
              </div>
              <span className="workspace-chip">{t('public.openService')}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
