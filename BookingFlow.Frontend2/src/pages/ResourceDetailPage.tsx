import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { SeoMeta } from '../components/SeoMeta'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { api } from '../lib/api'
import { formatPriceFrom, getResourceTypeLabel, normalizeSeededContent } from '../lib/display'
import { resolveLocalizedCollection, resolveLocalizedText } from '../lib/i18n-content'
import { getResourceImageUrl } from '../lib/placeholders'
import {
  formatTimeRangeInTimeZone,
  getDateInputValueInTimeZone,
} from '../lib/timezone'
import { useAuth } from '../features/auth/AuthProvider'
import type { AvailableSlot } from '../types/api'
import type { AppLocale } from '../features/i18n/config'

interface ResourceBookingFormValues {
  guestCount: number
  comment: string
}

export function ResourceDetailPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isAuthenticated, token, login } = useAuth()
  const { locale = 'ru', resourceId = '' } = useParams()
  const currentLocale = locale as AppLocale
  const [selectedDate, setSelectedDate] = useState(() => getDateInputValueInTimeZone('UTC', 1))
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>('')
  const [bookingNotice, setBookingNotice] = useState<string | null>(null)

  const resourceQuery = useQuery({
    queryKey: ['public', 'resource', resourceId],
    queryFn: () => api.resources.getResource(resourceId),
  })

  const availabilityQuery = useQuery({
    queryKey: ['public', 'resource-availability', resourceId, selectedDate],
    queryFn: () => api.resources.getAvailability(resourceId, selectedDate),
    enabled: Boolean(resourceId && selectedDate),
  })

  const bookingForm = useForm<ResourceBookingFormValues>({
    defaultValues: {
      guestCount: 1,
      comment: '',
    },
  })

  const resource = resourceQuery.data
  const ownerTimeZone = availabilityQuery.data?.[0]?.organizationTimeZone ?? 'UTC'
  const slots = availabilityQuery.data ?? []
  const selectedSlot =
    slots.find((slot) => `${slot.startAtUtc}:${slot.endAtUtc}` === selectedSlotKey) ?? null

  useEffect(() => {
    if (!resource) {
      return
    }

    bookingForm.setValue('guestCount', 1)
  }, [bookingForm, resource])

  useEffect(() => {
    setSelectedSlotKey('')
    setBookingNotice(null)
  }, [selectedDate])

  const bookingMutation = useMutation({
    mutationFn: async (values: ResourceBookingFormValues) => {
      if (!token || !selectedSlot) {
        throw new Error(t('public.bookingSelectSlot'))
      }

      return api.bookings.createResourceBooking(
        {
          organizationId: resource?.organizationId ?? undefined,
          resourceId,
          startAtUtc: selectedSlot.startAtUtc,
          endAtUtc: selectedSlot.endAtUtc,
          guestCount: values.guestCount,
          comment: values.comment.trim() || undefined,
        },
        token,
      )
    },
    onSuccess: async () => {
      setBookingNotice(t('public.bookingSuccess'))
      setSelectedSlotKey('')
      bookingForm.reset({
        guestCount: 1,
        comment: '',
      })
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['public', 'resource-availability', resourceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['auth', 'me'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['bookings', 'my'],
        }),
      ])
    },
    onError: (error) => {
      setBookingNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  if (resourceQuery.isLoading) {
    return <LoadingState label={t('states.loading')} />
  }

  if (resourceQuery.isError || !resource) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        actionLabel={t('actions.retry')}
        onRetry={() => void resourceQuery.refetch()}
      />
    )
  }

  const formats = resolveLocalizedCollection(resource.content.formats, currentLocale)
  const specialties = resolveLocalizedCollection(resource.content.specialties, currentLocale)
  const availableSlots = slots.filter((slot) => slot.isAvailable)

  const handleBookingSubmit = bookingForm.handleSubmit((values) => {
    setBookingNotice(null)

    if (!isAuthenticated || !token) {
      login(currentLocale)
      return
    }

    if (!selectedSlot) {
      setBookingNotice(t('public.bookingSelectSlot'))
      return
    }

    bookingMutation.mutate(values)
  })

  return (
    <>
      <SeoMeta
        title={resource.name}
        description={normalizeSeededContent(
          resolveLocalizedText(resource.content.summary, currentLocale) ||
            resource.description ||
            resource.name,
        )}
      />
      <section className="hero-panel hero-panel--detail">
        <div className="hero-panel__content">
          <p className="eyebrow">{getResourceTypeLabel(resource.type)}</p>
          <h1>{resource.name}</h1>
          <p className="hero-panel__lead">
            {normalizeSeededContent(
              resolveLocalizedText(resource.content.summary, currentLocale) ||
                resource.description ||
                '',
            )}
          </p>
        </div>
        <div className="hero-panel__aside">
          <div className="hero-figure">
            <img src={getResourceImageUrl(resource)} alt={resource.name} />
          </div>
          <p className="workspace-card__label">{t('public.bookingInfo')}</p>
          <h2>{formatPriceFrom(resource.priceFrom) ?? t('public.onRequest')}</h2>
          <p>{resource.location}</p>
          <div className="hero-aside-list">
            <span>{resource.slotSizeMinutes} {t('public.minutesUnit')}</span>
            <span>{resource.capacity} {t('public.peopleUnit')}</span>
          </div>
        </div>
      </section>
      <section className="workspace-quick-grid">
        <article className="workspace-panel">
          <p className="workspace-card__label">{t('public.specialtiesTitle')}</p>
          <h2>{t('public.resourceFormats')}</h2>
          <ul className="workspace-list">
            {specialties.map((item) => (
              <li key={item}>{normalizeSeededContent(item)}</li>
            ))}
            {formats.map((item) => (
              <li key={item}>{normalizeSeededContent(item)}</li>
            ))}
          </ul>
        </article>
        <article className="workspace-panel">
          <p className="workspace-card__label">{t('public.bookingDetailsTitle')}</p>
          <h2>{t('public.capacityTitle')}</h2>
          <div className="public-detail-list">
            <span>{t('public.capacityValue', { count: resource.capacity })}</span>
            <span>{t('public.slotDurationValue', { count: resource.slotSizeMinutes })}</span>
            <span>{t('public.priceValue', { value: formatPriceFrom(resource.priceFrom) ?? t('public.onRequest') })}</span>
          </div>
        </article>
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-card__label">{t('public.availableSlotsEyebrow')}</p>
            <h2>{t('public.availableSlotsTitle')}</h2>
          </div>
          <span className="workspace-chip">{ownerTimeZone}</span>
        </div>

        <form className="booking-panel" onSubmit={handleBookingSubmit}>
          <label className="field-group">
            <span>{t('public.selectDate')}</span>
            <input
              className="text-field"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          <div className="booking-slot-list" role="list">
            {slots.length === 0 && !availabilityQuery.isLoading ? (
              <p className="workspace-empty">{t('public.noSlotsForDate')}</p>
            ) : null}

            {slots.map((slot) => (
              <SlotButton
                key={`${slot.startAtUtc}:${slot.endAtUtc}`}
                slot={slot}
                locale={currentLocale}
                isSelected={selectedSlotKey === `${slot.startAtUtc}:${slot.endAtUtc}`}
                onSelect={() => setSelectedSlotKey(`${slot.startAtUtc}:${slot.endAtUtc}`)}
              />
            ))}
          </div>

          <div className="booking-panel__meta">
            <p>
              {t('public.availableSlotsCount', {
                count: availableSlots.length,
              })}
            </p>
            {selectedSlot ? (
              <p>
                {t('public.selectedSlot')}:{' '}
                {formatTimeRangeInTimeZone(
                  selectedSlot.startAtUtc,
                  selectedSlot.endAtUtc,
                  selectedSlot.organizationTimeZone,
                  currentLocale,
                )}
              </p>
            ) : (
              <p>{t('public.bookingSelectSlot')}</p>
            )}
          </div>

          <p className="workspace-empty">{t('public.bookingFlowHint')}</p>

          <div className="form-grid form-grid--double">
            <label className="field-group">
              <span>{t('public.guestsLabel')}</span>
              <input
                className="text-field"
                type="number"
                min={1}
                max={resource.capacity}
                {...bookingForm.register('guestCount', {
                  required: true,
                  min: 1,
                  max: resource.capacity,
                  valueAsNumber: true,
                })}
              />
            </label>
            <label className="field-group field-group--full">
              <span>{t('public.commentLabel')}</span>
              <textarea
                className="textarea-field"
                rows={3}
                {...bookingForm.register('comment')}
              />
            </label>
          </div>

          {bookingNotice ? (
            <p
              className={`booking-notice ${bookingMutation.isSuccess ? 'booking-notice--success' : ''}`}
            >
              {bookingNotice}
            </p>
          ) : null}

          <div className="booking-panel__actions">
            {!isAuthenticated ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => login(currentLocale)}
              >
                {t('public.loginToBook')}
              </button>
            ) : null}
            <button
              className="primary-button"
              type="submit"
              disabled={bookingMutation.isPending || availabilityQuery.isLoading}
            >
              {bookingMutation.isPending
                ? t('states.loading')
                : t('actions.bookSlot')}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

function SlotButton({
  slot,
  locale,
  isSelected,
  onSelect,
}: {
  slot: AvailableSlot
  locale: AppLocale
  isSelected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()

  return (
    <button
      className={`booking-slot ${isSelected ? 'is-selected' : ''}`}
      type="button"
      onClick={onSelect}
      disabled={!slot.isAvailable}
      >
        <strong>
        {formatTimeRangeInTimeZone(
          slot.startAtUtc,
          slot.endAtUtc,
          slot.organizationTimeZone,
          locale,
        )}
      </strong>
      <span>{slot.isAvailable ? t('public.slotAvailable') : t('public.slotBusy')}</span>
    </button>
  )
}
