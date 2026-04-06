import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { persistLocale, supportedLocales, type AppLocale } from '../features/i18n/config'
import { getLocaleLabel } from '../lib/display'

interface LanguageSwitcherProps {
  currentLocale: AppLocale
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  function changeLocale(nextLocale: AppLocale) {
    const pathname = location.pathname.replace(/^\/(ru|en|vi)/, '')
    persistLocale(nextLocale)
    void i18n.changeLanguage(nextLocale)
    navigate(`/${nextLocale}${pathname}${location.search}${location.hash}`)
  }

  return (
    <div className="locale-switcher" role="group" aria-label="Переключение языка">
      {supportedLocales.map((locale) => (
        <button
          key={locale}
          className={locale === currentLocale ? 'locale-switcher__item is-active' : 'locale-switcher__item'}
          type="button"
          onClick={() => changeLocale(locale)}
        >
          {getLocaleLabel(locale)}
        </button>
      ))}
    </div>
  )
}
