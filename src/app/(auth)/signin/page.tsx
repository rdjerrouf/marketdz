'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { isValidEmail } from '@/lib/utils'
import { signIn } from './actions'
import PWAInstallButton from '@/components/PWAInstallButton'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  [key: string]: string
}

function SignInPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const successMessage = searchParams?.get('message')
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        router.replace('/signin')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, router])

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
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
      // Use server action to sign in (sets HTTP cookies)
      console.log('🔑 Signin: Attempting server-side authentication for:', formData.email)

      const form = new FormData()
      form.append('email', formData.email)
      form.append('password', formData.password)
      form.append('redirect', searchParams?.get('redirect') || '/')

      const result = await signIn(form)

      if (result?.error) {
        console.log('🔑 Signin: Authentication error:', result.error)
        if (result.error.includes('Invalid login credentials')) {
          setErrors({ general: 'Incorrect email or password.' })
        } else {
          setErrors({ general: result.error })
        }
        return
      }

      if (result?.success) {
        console.log('🔑 Signin: Authentication successful, redirecting to:', result.redirectTo)
        setIsRedirecting(true)
        // Use window.location.href to ensure cookies are sent with next request
        window.location.href = result.redirectTo
        return
      }

    } catch (error: unknown) {
      console.error('Sign in error:', error)
      setErrors({ general: 'An error occurred. Please try again.' })
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
        {/* Back button and PWA Install */}
        <div className="mb-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-white/80 hover:text-white transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <PWAInstallButton variant="compact" />
        </div>
        
        <h1 className="text-center text-3xl font-bold text-white mb-2">
          MarketDZ
        </h1>
        <h2 className="text-center text-xl text-white/80">
          Sign In
        </h2>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Success message from sign up */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="your@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || isRedirecting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading || isRedirecting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isRedirecting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Login successful! Redirecting...
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </Link>
            </div>
            
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  href="/signup" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Create Account
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SignInPageContent />
    </Suspense>
  )
}