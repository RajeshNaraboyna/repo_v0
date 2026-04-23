import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.split('-')[0] || 'en'

  return (
    <div className="flex items-center space-x-1 border border-gray-200 rounded-lg overflow-hidden">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          title={lang.label}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            current === lang.code
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {lang.nativeLabel}
        </button>
      ))}
    </div>
  )
}
