import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { ProviderOrganizationJoinRequest } from '../types/api'

export function OrganizationJoinRequestsPanel({
  organizationId,
  token,
}: {
  organizationId: string
  token: string
}) {
  const [requests, setRequests] = useState<ProviderOrganizationJoinRequest[]>([])
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadRequests() {
      try {
        setLoading(true)
        const nextRequests = await api.getOrganizationProviderJoinRequests(organizationId, token)
        if (isMounted) {
          setRequests(nextRequests)
          setError(null)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load provider requests.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadRequests()

    return () => {
      isMounted = false
    }
  }, [organizationId, token])

  async function reviewRequest(requestId: string, status: 'Approved' | 'Rejected') {
    try {
      setWorkingId(requestId)
      const updatedRequest = await api.reviewOrganizationProviderJoinRequest(
        organizationId,
        requestId,
        {
          status,
          note: reviewNotes[requestId],
          title: titles[requestId] || 'Resident Provider',
          isPrimary: false,
        },
        token,
      )

      setRequests((current) => current.map((item) => (item.id === requestId ? updatedRequest : item)))
      setError(null)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review request.')
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <section className="surface-card section-stack">
      <header>
        <span className="section-kicker">Collaboration</span>
        <h2 className="section-title">Provider join requests</h2>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <div className="empty-state">
          <h3>Loading requests...</h3>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <h3>No provider requests yet</h3>
          <p>When providers ask to attach to this organization, their requests will appear here.</p>
        </div>
      ) : (
        <div className="table-like">
          {requests.map((request) => (
            <article key={request.id} className="table-row">
              <header>
                <strong>{request.providerDisplayName}</strong>
                <small>{request.status}</small>
              </header>
              {request.message ? <p>{request.message}</p> : null}
              {request.affiliation ? (
                <div className="info-banner">
                  Already attached as {request.affiliation.title}.
                </div>
              ) : null}
              <div className="form-grid">
                <div className="field-group">
                  <label htmlFor={`title-${request.id}`}>Affiliation title</label>
                  <input
                    id={`title-${request.id}`}
                    className="input-field"
                    value={titles[request.id] ?? ''}
                    onChange={(event) =>
                      setTitles((current) => ({
                        ...current,
                        [request.id]: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field-group">
                  <label htmlFor={`note-${request.id}`}>Internal note</label>
                  <textarea
                    id={`note-${request.id}`}
                    className="textarea-field"
                    rows={3}
                    value={reviewNotes[request.id] ?? ''}
                    onChange={(event) =>
                      setReviewNotes((current) => ({
                        ...current,
                        [request.id]: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="card-actions">
                <button
                  className="solid-button"
                  type="button"
                  disabled={workingId === request.id}
                  onClick={() => void reviewRequest(request.id, 'Approved')}
                >
                  Approve
                </button>
                <button
                  className="danger-button"
                  type="button"
                  disabled={workingId === request.id}
                  onClick={() => void reviewRequest(request.id, 'Rejected')}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
