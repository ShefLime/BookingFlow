import { useEffect, useState } from 'react'
import { LoadingBlock } from '../components/LoadingBlock'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../i18n/LocaleContext'
import { api } from '../lib/api'
import {
  canModifyBooking,
  describeBookingOwner,
  describeBookingTarget,
  formatDateTime,
  getDefaultBookingDate,
} from '../lib/format'
import type { AvailableSlot, Booking, Locale } from '../types/api'

type SlotsByBooking = Record<string, AvailableSlot[]>
type DatesByBooking = Record<string, string>
type ReasonsByBooking = Record<string, string>

function getBookingCopy(locale: Locale) {
  return {
    ru: {
      loading: 'Подгружаю ваши брони...',
      loadError: 'Не удалось загрузить брони.',
      slotError: 'Не удалось загрузить слоты для переноса.',
      cancelSuccess: 'Бронь отменена.',
      cancelError: 'Не удалось отменить бронь.',
      rescheduleSuccess: 'Бронь перенесена.',
      rescheduleError: 'Не удалось перенести бронь.',
      kicker: 'Кабинет клиента',
      title: 'Мои бронирования',
      subtitle: 'Отмена и перенос доступны не позже чем за 24 часа до начала брони.',
      emptyTitle: 'Пока нет броней',
      emptyDescription: 'Перейдите в каталог, выберите площадку и создайте первую бронь.',
      start: 'Начало',
      end: 'Окончание',
      guests: 'Гостей',
      reasonTitle: 'Причина отмены',
      reasonPrefix: 'Причина отмены',
      reasonPlaceholder: 'Например, изменились планы',
      cancelAction: 'Отменить бронь',
      rescheduleDate: 'Дата для переноса',
      loadSlots: 'Показать новые слоты',
      eventOnlyCancel: 'Для событий доступна только отмена: время мероприятия фиксировано.',
      lockedNotice: 'Изменения недоступны: либо бронь уже изменена, либо до начала осталось меньше 24 часов.',
      status: {
        Confirmed: 'Подтверждено',
        Cancelled: 'Отменено',
        Pending: 'Ожидает',
        Completed: 'Завершено',
        Expired: 'Истекло',
      },
    },
    en: {
      loading: 'Loading your bookings...',
      loadError: 'Failed to load bookings.',
      slotError: 'Failed to load slots for rescheduling.',
      cancelSuccess: 'Booking cancelled.',
      cancelError: 'Failed to cancel booking.',
      rescheduleSuccess: 'Booking rescheduled.',
      rescheduleError: 'Failed to reschedule booking.',
      kicker: 'Client area',
      title: 'My bookings',
      subtitle: 'Cancellation and rescheduling are available no later than 24 hours before the booking.',
      emptyTitle: 'No bookings yet',
      emptyDescription: 'Go to the catalog, choose a venue and create your first booking.',
      start: 'Start',
      end: 'End',
      guests: 'Guests',
      reasonTitle: 'Cancellation reason',
      reasonPrefix: 'Cancellation reason',
      reasonPlaceholder: 'For example, plans changed',
      cancelAction: 'Cancel booking',
      rescheduleDate: 'Reschedule date',
      loadSlots: 'Show new slots',
      eventOnlyCancel: 'Events can only be cancelled because the schedule is fixed.',
      lockedNotice: 'Changes are unavailable because the booking was already changed or less than 24 hours remain.',
      status: {
        Confirmed: 'Confirmed',
        Cancelled: 'Cancelled',
        Pending: 'Pending',
        Completed: 'Completed',
        Expired: 'Expired',
      },
    },
    vi: {
      loading: 'Dang tai lich dat cua ban...',
      loadError: 'Khong the tai lich dat.',
      slotError: 'Khong the tai khung gio de doi lich.',
      cancelSuccess: 'Da huy lich dat.',
      cancelError: 'Khong the huy lich dat.',
      rescheduleSuccess: 'Da doi lich dat.',
      rescheduleError: 'Khong the doi lich dat.',
      kicker: 'Khu vuc khach hang',
      title: 'Lich dat cua toi',
      subtitle: 'Huy va doi lich chi kha dung truoc it nhat 24 gio.',
      emptyTitle: 'Chua co lich dat',
      emptyDescription: 'Hay vao danh muc, chon dia diem va tao lich dat dau tien.',
      start: 'Bat dau',
      end: 'Ket thuc',
      guests: 'Khach',
      reasonTitle: 'Ly do huy',
      reasonPrefix: 'Ly do huy',
      reasonPlaceholder: 'Vi du: thay doi ke hoach',
      cancelAction: 'Huy lich dat',
      rescheduleDate: 'Ngay doi lich',
      loadSlots: 'Hien khung gio moi',
      eventOnlyCancel: 'Su kien chi co the huy vi thoi gian da co dinh.',
      lockedNotice: 'Khong the thay doi vi lich dat da duoc sua hoac con duoi 24 gio.',
      status: {
        Confirmed: 'Da xac nhan',
        Cancelled: 'Da huy',
        Pending: 'Dang cho',
        Completed: 'Da xong',
        Expired: 'Het han',
      },
    },
  }[locale]
}

