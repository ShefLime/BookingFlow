import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type {
  CreateProviderOrganizationJoinRequestPayload,
  Organization,
  ProviderOrganizationAffiliation,
  ProviderOrganizationJoinRequest,
} from '../types/api'

export function ProviderOrganizationRequestsPanel({
  organizations,
  affiliations,
  token,
}: {
  organizations: Organization[]
  affiliations: ProviderOrganizationAffiliation[]
  token: string
}) {
  const [requests, setRequests] = useState<ProviderOrganizationJoinRequest[]>([])
  const [form, setForm] = useState<CreateProviderOrganizationJoinRequestPayload>({
    organizationId: '',
    message: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unavailableOrganizationIds = useMemo(
    () =>
      new Set([
        ...affiliations.filter((item) => item.isActive).map((item) => item.organizationId),
        ...requests.filter((item) => item.status === 'Pending').map((item) => item.organizationId),
      ]),
    [affiliations, requests],
  )

  const loadRequests = useEffectEvent(async (isMounted: () => boolean) => {
    try {
      setLoading(true)
      const nextRequests = await api.getMyProviderOrganizationRequests(token)
      if (isMounted()) {
        setRequests(nextRequests)
        setError(null)
      }
    } catch (loadError) {
      if (isMounted()) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load requests.')
      }
    } finally {
      if (isMounted()) {
        setLoading(false)
      }
    }
  })

  useEffect(() => {
    let isMounted = true

    void loadRequests(() => isMounted)

    return () => {
      isMounted = false
    }
  }, [loadRequests])

  useEffect(() => {
    if (form.organizationId) {
      return
    }

    const nextOrganization = organizations.find((organization) => !unavailableOrganizationIds.has(organization.id))
    if (!nextOrganization) {
      return
    }

    setForm((current) => ({
      ...current,
      organizationId: nextOrganization.id,
    }))
  }, [form.organizationId, organizations, unavailableOrganizationIds])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.organizationId) {
      setError('Choose an organization first.')
      return
    }

    try {
      setSaving(true)
      const createdRequest = await api.createProviderOrganizationRequest(form, token)
      setRequests((current) => [createdRequest, ...current])
      setForm({
        organizationId: '',
        message: '',
      })
      setMessage('Join request sent to the organization.')
      setError(null)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to send request.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="surface-card section-stack">
      <header>
        <span className="section-kicker">Organizations</span>
        <h2 className="section-title">Request attachment to a club or venue</h2>
      </header>

      {message ? <div className="message-banner">{message}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="two-column-grid">
        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">Affiliations</span>
            <h3>Current organizations</h3>
          </header>
          {affiliations.length === 0 ? (
            <div className="empty-state">
              <h3>No affiliations yet</h3>
            </div>
          ) : (
            <div className="table-like">
              {affiliations.map((affiliation) => (
                <article key={affiliation.organizationId} className="table-row">
                  <header>
                    <strong>{affiliation.organizationName}</strong>
                    <small>{affiliation.title}</small>
                  </header>
                  <div className="meta-line">
                    <span className={affiliation.isActive ? 'status-pill success' : 'status-pill warning'}>
                      {affiliation.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {affiliation.isPrimary ? <span className="type-pill">Primary</span> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">New request</span>
            <h3>Send organization request</h3>
          </header>
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="provider-organization">Organization</label>
              <select
                id="provider-organization"
                className="select-field"
                value={form.organizationId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    organizationId: event.target.value,
                  }))
                }
              >
                <option value="">Choose organization</option>
                {organizations
                  .filter((organization) => !unavailableOrganizationIds.has(organization.id))
                  .map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="provider-organization-message">Message</label>
              <textarea
                id="provider-organization-message"
                className="textarea-field"
                rows={4}
                value={form.message ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
              />
            </div>
            <div className="card-actions">
              <button className="solid-button" type="submit" disabled={saving}>
                Send request
              </button>
            </div>
          </form>
        </article>
      </div>

      <header>
        <span className="section-kicker">History</span>
        <h3>Your organization requests</h3>
      </header>

      {loading ? (
        <div className="empty-state">
          <h3>Loading requests...</h3>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <h3>No requests yet</h3>
        </div>
      ) : (
        <div className="table-like">
          {requests.map((request) => (
            <article key={request.id} className="table-row">
              <header>
                <strong>{request.organizationName}</strong>
                <small>{request.status}</small>
              </header>
              {request.message ? <p>{request.message}</p> : null}
              {request.reviewNote ? <div className="info-banner">{request.reviewNote}</div> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
