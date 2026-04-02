import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { api } from '../lib/api'
import { getKeycloak, initializeKeycloak } from '../lib/keycloak'
import type { AuthSession, CurrentUser, UserRole } from '../types/api'

interface AuthContextValue {
  session: AuthSession | null
  user: CurrentUser | null
  roles: UserRole[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  hasRole: (...roles: UserRole[]) => boolean
  signIn: (redirectUri?: string) => Promise<void>
  register: (redirectUri?: string) => Promise<void>
  logout: (redirectUri?: string) => Promise<void>
  refreshProfile: () => Promise<AuthSession | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toExpirationDate(exp?: number) {
  const expiresAt = exp ? exp * 1000 : Date.now() + 5 * 60 * 1000
  return new Date(expiresAt).toISOString()
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sessionRef = useRef<AuthSession | null>(null)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const synchronizeSession = useEffectEvent(async (withProfile: boolean) => {
    const keycloak = getKeycloak()
    if (!keycloak.authenticated || !keycloak.token) {
      startTransition(() => {
        setSession(null)
      })

      return null
    }

    const currentUser =
      withProfile || !session?.user ? await api.getCurrentUser(keycloak.token) : session.user

    const nextSession: AuthSession = {
      accessToken: keycloak.token,
      expiresAtUtc: toExpirationDate(keycloak.tokenParsed?.exp),
      user: currentUser,
    }

    startTransition(() => {
      setSession(nextSession)
      setError(null)
    })

    return nextSession
  })

  useEffect(() => {
    let cancelled = false

    async function initializeSession() {
      try {
        setIsLoading(true)
        const authenticated = await initializeKeycloak()

        if (cancelled) {
          return
        }

        if (!authenticated) {
          startTransition(() => {
            setSession(null)
            setError(null)
          })
          return
        }

        await synchronizeSession(true)
      } catch (initializationError) {
        if (!cancelled) {
          startTransition(() => {
            setSession(null)
            setError(
              initializationError instanceof Error
                ? initializationError.message
                : 'Failed to initialize authentication.',
            )
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void initializeSession()

    return () => {
      cancelled = true
    }
  }, [synchronizeSession])

  useEffect(() => {
    if (!session) {
      return
    }

    const intervalId = window.setInterval(async () => {
      try {
        const keycloak = getKeycloak()
        if (!keycloak.authenticated) {
          startTransition(() => {
            setSession(null)
          })
          return
        }

        const refreshed = await keycloak.updateToken(60)
        if (!keycloak.token) {
          startTransition(() => {
            setSession(null)
          })
          return
        }

        const nextExpiresAtUtc = toExpirationDate(keycloak.tokenParsed?.exp)
        const currentSession = sessionRef.current
        if (
          currentSession &&
          currentSession.accessToken === keycloak.token &&
          currentSession.expiresAtUtc === nextExpiresAtUtc
        ) {
          return
        }

        startTransition(() => {
          setSession((current) => {
            if (!current) {
              return current
            }

            if (
              current.accessToken === keycloak.token &&
              current.expiresAtUtc === nextExpiresAtUtc
            ) {
              return current
            }

            return {
              ...current,
              accessToken: keycloak.token!,
              expiresAtUtc: nextExpiresAtUtc,
            }
          })
        })

        if (refreshed) {
          setError(null)
        }
      } catch {
        startTransition(() => {
          setSession(null)
          setError('Your session has expired. Please sign in again.')
        })
      }
    }, 30_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [session !== null])

  const value = useMemo<AuthContextValue>(() => {
    const roles = session?.user.roles ?? []

    return {
      session,
      user: session?.user ?? null,
      roles,
      isAuthenticated: session !== null,
      isLoading,
      error,
      hasRole(...candidateRoles) {
        if (candidateRoles.length === 0) {
          return session !== null
        }

        return candidateRoles.some((candidateRole) => roles.includes(candidateRole))
      },
      async signIn(redirectUri = window.location.href) {
        const keycloak = getKeycloak()
        await keycloak.login({ redirectUri })
      },
      async register(redirectUri = window.location.href) {
        const keycloak = getKeycloak()
        await keycloak.register({ redirectUri })
      },
      async logout(redirectUri = window.location.origin) {
        const keycloak = getKeycloak()
        startTransition(() => {
          setSession(null)
        })
        await keycloak.logout({ redirectUri })
      },
      async refreshProfile() {
        return synchronizeSession(true)
      },
    }
  }, [error, isLoading, session, synchronizeSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
