import type { PropsWithChildren } from 'react'

export function HeroSection({
  imageUrl,
  imageAlt = '',
  children,
}: PropsWithChildren<{
  imageUrl?: string | null
  imageAlt?: string
}>) {
  return (
    <section className="immersive-hero">
      {imageUrl ? (
        <img
          className="immersive-hero-media"
          src={imageUrl}
          alt={imageAlt}
          loading="eager"
          decoding="async"
        />
      ) : null}
      <div className="immersive-hero-backdrop" aria-hidden="true" />
      <div className="immersive-overlay">{children}</div>
    </section>
  )
}
