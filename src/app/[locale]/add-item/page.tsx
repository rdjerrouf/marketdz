// src/app/[locale]/add-item/page.tsx
'use client'

import { useRouter } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
}

export default function AddItemPage() {
  const router = useRouter()
  const t = useTranslations('addItem')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPWA, setIsPWA] = useState(false)

  // Detect if running as PWA
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSPWA = 'standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true
      setIsPWA(isStandalone || isIOSPWA)
    }
    checkPWA()
  }, [])

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication for add-item page...')
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )
        
        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ])

        const { data: { session }, error: sessionError } = result as Awaited<typeof sessionPromise>
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          router.push('/signin?redirect=/add-item')
          return
        }
        
        if (!session) {
          console.log('❌ No session found, redirecting to signin')
          router.push('/signin?redirect=/add-item')
          return
        }

        console.log('✅ Session found for user:', session.user.id)

        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.warn('⚠️ Profile fetch error (will use basic info):', error)
          // Even if profile fetch fails, we can still allow user to proceed with basic info
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            first_name: '',
            last_name: ''
          })
        } else if (profile) {
          console.log('✅ Profile loaded:', profile.first_name, profile.last_name)
          setUser({
            id: profile.id,
            email: session.user.email || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          })
        }
      } catch (error) {
        console.error('❌ Authentication check failed:', error)
        if (error instanceof Error && error.message === 'Session check timeout') {
          console.error('❌ Authentication check timed out - possible Docker connectivity issue')
          alert('Authentication check timed out. Please try refreshing the page or check your connection.')
        }
        router.push('/signin?redirect=/add-item')
      } finally {
        console.log('✅ Setting loading to false')
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const categories = [
    { id: 'for_sale', title: t('categories.forSale'), description: t('categories.forSaleDesc'), subtitle: t('categories.forSaleSubtitle'), icon: '🛒', color: 'from-blue-400 to-blue-600' },
    { id: 'for_rent', title: t('categories.forRent'), description: t('categories.forRentDesc'), subtitle: t('categories.forRentSubtitle'), icon: '🏠', color: 'from-green-400 to-green-600' },
    { id: 'job', title: t('categories.job'), description: t('categories.jobDesc'), subtitle: t('categories.jobSubtitle'), icon: '💼', color: 'from-purple-400 to-purple-600' },
    { id: 'service', title: t('categories.service'), description: t('categories.serviceDesc'), subtitle: t('categories.serviceSubtitle'), icon: '🔧', color: 'from-orange-400 to-orange-600' },
    { id: 'urgent', title: t('categories.urgent'), description: t('categories.urgentDesc'), subtitle: t('categories.urgentSubtitle'), icon: '🚨', color: 'from-red-500 to-red-700' }
  ]

  const handleCategorySelect = (categoryId: string) => {
    router.push(`/add-item/${categoryId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center text-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4F2] relative overflow-hidden">
      <div className="relative z-10">

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8 pb-24 md:pb-8">
        {/* Top bar: back + logo */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-800 hover:text-gray-900 transition-colors group"
            >
              <svg className={`w-5 h-5 me-2 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">{tCommon('back')}</span>
            </button>
            <div className="flex items-center">
              <img src="/icons/icon-192x192.png" alt="DlalaDZ" className="w-9 h-9 rounded-lg me-2" />
              <h1 className="text-gray-900 text-lg font-bold">DlalaDZ</h1>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            ✨ {t('createTitle')}
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            {t('createSubtitle')}
          </p>
          <p className="text-gray-600">
            {t('selectCategory')}
          </p>
        </div>

        {/* Category Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="group relative bg-white backdrop-blur-lg hover:bg-gray-50 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border border-gray-200 hover:border-gray-300"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-30 rounded-2xl transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative z-10 text-center">
                  <div className="text-6xl mb-4">
                    {category.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {category.title}
                  </h3>

                  <p className="text-gray-700 mb-2 font-medium">
                    {category.description}
                  </p>

                  <p className="text-gray-600 italic text-sm">
                    {category.subtitle}
                  </p>

                  {/* Arrow Icon */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className={`w-6 h-6 text-gray-700 mx-auto ${isRtl ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
      </div>
    </div>
  )
}