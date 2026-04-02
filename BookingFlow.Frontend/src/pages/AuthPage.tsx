import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../i18n/LocaleContext'
import { getDashboardPath } from '../lib/format'

const copy = {
  ru: {
    kicker: 'Единый вход',
    title: 'Авторизация и регистрация теперь работают через Keycloak.',
    description:
      'BookingFlow использует централизованную аутентификацию: саморегистрация клиентов остаётся, а после первого входа локальный профиль, роли и связи с организациями синхронизируются автоматически.',
    signIn: 'Перейти ко входу',
    register: 'Создать аккаунт',
    loading: 'Проверяю активную сессию...',
    featuresTitle: 'Что уже настроено',
    featureOne: 'Саморегистрация новых пользователей',
    featureTwo: 'Единая сессия для клиента, менеджера, администратора и провайдера услуг',
    featureThree: 'Автоматическое создание локального профиля без привязки к организации',
    demoTitle: 'Demo-аккаунты',
    note: 'После входа система сама определит роли и откроет нужный кабинет.',
  },
  en: {
    kicker: 'Unified access',
    title: 'Authentication and registration now run through Keycloak.',
    description:
      'BookingFlow now uses centralized authentication: self-registration stays available, and after the first sign-in the local profile, roles and organization links are synced automatically.',
    signIn: 'Continue to sign in',
    register: 'Create account',
    loading: 'Checking active session...',
    featuresTitle: 'Already configured',
    featureOne: 'Self-registration for new users',
    featureTwo: 'One session for client, manager, administrator and independent provider',
    featureThree: 'Automatic local profile provisioning without an organization',
    demoTitle: 'Demo accounts',
    note: 'After authentication the platform will detect the available roles and open the right workspace.',
  },
  vi: {
    kicker: 'Dang nhap tap trung',
    title: 'Dang nhap va dang ky hien da duoc chuyen sang Keycloak.',
    description:
      'BookingFlow hien dung xac thuc tap trung: dang ky moi van hoat dong, va sau lan dang nhap dau tien ho so noi bo, vai tro va lien ket to chuc se duoc dong bo tu dong.',
    signIn: 'Di toi dang nhap',
    register: 'Tao tai khoan',
    loading: 'Dang kiem tra phien dang nhap...',
    featuresTitle: 'Da cau hinh',
    featureOne: 'Tu dang ky cho nguoi dung moi',
    featureTwo: 'Mot phien chung cho khach hang, quan ly, quan tri vien va nha cung cap',
    featureThree: 'Tu dong tao ho so noi bo khong can gan vao to chuc',
    demoTitle: 'Tai khoan demo',
    note: 'Sau khi dang nhap he thong se tu xac dinh vai tro va mo dung khu vuc lam viec.',
  },
}

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { locale } = useLocale()
  const { isAuthenticated, isLoading, signIn, register, roles, error, user } = useAuth()
  const currentCopy = copy[locale]
  const redirectPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : roles.includes('Admin') || roles.includes('Manager')
        ? '/admin'
        : user?.providerProfile
          ? '/provider'
          : getDashboardPath(roles)

  const redirectUri = useMemo(
    () => new URL(redirectPath, window.location.origin).toString(),
    [redirectPath],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    void navigate(redirectPath, { replace: true })
  }, [isAuthenticated, navigate, redirectPath])

  if (isLoading) {
    return (
      <div className="empty-state">
        <h2>{currentCopy.loading}</h2>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel section-stack">
        <span className="section-kicker">{currentCopy.kicker}</span>
        <h1>{currentCopy.title}</h1>
        <p>{currentCopy.description}</p>

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="hero-actions">
          <button className="solid-button" type="button" onClick={() => void signIn(redirectUri)}>
            {currentCopy.signIn}
          </button>
          <button className="ghost-button" type="button" onClick={() => void register(redirectUri)}>
            {currentCopy.register}
          </button>
        </div>

        <div className="divider" />

        <div className="section-stack">
          <span className="stack-label">{currentCopy.featuresTitle}</span>
          <div className="compact-list">
            <div className="compact-item">{currentCopy.featureOne}</div>
            <div className="compact-item">{currentCopy.featureTwo}</div>
            <div className="compact-item">{currentCopy.featureThree}</div>
          </div>
        </div>

        <p className="footer-note">{currentCopy.note}</p>
      </section>

      <aside className="auth-panel section-stack">
        <span className="section-kicker">Demo</span>
        <h2 className="section-title">{currentCopy.demoTitle}</h2>

        <article className="compact-item">
          <div className="meta-line">
            <span className="role-pill">Admin</span>
            <strong>admin@bookingflow.local</strong>
          </div>
          <p className="muted-code">Admin123!</p>
        </article>

        <article className="compact-item">
          <div className="meta-line">
            <span className="role-pill">Manager</span>
            <strong>manager@bookingflow.local</strong>
          </div>
          <p className="muted-code">Manager123!</p>
        </article>

        <article className="compact-item">
          <div className="meta-line">
            <span className="role-pill">Client</span>
            <strong>client@bookingflow.local</strong>
          </div>
          <p className="muted-code">Client123!</p>
        </article>

        <article className="compact-item">
          <div className="meta-line">
            <span className="role-pill">Provider</span>
            <strong>provider@bookingflow.local</strong>
          </div>
          <p className="muted-code">Provider123!</p>
        </article>

        <article className="compact-item">
          <div className="meta-line">
            <span className="role-pill">Creator</span>
            <strong>creator@bookingflow.local</strong>
          </div>
          <p className="muted-code">Creator123!</p>
        </article>
      </aside>
    </div>
  )
}
