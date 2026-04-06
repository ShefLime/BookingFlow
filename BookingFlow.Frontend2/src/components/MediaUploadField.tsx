import { useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'

interface MediaUploadFieldProps {
  token: string
  folder: string
  label: string
  value?: string
  onChange: (url: string) => void
}

export function MediaUploadField({
  token,
  folder,
  label,
  value,
  onChange,
}: MediaUploadFieldProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => api.media.uploadMedia(file, folder, token),
    onSuccess: (result) => {
      onChange(result.url)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
  })

  return (
    <div className="media-upload-field">
      <div className="media-upload-field__header">
        <label className="field-group">
          <span>{label}</span>
          <input
            className="text-field"
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
        <div className="media-upload-field__actions">
          <input
            ref={inputRef}
            className="media-upload-field__input"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }

              uploadMutation.mutate(file)
            }}
          />
          <button
            className="secondary-button"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? t('states.loading') : t('actions.uploadMedia')}
          </button>
        </div>
      </div>
      {uploadMutation.isError ? (
        <p className="booking-notice">{uploadMutation.error.message}</p>
      ) : null}
      {value ? (
        <a className="workspace-card__label" href={value} target="_blank" rel="noreferrer">
          {t('actions.openUploadedMedia')}
        </a>
      ) : null}
    </div>
  )
}
