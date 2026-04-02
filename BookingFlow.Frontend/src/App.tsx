import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LocaleProvider } from './i18n/LocaleContext'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage'
import { EventPage } from './pages/EventPage'
import { HomePage } from './pages/HomePage'
import { MyBookingsPage } from './pages/MyBookingsPage'
import { OrganizationPage } from './pages/OrganizationPage'
import { ProviderPage } from './pages/ProviderPage'
import { ProviderStudioPage } from './pages/ProviderStudioPage'
import { ResourcePage } from './pages/ResourcePage'

function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="auth" element={<AuthPage />} />
            <Route path="organizations/:organizationId" element={<OrganizationPage />} />
            <Route path="events/:eventId" element={<EventPage />} />
            <Route path="providers/:providerId" element={<ProviderPage />} />
            <Route path="resources/:resourceId" element={<ResourcePage />} />

            <Route element={<ProtectedRoute allowedRoles={['Client']} />}>
              <Route path="bookings" element={<MyBookingsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Provider']} />}>
              <Route path="provider" element={<ProviderStudioPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </LocaleProvider>
  )
}

export default App
