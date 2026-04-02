import type {
  Booking,
  DayOfWeekName,
  Locale,
  LocalizedStringCollectionSet,
  LocalizedTextSet,
  ModerationStatus,
  OrganizationType,
  ResourceType,
  UserRole,
} from '../types/api'

function toIntlLocale(locale: Locale) {
  const locales: Record<Locale, string> = {
    ru: 'ru-RU',
    en: 'en-US',
    vi: 'vi-VN',
  }

  return locales[locale]
}

export function formatDateTime(value: string, locale: Locale = 'ru') {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDate(value: string, locale: Locale = 'ru') {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function toDateTimeLocalValue(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export function getDefaultBookingDate() {
  const date = new Date()
  date.setDate(date.getDate() + 2)
  return toDateInputValue(date)
}

export function getDefaultEventDateTime(daysAhead: number, hours: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  date.setHours(hours, 0, 0, 0)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export function pickLocalizedText(value: LocalizedTextSet | undefined, locale: Locale, fallback?: string) {
  if (!value) {
    return fallback ?? ''
  }

  return value[locale] ?? value.ru ?? value.en ?? value.vi ?? fallback ?? ''
}

export function pickLocalizedList(
  value: LocalizedStringCollectionSet | undefined,
  locale: Locale,
) {
  if (!value) {
    return []
  }

  const localized = value[locale]
  if (localized && localized.length > 0) {
    return localized
  }

  return value.ru.length > 0 ? value.ru : value.en.length > 0 ? value.en : value.vi
}

export function formatOrganizationType(type: OrganizationType, locale: Locale = 'ru') {
  const labels: Record<Locale, Record<OrganizationType, string>> = {
    ru: {
      FitnessClub: 'Фитнес-клуб',
      Bar: 'Бар',
      NightClub: 'Ночной клуб',
      EventVenue: 'Площадка',
      Restaurant: 'Ресторан',
      SportsCenter: 'Спортивный центр',
      Other: 'Другое',
    },
    en: {
      FitnessClub: 'Fitness club',
      Bar: 'Bar',
      NightClub: 'Night club',
      EventVenue: 'Venue',
      Restaurant: 'Restaurant',
      SportsCenter: 'Sports center',
      Other: 'Other',
    },
    vi: {
      FitnessClub: 'CLB the hinh',
      Bar: 'Bar',
      NightClub: 'Night club',
      EventVenue: 'Dia diem su kien',
      Restaurant: 'Nha hang',
      SportsCenter: 'Trung tam the thao',
      Other: 'Khac',
    },
  }

  return labels[locale][type]
}

export function formatResourceType(type: ResourceType, locale: Locale = 'ru') {
  const labels: Record<Locale, Record<ResourceType, string>> = {
    ru: {
      Trainer: 'Тренер',
      Table: 'Столик',
      Room: 'Комната',
      Court: 'Корт',
      Hall: 'Зал',
      ServiceSpot: 'Сервисная точка',
      VipTable: 'VIP-столик',
    },
    en: {
      Trainer: 'Coach',
      Table: 'Table',
      Room: 'Room',
      Court: 'Court',
      Hall: 'Hall',
      ServiceSpot: 'Service spot',
      VipTable: 'VIP table',
    },
    vi: {
      Trainer: 'Huong dan vien',
      Table: 'Ban',
      Room: 'Phong',
      Court: 'San',
      Hall: 'Hoi truong',
      ServiceSpot: 'Diem dich vu',
      VipTable: 'Ban VIP',
    },
  }

  return labels[locale][type]
}

export function formatDayOfWeek(day: DayOfWeekName, locale: Locale = 'ru') {
  const labels: Record<Locale, Record<DayOfWeekName, string>> = {
    ru: {
      Sunday: 'Воскресенье',
      Monday: 'Понедельник',
      Tuesday: 'Вторник',
      Wednesday: 'Среда',
      Thursday: 'Четверг',
      Friday: 'Пятница',
      Saturday: 'Суббота',
    },
    en: {
      Sunday: 'Sunday',
      Monday: 'Monday',
      Tuesday: 'Tuesday',
      Wednesday: 'Wednesday',
      Thursday: 'Thursday',
      Friday: 'Friday',
      Saturday: 'Saturday',
    },
    vi: {
      Sunday: 'Chu nhat',
      Monday: 'Thu hai',
      Tuesday: 'Thu ba',
      Wednesday: 'Thu tu',
      Thursday: 'Thu nam',
      Friday: 'Thu sau',
      Saturday: 'Thu bay',
    },
  }

  return labels[locale][day]
}

export function canModifyBooking(booking: Booking) {
  return getHoursUntil(booking.startAtUtc) >= 24 && booking.status === 'Confirmed'
}

export function getHoursUntil(value: string) {
  return (new Date(value).getTime() - Date.now()) / 3_600_000
}

export function describeBookingTarget(booking: Booking) {
  return booking.resourceName ?? booking.eventName ?? 'Бронирование'
}

export function describeBookingOwner(booking: Booking) {
  return booking.organizationName ?? booking.providerDisplayName ?? 'BookingFlow'
}

export function formatModerationStatus(status: ModerationStatus, locale: Locale = 'ru') {
  const labels: Record<Locale, Record<ModerationStatus, string>> = {
    ru: {
      PendingApproval: 'На модерации',
      Approved: 'Одобрено',
      Rejected: 'Отклонено',
    },
    en: {
      PendingApproval: 'Pending approval',
      Approved: 'Approved',
      Rejected: 'Rejected',
    },
    vi: {
      PendingApproval: 'Dang cho duyet',
      Approved: 'Da duyet',
      Rejected: 'Da tu choi',
    },
  }

  return labels[locale][status]
}

export function formatUserRole(role: UserRole, locale: Locale = 'ru') {
  const labels: Record<Locale, Record<UserRole, string>> = {
    ru: {
      Client: 'Клиент',
      Provider: 'Исполнитель',
      Admin: 'Администратор',
      Manager: 'Менеджер',
    },
    en: {
      Client: 'Client',
      Provider: 'Provider',
      Admin: 'Admin',
      Manager: 'Manager',
    },
    vi: {
      Client: 'Khach hang',
      Provider: 'Nha cung cap',
      Admin: 'Quan tri vien',
      Manager: 'Quan ly',
    },
  }

  return labels[locale][role]
}

const rolePriority: UserRole[] = ['Admin', 'Manager', 'Provider', 'Client']

export function getPrimaryRole(roles: UserRole[]) {
  return rolePriority.find((role) => roles.includes(role)) ?? null
}

export function getDashboardPath(roles: UserRole[]) {
  if (roles.includes('Admin') || roles.includes('Manager')) {
    return '/admin'
  }

  return '/bookings'
}
