const organizationTypeLabels: Record<string, string> = {
  FitnessClub: 'Фитнес-клуб',
  Bar: 'Бар',
  NightClub: 'Ночной клуб',
  EventVenue: 'Площадка',
  Restaurant: 'Ресторан',
  SportsCenter: 'Спортивный центр',
  Other: 'Другое',
  BeautySalon: 'Салон красоты',
  WellnessStudio: 'Велнес-студия',
  SportsComplex: 'Спортивный комплекс',
  YogaStudio: 'Йога-студия',
  DanceStudio: 'Танцевальная студия',
}

const resourceTypeLabels: Record<string, string> = {
  Trainer: 'Тренер',
  Table: 'Столик',
  Room: 'Комната',
  Court: 'Корт',
  Hall: 'Зал',
  ServiceSpot: 'Услуга',
  VipTable: 'VIP-столик',
}

const localeLabels: Record<string, string> = {
  ru: 'Рус',
  en: 'Анг',
  vi: 'Вьет',
}

const roleLabels: Record<string, string> = {
  Admin: 'Администратор',
  Manager: 'Менеджер',
  Provider: 'Исполнитель',
  Client: 'Клиент',
}

const moderationStatusLabels: Record<string, string> = {
  PendingApproval: 'На проверке',
  Approved: 'Одобрено',
  Rejected: 'Отклонено',
}

const bookingStatusLabels: Record<string, string> = {
  Pending: 'Ожидает подтверждения',
  Confirmed: 'Подтверждено',
  Cancelled: 'Отменено',
  Completed: 'Завершено',
  Expired: 'Истекло',
}

const providerJoinRequestStatusLabels: Record<string, string> = {
  Pending: 'На рассмотрении',
  Approved: 'Одобрено',
  Rejected: 'Отклонено',
}

const seededContentReplacements: Array<[string | RegExp, string]> = [
  [
    /Padel center with courts, recovery rooms and weekly community sessions\./gi,
    'Падел-центр с кортами, зоной восстановления и регулярными клубными событиями.',
  ],
  [
    /Indoor panoramic court for fast-paced doubles matches\./gi,
    'Крытый панорамный корт для динамичных парных матчей.',
  ],
  [
    /Club court with softer evening lights and premium rackets\./gi,
    'Клубный корт с вечерним светом и ракетками премиального уровня.',
  ],
  [
    /Post-match mobility room with guided recovery slots\./gi,
    'Комната восстановления после матча с короткими guided-сессиями.',
  ],
  [
    /District 2 mobile sessions/gi,
    'Выездные сессии в районе District 2',
  ],
  [
    /My Khe Beach, Da Nang/gi,
    'Пляж My Khe, Дананг',
  ],
  [/private-ужинов/gi, 'закрытых ужинов'],
  [/live-сетов/gi, 'живых сетов'],
  [/\bJazz night\b/g, 'джазовые вечера'],
  [/\b1:1 coaching\b/gi, 'персональный коучинг'],
  [/mobility-сессии/gi, 'сессии по мобильности'],
  [/\bworkshop(?:ы|s)?\b/gi, 'воркшопы'],
  [/\bprivate room\b/gi, 'закрытый зал'],
  [/\bcoaching\b/gi, 'тренировки'],
  [/\bbreathwork\b/gi, 'дыхательные практики'],
  [/\brecovery\b/gi, 'восстановление'],
  [/\bcommunity nights\b/gi, 'вечера сообщества'],
  [/\bchef tasting\b/gi, 'дегустации от шефа'],
  [/\bindoor\b/gi, 'крытый'],
  [/\bpost-match\b/gi, 'после матча'],
  [/\bclub court\b/gi, 'клубный корт'],
  [/\bmobility\b/gi, 'мобильность'],
  [/Тренировки с coach/gi, 'Тренировки с тренером'],
  [/Частный тренер по пилатесу и мобильность/gi, 'Частный тренер по пилатесу и мобильности'],
  [/дыхательные практики с рассветными практиками/gi, 'дыхательные практики с занятиями на рассвете'],
]

export function getOrganizationTypeLabel(type: string) {
  return organizationTypeLabels[type] ?? type
}

export function getResourceTypeLabel(type: string) {
  return resourceTypeLabels[type] ?? type
}

export function getLocaleLabel(locale: string) {
  return localeLabels[locale] ?? locale.toUpperCase()
}

export function getRoleLabel(role: string) {
  return roleLabels[role] ?? role
}

export function getUserDisplayName(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  if (fullName && !/^[\d\s]+$/.test(fullName)) {
    return fullName
  }

  if (email) {
    return email.split('@')[0]
  }

  return 'Пользователь'
}

export function getModerationStatusLabel(status: string) {
  return moderationStatusLabels[status] ?? status
}

export function getBookingStatusLabel(status: string) {
  return bookingStatusLabels[status] ?? status
}

export function getProviderJoinRequestStatusLabel(status: string) {
  return providerJoinRequestStatusLabels[status] ?? status
}

export function normalizeSeededContent(value: string) {
  return seededContentReplacements.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value,
  )
}

export function formatPriceFrom(value?: number | null) {
  if (value === undefined || value === null) {
    return null
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}
