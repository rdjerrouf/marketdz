'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'

type Subsection = { h: string; items?: string[]; p?: string }
type Section = {
  h: string
  p?: string
  pre?: string
  items?: string[]
  subsections?: Subsection[]
  contact?: { email: string; address: string }
}

function PolicySection({ section, isRtl }: { section: Section; isRtl: boolean }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{section.h}</h2>
      {section.p && <p className="text-gray-600 mb-4">{section.p}</p>}
      {section.pre && <p className="text-gray-600 mb-2">{section.pre}</p>}
      {section.subsections?.map((sub, i) => (
        <div key={i}>
          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">{sub.h}</h3>
          {sub.p && <p className="text-gray-600 mb-4">{sub.p}</p>}
          {sub.items && (
            <ul className={`list-disc text-gray-600 mb-4 space-y-1 ${isRtl ? 'list-inside pr-0' : 'list-inside'}`}>
              {sub.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          )}
        </div>
      ))}
      {section.items && (
        <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
          {section.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
      {section.contact && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
          <p className="text-gray-700 mb-2"><strong>Email:</strong> {section.contact.email}</p>
          <p className="text-gray-700"><strong>{isRtl ? 'العنوان' : 'Adresse'}:</strong> {section.contact.address}</p>
        </div>
      )}
    </div>
  )
}

export default function PrivacyPage() {
  const t = useTranslations('privacy')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const sections = t.raw('sections') as Section[]

  return (
    <div className="min-h-screen bg-[#F5F4F2] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className={`inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
          <svg className={`w-5 h-5 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('back')}
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('title')}</h1>
          <p className="text-sm text-gray-500 mb-8">{t('updated')}</p>
          <div className={`prose prose-lg max-w-none ${isRtl ? 'text-right' : ''}`}>
            {sections.map((section, i) => (
              <PolicySection key={i} section={section} isRtl={isRtl} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
