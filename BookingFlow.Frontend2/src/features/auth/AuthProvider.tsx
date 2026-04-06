import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { createKeycloakClient, hasKeycloakConfig } from '../../lib/keycloak'
import type { CurrentUser } from '../../types/api'
import type { AppLocale } from '../i18n/config'

interface AuthContextValue {
  authReady: boolean
  isAuthenticated: boolean
  profile: CurrentUser | null
  token: string | null
  refreshProfile: () => Promise<CurrentUser | undefined>
  login: (locale: AppLocale) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [authReady, setAuthReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!hasKeycloakConfig()) {
      setAuthReady(true)
      return
    }

    const keycloak = createKeycloakClient()

    void keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      })
      .then((authenticated) => {
        setIsAuthenticated(authenticated)
        setToken(authenticated ? keycloak.token ?? null : null)
      })
      .catch(() => {
        setIsAuthenticated(false)
        setToken(null)
      })
      .finally(() => {
        setAuthReady(true)
      })

    const refreshTimer = window.setInterval(() => {
      if (!keycloak.authenticated) {
        return
      }

      void keycloak.updateToken(30).then(() => {
        setToken(keycloak.token ?? null)
      })
    }, 30000)

    return () => {
      window.clearInterval(refreshTimer)
    }
  }, [])

  const profileQuery = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => api.auth.getCurrentUser(token!),
    enabled: authReady && Boolean(token),
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      authReady,
      isAuthenticated,
      profile: profileQuery.data ?? null,
      token,
      refreshProfile: () => profileQuery.refetch().then((result) => result.data),
      login: (locale) => {
        if (!hasKeycloakConfig()) {
          return
        }

        void createKeycloakClient().login({
          redirectUri: `${window.location.origin}/${locale}/app`,
        })
      },
      logout: () => {
        if (!hasKeycloakConfig()) {
          return
        }

        setToken(null)
        setIsAuthenticated(false)
        void createKeycloakClient().logout({
          redirectUri: window.location.origin,
        })
      },
    }),
    [authReady, isAuthenticated, profileQuery, profileQuery.data, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
