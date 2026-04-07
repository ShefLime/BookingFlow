import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { LoadingState } from './LoadingState'
import { EmptyState } from './EmptyState'
import type { AppLocale } from '../features/i18n/config'

export function RequireAuth({ children }: { children: ReactElement }) {
  const { t } = useTranslation()
  const { locale = 'ru' } = useParams()
  const auth = useAuth()

  if (!auth.authReady) {
    return <LoadingState label={t('states.loadingAuth')} />
  }

  if (!auth.isAuthenticated) {
    return (
      <EmptyState
        title={t('workspace.authRequiredTitle')}
        description={t('workspace.authRequiredDescription')}
        actionLabel={t('actions.signIn')}
        action={() => auth.login(locale as AppLocale)}
      />
    )
  }

  return children
}
