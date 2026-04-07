import type { AppLocale } from '../features/i18n/config'

export interface SeoDescriptor {
  title: string
  description: string
  canonicalPath: string
}

export function buildSeoDescriptor(input: SeoDescriptor) {
  return input
}

export function buildCanonicalUrl(canonicalPath: string) {
  return `${window.location.origin}${canonicalPath}`
}

export function buildHreflangEntries(canonicalPath: string, locales: AppLocale[]) {
  return locales.map((locale) => ({
    locale,
    href: buildCanonicalUrl(`/${locale}${canonicalPath}`),
  }))
}
