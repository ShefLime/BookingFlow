import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HeroSection } from '../components/HeroSection'
import { LoadingBlock } from '../components/LoadingBlock'
import { useLocale } from '../i18n/LocaleContext'
import { api } from '../lib/api'
import {
  formatResourceType,
  pickLocalizedList,
  pickLocalizedText,
} from '../lib/format'
import type { ProviderProfile, Resource } from '../types/api'

export function ProviderPage() {
  const { providerId } = useParams()
  const { locale } = useLocale()
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [services, setServices] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!providerId) {
      setError('Provider not found.')
      setLoading(false)
      return
    }

    const currentProviderId = providerId
    let isMounted = true

    async function loadProvider() {
      try {
        setLoading(true)
        const [nextProvider, allProviderServices] = await Promise.all([
          api.getProviderProfile(currentProviderId),
          api.discoverResources('provider'),
        ])

        if (!isMounted) {
          return
        }

        setProvider(nextProvider)
        setServices(
          allProviderServices.filter((service) => service.providerProfileId === currentProviderId),
        )
        setError(null)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load provider.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadProvider()

    return () => {
      isMounted = false
    }
  }, [providerId])

  const gallery = useMemo(() => provider?.gallery ?? [], [provider?.gallery])

  if (loading) {
    return <LoadingBlock label="Loading provider profile..." />
  }

  if (!provider) {
    return (
      <div className="empty-state">
        <h2>Provider not found</h2>
        {error ? <p>{error}</p> : null}
      </div>
    )
  }

  const summary = pickLocalizedText(provider.content.summary, locale, provider.headline)
  const biography = pickLocalizedText(provider.content.biography, locale, provider.headline)
  const approach = pickLocalizedText(provider.content.approach, locale)
  const quote = pickLocalizedText(provider.content.quote, locale)
  const specialties = pickLocalizedList(provider.content.specialties, locale)
  const highlights = pickLocalizedList(provider.content.highlights, locale)

  return (
    <div className="page-stack">
      <HeroSection imageUrl={provider.coverImageUrl} imageAlt={provider.displayName}>
        <div className="hero-split">
          <div className="section-stack">
            <div className="pill-row">
              <span className="type-pill">{provider.city ?? provider.timeZone}</span>
              <span className="metric-pill">{provider.servicesCount} services</span>
            </div>
            <h1 className="display-title">{provider.displayName}</h1>
            <p className="hero-lead">{summary}</p>
            <div className="hero-actions">
              <a href="#provider-services" className="solid-button">
                Explore services
              </a>
            </div>
          </div>

          <aside className="glass-panel section-stack">
            {provider.avatarImageUrl ? (
              <img className="portrait-image" src={provider.avatarImageUrl} alt={provider.displayName} />
            ) : null}
            <div className="stacked-meta">
              <div className="meta-line">
                <span className="inline-pill">Headline</span>
                <span>{provider.headline}</span>
              </div>
              {provider.location ? (
                <div className="meta-line">
                  <span className="inline-pill">Location</span>
                  <span>{provider.location}</span>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </HeroSection>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="two-column-grid">
        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">About</span>
            <h2 className="section-title">{provider.displayName}</h2>
          </header>
          <p>{biography}</p>
          {approach ? <div className="info-banner">{approach}</div> : null}
          {quote ? <blockquote className="quote-block">{quote}</blockquote> : null}
        </article>

        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">Specialties</span>
            <h2 className="section-title">Why people book this provider</h2>
          </header>
          <div className="pill-row">
            {specialties.map((item) => (
              <span key={item} className="chip-pill">
                {item}
              </span>
            ))}
          </div>
          <div className="bullet-stack">
            {highlights.map((item) => (
              <div key={item} className="bullet-line">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="surface-card section-stack" id="provider-services">
        <header>
          <span className="section-kicker">Services</span>
          <h2 className="section-title">Approved sessions</h2>
        </header>

        {services.length === 0 ? (
          <div className="empty-state">
            <h3>No approved services yet</h3>
          </div>
        ) : (
          <div className="two-column-grid">
            {services.map((service) => (
              <article key={service.id} className="event-banner">
                {service.coverImageUrl ? (
                  <img className="event-banner-image" src={service.coverImageUrl} alt={service.name} />
                ) : null}
                <div className="section-stack">
                  <div className="pill-row">
                    <span className="type-pill">{formatResourceType(service.type, locale)}</span>
                    {service.priceFrom ? <span className="metric-pill">${service.priceFrom}</span> : null}
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
                      Book now
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {gallery.length > 0 ? (
        <section className="surface-card section-stack">
          <header>
            <span className="section-kicker">Gallery</span>
            <h2 className="section-title">{provider.displayName}</h2>
          </header>
          <div className="gallery-grid">
            {gallery.map((item) => (
              <img key={item.url} className="gallery-image" src={item.url} alt={item.title ?? provider.displayName} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
