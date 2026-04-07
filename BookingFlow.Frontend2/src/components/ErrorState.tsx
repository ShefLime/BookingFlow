interface ErrorStateProps {
  title: string
  description: string
  actionLabel: string
  onRetry: () => void
}

export function ErrorState({ title, description, actionLabel, onRetry }: ErrorStateProps) {
  return (
    <section className="state-panel state-panel--error">
      <p className="eyebrow">BookingFlow</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="secondary-button" type="button" onClick={onRetry}>
        {actionLabel}
      </button>
    </section>
  )
}
