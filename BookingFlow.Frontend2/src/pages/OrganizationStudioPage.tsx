import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { useAuth } from '../features/auth/AuthProvider'
import {
  buildEventForm,
  buildOrganizationForm,
  buildOrganizationResourceForm,
  toEventPayload,
  toOrganizationPayload,
  toResourcePayload,
} from '../lib/forms'
import type {
  DayOfWeekName,
  EventPayload,
  EventSession,
  OrganizationPayload,
  Resource,
  ResourcePayload,
} from '../types/api'
import { LoadingState } from '../components/LoadingState'
import { LocalizedFieldBlock } from '../components/LocalizedFieldBlock'
import { MediaUploadField } from '../components/MediaUploadField'
import { toDateTimeLocalValue, toUtcIso } from '../lib/timezone'
import { getOrganizationTypeLabel, getResourceTypeLabel } from '../lib/display'

const organizationTypes: OrganizationPayload['type'][] = [
  'FitnessClub',
  'Bar',
  'NightClub',
  'EventVenue',
  'Restaurant',
  'SportsCenter',
  'Other',
]

const resourceTypes: ResourcePayload['type'][] = [
  'Trainer',
  'Table',
  'Room',
  'Court',
  'Hall',
  'ServiceSpot',
  'VipTable',
]

