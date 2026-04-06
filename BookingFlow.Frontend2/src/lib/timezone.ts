import type { Locale } from '../types/api'

const localeMap: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  vi: 'vi-VN',
}

function toIntlLocale(locale: Locale) {
  return localeMap[locale]
}

export function formatUtcInTimeZone(value: string | Date, timeZone: string, locale: Locale = 'ru') {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(value))
}

export function formatCurrentTimeInTimeZone(timeZone: string, locale: Locale = 'ru') {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date())
}

export function formatTimeRangeInTimeZone(
  startAtUtc: string | Date,
  endAtUtc: string | Date,
  timeZone: string,
  locale: Locale = 'ru',
) {
  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  })

  return `${formatter.format(new Date(startAtUtc))} - ${formatter.format(new Date(endAtUtc))}`
}

export function getDateInputValueInTimeZone(timeZone: string, daysFromNow = 0) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)
  return formatDateInputInTimeZone(date, timeZone)
}

export function formatDateInputInTimeZone(value: string | Date, timeZone: string) {
  const date = new Date(value)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  })

  return formatter.format(date)
}

export function toUtcIso(value: string | Date) {
  return new Date(value).toISOString()
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
