import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.split('-')[0] || 'en'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0]

  return (
    <div ref={ref} className="relative inline-block">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 text-xs font-medium rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-primary-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{currentLang.nativeLabel}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-gray-100 bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                current === lang.code
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {current === lang.code && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {current !== lang.code && <span className="w-3 shrink-0" />}
              {lang.nativeLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