const dayOfWeekOptions: DayOfWeekName[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

interface AvailabilityRuleFormValues {
  resourceId: string
  dayOfWeek: DayOfWeekName
  startTime: string
  endTime: string
}

export function OrganizationStudioPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const token = auth.token!
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    auth.profile?.memberships[0]?.organizationId ?? '',
  )
  const [selectedResourceId, setSelectedResourceId] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [organizationNotice, setOrganizationNotice] = useState<string | null>(null)
  const [resourceNotice, setResourceNotice] = useState<string | null>(null)
  const [eventNotice, setEventNotice] = useState<string | null>(null)
  const [ruleNotice, setRuleNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedOrganizationId && auth.profile?.memberships[0]?.organizationId) {
      setSelectedOrganizationId(auth.profile.memberships[0].organizationId)
    }
  }, [auth.profile, selectedOrganizationId])

  const organizationQuery = useQuery({
    queryKey: ['workspace', 'organization', selectedOrganizationId],
    queryFn: () => api.organizations.getOrganization(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId),
  })

  const resourcesQuery = useQuery({
    queryKey: ['workspace', 'organization-resources', selectedOrganizationId],
    queryFn: () => api.resources.getResources(selectedOrganizationId, true),
    enabled: Boolean(selectedOrganizationId),
  })

  const eventsQuery = useQuery({
    queryKey: ['workspace', 'organization-events', selectedOrganizationId],
    queryFn: () => api.events.getEvents(selectedOrganizationId, true),
    enabled: Boolean(selectedOrganizationId),
  })

  const selectedResource = useMemo(
    () => (resourcesQuery.data ?? []).find((resource) => resource.id === selectedResourceId) ?? null,
    [resourcesQuery.data, selectedResourceId],
  )
  const selectedEvent = useMemo(
    () => (eventsQuery.data ?? []).find((event) => event.id === selectedEventId) ?? null,
    [eventsQuery.data, selectedEventId],
  )
  const hasResources = (resourcesQuery.data?.length ?? 0) > 0
  const hasEvents = (eventsQuery.data?.length ?? 0) > 0

  const availabilityRulesQuery = useQuery({
    queryKey: ['workspace', 'resource-rules', selectedResourceId],
    queryFn: () => api.resources.getAvailabilityRules(selectedResourceId),
    enabled: Boolean(selectedResourceId),
  })

  const organizationForm = useForm<OrganizationPayload>({
    defaultValues: buildOrganizationForm(),
  })

  const resourceForm = useForm<ResourcePayload>({
    defaultValues: buildOrganizationResourceForm(selectedOrganizationId),
  })

  const eventForm = useForm<EventPayload>({
    defaultValues: buildEventForm(selectedOrganizationId),
  })

  const ruleForm = useForm<AvailabilityRuleFormValues>({
    defaultValues: {
      resourceId: '',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '18:00',
    },
  })

  useEffect(() => {
    if (organizationQuery.data) {
      organizationForm.reset({
        name: organizationQuery.data.name,
        type: organizationQuery.data.type,
        description: organizationQuery.data.description,
        timeZone: organizationQuery.data.timeZone,
        address: organizationQuery.data.address,
        city: organizationQuery.data.city ?? '',
        phone: organizationQuery.data.phone ?? '',
        email: organizationQuery.data.email ?? '',
        websiteUrl: organizationQuery.data.websiteUrl ?? '',
        logoImageUrl: organizationQuery.data.logoImageUrl ?? '',
        coverImageUrl: organizationQuery.data.coverImageUrl ?? '',
        gallery: organizationQuery.data.gallery,
        documents: organizationQuery.data.documents,
        content: organizationQuery.data.content,
        isActive: organizationQuery.data.isActive,
      })
    } else {
      organizationForm.reset(buildOrganizationForm())
    }
  }, [organizationForm, organizationQuery.data])

  useEffect(() => {
    if (selectedResource) {
      resourceForm.reset(toResourceForm(selectedResource))
      ruleForm.setValue('resourceId', selectedResource.id)
    } else {
      resourceForm.reset(buildOrganizationResourceForm(selectedOrganizationId))
      ruleForm.reset({
        resourceId: '',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '18:00',
      })
    }
  }, [resourceForm, ruleForm, selectedOrganizationId, selectedResource])

  useEffect(() => {
    if (selectedEvent) {
      eventForm.reset(toEventForm(selectedEvent))
    } else {
      eventForm.reset(buildEventForm(selectedOrganizationId))
    }
  }, [eventForm, selectedEvent, selectedOrganizationId])

  const organizationMutation = useMutation({
    mutationFn: async (payload: OrganizationPayload) => {
      if (organizationQuery.data) {
        return api.organizations.updateOrganization(organizationQuery.data.id, payload, token)
      }

      return api.organizations.createOrganization(payload, token)
    },
    onSuccess: async (organization) => {
      setOrganizationNotice(t('workspace.organizationSaved'))
      setSelectedOrganizationId(organization.id)
      await Promise.all([
        auth.refreshProfile(),
        queryClient.invalidateQueries({ queryKey: ['workspace', 'organization', organization.id] }),
      ])
    },
    onError: (error) => {
      setOrganizationNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  const resourceMutation = useMutation({
    mutationFn: (payload: ResourcePayload) => {
      if (selectedResource) {
        return api.resources.updateResource(selectedResource.id, payload, token)
      }

      return api.resources.createResource(payload, token)
    },
    onSuccess: async (resource) => {
      setResourceNotice(t('workspace.resourceSaved'))
      setSelectedResourceId(resource.id)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['workspace', 'organization-resources', selectedOrganizationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['workspace', 'resource-rules', resource.id],
        }),
      ])
    },
    onError: (error) => {
      setResourceNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  const eventMutation = useMutation({
    mutationFn: (payload: EventPayload) => {
      if (selectedEvent) {
        return api.events.updateEvent(selectedEvent.id, payload, token)
      }

      return api.events.createEvent(payload, token)
    },
    onSuccess: async (event) => {
      setEventNotice(t('workspace.eventSaved'))
      setSelectedEventId(event.id)
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'organization-events', selectedOrganizationId],
      })
    },
    onError: (error) => {
      setEventNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  const ruleMutation = useMutation({
    mutationFn: (values: AvailabilityRuleFormValues) =>
      api.resources.createAvailabilityRule(
        {
          resourceId: values.resourceId,
          dayOfWeek: values.dayOfWeek,
          startTime: `${values.startTime}:00`,
          endTime: `${values.endTime}:00`,
        },
        token,
      ),
    onSuccess: async () => {
      setRuleNotice(t('workspace.ruleSaved'))
      ruleForm.reset({
        resourceId: selectedResourceId,
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '18:00',
      })
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'resource-rules', selectedResourceId],
      })
    },
    onError: (error) => {
      setRuleNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  function submitOrganization(values: OrganizationPayload) {
    setOrganizationNotice(null)
    organizationMutation.mutate(toOrganizationPayload(values))
  }

  function submitResource(values: ResourcePayload) {
    setResourceNotice(null)
    resourceMutation.mutate(
      toResourcePayload({
        ...values,
        organizationId: selectedOrganizationId,
      }),
    )
  }

  function submitEvent(values: EventPayload) {
    setEventNotice(null)
    eventMutation.mutate(
      toEventPayload({
        ...values,
        organizationId: selectedOrganizationId,
        startAtUtc: toUtcIso(values.startAtUtc),
        endAtUtc: toUtcIso(values.endAtUtc),
      }),
    )
  }

  function submitRule(values: AvailabilityRuleFormValues) {
    setRuleNotice(null)
    ruleMutation.mutate(values)
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
        <label className="field-group">
          <span>{t('forms.location')}</span>
          <input className="text-field" {...resourceForm.register('location')} />
        </label>
        <label className="field-group">
          <span>{t('forms.isActive')}</span>
          <select
            className="text-field"
            value={resourceForm.watch('isActive') === false ? 'false' : 'true'}
            onChange={(event) => resourceForm.setValue('isActive', event.target.value === 'true')}
          >
            <option value="true">{t('workspace.statusActive')}</option>
            <option value="false">{t('workspace.statusInactive')}</option>
          </select>
        </label>
        <label className="field-group field-group--full">
          <span>{t('forms.description')}</span>
          <textarea className="textarea-field" rows={3} {...resourceForm.register('description')} />
        </label>
      </div>

      <div className="form-grid form-grid--double">
        <MediaUploadField
          token={token}
          folder={`organizations/${selectedOrganizationId}/resources/${selectedResourceId || 'draft'}`}
          label={t('forms.avatarImageUrl')}
          value={resourceForm.watch('avatarImageUrl')}
          onChange={(url) => resourceForm.setValue('avatarImageUrl', url)}
        />
        <MediaUploadField
          token={token}
          folder={`organizations/${selectedOrganizationId}/resources/${selectedResourceId || 'draft'}`}
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

  const eventFormFields = (
    <>
      <div className="form-grid form-grid--double">
        <label className="field-group">
          <span>{t('forms.eventName')}</span>
          <input className="text-field" {...eventForm.register('name', { required: true })} />
        </label>
        <label className="field-group">
          <span>{t('forms.location')}</span>
          <input className="text-field" {...eventForm.register('location', { required: true })} />
        </label>
        <label className="field-group">
          <span>{t('forms.startAt')}</span>
          <input
            className="text-field"
            type="datetime-local"
            value={toDateTimeLocalValue(eventForm.watch('startAtUtc'))}
            onChange={(event) => eventForm.setValue('startAtUtc', event.target.value)}
          />
        </label>
        <label className="field-group">
          <span>{t('forms.endAt')}</span>
          <input
            className="text-field"
            type="datetime-local"
            value={toDateTimeLocalValue(eventForm.watch('endAtUtc'))}
            onChange={(event) => eventForm.setValue('endAtUtc', event.target.value)}
          />
        </label>
        <label className="field-group">
          <span>{t('forms.capacity')}</span>
          <input className="text-field" type="number" {...eventForm.register('capacity', { valueAsNumber: true })} />
        </label>
        <label className="field-group">
          <span>{t('forms.isActive')}</span>
          <select
            className="text-field"
            value={eventForm.watch('isActive') === false ? 'false' : 'true'}
            onChange={(event) => eventForm.setValue('isActive', event.target.value === 'true')}
          >
            <option value="true">{t('workspace.statusActive')}</option>
            <option value="false">{t('workspace.statusInactive')}</option>
          </select>
        </label>
        <label className="field-group field-group--full">
          <span>{t('forms.description')}</span>
          <textarea className="textarea-field" rows={3} {...eventForm.register('description', { required: true })} />
        </label>
      </div>

      <MediaUploadField
        token={token}
        folder={`organizations/${selectedOrganizationId}/events/${selectedEventId || 'draft'}`}
        label={t('forms.posterImageUrl')}
        value={eventForm.watch('posterImageUrl')}
        onChange={(url) => eventForm.setValue('posterImageUrl', url)}
      />

      <LocalizedFieldBlock
        title={t('forms.eventContent')}
        register={eventForm.register}
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
            label: t('forms.descriptionLocalized'),
            multiline: true,
            rows: 4,
            nameByLocale: {
              ru: 'content.description.ru',
              en: 'content.description.en',
              vi: 'content.description.vi',
            },
          },
        ]}
      />

      <div className="form-actions">
        {eventNotice ? <p className="form-notice">{eventNotice}</p> : null}
        <button className="secondary-button" type="submit" disabled={eventMutation.isPending}>
          {selectedEvent ? t('actions.saveChanges') : t('actions.createEvent')}
        </button>
      </div>
    </>
  )

  if (selectedOrganizationId && (organizationQuery.isLoading || resourcesQuery.isLoading || eventsQuery.isLoading)) {
    return <LoadingState label={t('states.loading')} />
  }

  return (
    <div className="workspace-stack">
      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="eyebrow">{t('workspace.navOrganization')}</p>
            <h1 className="workspace-title">{t('workspace.organizationTitle')}</h1>
            <p>{t('workspace.organizationDescription')}</p>
          </div>

          {auth.profile && auth.profile.memberships.length > 0 ? (
            <label className="field-group field-group--compact">
              <span>{t('workspace.selectOrganization')}</span>
              <select
                className="text-field"
                value={selectedOrganizationId}
                onChange={(event) => {
                  setSelectedOrganizationId(event.target.value)
                  setSelectedResourceId('')
                  setSelectedEventId('')
                  setOrganizationNotice(null)
                  setResourceNotice(null)
                  setEventNotice(null)
                  setRuleNotice(null)
                }}
              >
                {auth.profile.memberships.map((membership) => (
                  <option key={membership.organizationId} value={membership.organizationId}>
                    {membership.organizationName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <form className="workspace-form workspace-form--comfortable" onSubmit={organizationForm.handleSubmit(submitOrganization)}>
          <div className="form-grid form-grid--double">
            <label className="field-group">
              <span>{t('forms.organizationName')}</span>
              <input className="text-field" {...organizationForm.register('name', { required: true })} />
            </label>
            <label className="field-group">
              <span>{t('forms.organizationType')}</span>
              <select className="text-field" {...organizationForm.register('type')}>
                {organizationTypes.map((type) => (
                  <option key={type} value={type}>
                    {getOrganizationTypeLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>{t('forms.timeZone')}</span>
              <input className="text-field" {...organizationForm.register('timeZone', { required: true })} />
            </label>
            <label className="field-group">
              <span>{t('forms.city')}</span>
              <input className="text-field" {...organizationForm.register('city')} />
            </label>
            <label className="field-group field-group--full">
              <span>{t('forms.address')}</span>
              <input className="text-field" {...organizationForm.register('address', { required: true })} />
            </label>
            <label className="field-group">
              <span>{t('forms.phone')}</span>
              <input className="text-field" {...organizationForm.register('phone')} />
            </label>
            <label className="field-group">
              <span>{t('forms.email')}</span>
              <input className="text-field" type="email" {...organizationForm.register('email')} />
            </label>
            <label className="field-group">
              <span>{t('forms.website')}</span>
              <input className="text-field" {...organizationForm.register('websiteUrl')} />
            </label>
            <label className="field-group">
              <span>{t('forms.isActive')}</span>
              <select
                className="text-field"
                value={organizationForm.watch('isActive') ? 'true' : 'false'}
                onChange={(event) =>
                  organizationForm.setValue('isActive', event.target.value === 'true')
                }
              >
                <option value="true">{t('workspace.statusActive')}</option>
                <option value="false">{t('workspace.statusInactive')}</option>
              </select>
            </label>
            <label className="field-group field-group--full">
              <span>{t('forms.description')}</span>
              <textarea
                className="textarea-field"
                rows={4}
                {...organizationForm.register('description', { required: true })}
              />
            </label>
          </div>

          <div className="form-grid form-grid--double">
            <MediaUploadField
              token={token}
              folder={`organizations/${selectedOrganizationId || 'draft'}`}
              label={t('forms.logoImageUrl')}
              value={organizationForm.watch('logoImageUrl')}
              onChange={(url) => organizationForm.setValue('logoImageUrl', url)}
            />
            <MediaUploadField
              token={token}
              folder={`organizations/${selectedOrganizationId || 'draft'}`}
              label={t('forms.coverImageUrl')}
              value={organizationForm.watch('coverImageUrl')}
              onChange={(url) => organizationForm.setValue('coverImageUrl', url)}
            />
          </div>

          <LocalizedFieldBlock
            title={t('forms.publicContent')}
            register={organizationForm.register}
            fields={[
              {
                label: t('forms.heroTitle'),
                nameByLocale: {
                  ru: 'content.heroTitle.ru',
                  en: 'content.heroTitle.en',
                  vi: 'content.heroTitle.vi',
                },
              },
              {
                label: t('forms.heroSubtitle'),
                nameByLocale: {
                  ru: 'content.heroSubtitle.ru',
                  en: 'content.heroSubtitle.en',
                  vi: 'content.heroSubtitle.vi',
                },
              },
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
                label: t('forms.descriptionLocalized'),
                multiline: true,
                rows: 5,
                nameByLocale: {
                  ru: 'content.description.ru',
                  en: 'content.description.en',
                  vi: 'content.description.vi',
                },
              },
            ]}
          />

          <div className="form-actions">
            {organizationNotice ? <p className="form-notice">{organizationNotice}</p> : null}
            <button className="primary-button" type="submit" disabled={organizationMutation.isPending}>
              {organizationQuery.data ? t('actions.saveChanges') : t('actions.createOrganization')}
            </button>
          </div>
        </form>
      </section>

      {selectedOrganizationId ? (
        <>
          <section className="workspace-panel">
            <div className="workspace-panel__header">
              <div>
                <p className="eyebrow">{t('workspace.resourceComposerEyebrow')}</p>
                <h2>{t('workspace.resourceManagerTitle')}</h2>
                <p>{t('workspace.resourceManagerDescription')}</p>
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
                      setRuleNotice(null)
                      setResourceNotice(null)
                    }}
                  >
                    <strong>{resource.name}</strong>
                    <span>{getResourceTypeLabel(resource.type)}</span>
                    <span>{resource.isActive ? t('workspace.statusActive') : t('workspace.statusInactive')}</span>
                  </button>
                ))}
              </div>

              <div className="workspace-stack">
                <form className="workspace-form workspace-form--comfortable" onSubmit={resourceForm.handleSubmit(submitResource)}>
                  {resourceFormFields}
                </form>

                {selectedResource ? (
                  <section className="form-card">
                    <div className="form-card__header">
                      <div>
                        <p className="workspace-card__label">{t('workspace.rulesEyebrow')}</p>
                        <h3>{t('workspace.rulesTitle')}</h3>
                      </div>
                    </div>

                    <div className="manager-rules">
                      {(availabilityRulesQuery.data ?? []).map((rule) => (
                        <article key={rule.id} className="manager-rule">
                          <strong>{t(`days.${rule.dayOfWeek}`)}</strong>
                          <span>{rule.startTime.slice(0, 5)} - {rule.endTime.slice(0, 5)}</span>
                        </article>
                      ))}
                    </div>

                    <form className="workspace-form" onSubmit={ruleForm.handleSubmit(submitRule)}>
                      <div className="form-grid form-grid--double">
                        <label className="field-group">
                          <span>{t('forms.dayOfWeek')}</span>
                          <select className="text-field" {...ruleForm.register('dayOfWeek')}>
                            {dayOfWeekOptions.map((day) => (
                              <option key={day} value={day}>
                                {t(`days.${day}`)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field-group">
                          <span>{t('forms.startTime')}</span>
                          <input className="text-field" type="time" {...ruleForm.register('startTime')} />
                        </label>
                        <label className="field-group">
                          <span>{t('forms.endTime')}</span>
                          <input className="text-field" type="time" {...ruleForm.register('endTime')} />
                        </label>
                      </div>

                      <div className="form-actions">
                        {ruleNotice ? <p className="form-notice">{ruleNotice}</p> : null}
                        <button className="secondary-button" type="submit" disabled={ruleMutation.isPending}>
                          {t('actions.addRule')}
                        </button>
                      </div>
                    </form>
                  </section>
                ) : null}
              </div>
            </div>
            ) : (
              <div className="workspace-stack workspace-stack--compact">
                <p className="workspace-empty">{t('workspace.organizationEmptyResources')}</p>
                <form className="workspace-form workspace-form--comfortable" onSubmit={resourceForm.handleSubmit(submitResource)}>
                  {resourceFormFields}
                </form>
              </div>
            )}
          </section>

          <section className="workspace-panel">
            <div className="workspace-panel__header">
              <div>
                <p className="eyebrow">{t('workspace.eventComposerEyebrow')}</p>
                <h2>{t('workspace.eventManagerTitle')}</h2>
                <p>{t('workspace.eventManagerDescription')}</p>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setSelectedEventId('')}
              >
                {t('actions.createNewEvent')}
              </button>
            </div>

            {hasEvents ? (
            <div className="manager-grid">
              <div className="manager-list">
                {(eventsQuery.data ?? []).map((event) => (
                  <button
                    key={event.id}
                    className={`manager-list__item ${selectedEventId === event.id ? 'is-selected' : ''}`}
                    type="button"
                    onClick={() => {
                      setSelectedEventId(event.id)
                      setEventNotice(null)
                    }}
                  >
                    <strong>{event.name}</strong>
                    <span>{new Date(event.startAtUtc).toLocaleDateString('ru-RU')}</span>
                    <span>{event.isActive ? t('workspace.statusActive') : t('workspace.statusInactive')}</span>
                  </button>
                ))}
              </div>

              <form className="workspace-form workspace-form--comfortable" onSubmit={eventForm.handleSubmit(submitEvent)}>
                {eventFormFields}
              </form>
            </div>
            ) : (
              <div className="workspace-stack workspace-stack--compact">
                <p className="workspace-empty">{t('workspace.organizationEmptyEvents')}</p>
                <form className="workspace-form workspace-form--comfortable" onSubmit={eventForm.handleSubmit(submitEvent)}>
                  {eventFormFields}
                </form>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

function toResourceForm(resource: Resource): ResourcePayload {
  return {
    organizationId: resource.organizationId ?? '',
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
    isActive: resource.isActive,
  }
}

function toEventForm(event: EventSession): EventPayload {
  return {
    organizationId: event.organizationId,
    name: event.name,
    description: event.description,
    location: event.location,
    posterImageUrl: event.posterImageUrl ?? '',
    gallery: event.gallery,
    documents: event.documents,
    content: event.content,
    startAtUtc: event.startAtUtc,
    endAtUtc: event.endAtUtc,
    capacity: event.capacity,
    isActive: event.isActive,
  }
}
