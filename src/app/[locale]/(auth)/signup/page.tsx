'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { ALGERIA_WILAYAS, getLocalizedName } from '@/lib/constants/algeria'
import { isValidEmail, isValidAlgerianPhone } from '@/lib/utils'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone: string
  wilaya: string
  city: string
  bio: string
}

interface FormErrors {
  [key: string]: string
}

export default function SignUpPage() {
  const router = useRouter()
  const t = useTranslations('auth.signUp')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    wilaya: '',
    city: '',
    bio: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  
  // Get cities for selected wilaya
  const selectedWilaya = ALGERIA_WILAYAS.find(w => w.code === formData.wilaya)
  const availableCities = selectedWilaya ? selectedWilaya.cities : []

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = t('errors.emailRequired')
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t('errors.emailInvalid')
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired')
    } else if (formData.password.length < 6) {
      newErrors.password = t('errors.passwordTooShort')
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordMismatch')
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('errors.firstNameRequired')
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('errors.lastNameRequired')
    }

    // Phone validation (optional but if provided must be valid)
    if (formData.phone && !isValidAlgerianPhone(formData.phone)) {
      newErrors.phone = t('errors.invalidPhone')
    }

    // Location validation
    if (!formData.wilaya) {
      newErrors.wilaya = t('errors.provinceRequired')
    }
    if (!formData.city) {
      newErrors.city = t('errors.cityRequired')
    }

    return newErrors
  }

  // Handle resend verification email
  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      })

      const result = await response.json()

      if (!response.ok) {
        setResendMessage(result.error || t('resendFailed'))
        return
      }

      setResendMessage(t('resendSuccess'))
    } catch (error) {
      console.error('Resend email error:', error)
      setResendMessage(t('errors.generic'))
    } finally {
      setIsResending(false)
    }
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Reset city when wilaya changes
    if (name === 'wilaya') {
      setFormData(prev => ({ ...prev, city: '' }))
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
      // Send signup request to API route
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          wilaya: formData.wilaya,
          city: formData.city,
          bio: formData.bio || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error.includes('already registered') || result.error.includes('User already registered')) {
          setErrors({ email: t('errors.emailExists') })
        } else {
          setErrors({ general: result.error })
        }
        return
      }

      // Success - show verification message
      if (result.requiresVerification) {
        setUserEmail(formData.email)
        setShowVerificationMessage(true)
      } else {
        // Fallback: redirect to sign in if no verification required
        router.push('/signin')
      }

    } catch (error) {
      console.error('Sign up error:', error)
      setErrors({ general: t('errors.generic') })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06402B] relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:4s]"></div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[
            { left: 'left-[10%]', top: 'top-[20%]', opacity: 'opacity-10' },
            { left: 'left-[25%]', top: 'top-[15%]', opacity: 'opacity-20' },
            { left: 'left-[40%]', top: 'top-[30%]', opacity: 'opacity-30' },
            { left: 'left-[60%]', top: 'top-[10%]', opacity: 'opacity-40' },
            { left: 'left-[80%]', top: 'top-[25%]', opacity: 'opacity-50' }
          ].map((particle, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-white/10 rounded-full animate-pulse ${particle.left} ${particle.top} ${particle.opacity}`}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back button */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-white/80 hover:text-white transition-colors duration-200"
          >
            <svg className={`w-4 h-4 me-2 ${isRtl ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {tCommon('back')}
          </Link>
        </div>

        <h1 className="text-center text-3xl font-bold text-white mb-2">
          {tCommon('appName')}
        </h1>
        <h2 className="text-center text-xl text-white/80">
          {showVerificationMessage ? t('verifyEmail') : t('title')}
        </h2>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

          {/* Verification Message */}
          {showVerificationMessage ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('verifyEmailTitle')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('verifyEmailIntro')}
              </p>
              <p className="text-sm font-medium text-gray-900 mb-6">
                {userEmail}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-sm text-blue-800">
                  {t('verifyEmailInstructions')}
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  href="/signin"
                  className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('goToSignIn')}
                </Link>
                <button
                  onClick={() => setShowVerificationMessage(false)}
                  className="block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('backToSignUp')}
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                {t('verifyEmailSpamHint')}
              </p>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className={`text-sm font-medium ${
                    isResending
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-500'
                  }`}
                >
                  {isResending ? t('resending') : t('resendEmail')}
                </button>
                {resendMessage && (
                  <p className={`mt-2 text-sm ${
                    resendMessage.includes('sent')
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('email')} *
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                dir="ltr"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('emailPlaceholder')}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('password')} *
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
                  placeholder={t('passwordPlaceholder')}
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
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('confirmPassword')} *
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('confirmPasswordPlaceholder')}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  {t('firstName')} *
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  {t('lastName')} *
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {t('phone')}
                <span className="text-xs text-gray-500 ms-2">- {t('phoneHint')}</span>
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                dir="ltr"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('phonePlaceholder')}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              <p className="mt-1 text-xs text-gray-500">
                {t('phoneFormat')}
              </p>
            </div>

            {/* Wilaya */}
            <div>
              <label htmlFor="wilaya" className="block text-sm font-medium text-gray-700">
                {t('province')} *
              </label>
              <select
                name="wilaya"
                id="wilaya"
                value={formData.wilaya}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.wilaya ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">{t('selectProvince')}</option>
                {ALGERIA_WILAYAS.map(wilaya => (
                  <option key={wilaya.code} value={wilaya.code}>
                    {wilaya.code} - {getLocalizedName(wilaya, locale)}
                  </option>
                ))}
              </select>
              {errors.wilaya && <p className="mt-1 text-sm text-red-600">{errors.wilaya}</p>}
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                {t('city')} *
              </label>
              <select
                name="city"
                id="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!formData.wilaya}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                } ${!formData.wilaya ? 'bg-gray-100' : ''}`}
              >
                <option value="">{t('selectCity')}</option>
                {availableCities.map(city => (
                  <option key={city.name} value={city.name}>
                    {getLocalizedName(city, locale)}
                  </option>
                ))}
              </select>
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                {t('bio')}
              </label>
              <textarea
                name="bio"
                id="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('bioPlaceholder')}
              />
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
          )}

          {!showVerificationMessage && (
            <div className="mt-6">
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  {t('hasAccount')}{' '}
                  <Link
                    href="/signin"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {t('signIn')}
                  </Link>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}