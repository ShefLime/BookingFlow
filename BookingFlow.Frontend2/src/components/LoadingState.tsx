interface LoadingStateProps {
  label: string
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <section className="state-panel">
      <div className="loading-orb" aria-hidden="true" />
      <p>{label}</p>
    </section>
  )
}