export function MyBookingsPage() {
  const { session } = useAuth()
  const { locale } = useLocale()
  const copy = getBookingCopy(locale)
  const token = session?.accessToken
  const hasToken = Boolean(token)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDates, setSelectedDates] = useState<DatesByBooking>({})
  const [cancelReasons, setCancelReasons] = useState<ReasonsByBooking>({})
  const [slotsByBookingId, setSlotsByBookingId] = useState<SlotsByBooking>({})
  const [loading, setLoading] = useState(true)
  const [workingBookingId, setWorkingBookingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      return
    }

    const accessToken = token
    let isMounted = true

    async function loadBookings() {
      try {
        setLoading(true)
        const data = await api.getMyBookings(accessToken)
        if (!isMounted) {
          return
        }

        setBookings(data)
        setSelectedDates(
          data.reduce<DatesByBooking>((accumulator, booking) => {
            accumulator[booking.id] = getDefaultBookingDate()
            return accumulator
          }, {}),
        )
        setError(null)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : copy.loadError)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadBookings()

    return () => {
      isMounted = false
    }
  }, [copy.loadError, hasToken, token])

  if (!token) {
    return null
  }

  const accessToken = token

  async function refreshBookings() {
    const data = await api.getMyBookings(accessToken)
    setBookings(data)
  }

  async function loadRescheduleSlots(booking: Booking) {
    if (!booking.resourceId) {
      return
    }

    const dateValue = selectedDates[booking.id] ?? getDefaultBookingDate()

    try {
      setWorkingBookingId(booking.id)
      const slots = await api.getAvailability(booking.resourceId, dateValue)
      setSlotsByBookingId((current) => ({
        ...current,
        [booking.id]: slots.filter((slot) => slot.isAvailable),
      }))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.slotError)
    } finally {
      setWorkingBookingId(null)
    }
  }

  async function handleCancel(booking: Booking) {
    try {
      setWorkingBookingId(booking.id)
      const updated = await api.cancelBooking(booking.id, cancelReasons[booking.id], accessToken)
      setBookings((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setMessage(`"${describeBookingTarget(updated)}": ${copy.cancelSuccess}`)
      setError(null)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.cancelError)
    } finally {
      setWorkingBookingId(null)
    }
  }

  async function handleReschedule(booking: Booking, slot: AvailableSlot) {
    try {
      setWorkingBookingId(booking.id)
      const updated = await api.rescheduleBooking(
        booking.id,
        {
          newStartAtUtc: slot.startAtUtc,
          newEndAtUtc: slot.endAtUtc,
        },
        accessToken,
      )

      setBookings((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSlotsByBookingId((current) => ({ ...current, [booking.id]: [] }))
      setMessage(`"${describeBookingTarget(updated)}": ${copy.rescheduleSuccess}`)
      setError(null)
      await refreshBookings()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.rescheduleError)
    } finally {
      setWorkingBookingId(null)
    }
  }

  if (loading) {
    return <LoadingBlock label={copy.loading} />
  }

  return (
    <div className="page-stack">
      <section className="surface-card section-stack">
        <header>
          <span className="section-kicker">{copy.kicker}</span>
          <h1 className="section-title">{copy.title}</h1>
          <p className="section-subtitle">{copy.subtitle}</p>
        </header>

        {message ? <div className="message-banner">{message}</div> : null}
        {error ? <div className="error-banner">{error}</div> : null}

        {bookings.length === 0 ? (
          <div className="empty-state">
            <h3>{copy.emptyTitle}</h3>
            <p>{copy.emptyDescription}</p>
          </div>
        ) : (
          <div className="booking-grid">
            {bookings.map((booking) => {
              const editable = canModifyBooking(booking)
              const rescheduleSlots = slotsByBookingId[booking.id] ?? []

              return (
                <article key={booking.id} className="booking-item">
                  <div className="booking-summary">
                    <div className="pill-row">
                      <span
                        className={
                          booking.status === 'Confirmed'
                            ? 'status-pill success'
                            : booking.status === 'Cancelled'
                              ? 'status-pill danger'
                              : 'status-pill warning'
                        }
                      >
                        {copy.status[booking.status]}
                      </span>
                      <span className="type-pill">{describeBookingOwner(booking)}</span>
                    </div>

                    <h3>{describeBookingTarget(booking)}</h3>
                    <div className="stacked-meta">
                      <div className="meta-line">
                        <span className="inline-pill">{copy.start}</span>
                        <span>{formatDateTime(booking.startAtUtc, locale)}</span>
                      </div>
                      <div className="meta-line">
                        <span className="inline-pill">{copy.end}</span>
                        <span>{formatDateTime(booking.endAtUtc, locale)}</span>
                      </div>
                      <div className="meta-line">
                        <span className="inline-pill">{copy.guests}</span>
                        <span>{booking.guestCount}</span>
                      </div>
                    </div>
                  </div>

                  {booking.cancellationReason ? (
                    <div className="info-banner">
                      {copy.reasonPrefix}: {booking.cancellationReason}
                    </div>
                  ) : null}

                  {editable ? (
                    <div className="form-stack">
                      <div className="field-group">
                        <label htmlFor={`cancel-reason-${booking.id}`}>{copy.reasonTitle}</label>
                        <input
                          id={`cancel-reason-${booking.id}`}
                          className="input-field"
                          value={cancelReasons[booking.id] ?? ''}
                          onChange={(event) =>
                            setCancelReasons((current) => ({
                              ...current,
                              [booking.id]: event.target.value,
                            }))
                          }
                          placeholder={copy.reasonPlaceholder}
                        />
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          className="danger-button"
                          disabled={workingBookingId === booking.id}
                          onClick={() => handleCancel(booking)}
                        >
                          {copy.cancelAction}
                        </button>
                      </div>

                      {booking.resourceId ? (
                        <div className="form-stack">
                          <div className="field-group">
                            <label htmlFor={`reschedule-date-${booking.id}`}>{copy.rescheduleDate}</label>
                            <input
                              id={`reschedule-date-${booking.id}`}
                              className="input-field"
                              type="date"
                              value={selectedDates[booking.id] ?? getDefaultBookingDate()}
                              onChange={(event) =>
                                setSelectedDates((current) => ({
                                  ...current,
                                  [booking.id]: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="card-actions">
                            <button
                              type="button"
                              className="ghost-button"
                              disabled={workingBookingId === booking.id}
                              onClick={() => loadRescheduleSlots(booking)}
                            >
                              {copy.loadSlots}
                            </button>
                          </div>

                          {rescheduleSlots.length > 0 ? (
                            <div className="slot-grid">
                              {rescheduleSlots.map((slot) => (
                                <button
                                  key={`${booking.id}-${slot.startAtUtc}`}
                                  type="button"
                                  className="slot-button"
                                  disabled={workingBookingId === booking.id}
                                  onClick={() => handleReschedule(booking, slot)}
                                >
                                  {formatDateTime(slot.startAtUtc, locale)}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="info-banner">{copy.eventOnlyCancel}</div>
                      )}
                    </div>
                  ) : (
                    <div className="info-banner">{copy.lockedNotice}</div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
