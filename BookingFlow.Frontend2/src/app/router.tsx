import { Suspense, lazy, useEffect, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { RequireAuth } from '../components/RequireAuth'
import { RequireRole } from '../components/RequireRole'
import { WorkspaceLayout } from '../components/WorkspaceLayout'
import { detectPreferredLocale, isSupportedLocale, persistLocale, supportedLocales, type AppLocale } from '../features/i18n/config'

function lazyPage<TModule, TKey extends keyof TModule & string>(
  loader: () => Promise<TModule>,
  key: TKey,
): LazyExoticComponent<ComponentType> {
  return lazy(async () => {
    const module = await loader()
    return {
      default: module[key] as unknown as ComponentType,
    }
  })
}

const HomePage = lazyPage(() => import('../pages/HomePage'), 'HomePage')
const OrganizationsPage = lazyPage(() => import('../pages/OrganizationsPage'), 'OrganizationsPage')
const OrganizationDetailPage = lazyPage(
  () => import('../pages/OrganizationDetailPage'),
  'OrganizationDetailPage',
)
const ProvidersPage = lazyPage(() => import('../pages/ProvidersPage'), 'ProvidersPage')
const ProviderDetailPage = lazyPage(
  () => import('../pages/ProviderDetailPage'),
  'ProviderDetailPage',
)
const ResourcesPage = lazyPage(() => import('../pages/ResourcesPage'), 'ResourcesPage')
const ResourceDetailPage = lazyPage(
  () => import('../pages/ResourceDetailPage'),
  'ResourceDetailPage',
)
const WorkspacePage = lazyPage(() => import('../pages/WorkspacePage'), 'WorkspacePage')
const MyBookingsPage = lazyPage(() => import('../pages/MyBookingsPage'), 'MyBookingsPage')
const AdminPage = lazyPage(() => import('../pages/AdminPage'), 'AdminPage')
const OrganizationStudioPage = lazyPage(
  () => import('../pages/OrganizationStudioPage'),
  'OrganizationStudioPage',
)
const ProviderStudioPage = lazyPage(
  () => import('../pages/ProviderStudioPage'),
  'ProviderStudioPage',
)

function renderLazyPage(Component: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<LoadingState label="Загрузка данных…" />}>
      <Component />
    </Suspense>
  )
}

function RootRedirect() {
  const locale = detectPreferredLocale()
  return <Navigate to={`/${locale}`} replace />
}

function LocaleGuard() {
  const { locale } = useParams()
  const { i18n } = useTranslation()

  if (!isSupportedLocale(locale)) {
    return <Navigate to={`/${detectPreferredLocale()}`} replace />
  }

  useEffect(() => {
    persistLocale(locale)
    document.documentElement.lang = locale
    void i18n.changeLanguage(locale)
  }, [i18n, locale])

  return (
    <AppShell locale={locale}>
      <Outlet />
    </AppShell>
  )
}

function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <EmptyState
      title={t('states.notFoundTitle')}
      description={t('states.notFoundDescription')}
      actionLabel={t('actions.goHome')}
      to={`/${detectPreferredLocale()}`}
    />
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/:locale',
    element: <LocaleGuard />,
    children: [
      {
        index: true,
        element: renderLazyPage(HomePage),
      },
      {
        path: 'organizations',
        element: renderLazyPage(OrganizationsPage),
      },
      {
        path: 'organizations/:organizationId',
        element: renderLazyPage(OrganizationDetailPage),
      },
      {
        path: 'providers',
        element: renderLazyPage(ProvidersPage),
      },
      {
        path: 'providers/:providerId',
        element: renderLazyPage(ProviderDetailPage),
      },
      {
        path: 'resources',
        element: renderLazyPage(ResourcesPage),
      },
      {
        path: 'resources/:resourceId',
        element: renderLazyPage(ResourceDetailPage),
      },
      {
        path: 'app',
        element: (
          <RequireAuth>
            <WorkspaceLayout />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: renderLazyPage(WorkspacePage),
          },
          {
            path: 'bookings',
            element: renderLazyPage(MyBookingsPage),
          },
          {
            path: 'admin',
            element: (
              <RequireRole roles={['Admin']}>
                {renderLazyPage(AdminPage)}
              </RequireRole>
            ),
          },
          {
            path: 'organization',
            element: (
              <RequireRole roles={['Admin', 'Manager']}>
                {renderLazyPage(OrganizationStudioPage)}
              </RequireRole>
            ),
          },
          {
            path: 'provider',
            element: (
              <RequireRole roles={['Admin', 'Provider']}>
                {renderLazyPage(ProviderStudioPage)}
              </RequireRole>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function buildLocalePath(locale: AppLocale, suffix = '') {
  return suffix ? `/${locale}/${suffix}` : `/${locale}`
}

export function buildAlternateLanguageLinks(pathname: string) {
  const trimmedPath = pathname.replace(/^\/(ru|en|vi)/, '')

  return supportedLocales.map((locale) => ({
    locale,
    href: `${window.location.origin}/${locale}${trimmedPath}`,
  }))
}
