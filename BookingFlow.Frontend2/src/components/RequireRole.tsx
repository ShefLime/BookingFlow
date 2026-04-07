import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from './EmptyState'
import { useAuth } from '../features/auth/AuthProvider'
import type { UserRole } from '../types/api'

export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[]
  children: ReactElement
}) {
  const { t } = useTranslation()
  const auth = useAuth()

  if (!auth.profile || !roles.some((role) => auth.profile?.roles.includes(role))) {
    return (
      <EmptyState
        title={t('workspace.forbiddenTitle')}
        description={t('workspace.forbiddenDescription')}
      />
    )
  }

  return children
}
