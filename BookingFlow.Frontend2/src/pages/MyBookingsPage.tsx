import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { SeoMeta } from '../components/SeoMeta'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../features/auth/AuthProvider'
import { api } from '../lib/api'
import { getBookingStatusLabel } from '../lib/display'
import {
  formatDateInputInTimeZone,
  formatTimeRangeInTimeZone,
  formatUtcInTimeZone,
} from '../lib/timezone'
import type { AppLocale } from '../features/i18n/config'
import type { AvailableSlot, Booking } from '../types/api'

interface CancelFormValues {
  reason: string
}

interface BookingTimeZoneMaps {
  organizations: Record<string, string>
  providers: Record<string, string>
}

export function MyBookingsPage() {
  const { t, i18n } = useTranslation()
  const auth = useAuth()
  const locale = i18n.language as AppLocale

  const bookingsQuery = useQuery({
    queryKey: ['workspace', 'bookings', auth.token],
    queryFn: () => api.bookings.getMyBookings(auth.token!),
    enabled: Boolean(auth.token),
  })

  const timeZonesQuery = useQuery({
    queryKey: [
      'workspace',
      'booking-timezones',
      (bookingsQuery.data ?? []).map((booking) => booking.id).join(':'),
    ],
    enabled: Boolean(bookingsQuery.data?.length),
    queryFn: async (): Promise<BookingTimeZoneMaps> => {
      const organizationIds = [...new Set((bookingsQuery.data ?? []).flatMap((booking) => booking.organizationId ? [booking.organizationId] : []))]
      const providerIds = [...new Set((bookingsQuery.data ?? []).flatMap((booking) => !booking.organizationId && booking.providerProfileId ? [booking.providerProfileId] : []))]

      const [organizations, providers] = await Promise.all([
        Promise.all(organizationIds.map(async (id) => [id, (await api.organizations.getOrganization(id)).timeZone] as const)),
        Promise.all(providerIds.map(async (id) => [id, (await api.providers.getProviderProfile(id)).timeZone] as const)),
      ])

      return {
        organizations: Object.fromEntries(organizations),
        providers: Object.fromEntries(providers),
      }
    },
  })

  const bookings = bookingsQuery.data ?? []
  const now = Date.now()
  const upcomingBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status !== 'Cancelled' && new Date(booking.startAtUtc).getTime() >= now,
      ),
    [bookings, now],
  )
  const historyBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === 'Cancelled' || new Date(booking.startAtUtc).getTime() < now,
      ),
    [bookings, now],
  )

  if (bookingsQuery.isLoading) {
    return <LoadingState label={t('states.loading')} />
  }

  if (bookingsQuery.isError) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        actionLabel={t('actions.retry')}
        onRetry={() => void bookingsQuery.refetch()}
      />
    )
  }

  return (
    <>
      <SeoMeta title={t('workspace.bookingsMetaTitle')} description={t('workspace.bookingsMetaDescription')} />

      <section className="workspace-hero workspace-hero--compact">
        <div className="workspace-hero__content">
          <p className="eyebrow">{t('workspace.navBookings')}</p>
          <h1 className="workspace-title">{t('workspace.bookingsTitle')}</h1>
          <p>{t('workspace.bookingsDescription')}</p>
        </div>
      </section>

      {!bookings.length ? (
        <EmptyState
          title={t('workspace.bookingsEmptyTitle')}
          description={t('workspace.bookingsEmptyDescription')}
        />
      ) : (
        <div className="workspace-stack">
          <section className="workspace-panel">
            <div className="workspace-panel__header">
              <div>
                <p className="workspace-card__label">{t('workspace.bookingsUpcomingEyebrow')}</p>
                <h2>{t('workspace.bookingsUpcomingTitle')}</h2>
              </div>
            </div>
            <div className="workspace-stack">
              {upcomingBookings.length ? (
                upcomingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    locale={locale}
                    ownerTimeZone={resolveBookingTimeZone(booking, timeZonesQuery.data)}
                  />
                ))
              ) : (
                <p className="workspace-empty">{t('workspace.bookingsNoUpcoming')}</p>
              )}
            </div>
          </section>

          <section className="workspace-panel">
            <div className="workspace-panel__header">
              <div>
                <p className="workspace-card__label">{t('workspace.bookingsHistoryEyebrow')}</p>
                <h2>{t('workspace.bookingsHistoryTitle')}</h2>
              </div>
            </div>
            <div className="workspace-stack">
              {historyBookings.length ? (
                historyBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    locale={locale}
                    ownerTimeZone={resolveBookingTimeZone(booking, timeZonesQuery.data)}
                  />
                ))
              ) : (
                <p className="workspace-empty">{t('workspace.bookingsNoHistory')}</p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function BookingCard({
  booking,
  locale,
  ownerTimeZone,
}: {
  booking: Booking
  locale: AppLocale
  ownerTimeZone: string
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState(() =>
    formatDateInputInTimeZone(booking.startAtUtc, ownerTimeZone),
  )
  const [selectedSlotKey, setSelectedSlotKey] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setRescheduleDate(formatDateInputInTimeZone(booking.startAtUtc, ownerTimeZone))
  }, [booking.startAtUtc, ownerTimeZone])

  const cancelForm = useForm<CancelFormValues>({
    defaultValues: {
      reason: '',
    },
  })

  const rescheduleSlotsQuery = useQuery({
    queryKey: ['workspace', 'booking-reschedule-slots', booking.id, rescheduleDate],
    queryFn: () => api.resources.getAvailability(booking.resourceId!, rescheduleDate),
    enabled: isRescheduleOpen && Boolean(booking.resourceId),
  })

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => api.bookings.cancelBooking(booking.id, reason || undefined, auth.token!),
    onSuccess: async () => {
      setNotice(t('workspace.bookingCancelled'))
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'bookings'],
      })
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      const selectedSlot =
        (rescheduleSlotsQuery.data ?? []).find(
          (slot) => `${slot.startAtUtc}:${slot.endAtUtc}` === selectedSlotKey,
        ) ?? null

      if (!selectedSlot) {
        throw new Error(t('workspace.selectNewSlot'))
      }

      return api.bookings.rescheduleBooking(
        booking.id,
        {
          newStartAtUtc: selectedSlot.startAtUtc,
          newEndAtUtc: selectedSlot.endAtUtc,
        },
        auth.token!,
      )
    },
    onSuccess: async () => {
      setNotice(t('workspace.bookingRescheduled'))
      setSelectedSlotKey('')
      setIsRescheduleOpen(false)
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'bookings'],
      })
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : t('states.errorDescription'))
    },
  })

  const canCancel = booking.status !== 'Cancelled' && new Date(booking.startAtUtc).getTime() >= Date.now()
  const canReschedule = Boolean(
    booking.resourceId &&
      booking.status !== 'Cancelled' &&
      new Date(booking.startAtUtc).getTime() >= Date.now(),
  )

  const availableSlots = (rescheduleSlotsQuery.data ?? []).filter(
    (slot) =>
      slot.isAvailable &&
      `${slot.startAtUtc}:${slot.endAtUtc}` !== `${booking.startAtUtc}:${booking.endAtUtc}`,
  )

  return (
    <article className="workspace-card booking-card">
      <div className="booking-card__header">
        <div>
          <p className="workspace-card__label">
            {booking.eventSessionId ? t('workspace.bookingEvent') : t('workspace.bookingResource')}
          </p>
          <h2>{booking.resourceName ?? booking.eventName ?? t('workspace.bookingFallback')}</h2>
          <p>{booking.organizationName ?? booking.providerDisplayName}</p>
        </div>
        <div className="booking-card__badges">
          <span className="workspace-chip">{getBookingStatusLabel(booking.status)}</span>
          <span className="workspace-chip">{ownerTimeZone}</span>
        </div>
      </div>

      <div className="workspace-quick-grid booking-card__grid">
        <article className="workspace-panel">
          <p className="workspace-card__label">{t('workspace.bookingWhen')}</p>
          <h3>{formatUtcInTimeZone(booking.startAtUtc, ownerTimeZone, locale)}</h3>
          <p>{formatTimeRangeInTimeZone(booking.startAtUtc, booking.endAtUtc, ownerTimeZone, locale)}</p>
        </article>
        <article className="workspace-panel">
          <p className="workspace-card__label">{t('workspace.bookingDetails')}</p>
          <p>{t('workspace.bookingGuests', { count: booking.guestCount })}</p>
          {booking.comment ? <p>{booking.comment}</p> : null}
          {booking.cancellationReason ? <p>{booking.cancellationReason}</p> : null}
        </article>
      </div>

      {notice ? (
        <p className="booking-notice">{notice}</p>
      ) : null}

      <div className="booking-panel__actions">
        {canReschedule ? (
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setNotice(null)
              setIsRescheduleOpen((value) => !value)
            }}
          >
            {isRescheduleOpen ? t('workspace.hideReschedule') : t('workspace.openReschedule')}
          </button>
        ) : null}

        {canCancel ? (
          <button
            className="ghost-button"
            type="button"
            onClick={cancelForm.handleSubmit((values) => {
              setNotice(null)
              cancelMutation.mutate(values.reason.trim())
            })}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? t('states.loading') : t('workspace.cancelBooking')}
          </button>
        ) : null}
      </div>

      {canCancel ? (
        <label className="field-group">
          <span>{t('workspace.cancelReason')}</span>
          <input className="text-field" {...cancelForm.register('reason')} />
        </label>
      ) : null}

      {isRescheduleOpen && canReschedule ? (
        <div className="booking-reschedule">
          <div className="form-grid form-grid--double">
            <label className="field-group">
              <span>{t('public.selectDate')}</span>
              <input
                className="text-field"
                type="date"
                value={rescheduleDate}
                onChange={(event) => {
                  setRescheduleDate(event.target.value)
                  setSelectedSlotKey('')
                  setNotice(null)
                }}
              />
            </label>
          </div>

          <p className="workspace-empty">{t('workspace.rescheduleHint')}</p>

          <div className="booking-slot-list">
            {availableSlots.length ? (
              availableSlots.map((slot) => (
                <RescheduleSlotButton
                  key={`${slot.startAtUtc}:${slot.endAtUtc}`}
                  slot={slot}
                  locale={locale}
                  isSelected={selectedSlotKey === `${slot.startAtUtc}:${slot.endAtUtc}`}
                  onSelect={() => setSelectedSlotKey(`${slot.startAtUtc}:${slot.endAtUtc}`)}
                />
              ))
            ) : (
              <p className="workspace-empty">{t('workspace.noRescheduleSlots')}</p>
            )}
          </div>

          <div className="booking-panel__actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setNotice(null)
                rescheduleMutation.mutate()
              }}
              disabled={rescheduleMutation.isPending || !selectedSlotKey}
            >
              {rescheduleMutation.isPending ? t('states.loading') : t('workspace.confirmReschedule')}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function RescheduleSlotButton({
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
  return (
    <button
      className={`booking-slot ${isSelected ? 'is-selected' : ''}`}
      type="button"
      onClick={onSelect}
    >
      <strong>
        {formatTimeRangeInTimeZone(
          slot.startAtUtc,
          slot.endAtUtc,
          slot.organizationTimeZone,
          locale,
        )}
      </strong>
      <span>{formatUtcInTimeZone(slot.startAtUtc, slot.organizationTimeZone, locale)}</span>
    </button>
  )
}

function resolveBookingTimeZone(booking: Booking, maps?: BookingTimeZoneMaps) {
  if (booking.organizationId && maps?.organizations[booking.organizationId]) {
    return maps.organizations[booking.organizationId]
  }

  if (booking.providerProfileId && maps?.providers[booking.providerProfileId]) {
    return maps.providers[booking.providerProfileId]
  }

  return 'UTC'
}
