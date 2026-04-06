import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { supportedLocales, type AppLocale } from '../features/i18n/config'
import { getLocaleLabel } from '../lib/display'

interface LocalizedFieldBlockProps<TForm extends FieldValues> {
  title: string
  fields: Array<{
    label: string
    nameByLocale: Record<AppLocale, Path<TForm>>
    multiline?: boolean
    rows?: number
  }>
  register: UseFormRegister<TForm>
}

export function LocalizedFieldBlock<TForm extends FieldValues>({
  title,
  fields,
  register,
}: LocalizedFieldBlockProps<TForm>) {
  const blockId = useId()
  const { t } = useTranslation()
  const [activeLocale, setActiveLocale] = useState<AppLocale>('ru')

  return (
    <section className="form-card">
      <div className="form-card__header">
        <div>
          <p className="workspace-card__label">{t('forms.localized')}</p>
          <h3>{title}</h3>
        </div>

        <div className="locale-switcher" role="tablist" aria-label={title}>
          {supportedLocales.map((locale) => (
            <button
              key={`${blockId}-${locale}`}
              className={locale === activeLocale ? 'locale-switcher__item is-active' : 'locale-switcher__item'}
              type="button"
              onClick={() => setActiveLocale(locale)}
            >
              {getLocaleLabel(locale)}
            </button>
          ))}
        </div>
      </div>

      <div className="form-grid">
        {fields.map((field) => (
          <label key={`${blockId}-${field.label}`} className="field-group">
            <span>{field.label}</span>
            {field.multiline ? (
              <textarea
                className="textarea-field"
                rows={field.rows ?? 4}
                {...register(field.nameByLocale[activeLocale])}
              />
            ) : (
              <input className="text-field" {...register(field.nameByLocale[activeLocale])} />
            )}
          </label>
        ))}
      </div>
    </section>
  )
}
