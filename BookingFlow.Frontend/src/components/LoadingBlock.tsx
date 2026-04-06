import { useLocale } from '../i18n/LocaleContext'

interface LoadingBlockProps {
  label?: string
}

export function LoadingBlock({ label }: LoadingBlockProps) {
  const { t } = useLocale()

  return (
    <div className="loading-block">
      <div className="loading-ring" />
      <span>{label ?? `${t('common.loadingShort')}...`}</span>
    </div>
  )
}
