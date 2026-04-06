import { useEffect, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type {
  OrganizationAnalytics,
  OrganizationSubscription,
  OrganizationSubscriptionPlan,
  UpsertOrganizationSubscriptionPayload,
} from '../types/api'

const subscriptionPlans: OrganizationSubscriptionPlan[] = ['Starter', 'Growth', 'Premium']

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10)
}

function createDefaultSubscriptionForm(): UpsertOrganizationSubscriptionPayload {
  return {
    plan: 'Growth',
    isAnalyticsEnabled: true,
    startsAtUtc: new Date().toISOString(),
    endsAtUtc: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    monthlyPrice: 149,
    currency: 'USD',
  }
}

function toSubscriptionForm(subscription: OrganizationSubscription | null): UpsertOrganizationSubscriptionPayload {
  if (!subscription) {
    return createDefaultSubscriptionForm()
  }

  return {
    plan: subscription.plan,
    isAnalyticsEnabled: subscription.isAnalyticsEnabled,
    startsAtUtc: subscription.startsAtUtc,
    endsAtUtc: subscription.endsAtUtc ?? undefined,
    monthlyPrice: subscription.monthlyPrice ?? undefined,
    currency: subscription.currency ?? 'USD',
  }
}

export function OrganizationAnalyticsPanel({
  organizationId,
  token,
  isAdmin,
}: {
  organizationId: string
  token: string
  isAdmin: boolean
}) {
  const { locale } = useLocale()
  const copy = {
    ru: {
      loadFailed: 'Не удалось загрузить аналитику.',
      updateSuccess: 'Подписка обновлена.',
      updateFailed: 'Не удалось обновить подписку.',
      kicker: 'Аналитика',
      title: 'Показатели организации',
      from: 'С',
      to: 'По',
      active: 'Аналитика активна',
      locked: 'Аналитика закрыта',
      noPlan: 'Нет плана',
      openEnded: 'без даты окончания',
      activeFrom: 'Активна с',
      collectOnly: 'Данные уже собираются. Подключите подписку, чтобы открыть аналитику менеджерам организации.',
      subscriptionAccess: 'Доступ по подписке',
      plan: 'План',
      monthlyPrice: 'Цена в месяц',
      starts: 'Старт',
      ends: 'Окончание',
      enableManagers: 'Открыть доступ к аналитике менеджерам организации',
      save: 'Сохранить подписку',
      loading: 'Загружаю аналитику...',
      views: 'Просмотры',
      bookings: 'Записи',
      expectedRevenue: 'Ожидаемая выручка',
      newClients: 'Новые клиенты',
      occupancy: 'Заполняемость',
      efficiency: 'Эффективность',
      retention30: 'Клиенты без возврата за 30 дней',
      viewsBreakdown: 'организация, услуги, события',
      bookingsBreakdown: 'будущие записи и записи на персонал',
      forecastWindow: 'Окно прогноза',
      repeatClients: 'повторных клиентов за тот же период',
      eventFill: 'Заполняемость событий',
      efficiencyDetail: 'Отмены и среднее окно до записи',
      popularity: 'Популярность',
      topServices: 'Топ услуг',
      staff: 'Персонал',
      topStaff: 'Самые востребованные специалисты',
      interest: 'Интерес',
      mostViewed: 'Самые просматриваемые страницы',
      outreach: 'Тёплый прозвон',
      noRiskClients: 'Нет клиентов в зоне риска',
      unlockMessage: 'Аналитика собирается, но для доступа менеджеров нужна активная подписка.',
    },
    en: {
      loadFailed: 'Failed to load analytics.',
      updateSuccess: 'Subscription updated.',
      updateFailed: 'Failed to update subscription.',
      kicker: 'Analytics',
      title: 'Organization performance',
      from: 'From',
      to: 'To',
      active: 'Analytics active',
      locked: 'Analytics locked',
      noPlan: 'No plan',
      openEnded: 'open-ended',
      activeFrom: 'Active from',
      collectOnly: 'Data is already being collected. Activate a subscription to unlock analytics for organization managers.',
      subscriptionAccess: 'Subscription access',
      plan: 'Plan',
      monthlyPrice: 'Monthly price',
      starts: 'Starts',
      ends: 'Ends',
      enableManagers: 'Enable analytics access for organization managers',
      save: 'Save subscription',
      loading: 'Loading analytics...',
      views: 'Views',
      bookings: 'Bookings',
      expectedRevenue: 'Expected revenue',
      newClients: 'New clients',
      occupancy: 'Occupancy',
      efficiency: 'Efficiency',
      retention30: 'Clients who did not return in 30 days',
      viewsBreakdown: 'organization, services, events',
      bookingsBreakdown: 'upcoming bookings and staff bookings',
      forecastWindow: 'Forecast window',
      repeatClients: 'repeat clients in the same period',
      eventFill: 'Event fill',
      efficiencyDetail: 'Cancellation rate and average lead time',
      popularity: 'Popularity',
      topServices: 'Top services',
      staff: 'Staff',
      topStaff: 'Most booked personnel',
      interest: 'Interest',
      mostViewed: 'Most viewed pages',
      outreach: 'Warm outreach',
      noRiskClients: 'No at-risk clients',
      unlockMessage: 'Analytics data is being collected, but this organization needs an active subscription to unlock it for managers.',
    },
    vi: {
      loadFailed: 'Khong the tai phan tich.',
      updateSuccess: 'Da cap nhat goi.',
      updateFailed: 'Khong the cap nhat goi.',
      kicker: 'Phan tich',
      title: 'Hieu suat to chuc',
      from: 'Tu',
      to: 'Den',
      active: 'Da mo phan tich',
      locked: 'Phan tich bi khoa',
      noPlan: 'Chua co goi',
      openEnded: 'khong gioi han',
      activeFrom: 'Hieu luc tu',
      collectOnly: 'Du lieu da duoc thu thap. Hay kich hoat goi de mo phan tich cho quan ly to chuc.',
      subscriptionAccess: 'Quyen truy cap theo goi',
      plan: 'Goi',
      monthlyPrice: 'Gia theo thang',
      starts: 'Bat dau',
      ends: 'Ket thuc',
      enableManagers: 'Mo quyen phan tich cho quan ly to chuc',
      save: 'Luu goi',
      loading: 'Dang tai phan tich...',
      views: 'Luot xem',
      bookings: 'Luot dat',
      expectedRevenue: 'Doanh thu du kien',
      newClients: 'Khach moi',
      occupancy: 'Ti le lap day',
      efficiency: 'Hieu qua',
      retention30: 'Khach chua quay lai trong 30 ngay',
      viewsBreakdown: 'to chuc, dich vu, su kien',
      bookingsBreakdown: 'lich sap toi va lich cho nhan su',
      forecastWindow: 'Khung du bao',
      repeatClients: 'khach quay lai trong cung giai doan',
      eventFill: 'Ti le lap day su kien',
      efficiencyDetail: 'Ti le huy va thoi gian dat truoc trung binh',
      popularity: 'Do pho bien',
      topServices: 'Dich vu noi bat',
      staff: 'Nhan su',
      topStaff: 'Nhan su duoc dat nhieu nhat',
      interest: 'Muc do quan tam',
      mostViewed: 'Trang duoc xem nhieu nhat',
      outreach: 'Cham soc lai',
      noRiskClients: 'Khong co khach dang nguy co roi bo',
      unlockMessage: 'Du lieu phan tich dang duoc thu thap, nhung can goi dang hoat dong de mo cho quan ly.',
    },
  }[locale]
  const [fromDate, setFromDate] = useState(() => toDateInputValue(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)))
  const [toDate, setToDate] = useState(() => toDateInputValue(new Date()))
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null)
  const [subscriptionForm, setSubscriptionForm] = useState<UpsertOrganizationSubscriptionPayload>(() =>
    createDefaultSubscriptionForm(),
  )
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingSubscription, setSavingSubscription] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadAnalytics() {
      try {
        setLoading(true)
        const [nextSubscription, nextAnalytics] = await Promise.all([
          api.getOrganizationSubscription(organizationId, token),
          api.getOrganizationAnalytics(organizationId, token, {
            fromUtc: new Date(`${fromDate}T00:00:00.000Z`).toISOString(),
            toUtc: new Date(`${toDate}T23:59:59.999Z`).toISOString(),
            forecastDays: 30,
          }),
        ])

        if (!isMounted) {
          return
        }

        setSubscription(nextSubscription)
        setSubscriptionForm(toSubscriptionForm(nextSubscription))
        setAnalytics(nextAnalytics)
        setError(null)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : copy.loadFailed)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadAnalytics()

    return () => {
      isMounted = false
    }
  }, [copy.loadFailed, fromDate, organizationId, toDate, token])

  async function handleSaveSubscription() {
    try {
      setSavingSubscription(true)
      const nextSubscription = await api.upsertOrganizationSubscription(organizationId, subscriptionForm, token)
      setSubscription(nextSubscription)
      setSubscriptionForm(toSubscriptionForm(nextSubscription))
      setMessage(copy.updateSuccess)
      setError(null)
      const nextAnalytics = await api.getOrganizationAnalytics(organizationId, token, {
        fromUtc: new Date(`${fromDate}T00:00:00.000Z`).toISOString(),
        toUtc: new Date(`${toDate}T23:59:59.999Z`).toISOString(),
        forecastDays: 30,
      })
      setAnalytics(nextAnalytics)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.updateFailed)
    } finally {
      setSavingSubscription(false)
    }
  }

  return (
    <section className="surface-card section-stack">
      <header>
        <span className="section-kicker">{copy.kicker}</span>
        <h2 className="section-title">{copy.title}</h2>
      </header>

      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="analytics-from">{copy.from}</label>
          <input
            id="analytics-from"
            className="input-field"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="analytics-to">{copy.to}</label>
          <input
            id="analytics-to"
            className="input-field"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
      </div>

      {message ? <div className="message-banner">{message}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <article className="editor-stack">
        <div className="meta-line">
          <span className={subscription?.isActive ? 'status-pill success' : 'status-pill warning'}>
            {subscription?.isActive ? copy.active : copy.locked}
          </span>
          <span className="type-pill">{subscription?.plan ?? copy.noPlan}</span>
          {subscription?.monthlyPrice ? (
            <span className="metric-pill">
              {subscription.monthlyPrice} {subscription.currency ?? 'USD'}
            </span>
          ) : null}
        </div>

        {subscription ? (
          <p className="supporting-copy">
            {copy.activeFrom} {formatDateTime(subscription.startsAtUtc, locale)}{' '}
            {copy.to.toLowerCase()} {subscription.endsAtUtc ? formatDateTime(subscription.endsAtUtc, locale) : copy.openEnded}.
          </p>
        ) : (
          <p className="supporting-copy">
            {copy.collectOnly}
          </p>
        )}
      </article>

      {isAdmin ? (
        <article className="editor-stack">
          <span className="stack-label">{copy.subscriptionAccess}</span>
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="subscription-plan">{copy.plan}</label>
              <select
                id="subscription-plan"
                className="select-field"
                value={subscriptionForm.plan}
                onChange={(event) =>
                  setSubscriptionForm((current) => ({
                    ...current,
                    plan: event.target.value as OrganizationSubscriptionPlan,
                  }))
                }
              >
                {subscriptionPlans.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="subscription-price">{copy.monthlyPrice}</label>
              <input
                id="subscription-price"
                className="input-field"
                type="number"
                min="0"
                step="1"
                value={subscriptionForm.monthlyPrice ?? ''}
                onChange={(event) =>
                  setSubscriptionForm((current) => ({
                    ...current,
                    monthlyPrice: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
              />
            </div>

            <div className="field-group">
              <label htmlFor="subscription-start">{copy.starts}</label>
              <input
                id="subscription-start"
                className="input-field"
                type="datetime-local"
                value={subscriptionForm.startsAtUtc.slice(0, 16)}
                onChange={(event) =>
                  setSubscriptionForm((current) => ({
                    ...current,
                    startsAtUtc: new Date(event.target.value).toISOString(),
                  }))
                }
              />
            </div>

            <div className="field-group">
              <label htmlFor="subscription-end">{copy.ends}</label>
              <input
                id="subscription-end"
                className="input-field"
                type="datetime-local"
                value={subscriptionForm.endsAtUtc ? subscriptionForm.endsAtUtc.slice(0, 16) : ''}
                onChange={(event) =>
                  setSubscriptionForm((current) => ({
                    ...current,
                    endsAtUtc: event.target.value ? new Date(event.target.value).toISOString() : undefined,
                  }))
                }
              />
            </div>
          </div>

          <label className="meta-line">
            <input
              type="checkbox"
              checked={subscriptionForm.isAnalyticsEnabled}
              onChange={(event) =>
                setSubscriptionForm((current) => ({
                  ...current,
                  isAnalyticsEnabled: event.target.checked,
                }))
              }
            />
            <span>{copy.enableManagers}</span>
          </label>

          <div className="card-actions">
            <button
              className="solid-button"
              type="button"
              disabled={savingSubscription}
              onClick={() => void handleSaveSubscription()}
            >
              {copy.save}
            </button>
          </div>
        </article>
      ) : null}

      {loading ? (
        <div className="empty-state">
          <h3>{copy.loading}</h3>
        </div>
      ) : analytics ? (
        analytics.hasAccess ? (
          <>
            <div className="metric-grid">
              <article className="metric-card">
                <span className="section-kicker">{copy.views}</span>
                <strong className="metric-value">{analytics.totalViews}</strong>
                <p>
                  {analytics.organizationViews} / {analytics.resourceViews} / {analytics.eventViews} {copy.viewsBreakdown}
                </p>
              </article>
              <article className="metric-card">
                <span className="section-kicker">{copy.bookings}</span>
                <strong className="metric-value">{analytics.bookingsInPeriod}</strong>
                <p>
                  {analytics.upcomingBookings} / {analytics.staffBookings} {copy.bookingsBreakdown}
                </p>
              </article>
              <article className="metric-card highlight">
                <span className="section-kicker">{copy.expectedRevenue}</span>
                <strong className="metric-value">
                  {analytics.expectedRevenue} {analytics.currency}
                </strong>
                <p>{copy.forecastWindow}: {analytics.forecastDays} days</p>
              </article>
            </div>

            <div className="metric-grid">
              <article className="metric-card">
                <span className="section-kicker">{copy.newClients}</span>
                <strong className="metric-value">{analytics.newClients}</strong>
                <p>{analytics.repeatClients} {copy.repeatClients}</p>
              </article>
              <article className="metric-card">
                <span className="section-kicker">{copy.occupancy}</span>
                <strong className="metric-value">{analytics.occupancyRatePercent}%</strong>
                <p>{copy.eventFill}: {analytics.eventFillRatePercent}%</p>
              </article>
              <article className="metric-card">
                <span className="section-kicker">{copy.efficiency}</span>
                <strong className="metric-value">{analytics.conversionRatePercent}%</strong>
                <p>{copy.efficiencyDetail}: {analytics.cancellationRatePercent}% / {analytics.averageLeadTimeDays} days</p>
              </article>
            </div>

            <div className="two-column-grid">
              <article className="surface-card section-stack">
                <header>
                  <span className="section-kicker">{copy.popularity}</span>
                  <h3>{copy.topServices}</h3>
                </header>
                <div className="table-like">
                  {analytics.topServices.map((item) => (
                    <article key={item.entityId} className="table-row">
                      <header>
                        <strong>{item.name}</strong>
                        {item.category ? <small>{item.category}</small> : null}
                      </header>
                      <div className="meta-line">
                        <span className="metric-pill">{item.bookings} bookings</span>
                        <span className="metric-pill">{item.expectedRevenue} {analytics.currency}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="surface-card section-stack">
                <header>
                  <span className="section-kicker">{copy.staff}</span>
                  <h3>{copy.topStaff}</h3>
                </header>
                <div className="table-like">
                  {analytics.staffLeaderboard.map((item) => (
                    <article key={item.entityId} className="table-row">
                      <header>
                        <strong>{item.name}</strong>
                        {item.category ? <small>{item.category}</small> : null}
                      </header>
                      <div className="meta-line">
                        <span className="metric-pill">{item.bookings} bookings</span>
                        <span className="metric-pill">{item.uniqueClients} clients</span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </div>

            <div className="two-column-grid">
              <article className="surface-card section-stack">
                <header>
                  <span className="section-kicker">{copy.interest}</span>
                  <h3>{copy.mostViewed}</h3>
                </header>
                <div className="table-like">
                  {analytics.topViewedItems.map((item) => (
                    <article key={`${item.entityType}-${item.entityId}`} className="table-row">
                      <header>
                        <strong>{item.name}</strong>
                        <small>{item.entityType}</small>
                      </header>
                      <div className="meta-line">
                        <span className="metric-pill">{item.views} views</span>
                        <span className="metric-pill">{item.bookings} bookings</span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="surface-card section-stack">
                <header>
                  <span className="section-kicker">{copy.outreach}</span>
                  <h3>{copy.retention30}</h3>
                </header>
                {analytics.retentionCandidates.length === 0 ? (
                  <div className="empty-state">
                    <h3>{copy.noRiskClients}</h3>
                  </div>
                ) : (
                  <div className="table-like">
                    {analytics.retentionCandidates.map((client) => (
                      <article key={client.userId} className="table-row">
                        <header>
                          <strong>{client.fullName}</strong>
                          <small>{client.email}</small>
                        </header>
                        <div className="meta-line">
                          <span className="metric-pill">{client.lastBookingName}</span>
                          <span className="metric-pill">{formatDateTime(client.lastBookingAtUtc, 'en')}</span>
                        </div>
                        {client.phone ? <p className="muted-code">{client.phone}</p> : null}
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </>
        ) : (
          <div className="info-banner">
            {analytics.accessMessage ?? copy.unlockMessage}
          </div>
        )
      ) : null}
    </section>
  )
}
