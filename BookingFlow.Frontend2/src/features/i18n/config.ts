export const supportedLocales = ['ru', 'en', 'vi'] as const

export type AppLocale = (typeof supportedLocales)[number]

export const localeStorageKey = 'bookingflow-locale'

export function isSupportedLocale(value: string | undefined): value is AppLocale {
  return typeof value === 'string' && supportedLocales.includes(value as AppLocale)
}

export function detectPreferredLocale(): AppLocale {
  const persisted = window.localStorage.getItem(localeStorageKey) ?? undefined
  if (isSupportedLocale(persisted)) {
    return persisted
  }

  const browserLocale = navigator.language.toLowerCase()

  if (browserLocale.startsWith('vi')) {
    return 'vi'
  }

  if (browserLocale.startsWith('en')) {
    return 'en'
  }

  return 'ru'
}

export function persistLocale(locale: AppLocale) {
  window.localStorage.setItem(localeStorageKey, locale)
}
