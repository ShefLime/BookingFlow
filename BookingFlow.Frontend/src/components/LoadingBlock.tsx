interface LoadingBlockProps {
  label?: string
}

export function LoadingBlock({ label = 'Загрузка...' }: LoadingBlockProps) {
  return (
    <div className="loading-block">
      <div className="loading-ring" />
      <span>{label}</span>
    </div>
  )
}
