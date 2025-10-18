// src/app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ALGERIA_WILAYAS } from '@/lib/constants/algeria'
import { normalizePhoneNumber, generateWhatsAppLink } from '@/lib/utils'
import { fixPhotoUrl } from '@/lib/storage'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  bio: string
  phone: string
  city: string
  wilaya: string
  created_at: string
}

interface Listing {
  id: string
  title: string
  description: string | null
  price: number | null
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  photos: string[]
  created_at: string
  status: string
  user_id: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userListings, setUserListings] = useState<Listing[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'listings' | 'settings'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    phone: '',
    city: '',
    wilaya: ''
  })

  // Check authentication and fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/signin?redirect=/profile')
          return
        }

        console.log('🔍 Profile: Current user session:', {
          userId: session.user.id,
          email: session.user.email
        })

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setError('Failed to load profile')
          return
        }
        const userData: User = {
          id: profile.id,
          email: session.user.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          bio: profile.bio || '',
          phone: profile.phone || '',
          city: profile.city || '',
          wilaya: profile.wilaya || '',
          created_at: profile.created_at
        }

        setUser(userData)
        setFormData({
          first_name: userData.first_name,
          last_name: userData.last_name,
          bio: userData.bio,
          phone: userData.phone,
          city: userData.city,
          wilaya: userData.wilaya
        })

        // Fetch user's listings
        console.log('🔍 Profile: Fetching listings for user:', session.user.id)
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', session.user.id)
          .neq('title', '') // Exclude listings with empty titles (invalid data)
          .order('created_at', { ascending: false })

        if (listingsError) {
          console.error('Error fetching listings:', listingsError)
        } else {
          // Additional client-side filtering to ensure data integrity
          const validListings = (listings || []).filter((listing: Listing) =>
            listing.user_id === session.user.id && // Double-check user_id match
            listing.title && // Must have a title
            listing.title.trim().length > 0 && // Title must not be empty
            listing.id // Must have a valid ID
          )
          
          console.log('🔍 Profile: Found listings:', listings?.length || 0)
          console.log('🔍 Profile: Valid listings after filtering:', validListings.length)
          console.log('🔍 Profile: Listings data:', validListings.map((l: Listing) => ({
            id: l.id,
            title: l.title,
            user_id: l.user_id,
            created_at: l.created_at
          })))
          setUserListings(validListings)
        }

      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      // Get the current session to include the JWT token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('You must be signed in to update your profile')
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          bio: formData.bio.trim(),
          phone: normalizePhoneNumber(formData.phone.trim()),
          city: formData.city.trim(),
          wilaya: formData.wilaya
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const result = await response.json()

      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        bio: formData.bio.trim(),
        phone: normalizePhoneNumber(formData.phone.trim()),
        city: formData.city.trim(),
        wilaya: formData.wilaya
      } : null)

      setMessage(result.message || 'Profile updated successfully!')
      setEditMode(false)

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)

    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return
    }

    try {
      // Get the current session to include the JWT token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('You must be signed in to delete listings')
      }

      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete listing')
      }

      setUserListings(prev => prev.filter(listing => listing.id !== listingId))
      setMessage('Listing deleted successfully!')
      setTimeout(() => setMessage(''), 3000)

    } catch (err) {
      console.error('Error deleting listing:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete listing')
    }
  }

  const formatPrice = (price: number | null, category: string) => {
    if (!price) return category === 'job' ? 'Salary negotiable' : 'Price negotiable'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getCategoryBadge = (category: string) => {
    const badges = {
      'for_sale': { text: 'For Sale', color: 'bg-green-500' },
      'for_rent': { text: 'For Rent', color: 'bg-blue-500' },
      'job': { text: 'Jobs', color: 'bg-red-500' },
      'service': { text: 'Services', color: 'bg-purple-500' }
    }
    return badges[category as keyof typeof badges] || { text: category, color: 'bg-gray-500' }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'active': { text: 'Active', color: 'bg-green-100 text-green-800' },
      'inactive': { text: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      'sold': { text: 'Sold', color: 'bg-blue-100 text-blue-800' },
      'closed': { text: 'Closed', color: 'bg-red-100 text-red-800' }
    }
    return badges[status as keyof typeof badges] || { text: status, color: 'bg-gray-100 text-gray-800' }
  }

  const getCities = () => {
    const wilaya = ALGERIA_WILAYAS.find((w: any) => w.code === formData.wilaya)
    return wilaya ? wilaya.cities : []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06402B] relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        </div>
        
        <div className="relative z-10 text-center bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-[#06402B] relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        </div>
        
        <div className="relative z-10 text-center bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20">
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load profile</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const inputClassName = "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white font-medium placeholder-gray-500"
  const selectClassName = "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white font-medium"
  const labelClassName = "block text-sm font-semibold text-gray-700 mb-2"

  return (
    <div className="min-h-screen bg-[#06402B] relative overflow-hidden">
      {/* Animated background elements - Fixed to not interfere with clicks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s] pointer-events-none"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:4s] pointer-events-none"></div>
        
        {/* Floating particles - Fixed to not interfere with clicks */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { left: 'left-[10%]', top: 'top-[20%]', opacity: 'opacity-10' },
            { left: 'left-[25%]', top: 'top-[15%]', opacity: 'opacity-20' },
            { left: 'left-[40%]', top: 'top-[30%]', opacity: 'opacity-30' },
            { left: 'left-[60%]', top: 'top-[10%]', opacity: 'opacity-40' },
            { left: 'left-[80%]', top: 'top-[25%]', opacity: 'opacity-50' }
          ].map((particle, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-white/10 rounded-full animate-pulse pointer-events-none ${particle.left} ${particle.top} ${particle.opacity}`}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>

            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          </div>
        </div>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Messages */}
        {message && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-lg font-medium relative z-30">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg font-medium relative z-30">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 relative z-30">
              {/* User Avatar and Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {user?.first_name?.[0] || 'U'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Member since {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}
                </p>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-green-100 text-green-800 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>

                <button
                  onClick={() => setActiveTab('listings')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeTab === 'listings' 
                      ? 'bg-green-100 text-green-800 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  My Listings
                  <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {userListings.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-green-100 text-green-800 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-lg p-6 relative z-30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {editMode ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="first_name" className={labelClassName}>
                          First Name *
                        </label>
                        <input
                          id="first_name"
                          type="text"
                          value={formData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className={inputClassName}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="last_name" className={labelClassName}>
                          Last Name *
                        </label>
                        <input
                          id="last_name"
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          className={inputClassName}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="bio" className={labelClassName}>
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={4}
                          className={`${inputClassName} resize-none`}
                          placeholder="Tell others about yourself..."
                        />
                        <p className="mt-2 text-sm text-gray-600">{formData.bio.length}/500 characters</p>
                      </div>

                      <div>
                        <label htmlFor="phone" className={labelClassName}>
                          Phone Number
                          <span className="text-xs text-gray-500 ml-2 font-normal">- Saved in WhatsApp format</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={inputClassName}
                          placeholder="0551234567 or +213551234567"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          📱 Phone numbers are automatically formatted as +213xxxxxxxxx for WhatsApp compatibility
                        </p>
                      </div>

                      <div>
                        <label htmlFor="wilaya" className={labelClassName}>
                          Wilaya
                        </label>
                        <select
                          id="wilaya"
                          value={formData.wilaya}
                          onChange={(e) => handleInputChange('wilaya', e.target.value)}
                          className={selectClassName}
                        >
                          <option value="">Select wilaya</option>
                          {ALGERIA_WILAYAS.map((wilaya: any) => (
                            <option key={wilaya.code} value={wilaya.code}>
                              {wilaya.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="city" className={labelClassName}>
                          City
                        </label>
                        {formData.wilaya ? (
                          <select
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className={selectClassName}
                          >
                            <option value="">Select city</option>
                            {getCities().map((city: string) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="city"
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className={inputClassName}
                            placeholder="Enter city name"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 mt-8">
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false)
                          setFormData({
                            first_name: user?.first_name || '',
                            last_name: user?.last_name || '',
                            bio: user?.bio || '',
                            phone: user?.phone || '',
                            city: user?.city || '',
                            wilaya: user?.wilaya || ''
                          })
                        }}
                        className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Name</h3>
                      <p className="text-gray-900">{user?.first_name} {user?.last_name}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Email</h3>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-gray-800 mb-2">Bio</h3>
                      <p className="text-gray-900">{user?.bio || 'No bio added yet.'}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Phone</h3>
                      {user?.phone ? (
                        <div className="space-y-2">
                          <p className="text-gray-900">{user.phone}</p>
                          {user.phone && (
                            <div className="flex gap-2">
                              <a
                                href={`tel:${user.phone}`}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                📞 Call
                              </a>
                              <a
                                href={generateWhatsAppLink(user.phone, `Hi! I saw your profile on MarketDZ.`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors"
                              >
                                💬 WhatsApp
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-900">Not provided</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Location</h3>
                      <p className="text-gray-900">
                        {user?.city && user?.wilaya 
                          ? `${user.city}, ${ALGERIA_WILAYAS.find(w => w.code === user.wilaya)?.name || user.wilaya}`
                          : 'Not provided'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="bg-white rounded-xl shadow-lg p-6 relative z-30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Listings ({userListings.length})</h2>
                  <button
                    onClick={() => router.push('/add-item')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create New Listing
                  </button>
                </div>

                {userListings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                    <p className="text-gray-600 mb-4">Create your first listing to start selling!</p>
                    <button
                      onClick={() => router.push('/add-item')}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Create Listing
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userListings.map((listing) => {
                      const categoryBadge = getCategoryBadge(listing.category)
                      const statusBadge = getStatusBadge(listing.status)

                      return (
                        <div key={listing.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                          {/* Image */}
                          <div className="h-48 bg-gray-200 relative">
                            {listing.photos && listing.photos.length > 0 ? (
                              <img
                                src={fixPhotoUrl(listing.photos[0])}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400">
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-2 left-2">
                              <span className={`${categoryBadge.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                                {categoryBadge.text}
                              </span>
                            </div>
                            <div className="absolute top-2 right-2">
                              <span className={`${statusBadge.color} px-3 py-1 rounded-full text-sm font-medium`}>
                                {statusBadge.text}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2 truncate">{listing.title}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description || 'No description available'}</p>
                            
                            <div className="flex items-center justify-between mb-4">
                              <span className="font-bold text-green-600">
                                {formatPrice(listing.price, listing.category)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(listing.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => router.push(`/browse/${listing.id}`)}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => router.push(`/edit-listing/${listing.id}`)}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteListing(listing.id)}
                                className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl shadow-lg p-6 relative z-30">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  {/* Account Information */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">User ID:</span>
                        <p className="text-gray-900 font-mono">{user?.id.slice(-12)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Email:</span>
                        <p className="text-gray-900">{user?.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Member Since:</span>
                        <p className="text-gray-900">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Total Listings:</span>
                        <p className="text-gray-900">{userListings.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Safety</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label htmlFor="profile-visibility" className="flex-1">
                          <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                          <p className="text-sm text-gray-600">Make your profile visible to other users</p>
                        </label>
                        <div className="flex items-center">
                          <input
                            id="profile-visibility"
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label htmlFor="show-contact" className="flex-1">
                          <h4 className="font-medium text-gray-900">Show Contact Information</h4>
                          <p className="text-sm text-gray-600">Allow buyers to see your contact details</p>
                        </label>
                        <div className="flex items-center">
                          <input
                            id="show-contact"
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label htmlFor="email-notifications" className="flex-1">
                          <h4 className="font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Receive notifications about messages and offers</p>
                        </label>
                        <div className="flex items-center">
                          <input
                            id="email-notifications"
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          // TODO: Implement password change
                          alert('Password change feature coming soon!')
                        }}
                        className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Change Password
                      </button>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to sign out?')) {
                              try {
                                await fetch('/api/auth/signout', { method: 'POST' })
                                router.push('/')
                              } catch (error) {
                                console.error('Signout error:', error)
                                router.push('/')
                              }
                            }
                          }}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors mr-3"
                        >
                          Sign Out
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement account deletion
                            alert('Account deletion requires contacting support.')
                          }}
                          className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-900 transition-colors"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}