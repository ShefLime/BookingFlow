import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { getMessage } from './messages'
import type { Locale } from '../types/api'

const STORAGE_KEY = 'bookingflow.locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function loadLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'ru'
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (rawValue === 'ru' || rawValue === 'en' || rawValue === 'vi') {
    return rawValue
  }

  const browserLocale = window.navigator.language.toLowerCase()
  if (browserLocale.startsWith('vi')) {
    return 'vi'
  }

  if (browserLocale.startsWith('en')) {
    return 'en'
  }

  return 'ru'
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => loadLocale())

  function setLocale(localeValue: Locale) {
    window.localStorage.setItem(STORAGE_KEY, localeValue)
    setLocaleState(localeValue)
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t(key) {
        return getMessage(locale, key)
      },
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider.')
  }

  return context
}
