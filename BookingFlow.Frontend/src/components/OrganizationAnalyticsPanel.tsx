import { useEffect, useEffectEvent, useState } from 'react'
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

  const loadAnalytics = useEffectEvent(async (isMounted: () => boolean) => {
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

      if (!isMounted()) {
        return
      }

      setSubscription(nextSubscription)
      setSubscriptionForm(toSubscriptionForm(nextSubscription))
      setAnalytics(nextAnalytics)
      setError(null)
    } catch (loadError) {
      if (isMounted()) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics.')
      }
    } finally {
      if (isMounted()) {
        setLoading(false)
      }
    }
  })

  useEffect(() => {
    let isMounted = true

    void loadAnalytics(() => isMounted)

    return () => {
      isMounted = false
    }
  }, [fromDate, organizationId, toDate, loadAnalytics])

  async function handleSaveSubscription() {
    try {
      setSavingSubscription(true)
      const nextSubscription = await api.upsertOrganizationSubscription(organizationId, subscriptionForm, token)
      setSubscription(nextSubscription)
      setSubscriptionForm(toSubscriptionForm(nextSubscription))
      setMessage('Subscription updated.')
      setError(null)
      const nextAnalytics = await api.getOrganizationAnalytics(organizationId, token, {
        fromUtc: new Date(`${fromDate}T00:00:00.000Z`).toISOString(),
        toUtc: new Date(`${toDate}T23:59:59.999Z`).toISOString(),
        forecastDays: 30,
      })
      setAnalytics(nextAnalytics)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update subscription.')
    } finally {
      setSavingSubscription(false)
    }
  }

  return (
    <section className="surface-card section-stack">
      <header>
        <span className="section-kicker">Analytics</span>
        <h2 className="section-title">Organization performance</h2>
      </header>

      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="analytics-from">From</label>
          <input
            id="analytics-from"
            className="input-field"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="analytics-to">To</label>
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
            {subscription?.isActive ? 'Analytics active' : 'Analytics locked'}
          </span>
          <span className="type-pill">{subscription?.plan ?? 'No plan'}</span>
          {subscription?.monthlyPrice ? (
            <span className="metric-pill">
              {subscription.monthlyPrice} {subscription.currency ?? 'USD'}
            </span>
          ) : null}
        </div>

        {subscription ? (
          <p className="supporting-copy">
            Active from {formatDateTime(subscription.startsAtUtc, 'en')} to{' '}
            {subscription.endsAtUtc ? formatDateTime(subscription.endsAtUtc, 'en') : 'open-ended'}.
          </p>
        ) : (
          <p className="supporting-copy">
            Data is already being collected. Activate a subscription to unlock analytics for organization managers.
          </p>
        )}
      </article>

      {isAdmin ? (
        <article className="editor-stack">
          <span className="stack-label">Subscription access</span>
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="subscription-plan">Plan</label>
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
              <label htmlFor="subscription-price">Monthly price</label>
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
              <label htmlFor="subscription-start">Starts</label>
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
              <label htmlFor="subscription-end">Ends</label>
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
            <span>Enable analytics access for organization managers</span>
          </label>

          <div className="card-actions">
            <button
              className="solid-button"
              type="button"
              disabled={savingSubscription}
              onClick={() => void handleSaveSubscription()}
            >
              Save subscription
            </button>
          </div>
        </article>
      ) : null}

      {loading ? (
        <div className="empty-state">
          <h3>Loading analytics...</h3>
        </div>
      ) : analytics ? (
        analytics.hasAccess ? (
          <>
            <div className="metric-grid">
              <article className="metric-card">
                <span className="section-kicker">Views</span>
                <strong className="metric-value">{analytics.totalViews}</strong>
                <p>{analytics.organizationViews} org, {analytics.resourceViews} services, {analytics.eventViews} events</p>
              </article>
              <article className="metric-card">
                <span className="section-kicker">Bookings</span>
                <strong className="metric-value">{analytics.bookingsInPeriod}</strong>
                <p>{analytics.upcomingBookings} upcoming and {analytics.staffBookings} on staff</p>
              </article>
              <article className="metric-card highlight">
                <span className="section-kicker">Expected revenue</span>
                <strong className="metric-value">
                  {analytics.expectedRevenue} {analytics.currency}
                </strong>
                <p>Forecast window: {analytics.forecastDays} days</p>
              </article>
            </div>

            <div className="metric-grid">
              <article className="metric-card">
                <span className="section-kicker">New clients</span>
                <strong className="metric-value">{analytics.newClients}</strong>
                <p>{analytics.repeatClients} repeat clients in the same period</p>
              </article>
              <article className="metric-card">
                <span className="section-kicker">Occupancy</span>
                <strong className="metric-value">{analytics.occupancyRatePercent}%</strong>
                <p>Event fill: {analytics.eventFillRatePercent}%</p>
              </article>
              <article className="metric-card">
                <span className="section-kicker">Efficiency</span>
                <strong className="metric-value">{analytics.conversionRatePercent}%</strong>
                <p>Cancellation {analytics.cancellationRatePercent}% and lead time {analytics.averageLeadTimeDays} days</p>
              </article>
            </div>

            <div className="two-column-grid">
              <article className="surface-card section-stack">
                <header>
                  <span className="section-kicker">Popularity</span>
                  <h3>Top services</h3>
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
                  <span className="section-kicker">Staff</span>
                  <h3>Most booked personnel</h3>
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
                  <span className="section-kicker">Interest</span>
                  <h3>Most viewed pages</h3>
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
                  <span className="section-kicker">Warm outreach</span>
                  <h3>Clients who did not return in 30 days</h3>
                </header>
                {analytics.retentionCandidates.length === 0 ? (
                  <div className="empty-state">
                    <h3>No at-risk clients</h3>
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
            {analytics.accessMessage ??
              'Analytics data is being collected, but this organization needs an active subscription to unlock it for managers.'}
          </div>
        )
      ) : null}
    </section>
  )
}
