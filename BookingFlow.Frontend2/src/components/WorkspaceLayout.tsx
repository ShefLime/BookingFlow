import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buildLocalePath } from '../app/router'
import { useAuth } from '../features/auth/AuthProvider'
import { canAccessAdminArea, canManageOrganizations, canManageProviderArea } from '../lib/authz'
import { getRoleLabel, getUserDisplayName } from '../lib/display'
import type { AppLocale } from '../features/i18n/config'

export function WorkspaceLayout() {
  const { t } = useTranslation()
  const { locale = 'ru' } = useParams()
  const auth = useAuth()
  const currentLocale = locale as AppLocale

  return (
    <section className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar__section">
          <h2>{t('workspace.shellTitle')}</h2>
          <p>{t('workspace.shellDescription')}</p>
        </div>

        <nav className="workspace-menu" aria-label={t('workspace.shellTitle')}>
          <NavLink end className="workspace-menu__item" to={buildLocalePath(currentLocale, 'app')}>
            {t('workspace.navOverview')}
          </NavLink>
          <NavLink className="workspace-menu__item" to={buildLocalePath(currentLocale, 'app/bookings')}>
            {t('workspace.navBookings')}
          </NavLink>
          {canAccessAdminArea(auth.profile) ? (
            <NavLink className="workspace-menu__item" to={buildLocalePath(currentLocale, 'app/admin')}>
              {t('workspace.navAdmin')}
            </NavLink>
          ) : null}
          {canManageOrganizations(auth.profile) ? (
            <NavLink className="workspace-menu__item" to={buildLocalePath(currentLocale, 'app/organization')}>
              {t('workspace.navOrganization')}
            </NavLink>
          ) : null}
          {canManageProviderArea(auth.profile) ? (
            <NavLink className="workspace-menu__item" to={buildLocalePath(currentLocale, 'app/provider')}>
              {t('workspace.navProvider')}
            </NavLink>
          ) : null}
        </nav>

        {auth.profile ? (
          <div className="workspace-sidebar__section workspace-sidebar__section--compact workspace-sidebar__account">
            <p className="workspace-card__label">{t('workspace.accountTitle')}</p>
            <strong>
              {getUserDisplayName(auth.profile.firstName, auth.profile.lastName, auth.profile.email)}
            </strong>
            <div className="workspace-sidebar__meta">
              <span>{auth.profile.email}</span>
              <span>{auth.profile.roles.map(getRoleLabel).join(', ')}</span>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="workspace-content">
        <Outlet />
      </div>
    </section>
  )
}
