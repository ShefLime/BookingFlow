import { useEffect } from 'react'
import { supportedLocales } from '../features/i18n/config'
import { buildCanonicalUrl, buildHreflangEntries } from '../lib/seo'

interface SeoMetaProps {
  title: string
  description: string
}

function upsertMeta(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.name = name
    document.head.appendChild(tag)
  }

  tag.content = content
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`

  let tag = document.head.querySelector<HTMLLinkElement>(selector)

  if (!tag) {
    tag = document.createElement('link')
    tag.rel = rel

    if (hreflang) {
      tag.hreflang = hreflang
    }

    document.head.appendChild(tag)
  }

  tag.href = href
}

export function SeoMeta({ title, description }: SeoMetaProps) {
  useEffect(() => {
    document.title = title
    upsertMeta('description', description)
    upsertLink('canonical', buildCanonicalUrl(window.location.pathname))

    for (const alternate of buildHreflangEntries(
      window.location.pathname.replace(/^\/(ru|en|vi)/, ''),
      [...supportedLocales],
    )) {
      upsertLink('alternate', alternate.href, alternate.locale)
    }
  }, [description, title])

  return null
}
