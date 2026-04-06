import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useLocale } from '../i18n/LocaleContext'
import type { ProviderOrganizationJoinRequest } from '../types/api'

export function OrganizationJoinRequestsPanel({
  organizationId,
  token,
}: {
  organizationId: string
  token: string
}) {
  const { locale } = useLocale()
  const copy = {
    ru: {
      loadFailed: 'Не удалось загрузить заявки исполнителей.',
      reviewFailed: 'Не удалось обработать заявку.',
      defaultTitle: 'Резидентный специалист',
      kicker: 'Сотрудничество',
      title: 'Заявки исполнителей',
      loading: 'Загружаю заявки...',
      emptyTitle: 'Пока нет заявок',
      emptyDescription: 'Когда исполнитель попросит прикрепиться к организации, заявка появится здесь.',
      attached: 'Уже прикреплён как',
      affiliationTitle: 'Роль в организации',
      internalNote: 'Внутренняя заметка',
      approve: 'Одобрить',
      reject: 'Отклонить',
    },
    en: {
      loadFailed: 'Failed to load provider requests.',
      reviewFailed: 'Failed to review request.',
      defaultTitle: 'Resident Provider',
      kicker: 'Collaboration',
      title: 'Provider join requests',
      loading: 'Loading requests...',
      emptyTitle: 'No provider requests yet',
      emptyDescription: 'When providers ask to attach to this organization, their requests will appear here.',
      attached: 'Already attached as',
      affiliationTitle: 'Affiliation title',
      internalNote: 'Internal note',
      approve: 'Approve',
      reject: 'Reject',
    },
    vi: {
      loadFailed: 'Khong the tai yeu cau nha cung cap.',
      reviewFailed: 'Khong the xu ly yeu cau.',
      defaultTitle: 'Nha cung cap noi bo',
      kicker: 'Hop tac',
      title: 'Yeu cau gan nha cung cap',
      loading: 'Dang tai yeu cau...',
      emptyTitle: 'Chua co yeu cau',
      emptyDescription: 'Khi nha cung cap xin gan vao to chuc, yeu cau se hien tai day.',
      attached: 'Da duoc gan voi vai tro',
      affiliationTitle: 'Vai tro lien ket',
      internalNote: 'Ghi chu noi bo',
      approve: 'Duyet',
      reject: 'Tu choi',
    },
  }[locale]
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
          setError(loadError instanceof Error ? loadError.message : copy.loadFailed)
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
  }, [copy.loadFailed, organizationId, token])

  async function reviewRequest(requestId: string, status: 'Approved' | 'Rejected') {
    try {
      setWorkingId(requestId)
      const updatedRequest = await api.reviewOrganizationProviderJoinRequest(
        organizationId,
        requestId,
        {
          status,
          note: reviewNotes[requestId],
          title: titles[requestId] || copy.defaultTitle,
          isPrimary: false,
        },
        token,
      )

      setRequests((current) => current.map((item) => (item.id === requestId ? updatedRequest : item)))
      setError(null)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : copy.reviewFailed)
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <section className="surface-card section-stack">
      <header>
        <span className="section-kicker">{copy.kicker}</span>
        <h2 className="section-title">{copy.title}</h2>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <div className="empty-state">
          <h3>{copy.loading}</h3>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <h3>{copy.emptyTitle}</h3>
          <p>{copy.emptyDescription}</p>
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
                  {copy.attached} {request.affiliation.title}.
                </div>
              ) : null}
              <div className="form-grid">
                <div className="field-group">
                  <label htmlFor={`title-${request.id}`}>{copy.affiliationTitle}</label>
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
                  <label htmlFor={`note-${request.id}`}>{copy.internalNote}</label>
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
                  {copy.approve}
                </button>
                <button
                  className="danger-button"
                  type="button"
                  disabled={workingId === request.id}
                  onClick={() => void reviewRequest(request.id, 'Rejected')}
                >
                  {copy.reject}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
