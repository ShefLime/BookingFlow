import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { useAuth } from '../features/auth/AuthProvider'
import {
  buildProviderProfileForm,
  buildProviderResourceForm,
  toProviderPayload,
  toProviderResourcePayload,
} from '../lib/forms'
import type {
  CreateProviderOrganizationJoinRequestPayload,
  ProviderProfilePayload,
  ProviderResourcePayload,
  Resource,
} from '../types/api'
import { LoadingState } from '../components/LoadingState'
import { LocalizedFieldBlock } from '../components/LocalizedFieldBlock'
import { MediaUploadField } from '../components/MediaUploadField'
import {
  getModerationStatusLabel,
  getProviderJoinRequestStatusLabel,
  getResourceTypeLabel,
} from '../lib/display'

const resourceTypes: ProviderResourcePayload['type'][] = [
  'Trainer',
  'Table',
  'Room',
  'Court',
  'Hall',
  'ServiceSpot',
  'VipTable',
]

export function ProviderStudioPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const token = auth.token!
  const [profileNotice, setProfileNotice] = useState<string | null>(null)
  const [resourceNotice, setResourceNotice] = useState<string | null>(null)
  const [requestNotice, setRequestNotice] = useState<string | null>(null)
  const [selectedResourceId, setSelectedResourceId] = useState('')

  const profileQuery = useQuery({
    queryKey: ['workspace', 'provider-profile'],
    queryFn: () => api.providers.getMyProviderProfile(token),
  })

  const resourcesQuery = useQuery({
    queryKey: ['workspace', 'provider-resources'],
    queryFn: () => api.providers.getMyProviderResources(token),
  })

  const requestsQuery = useQuery({
    queryKey: ['workspace', 'provider-organization-requests'],
    queryFn: () => api.providers.getMyProviderOrganizationRequests(token),
  })

  const organizationsQuery = useQuery({
    queryKey: ['public', 'organizations', 'provider-join'],
    queryFn: () => api.organizations.getOrganizations(false),
  })

  const selectedResource = useMemo(
    () => (resourcesQuery.data ?? []).find((resource) => resource.id === selectedResourceId) ?? null,
    [resourcesQuery.data, selectedResourceId],
  )
  const hasResources = (resourcesQuery.data?.length ?? 0) > 0

  const profileForm = useForm<ProviderProfilePayload>({
    defaultValues: buildProviderProfileForm(),
  })

  const resourceForm = useForm<ProviderResourcePayload>({
    defaultValues: buildProviderResourceForm(),
  })

  const requestForm = useForm<CreateProviderOrganizationJoinRequestPayload>({
    defaultValues: {
      organizationId: '',
      message: '',
    },
  })

  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        displayName: profileQuery.data.displayName,
        headline: profileQuery.data.headline,
        city: profileQuery.data.city ?? '',
        timeZone: profileQuery.data.timeZone,
        location: profileQuery.data.location ?? '',
        avatarImageUrl: profileQuery.data.avatarImageUrl ?? '',
        coverImageUrl: profileQuery.data.coverImageUrl ?? '',
        gallery: profileQuery.data.gallery,
        documents: profileQuery.data.documents,
        content: profileQuery.data.content,
      })
    } else {
      profileForm.reset(buildProviderProfileForm())
    }
  }, [profileForm, profileQuery.data])

  useEffect(() => {
    if (selectedResource) {
      resourceForm.reset(toProviderResourceForm(selectedResource))
    } else {
      resourceForm.reset(buildProviderResourceForm())
    }
  }, [resourceForm, selectedResource])

  useEffect(() => {
    if (!requestForm.watch('organizationId') && organizationsQuery.data?.length) {
      requestForm.setValue('organizationId', organizationsQuery.data[0].id)
    }
  }, [organizationsQuery.data, requestForm])

  const profileMutation = useMutation({
    mutationFn: (payload: ProviderProfilePayload) => api.providers.upsertProviderProfile(payload, token),
    onSuccess: async () => {
      setProfileNotice(t('workspace.providerSaved'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workspace', 'provider-profile'] }),
        auth.refreshProfile(),
      ])
    },
    onError: (error) => {
      setProfileNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  const resourceMutation = useMutation({
    mutationFn: (payload: ProviderResourcePayload) => {
      if (selectedResource) {
        return api.providers.updateProviderResource(selectedResource.id, payload, token)
      }

      return api.providers.createProviderResource(payload, token)
    },
    onSuccess: async (resource) => {
      setResourceNotice(t('workspace.resourceSaved'))
      setSelectedResourceId(resource.id)
      await queryClient.invalidateQueries({ queryKey: ['workspace', 'provider-resources'] })
    },
    onError: (error) => {
      setResourceNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  const requestMutation = useMutation({
    mutationFn: (payload: CreateProviderOrganizationJoinRequestPayload) =>
      api.providers.createProviderOrganizationRequest(payload, token),
    onSuccess: async () => {
      setRequestNotice(t('workspace.joinRequestCreated'))
      requestForm.reset({
        organizationId: organizationsQuery.data?.[0]?.id ?? '',
        message: '',
      })
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'provider-organization-requests'],
      })
    },
    onError: (error) => {
      setRequestNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  function submitProfile(values: ProviderProfilePayload) {
    setProfileNotice(null)
    profileMutation.mutate(toProviderPayload(values))
  }

  function submitResource(values: ProviderResourcePayload) {
    setResourceNotice(null)
    resourceMutation.mutate(toProviderResourcePayload(values))
  }

  function submitRequest(values: CreateProviderOrganizationJoinRequestPayload) {
    setRequestNotice(null)
    requestMutation.mutate({
      organizationId: values.organizationId,
      message: values.message?.trim() || undefined,
    })
  }

  const resourceFormFields = (
    <>
      <div className="form-grid form-grid--double">
        <label className="field-group">
          <span>{t('forms.resourceName')}</span>
          <input className="text-field" {...resourceForm.register('name', { required: true })} />
        </label>
        <label className="field-group">
          <span>{t('forms.resourceType')}</span>
          <select className="text-field" {...resourceForm.register('type')}>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {getResourceTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-group">
          <span>{t('forms.capacity')}</span>
          <input
            className="text-field"
            type="number"
            {...resourceForm.register('capacity', { valueAsNumber: true })}
          />
        </label>
        <label className="field-group">
          <span>{t('forms.slotSize')}</span>
          <input
            className="text-field"
            type="number"
            {...resourceForm.register('slotSizeMinutes', { valueAsNumber: true })}
          />
        </label>
        <label className="field-group">
          <span>{t('forms.priceFrom')}</span>
          <input
            className="text-field"
            type="number"
            step="0.01"
            {...resourceForm.register('priceFrom', { valueAsNumber: true })}
          />
        </label>
        <label className="field-group">
          <span>{t('forms.experienceYears')}</span>
          <input
            className="text-field"
            type="number"
            {...resourceForm.register('experienceYears', { valueAsNumber: true })}
          />
        </label>
        <label className="field-group field-group--full">
          <span>{t('forms.location')}</span>
          <input className="text-field" {...resourceForm.register('location')} />
        </label>
        <label className="field-group field-group--full">
          <span>{t('forms.description')}</span>
          <textarea className="textarea-field" rows={3} {...resourceForm.register('description')} />
        </label>
      </div>

      <div className="form-grid form-grid--double">
        <MediaUploadField
          token={token}
          folder={`providers/${profileQuery.data?.id || 'draft'}/resources/${selectedResourceId || 'draft'}`}
          label={t('forms.avatarImageUrl')}
          value={resourceForm.watch('avatarImageUrl')}
          onChange={(url) => resourceForm.setValue('avatarImageUrl', url)}
        />
        <MediaUploadField
          token={token}
          folder={`providers/${profileQuery.data?.id || 'draft'}/resources/${selectedResourceId || 'draft'}`}
          label={t('forms.coverImageUrl')}
          value={resourceForm.watch('coverImageUrl')}
          onChange={(url) => resourceForm.setValue('coverImageUrl', url)}
        />
      </div>

      <LocalizedFieldBlock
        title={t('forms.resourceContent')}
        register={resourceForm.register}
        fields={[
          {
            label: t('forms.summary'),
            multiline: true,
            rows: 3,
            nameByLocale: {
              ru: 'content.summary.ru',
              en: 'content.summary.en',
              vi: 'content.summary.vi',
            },
          },
        ]}
      />

      <div className="form-actions">
        {resourceNotice ? <p className="form-notice">{resourceNotice}</p> : null}
        <button className="secondary-button" type="submit" disabled={resourceMutation.isPending}>
          {selectedResource ? t('actions.saveChanges') : t('actions.createResource')}
        </button>
      </div>
    </>
  )

  if (
    profileQuery.isLoading ||
    resourcesQuery.isLoading ||
    requestsQuery.isLoading ||
    organizationsQuery.isLoading
  ) {
    return <LoadingState label={t('states.loading')} />
  }

  return (
    <div className="workspace-stack">
      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="eyebrow">{t('workspace.navProvider')}</p>
            <h1 className="workspace-title">{t('workspace.providerTitle')}</h1>
            <p>{t('workspace.providerDescription')}</p>
          </div>

          {profileQuery.data ? (
            <div className="workspace-stack workspace-stack--compact">
              <div className="workspace-chip">
                {t('workspace.providerStatus')}: {getModerationStatusLabel(profileQuery.data.approvalStatus)}
              </div>
              {profileQuery.data.moderationNote ? (
                <p className="workspace-empty">{profileQuery.data.moderationNote}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <form className="workspace-form" onSubmit={profileForm.handleSubmit(submitProfile)}>
          <div className="form-grid form-grid--double">
            <label className="field-group">
              <span>{t('forms.displayName')}</span>
              <input className="text-field" {...profileForm.register('displayName', { required: true })} />
            </label>
            <label className="field-group">
              <span>{t('forms.headline')}</span>
              <input className="text-field" {...profileForm.register('headline', { required: true })} />
            </label>
            <label className="field-group">
              <span>{t('forms.timeZone')}</span>
              <input className="text-field" {...profileForm.register('timeZone', { required: true })} />
            </label>
            <label className="field-group">
              <span>{t('forms.city')}</span>
              <input className="text-field" {...profileForm.register('city')} />
            </label>
            <label className="field-group field-group--full">
              <span>{t('forms.location')}</span>
              <input className="text-field" {...profileForm.register('location')} />
            </label>
          </div>

          <div className="form-grid form-grid--double">
            <MediaUploadField
              token={token}
              folder={`providers/${profileQuery.data?.id || 'draft'}`}
              label={t('forms.avatarImageUrl')}
              value={profileForm.watch('avatarImageUrl')}
              onChange={(url) => profileForm.setValue('avatarImageUrl', url)}
            />
            <MediaUploadField
              token={token}
              folder={`providers/${profileQuery.data?.id || 'draft'}`}
              label={t('forms.coverImageUrl')}
              value={profileForm.watch('coverImageUrl')}
              onChange={(url) => profileForm.setValue('coverImageUrl', url)}
            />
          </div>

          <LocalizedFieldBlock
            title={t('forms.profileContent')}
            register={profileForm.register}
            fields={[
              {
                label: t('forms.summary'),
                multiline: true,
                rows: 3,
                nameByLocale: {
                  ru: 'content.summary.ru',
                  en: 'content.summary.en',
                  vi: 'content.summary.vi',
                },
              },
              {
                label: t('forms.biography'),
                multiline: true,
                rows: 5,
                nameByLocale: {
                  ru: 'content.biography.ru',
                  en: 'content.biography.en',
                  vi: 'content.biography.vi',
                },
              },
            ]}
          />

          <div className="form-actions">
            {profileNotice ? <p className="form-notice">{profileNotice}</p> : null}
            <button className="primary-button" type="submit" disabled={profileMutation.isPending}>
              {t('actions.saveProfile')}
            </button>
          </div>
        </form>
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="eyebrow">{t('workspace.resourceComposerEyebrow')}</p>
            <h2>{t('workspace.providerResourceManagerTitle')}</h2>
            <p>{t('workspace.providerResourceManagerDescription')}</p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setSelectedResourceId('')}
          >
            {t('actions.createNewResource')}
          </button>
        </div>

        {hasResources ? (
          <div className="manager-grid">
            <div className="manager-list">
              {(resourcesQuery.data ?? []).map((resource) => (
                <button
                  key={resource.id}
                  className={`manager-list__item ${selectedResourceId === resource.id ? 'is-selected' : ''}`}
                  type="button"
                  onClick={() => {
                    setSelectedResourceId(resource.id)
                    setResourceNotice(null)
                  }}
                >
                  <strong>{resource.name}</strong>
                  <span>{getResourceTypeLabel(resource.type)}</span>
                  <span>{getModerationStatusLabel(resource.approvalStatus)}</span>
                </button>
              ))}
            </div>

            <form className="workspace-form workspace-form--comfortable" onSubmit={resourceForm.handleSubmit(submitResource)}>
              {resourceFormFields}
            </form>
          </div>
        ) : (
          <div className="workspace-stack workspace-stack--compact">
            <p className="workspace-empty">{t('workspace.providerEmptyResources')}</p>
            <form className="workspace-form workspace-form--comfortable" onSubmit={resourceForm.handleSubmit(submitResource)}>
              {resourceFormFields}
            </form>
          </div>
        )}
      </section>

      <section className="workspace-quick-grid">
        <article className="workspace-panel">
          <div className="workspace-panel__header">
            <div>
              <p className="workspace-card__label">{t('workspace.affiliationsTitle')}</p>
              <h2>{t('workspace.affiliationsTitle')}</h2>
            </div>
          </div>
          {profileQuery.data?.affiliations.length ? (
            <div className="manager-rules">
              {profileQuery.data.affiliations.map((affiliation) => (
                <article key={affiliation.organizationId} className="manager-rule">
                  <div>
                    <strong>{affiliation.organizationName}</strong>
                    <p className="workspace-empty">{affiliation.title}</p>
                  </div>
                  <span className="workspace-chip">
                    {affiliation.isPrimary ? t('workspace.primaryAffiliation') : t('workspace.activeAffiliation')}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="workspace-empty">{t('workspace.noAffiliations')}</p>
          )}
        </article>

        <article className="workspace-panel">
          <div className="workspace-panel__header">
            <div>
              <p className="workspace-card__label">{t('workspace.joinRequestsTitle')}</p>
              <h2>{t('workspace.joinRequestsTitle')}</h2>
            </div>
          </div>

          <form className="workspace-form" onSubmit={requestForm.handleSubmit(submitRequest)}>
            <label className="field-group">
              <span>{t('workspace.joinRequestOrganization')}</span>
              <select className="text-field" {...requestForm.register('organizationId', { required: true })}>
                {(organizationsQuery.data ?? []).map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>{t('workspace.joinRequestMessage')}</span>
              <textarea className="textarea-field" rows={3} {...requestForm.register('message')} />
            </label>

            <div className="form-actions">
              {requestNotice ? <p className="form-notice">{requestNotice}</p> : null}
              <button className="secondary-button" type="submit" disabled={requestMutation.isPending}>
                {t('workspace.createJoinRequest')}
              </button>
            </div>
          </form>

          <div className="manager-rules">
            {(requestsQuery.data ?? []).map((request) => (
              <article key={request.id} className="manager-rule manager-rule--stacked">
                <div>
                  <strong>{request.organizationName}</strong>
                  {request.message ? <p className="workspace-empty">{request.message}</p> : null}
                  {request.reviewNote ? <p className="workspace-empty">{request.reviewNote}</p> : null}
                </div>
                <span className="workspace-chip">
                  {getProviderJoinRequestStatusLabel(request.status)}
                </span>
              </article>
            ))}
            {!requestsQuery.data?.length ? (
              <p className="workspace-empty">{t('workspace.noJoinRequests')}</p>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  )
}

function toProviderResourceForm(resource: Resource): ProviderResourcePayload {
  return {
    name: resource.name,
    type: resource.type,
    description: resource.description ?? '',
    location: resource.location ?? '',
    capacity: resource.capacity,
    slotSizeMinutes: resource.slotSizeMinutes,
    experienceYears: resource.experienceYears ?? undefined,
    priceFrom: resource.priceFrom ?? undefined,
    avatarImageUrl: resource.avatarImageUrl ?? '',
    coverImageUrl: resource.coverImageUrl ?? '',
    gallery: resource.gallery,
    documents: resource.documents,
    content: resource.content,
  }
}
