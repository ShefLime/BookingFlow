import { useTranslation } from 'react-i18next'
import { SeoMeta } from '../components/SeoMeta'
import { useAuth } from '../features/auth/AuthProvider'
import { getModerationStatusLabel, getRoleLabel, getUserDisplayName } from '../lib/display'
import { buildLocalePath } from '../app/router'
import { useParams, Link } from 'react-router-dom'
import { canAccessAdminArea, canManageOrganizations, canManageProviderArea } from '../lib/authz'
import type { AppLocale } from '../features/i18n/config'

export function WorkspacePage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { locale = 'ru' } = useParams()

  return (
    <>
      <SeoMeta title={t('workspace.metaTitle')} description={t('workspace.metaDescription')} />

      <section className="workspace-hero workspace-hero--compact">
        <div className="workspace-hero__content">
          <p className="eyebrow">{t('workspace.eyebrow')}</p>
          <h1 className="workspace-hero__title">{t('workspace.title')}</h1>
          <p>{t('workspace.description')}</p>
          <div className="hero-actions">
            <Link className="primary-button" to={buildLocalePath(locale as AppLocale, 'app/bookings')}>
              {t('workspace.navBookings')}
            </Link>
            {canManageProviderArea(auth.profile) ? (
              <Link className="secondary-button" to={buildLocalePath(locale as AppLocale, 'app/provider')}>
                {t('workspace.navProvider')}
              </Link>
            ) : null}
          </div>
        </div>

        <article className="hero-panel__aside">
          <p className="workspace-card__label">{t('workspace.accountTitle')}</p>
          <h2>{getUserDisplayName(auth.profile?.firstName, auth.profile?.lastName, auth.profile?.email)}</h2>
          <p>{auth.profile?.email}</p>
          <div className="hero-aside-list">
            <span>
              {t('workspace.roles')}: {auth.profile?.roles.map(getRoleLabel).join(', ') || t('workspace.guestName')}
            </span>
            <span>
              {t('workspace.summaryMemberships')}: {auth.profile?.memberships.length ?? 0}
            </span>
            <span>
              {t('workspace.summaryProvider')}:{' '}
              {auth.profile?.providerProfile
                ? getModerationStatusLabel(auth.profile.providerProfile.approvalStatus)
                : t('workspace.profileMissingTitle')}
            </span>
          </div>
        </article>
      </section>

      <section className="workspace-quick-grid">
        {canAccessAdminArea(auth.profile) ? (
          <Link className="workspace-quick-card" to={buildLocalePath(locale as AppLocale, 'app/admin')}>
            <p className="workspace-card__label">{t('workspace.navAdmin')}</p>
            <h2>{t('admin.title')}</h2>
            <p>{t('admin.description')}</p>
          </Link>
        ) : null}

        <Link className="workspace-quick-card" to={buildLocalePath(locale as AppLocale, 'app/bookings')}>
          <p className="workspace-card__label">{t('workspace.navBookings')}</p>
          <h2>{t('workspace.bookingsTitle')}</h2>
          <p>{t('workspace.bookingsDescription')}</p>
        </Link>

        {canManageOrganizations(auth.profile) ? (
          <Link className="workspace-quick-card" to={buildLocalePath(locale as AppLocale, 'app/organization')}>
            <p className="workspace-card__label">{t('workspace.navOrganization')}</p>
            <h2>{t('workspace.organizationTitle')}</h2>
            <p>{t('workspace.organizationDescription')}</p>
          </Link>
        ) : null}

        {canManageProviderArea(auth.profile) ? (
          <Link className="workspace-quick-card" to={buildLocalePath(locale as AppLocale, 'app/provider')}>
            <p className="workspace-card__label">{t('workspace.navProvider')}</p>
            <h2>{t('workspace.providerTitle')}</h2>
            <p>{t('workspace.providerDescription')}</p>
          </Link>
        ) : null}
      </section>

      {auth.profile && auth.profile.memberships.length > 0 ? (
        <section className="workspace-panel">
          <div className="workspace-panel__header">
            <div>
              <p className="workspace-card__label">{t('workspace.memberships')}</p>
              <h2>{t('workspace.membershipListTitle')}</h2>
            </div>
          </div>

          <div className="public-stack">
            {auth.profile.memberships.map((membership) => (
              <article key={membership.organizationId} className="public-list-item">
                <div className="public-list-item__body">
                  <p className="workspace-card__label">{membership.title}</p>
                  <h3>{membership.organizationName}</h3>
                  <p>{t('workspace.membershipCardDescription')}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
