import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../i18n/LocaleContext'
import { formatUserRole, getPrimaryRole } from '../lib/format'
import type { Locale } from '../types/api'

export function AppLayout() {
  const { isAuthenticated, isLoading, logout, roles, session, hasRole } = useAuth()
  const { locale, setLocale, t } = useLocale()

  const supportedLocales: Locale[] = ['ru', 'en', 'vi']
  const primaryRole = getPrimaryRole(roles)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-main">
          <div className="brand-wrap">
            <NavLink to="/" className="brand-link">
              <span className="brand-badge">BF</span>
              <span>
                <strong>BookingFlow</strong>
                <small>Clubs, bars, coaches, providers and events</small>
              </span>
            </NavLink>
          </div>

          <div className="topbar-actions">
            <div className="locale-switcher">
              {supportedLocales.map((supportedLocale) => (
                <button
                  key={supportedLocale}
                  type="button"
                  className={supportedLocale === locale ? 'locale-button active' : 'locale-button'}
                  onClick={() => setLocale(supportedLocale)}
                >
                  {supportedLocale.toUpperCase()}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="profile-chip">
                <strong>...</strong>
              </div>
            ) : null}

            {isAuthenticated && session ? (
              <>
                <div className="profile-chip">
                  {primaryRole ? (
                    <span className="role-pill">{formatUserRole(primaryRole, locale)}</span>
                  ) : null}
                  <div>
                    <strong>{session.user.email}</strong>
                    <small>
                      {hasRole('Admin', 'Manager')
                        ? t('layout.adminArea')
                        : hasRole('Provider')
                          ? t('layout.providerArea')
                          : t('layout.clientArea')}
                    </small>
                  </div>
                </div>
                <button className="ghost-button" type="button" onClick={() => void logout()}>
                  {t('auth.signOut')}
                </button>
              </>
            ) : (
              !isLoading && (
                <NavLink to="/auth" className="primary-link-button">
                  {t('auth.signIn')}
                </NavLink>
              )
            )}
          </div>
        </div>

        <div className="topbar-nav-row">
          <nav className="topnav">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {t('nav.catalog')}
            </NavLink>

            {isAuthenticated ? (
              <NavLink
                to="/bookings"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                {t('nav.bookings')}
              </NavLink>
            ) : null}

            {hasRole('Provider') ? (
              <NavLink
                to="/provider"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                {t('nav.provider')}
              </NavLink>
            ) : null}

            {hasRole('Admin', 'Manager') ? (
              <NavLink
                to="/admin"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                {t('nav.admin')}
              </NavLink>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="page-frame">
        <Outlet />
      </main>
    </div>
  )
}
