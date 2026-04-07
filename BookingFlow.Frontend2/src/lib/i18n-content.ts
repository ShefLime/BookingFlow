import type { AppLocale } from '../features/i18n/config'
import type { LocalizedStringCollectionSet, LocalizedTextSet } from '../types/api'

const fallbackOrder: AppLocale[] = ['en', 'ru', 'vi']

export function resolveLocalizedText(value: LocalizedTextSet | null | undefined, locale: AppLocale) {
  if (!value) {
    return ''
  }

  const candidates = [value[locale], ...fallbackOrder.map((key) => value[key])]

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim()
    }
  }

  return ''
}

export const pickLocalizedText = resolveLocalizedText

export function resolveLocalizedCollection(
  value: LocalizedStringCollectionSet | null | undefined,
  locale: AppLocale,
) {
  if (!value) {
    return []
  }

  const candidates = [value[locale], ...fallbackOrder.map((key) => value[key])]

  for (const candidate of candidates) {
    if (candidate && candidate.length > 0) {
      return candidate
    }
  }

  return []
}

export const pickLocalizedList = resolveLocalizedCollection
