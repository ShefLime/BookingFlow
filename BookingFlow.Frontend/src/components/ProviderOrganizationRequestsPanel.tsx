import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useLocale } from '../i18n/LocaleContext'
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
  const { locale } = useLocale()
  const copy = {
    ru: {
      loadFailed: 'Не удалось загрузить заявки.',
      chooseFirst: 'Сначала выберите организацию.',
      submitSuccess: 'Заявка отправлена в организацию.',
      submitFailed: 'Не удалось отправить заявку.',
      kicker: 'Организации',
      title: 'Запрос на привязку к клубу или площадке',
      affiliations: 'Текущие организации',
      noAffiliations: 'Пока нет привязок',
      newRequest: 'Новая заявка',
      sendRequest: 'Отправить заявку',
      organization: 'Организация',
      chooseOrganization: 'Выберите организацию',
      message: 'Сообщение',
      history: 'История',
      requestHistory: 'Ваши заявки в организации',
      loading: 'Загружаю заявки...',
      noRequests: 'Пока нет заявок',
      active: 'Активна',
      inactive: 'Неактивна',
      primary: 'Основная',
    },
    en: {
      loadFailed: 'Failed to load requests.',
      chooseFirst: 'Choose an organization first.',
      submitSuccess: 'Join request sent to the organization.',
      submitFailed: 'Failed to send request.',
      kicker: 'Organizations',
      title: 'Request attachment to a club or venue',
      affiliations: 'Current organizations',
      noAffiliations: 'No affiliations yet',
      newRequest: 'New request',
      sendRequest: 'Send request',
      organization: 'Organization',
      chooseOrganization: 'Choose organization',
      message: 'Message',
      history: 'History',
      requestHistory: 'Your organization requests',
      loading: 'Loading requests...',
      noRequests: 'No requests yet',
      active: 'Active',
      inactive: 'Inactive',
      primary: 'Primary',
    },
    vi: {
      loadFailed: 'Khong the tai yeu cau.',
      chooseFirst: 'Hay chon to chuc truoc.',
      submitSuccess: 'Da gui yeu cau toi to chuc.',
      submitFailed: 'Khong the gui yeu cau.',
      kicker: 'To chuc',
      title: 'Gui yeu cau gan vao club hoac dia diem',
      affiliations: 'To chuc hien tai',
      noAffiliations: 'Chua co lien ket',
      newRequest: 'Yeu cau moi',
      sendRequest: 'Gui yeu cau',
      organization: 'To chuc',
      chooseOrganization: 'Chon to chuc',
      message: 'Tin nhan',
      history: 'Lich su',
      requestHistory: 'Cac yeu cau cua ban',
      loading: 'Dang tai yeu cau...',
      noRequests: 'Chua co yeu cau',
      active: 'Dang hoat dong',
      inactive: 'Khong hoat dong',
      primary: 'Chinh',
    },
  }[locale]
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

  useEffect(() => {
    let isMounted = true

    async function loadRequests() {
      try {
        setLoading(true)
        const nextRequests = await api.getMyProviderOrganizationRequests(token)
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
  }, [copy.loadFailed, token])

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
      setError(copy.chooseFirst)
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
      setMessage(copy.submitSuccess)
      setError(null)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.submitFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="surface-card section-stack">
      <header>
        <span className="section-kicker">{copy.kicker}</span>
        <h2 className="section-title">{copy.title}</h2>
      </header>

      {message ? <div className="message-banner">{message}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="two-column-grid">
        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.kicker}</span>
            <h3>{copy.affiliations}</h3>
          </header>
          {affiliations.length === 0 ? (
            <div className="empty-state">
              <h3>{copy.noAffiliations}</h3>
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
                      {affiliation.isActive ? copy.active : copy.inactive}
                    </span>
                    {affiliation.isPrimary ? <span className="type-pill">{copy.primary}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="surface-card section-stack">
          <header>
            <span className="section-kicker">{copy.newRequest}</span>
            <h3>{copy.sendRequest}</h3>
          </header>
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="provider-organization">{copy.organization}</label>
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
                <option value="">{copy.chooseOrganization}</option>
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
              <label htmlFor="provider-organization-message">{copy.message}</label>
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
                {copy.sendRequest}
              </button>
            </div>
          </form>
        </article>
      </div>

      <header>
        <span className="section-kicker">{copy.history}</span>
        <h3>{copy.requestHistory}</h3>
      </header>

      {loading ? (
        <div className="empty-state">
          <h3>{copy.loading}</h3>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <h3>{copy.noRequests}</h3>
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
