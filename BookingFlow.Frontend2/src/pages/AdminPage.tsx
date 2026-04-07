import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SeoMeta } from '../components/SeoMeta'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useAuth } from '../features/auth/AuthProvider'
import { api } from '../lib/api'
import {
  formatPriceFrom,
  getModerationStatusLabel,
  getRoleLabel,
  getResourceTypeLabel,
} from '../lib/display'

export function AdminPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const token = auth.token!
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [membershipUserId, setMembershipUserId] = useState('')
  const [membershipOrganizationId, setMembershipOrganizationId] = useState('')
  const [membershipTitle, setMembershipTitle] = useState('Manager')
  const [membershipNotice, setMembershipNotice] = useState<string | null>(null)
  const [profileNotes, setProfileNotes] = useState<Record<string, string>>({})
  const [resourceNotes, setResourceNotes] = useState<Record<string, string>>({})

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.admin.getAdminUsers(token),
  })

  const organizationsQuery = useQuery({
    queryKey: ['admin', 'organizations'],
    queryFn: () => api.organizations.getOrganizations(true),
  })

  const providerProfilesQuery = useQuery({
    queryKey: ['admin', 'provider-profiles'],
    queryFn: () => api.admin.getProviderProfilesForReview(token),
  })

  const providerResourcesQuery = useQuery({
    queryKey: ['admin', 'provider-resources'],
    queryFn: () => api.admin.getProviderResourcesForReview(token),
  })

  const analyticsQuery = useQuery({
    queryKey: ['admin', 'analytics', selectedOrganizationId],
    queryFn: () =>
      api.organizations.getOrganizationAnalytics(selectedOrganizationId, token, {
        forecastDays: 30,
      }),
    enabled: Boolean(selectedOrganizationId),
  })

  useEffect(() => {
    if (!selectedOrganizationId && organizationsQuery.data?.length) {
      setSelectedOrganizationId(organizationsQuery.data[0].id)
    }

    if (!membershipOrganizationId && organizationsQuery.data?.length) {
      setMembershipOrganizationId(organizationsQuery.data[0].id)
    }
  }, [membershipOrganizationId, organizationsQuery.data, selectedOrganizationId])

  useEffect(() => {
    if (!membershipUserId && usersQuery.data?.length) {
      setMembershipUserId(usersQuery.data[0].id)
    }
  }, [membershipUserId, usersQuery.data])

  const pendingProfiles = useMemo(
    () =>
      (providerProfilesQuery.data ?? []).filter(
        (profile) => profile.approvalStatus === 'PendingApproval',
      ),
    [providerProfilesQuery.data],
  )

  const pendingResources = useMemo(
    () =>
      (providerResourcesQuery.data ?? []).filter(
        (resource) => resource.approvalStatus === 'PendingApproval',
      ),
    [providerResourcesQuery.data],
  )

  const membershipMutation = useMutation({
    mutationFn: () =>
      api.admin.assignManagerMembership(
        {
          userId: membershipUserId,
          organizationId: membershipOrganizationId,
          title: membershipTitle.trim() || 'Manager',
        },
        token,
      ),
    onSuccess: async () => {
      setMembershipNotice(t('admin.membershipSaved'))
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => {
      setMembershipNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  const profileReviewMutation = useMutation({
    mutationFn: ({
      providerProfileId,
      status,
    }: {
      providerProfileId: string
      status: 'Approved' | 'Rejected'
    }) =>
      api.admin.reviewProviderProfile(
        providerProfileId,
        {
          status,
          note: profileNotes[providerProfileId]?.trim() || undefined,
        },
        token,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'provider-profiles'] })
    },
  })

  const resourceReviewMutation = useMutation({
    mutationFn: ({
      resourceId,
      status,
    }: {
      resourceId: string
      status: 'Approved' | 'Rejected'
    }) =>
      api.admin.reviewProviderResource(
        resourceId,
        {
          status,
          note: resourceNotes[resourceId]?.trim() || undefined,
        },
        token,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'provider-resources'] })
    },
  })

  if (
    usersQuery.isLoading ||
    organizationsQuery.isLoading ||
    providerProfilesQuery.isLoading ||
    providerResourcesQuery.isLoading
  ) {
    return <LoadingState label={t('states.loading')} />
  }

  if (
    usersQuery.isError ||
    organizationsQuery.isError ||
    providerProfilesQuery.isError ||
    providerResourcesQuery.isError
  ) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        actionLabel={t('actions.retry')}
        onRetry={() => {
          void usersQuery.refetch()
          void organizationsQuery.refetch()
          void providerProfilesQuery.refetch()
          void providerResourcesQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="workspace-stack">
      <SeoMeta title={t('admin.metaTitle')} description={t('admin.metaDescription')} />

      <section className="workspace-hero workspace-hero--compact">
        <div className="workspace-hero__content">
          <p className="eyebrow">{t('workspace.navAdmin')}</p>
          <h1 className="workspace-title">{t('admin.title')}</h1>
          <p>{t('admin.description')}</p>
        </div>
      </section>

      <section className="workspace-quick-grid">
        <article className="workspace-card">
          <p className="workspace-card__label">{t('admin.usersTitle')}</p>
          <h2>{usersQuery.data?.length ?? 0}</h2>
          <p>{t('admin.usersDescription')}</p>
        </article>
        <article className="workspace-card">
          <p className="workspace-card__label">{t('admin.pendingProfilesTitle')}</p>
          <h2>{pendingProfiles.length}</h2>
          <p>{t('admin.pendingProfilesDescription')}</p>
        </article>
        <article className="workspace-card">
          <p className="workspace-card__label">{t('admin.pendingResourcesTitle')}</p>
          <h2>{pendingResources.length}</h2>
          <p>{t('admin.pendingResourcesDescription')}</p>
        </article>
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-card__label">{t('admin.membershipTitle')}</p>
            <h2>{t('admin.membershipTitle')}</h2>
          </div>
        </div>

        <form className="workspace-form workspace-form--comfortable" onSubmit={(event) => event.preventDefault()}>
          <div className="form-grid form-grid--double">
            <label className="field-group">
              <span>{t('admin.userLabel')}</span>
              <select
                className="text-field"
                value={membershipUserId}
                onChange={(event) => setMembershipUserId(event.target.value)}
              >
                {(usersQuery.data ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>{t('admin.organizationLabel')}</span>
              <select
                className="text-field"
                value={membershipOrganizationId}
                onChange={(event) => setMembershipOrganizationId(event.target.value)}
              >
                {(organizationsQuery.data ?? []).map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>{t('admin.membershipRole')}</span>
              <input
                className="text-field"
                value={membershipTitle}
                onChange={(event) => setMembershipTitle(event.target.value)}
              />
            </label>
          </div>

          <div className="form-actions">
            {membershipNotice ? <p className="form-notice">{membershipNotice}</p> : null}
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setMembershipNotice(null)
                membershipMutation.mutate()
              }}
              disabled={membershipMutation.isPending}
            >
              {membershipMutation.isPending ? t('states.loading') : t('admin.assignMembership')}
            </button>
          </div>
        </form>

        <div className="manager-rules">
          {(usersQuery.data ?? []).map((user) => (
            <article key={user.id} className="manager-rule manager-rule--stacked">
              <div>
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <p className="workspace-empty">{user.email}</p>
              </div>
              <span className="workspace-chip">{user.roles.map(getRoleLabel).join(', ')}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-quick-grid">
        <article className="workspace-panel">
          <div className="workspace-panel__header">
            <div>
              <p className="workspace-card__label">{t('admin.pendingProfilesTitle')}</p>
              <h2>{t('admin.pendingProfilesTitle')}</h2>
            </div>
          </div>

          <div className="manager-rules">
            {pendingProfiles.map((profile) => (
              <article key={profile.id} className="manager-rule manager-rule--stacked">
                <div>
                  <strong>{profile.displayName}</strong>
                  <p className="workspace-empty">{profile.headline}</p>
                  <p className="workspace-empty">
                    {t('workspace.providerStatus')}: {getModerationStatusLabel(profile.approvalStatus)}
                  </p>
                  <textarea
                    className="textarea-field"
                    rows={2}
                    placeholder={t('admin.reviewNote')}
                    value={profileNotes[profile.id] ?? ''}
                    onChange={(event) =>
                      setProfileNotes((current) => ({
                        ...current,
                        [profile.id]: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="booking-panel__actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      profileReviewMutation.mutate({
                        providerProfileId: profile.id,
                        status: 'Approved',
                      })
                    }
                  >
                    {t('admin.approve')}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      profileReviewMutation.mutate({
                        providerProfileId: profile.id,
                        status: 'Rejected',
                      })
                    }
                  >
                    {t('admin.reject')}
                  </button>
                </div>
              </article>
            ))}
            {!pendingProfiles.length ? (
              <p className="workspace-empty">{t('admin.emptyModeration')}</p>
            ) : null}
          </div>
        </article>

        <article className="workspace-panel">
          <div className="workspace-panel__header">
            <div>
              <p className="workspace-card__label">{t('admin.pendingResourcesTitle')}</p>
              <h2>{t('admin.pendingResourcesTitle')}</h2>
            </div>
          </div>

          <div className="manager-rules">
            {pendingResources.map((resource) => (
              <article key={resource.id} className="manager-rule manager-rule--stacked">
                <div>
                  <strong>{resource.name}</strong>
                  <p className="workspace-empty">{getResourceTypeLabel(resource.type)}</p>
                  <p className="workspace-empty">{resource.providerDisplayName}</p>
                  <textarea
                    className="textarea-field"
                    rows={2}
                    placeholder={t('admin.reviewNote')}
                    value={resourceNotes[resource.id] ?? ''}
                    onChange={(event) =>
                      setResourceNotes((current) => ({
                        ...current,
                        [resource.id]: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="booking-panel__actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      resourceReviewMutation.mutate({
                        resourceId: resource.id,
                        status: 'Approved',
                      })
                    }
                  >
                    {t('admin.approve')}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      resourceReviewMutation.mutate({
                        resourceId: resource.id,
                        status: 'Rejected',
                      })
                    }
                  >
                    {t('admin.reject')}
                  </button>
                </div>
              </article>
            ))}
            {!pendingResources.length ? (
              <p className="workspace-empty">{t('admin.emptyModeration')}</p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-card__label">{t('admin.analyticsTitle')}</p>
            <h2>{t('admin.analyticsTitle')}</h2>
          </div>
          <label className="field-group field-group--compact">
            <span>{t('admin.organizationLabel')}</span>
            <select
              className="text-field"
              value={selectedOrganizationId}
              onChange={(event) => setSelectedOrganizationId(event.target.value)}
            >
              {(organizationsQuery.data ?? []).map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {analyticsQuery.isLoading ? (
          <LoadingState label={t('states.loading')} />
        ) : analyticsQuery.isError ? (
          <ErrorState
            title={t('states.errorTitle')}
            description={t('states.errorDescription')}
            actionLabel={t('actions.retry')}
            onRetry={() => void analyticsQuery.refetch()}
          />
        ) : analyticsQuery.data ? (
          analyticsQuery.data.hasAccess ? (
            <div className="workspace-quick-grid">
              <article className="workspace-card">
                <p className="workspace-card__label">{t('admin.totalViews')}</p>
                <h2>{analyticsQuery.data.totalViews}</h2>
              </article>
              <article className="workspace-card">
                <p className="workspace-card__label">{t('admin.bookingsPeriod')}</p>
                <h2>{analyticsQuery.data.bookingsInPeriod}</h2>
              </article>
              <article className="workspace-card">
                <p className="workspace-card__label">{t('admin.revenue')}</p>
                <h2>{formatPriceFrom(analyticsQuery.data.expectedRevenue) ?? analyticsQuery.data.expectedRevenue}</h2>
              </article>
              <article className="workspace-card">
                <p className="workspace-card__label">{t('admin.conversion')}</p>
                <h2>{analyticsQuery.data.conversionRatePercent.toFixed(1)}%</h2>
              </article>
            </div>
          ) : (
            <p className="workspace-empty">{analyticsQuery.data.accessMessage}</p>
          )
        ) : null}
      </section>
    </div>
  )
}
