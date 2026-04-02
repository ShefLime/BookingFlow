import { createContext, useContext, useState, type PropsWithChildren } from 'react'
import { getMessage } from './messages'
import type { Locale } from '../types/api'

const STORAGE_KEY = 'bookingflow.locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: Parameters<typeof getMessage>[1]) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function loadLocale(): Locale {
  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (rawValue === 'ru' || rawValue === 'en' || rawValue === 'vi') {
    return rawValue
  }

  return 'ru'
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => loadLocale())

  function setLocale(localeValue: Locale) {
    window.localStorage.setItem(STORAGE_KEY, localeValue)
    setLocaleState(localeValue)
  }

  const value: LocaleContextValue = {
    locale,
    setLocale,
    t(key) {
      return getMessage(locale, key)
    },
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider.')
  }

  return context
}
