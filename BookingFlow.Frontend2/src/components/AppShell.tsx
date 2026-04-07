import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { type ReactNode } from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuth } from '../features/auth/AuthProvider'
import { buildLocalePath } from '../app/router'
import type { AppLocale } from '../features/i18n/config'

interface AppShellProps {
  children: ReactNode
  locale: AppLocale
}

export function AppShell({ children, locale }: AppShellProps) {
  const { t } = useTranslation()
  const auth = useAuth()

  return (
    <div className="app-frame">
      <header className="topbar">
        <NavLink className="brandmark" to={buildLocalePath(locale)}>
          <span className="brandmark__label">BookingFlow</span>
          <span className="brandmark__subline">{t('brand.tagline')}</span>
        </NavLink>

        <nav className="topbar__nav" aria-label={t('navigation.primary')}>
          <NavLink className="topbar__link" to={buildLocalePath(locale, 'organizations')}>
            {t('navigation.explore')}
          </NavLink>
          <NavLink className="topbar__link" to={buildLocalePath(locale, 'providers')}>
            {t('navigation.providers')}
          </NavLink>
          <NavLink className="topbar__link" to={buildLocalePath(locale, 'app')}>
            {t('navigation.workspace')}
          </NavLink>
        </nav>

        <div className="topbar__actions">
          <LanguageSwitcher currentLocale={locale} />
          {auth.isAuthenticated ? (
            <button className="ghost-button" type="button" onClick={auth.logout}>
              {t('actions.signOut')}
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={() => auth.login(locale)}>
              {t('actions.signIn')}
            </button>
          )}
        </div>
      </header>

      <main className="page-shell">{children}</main>
    </div>
  )
}
