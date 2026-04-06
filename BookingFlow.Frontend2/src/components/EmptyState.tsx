import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  to?: string
  action?: () => void
}

export function EmptyState({ title, description, actionLabel, to, action }: EmptyStateProps) {
  return (
    <section className="state-panel">
      <p className="eyebrow">BookingFlow</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && to ? (
        <Link className="secondary-button" to={to}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && action ? (
        <button className="secondary-button" type="button" onClick={action}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}
