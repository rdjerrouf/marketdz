'use client'

import { Link } from '@/i18n/navigation'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Settings, Bell, ChevronDown, ChevronUp } from 'lucide-react'

type FAQ = { q: string; a: string }
type Feature = { title: string; desc: string; link: string; linkText: string }

function FAQItem({ q, a }: FAQ) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white text-gray-600 leading-relaxed">{a}</div>
      )}
    </div>
  )
}

export default function HelpPage() {
  const t = useTranslations('help')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const faqs = t.raw('faqs') as FAQ[]
  const features = t.raw('features') as Feature[]

  return (
    <div className="min-h-screen bg-[#F2DA85] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link href="/" className={`inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
          <svg className={`w-5 h-5 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('back')}
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('title')}</h1>
          <p className="text-xl text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="mb-10">
          <h2 className={`text-2xl font-bold text-gray-900 mb-5 ${isRtl ? 'text-right' : ''}`}>{t('faqTitle')}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>

        <div className="mb-10">
          <h2 className={`text-2xl font-bold text-gray-900 mb-5 ${isRtl ? 'text-right' : ''}`}>{t('accountTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = index === 0 ? Settings : Bell
              return (
                <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className={`flex items-center mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={`bg-green-100 p-3 rounded-lg ${isRtl ? 'ml-4' : 'mr-4'}`}>
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className={`text-gray-600 mb-4 text-sm leading-relaxed ${isRtl ? 'text-right' : ''}`}>{feature.desc}</p>
                  <Link
                    href={feature.link}
                    className={`inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    {feature.linkText}
                    <svg className={`w-4 h-4 ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('contactTitle')}</h2>
          <p className="text-gray-600 mb-6">{t('contactDesc')}</p>
          <Link
            href="mailto:support@dlaladz.com"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            {t('contactEmail')}
          </Link>
        </div>

      </div>
    </div>
  )
}
