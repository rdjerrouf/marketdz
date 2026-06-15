'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

interface FormData {
  password: string
  confirmPassword: string
}

interface FormErrors {
  [key: string]: string
}

function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth.resetPassword')
  const tCommon = useTranslations('common')
  
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Check if we have the required tokens from the URL
  const accessToken = searchParams?.get('access_token')
  const refreshToken = searchParams?.get('refresh_token')
  const type = searchParams?.get('type')

  useEffect(() => {
    // If we don't have the required tokens, redirect to forgot password
    if (!accessToken || !refreshToken || type !== 'recovery') {
      router.push('/forgot-password')
    }
  }, [accessToken, refreshToken, type, router])

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired')
    } else if (formData.password.length < 8) {
      newErrors.password = t('errors.passwordTooShort')
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.confirmRequired')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordMismatch')
    }

    return newErrors
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Send password update request to API route
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
          accessToken,
          refreshToken
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrors({ general: result.error })
        return
      }

      // Success
      setIsSuccess(true)

    } catch (error) {
      console.error('Password update error:', error)
      setErrors({ general: t('errors.generic') })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading if we're checking tokens
  if (!accessToken || !refreshToken || type !== 'recovery') {
    return (
      <div className="min-h-screen bg-[#F5F4F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">{t('verifyingLink')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
            {tCommon('appName')}
          </h1>
          <h2 className="text-center text-xl text-gray-600">
            {t('successTitle')}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('successTitle')}
              </h3>

              <p className="text-sm text-gray-600 mb-6">
                {t('successBody')}
              </p>

              <Link
                href="/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('signIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
          {tCommon('appName')}
        </h1>
        <h2 className="text-center text-xl text-gray-600">
          {t('title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full ps-3 pe-20 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('newPasswordPlaceholder')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-sm text-gray-600"
                >
                  {showPassword ? t('hidePassword') : t('showPassword')}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <p className="mt-1 text-xs text-gray-500">
                {t('minLength')}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full ps-3 pe-20 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-sm text-gray-600"
                >
                  {showConfirmPassword ? t('hidePassword') : t('showPassword')}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoading ? t('submitting') : t('submit')}
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <Link
              href="/signin"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {t('backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F4F2] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  )
}
