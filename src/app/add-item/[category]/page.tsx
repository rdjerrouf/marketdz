// src/app/add-item/[category]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getAllCategories, getCategoryByValue } from '@/lib/constants/categories'
import { ALGERIA_WILAYAS } from '@/lib/constants/algeria'

interface FormData {
  title: string
  description: string
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  price: string
  currency: string
  wilaya: string
  city: string
  phone: string
  email: string
  photos: File[]
  metadata: {
    condition?: string
    brand?: string
    jobType?: string
    experience?: string
    serviceType?: string
    availability?: string
    propertyType?: string
    bedrooms?: string
    bathrooms?: string
    size?: string
  }
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  city: string
  wilaya: string
}

export default function CreateListingForm() {
  const router = useRouter()
  const params = useParams()
  const category = params.category as string
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string[]>([])

  // Improved styling classes with better contrast
  const inputClassName = "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500 bg-white font-medium"
  const selectClassName = "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white font-medium"
  const labelClassName = "block text-sm font-semibold text-gray-800 mb-2"

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: category as 'for_sale' | 'job' | 'service' | 'for_rent',
    price: '',
    currency: 'DZD',
    wilaya: '',
    city: '',
    phone: '',
    email: '',
    photos: [],
    metadata: {}
  })

  useEffect(() => {
    const validCategories = ['for_sale', 'job', 'service', 'for_rent']
    if (!validCategories.includes(category)) {
      router.push('/add-item')
      return
    }
  }, [category, router])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin?redirect=/add-item')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setError('Failed to load user profile')
        return
      }

      if (profile) {
        setUser({
          id: profile.id,
          email: session.user.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          city: profile.city || '',
          wilaya: profile.wilaya || ''
        })

        setFormData(prev => ({
          ...prev,
          category: category as 'for_sale' | 'job' | 'service' | 'for_rent',
          wilaya: profile.wilaya || '',
          city: profile.city || '',
          phone: profile.phone || '',
          email: session.user.email || ''
        }))
      }
    }

    checkAuth()
  }, [router, category])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleMetadataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value }
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length > 5) {
      setError('Maximum 5 photos allowed')
      return
    }

    setFormData(prev => ({ ...prev, photos: files }))
    const previews = files.map(file => URL.createObjectURL(file))
    setPhotoPreview(previews)
  }

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index)
    const newPreviews = photoPreview.filter((_, i) => i !== index)
    
    setFormData(prev => ({ ...prev, photos: newPhotos }))
    setPhotoPreview(newPreviews)
  }

  const uploadPhotos = async (): Promise<string[]> => {
    if (formData.photos.length === 0) return []

    const photoUrls: string[] = []

    for (const photo of formData.photos) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `listings/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(filePath, photo)

      if (uploadError) {
        console.error('Photo upload error:', uploadError)
        throw new Error(`Failed to upload photo: ${uploadError.message}`)
      }

      const { data } = supabase.storage
        .from('listing-photos')
        .getPublicUrl(filePath)

      photoUrls.push(data.publicUrl)
    }

    return photoUrls
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    if (!formData.description.trim()) {
      setError('Description is required')
      return false
    }
    if (!formData.category) {
      setError('Category is required')
      return false
    }
    if (!formData.wilaya) {
      setError('Wilaya is required')
      return false
    }
    if (!formData.city.trim()) {
      setError('City is required')
      return false
    }
    if (formData.category !== 'job' && !formData.price.trim()) {
      setError('Price is required for this category')
      return false
    }
    if (formData.price && isNaN(Number(formData.price))) {
      setError('Price must be a valid number')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!user) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Starting form submission...')
      console.log('Form data:', formData)
      console.log('User:', user)

      // Upload photos first
      let photoUrls: string[] = []
      if (formData.photos.length > 0) {
        console.log('Uploading photos...')
        photoUrls = await uploadPhotos()
        console.log('Photos uploaded:', photoUrls)
      }

      // Prepare the listing data with location and metadata
    const allowedCategories = ['for_sale', 'job', 'service', 'for_rent'];
    const safeCategory = allowedCategories.includes(formData.category) ? formData.category : null;

        const listingData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: safeCategory,
        price: formData.price ? parseFloat(formData.price) : null,
        status: 'active',
        photos: photoUrls,
        location: {
          wilaya: formData.wilaya,
          city: formData.city.trim()
        },
        metadata: {
          ...formData.metadata,
          currency: formData.currency,
          phone: formData.phone.trim(),
          email: formData.email.trim()
        }
      }

      console.log('Inserting listing data:', listingData)

      // Insert the listing
      const { data, error: insertError } = await supabase
        .from('listings')
        .insert([listingData])
        .select()

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        throw new Error(`Database error: ${insertError.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from database')
      }

      console.log('Listing created successfully:', data)
      setSuccess('Listing created successfully! Redirecting...')
      
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err) {
      console.error('Error creating listing:', err)
      let errorMessage = 'Failed to create listing'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err)
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getCities = () => {
    const wilaya = ALGERIA_WILAYAS.find((w: any) => w.code === formData.wilaya)
    return wilaya ? wilaya.cities : []
  }

  const getCategoryInfo = () => {
    const categoryMap = {
      'for_sale': { title: 'For Sale', icon: '🛒', description: 'Sell your items to buyers across Algeria' },
      'for_rent': { title: 'For Rent', icon: '🏠', description: 'Rent out your properties and equipment' },
      'job': { title: 'Jobs', icon: '💼', description: 'Post job opportunities for job seekers' },
      'service': { title: 'Services', icon: '🔧', description: 'Offer your professional services' }
    }
    return categoryMap[category as keyof typeof categoryMap]
  }

  const renderCategoryFields = () => {
    switch (formData.category) {
      case 'for_sale':
        return (
          <>
            <div>
              <label htmlFor="condition-select" className={labelClassName}>
                Condition *
              </label>
              <select
                id="condition-select"
                value={formData.metadata.condition || ''}
                onChange={(e) => handleMetadataChange('condition', e.target.value)}
                className={selectClassName}
                required
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label htmlFor="brand-input" className={labelClassName}>
                Brand
              </label>
              <input
                id="brand-input"
                type="text"
                value={formData.metadata.brand || ''}
                onChange={(e) => handleMetadataChange('brand', e.target.value)}
                placeholder="e.g., Samsung, Toyota, etc."
                className={inputClassName}
              />
            </div>
          </>
        )

      case 'job':
        return (
          <>
            <div>
              <label htmlFor="job-type-select" className={labelClassName}>
                Job Type *
              </label>
              <select
                id="job-type-select"
                value={formData.metadata.jobType || ''}
                onChange={(e) => handleMetadataChange('jobType', e.target.value)}
                className={selectClassName}
                required
              >
                <option value="">Select job type</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label htmlFor="experience-select" className={labelClassName}>
                Required Experience
              </label>
              <select
                id="experience-select"
                value={formData.metadata.experience || ''}
                onChange={(e) => handleMetadataChange('experience', e.target.value)}
                className={selectClassName}
              >
                <option value="">Select experience level</option>
                <option value="entry">Entry Level (0-1 years)</option>
                <option value="junior">Junior (1-3 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior (5+ years)</option>
                <option value="executive">Executive/Manager</option>
              </select>
            </div>
          </>
        )

      case 'service':
        return (
          <>
            <div>
              <label htmlFor="service-type-select" className={labelClassName}>
                Service Type *
              </label>
              <select
                id="service-type-select"
                value={formData.metadata.serviceType || ''}
                onChange={(e) => handleMetadataChange('serviceType', e.target.value)}
                className={selectClassName}
                required
              >
                <option value="">Select service type</option>
                <option value="home_services">Home Services</option>
                <option value="professional">Professional Services</option>
                <option value="education">Education/Tutoring</option>
                <option value="health">Health & Wellness</option>
                <option value="events">Events & Entertainment</option>
                <option value="transport">Transportation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="availability-input" className={labelClassName}>
                Availability
              </label>
              <input
                id="availability-input"
                type="text"
                value={formData.metadata.availability || ''}
                onChange={(e) => handleMetadataChange('availability', e.target.value)}
                placeholder="e.g., Weekdays 9-5, Weekends only"
                className={inputClassName}
              />
            </div>
          </>
        )

      case 'for_rent':
        return (
          <>
            <div>
              <label htmlFor="property-type-select" className={labelClassName}>
                Property Type *
              </label>
              <select
                id="property-type-select"
                value={formData.metadata.propertyType || ''}
                onChange={(e) => handleMetadataChange('propertyType', e.target.value)}
                className={selectClassName}
                required
              >
                <option value="">Select property type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="room">Room</option>
                <option value="studio">Studio</option>
                <option value="office">Office Space</option>
                <option value="shop">Shop/Commercial</option>
                <option value="vehicle">Vehicle</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>
            {['apartment', 'house', 'room', 'studio'].includes(formData.metadata.propertyType || '') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bedrooms-select" className={labelClassName}>
                    Bedrooms
                  </label>
                  <select
                    id="bedrooms-select"
                    value={formData.metadata.bedrooms || ''}
                    onChange={(e) => handleMetadataChange('bedrooms', e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Select</option>
                    <option value="0">Studio</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bathrooms-select" className={labelClassName}>
                    Bathrooms
                  </label>
                  <select
                    id="bathrooms-select"
                    value={formData.metadata.bathrooms || ''}
                    onChange={(e) => handleMetadataChange('bathrooms', e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4+">4+</option>
                  </select>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="size-input" className={labelClassName}>
                Size (m²)
              </label>
              <input
                id="size-input"
                type="number"
                value={formData.metadata.size || ''}
                onChange={(e) => handleMetadataChange('size', e.target.value)}
                placeholder="Size in square meters"
                className={inputClassName}
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  const categoryInfo = getCategoryInfo()

  if (!user || !categoryInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <button
              onClick={() => router.push('/add-item')}
              className="text-white hover:text-green-100 transition-colors flex items-center mb-6 bg-white bg-opacity-10 px-4 py-2 rounded-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Categories
            </button>
            
            <div className="flex items-center">
              <span className="text-5xl mr-6">{categoryInfo.icon}</span>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Create {categoryInfo.title} Listing</h1>
                <p className="text-xl text-green-100">{categoryInfo.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-lg font-medium">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg font-medium">
            <div className="font-semibold mb-2">Error creating listing:</div>
            <div className="text-sm">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title-input" className={labelClassName}>
                  Title *
                </label>
                <input
                  id="title-input"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., iPhone 15 Pro Max 256GB, Used Car, etc."
                  className={inputClassName}
                  maxLength={100}
                  required
                />
                <p className="mt-2 text-sm font-medium text-gray-700">{formData.title.length}/100 characters</p>
              </div>

              <div>
                <label htmlFor="description-input" className={labelClassName}>
                  Description *
                </label>
                <textarea
                  id="description-input"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a detailed description of your item..."
                  rows={6}
                  className={`${inputClassName} resize-none`}
                  maxLength={2000}
                  required
                />
                <p className="mt-2 text-sm font-medium text-gray-700">{formData.description.length}/2000 characters</p>
              </div>
            </div>
          </div>

          {/* Category-specific fields */}
          {formData.category && (
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderCategoryFields()}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {formData.category === 'job' ? 'Salary Information' : 'Pricing'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="price-input" className={labelClassName}>
                  {formData.category === 'job' ? 'Salary' : 'Price'} {formData.category !== 'job' && '*'}
                </label>
                <input
                  id="price-input"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder={formData.category === 'job' ? 'Leave empty if negotiable' : 'Enter price in DZD'}
                  className={inputClassName}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label htmlFor="currency-select" className={labelClassName}>
                  Currency
                </label>
                <select
                  id="currency-select"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className={selectClassName}
                >
                  <option value="DZD">DZD (Algerian Dinar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="wilaya-select" className={labelClassName}>
                  Wilaya *
                </label>
                <select
                  id="wilaya-select"
                  value={formData.wilaya}
                  onChange={(e) => handleInputChange('wilaya', e.target.value)}
                  className={selectClassName}
                  required
                >
                  <option value="">Select wilaya</option>
                  {ALGERIA_WILAYAS.map((wilaya: any) => (
                    <option key={wilaya.code} value={wilaya.code}>
                      {wilaya.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city-select" className={labelClassName}>
                  City *
                </label>
                {formData.wilaya ? (
                  <select
                    id="city-select"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={selectClassName}
                    required
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
                    id="city-input"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city name"
                    className={inputClassName}
                    required
                  />
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone-input" className={labelClassName}>
                  Phone Number
                </label>
                <input
                  id="phone-input"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+213 XXX XXX XXX"
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="email-input" className={labelClassName}>
                  Email
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Photos</h2>
            
            <div>
              <label htmlFor="photos-input" className={labelClassName}>
                Upload Photos (Max 5)
              </label>
              <input
                id="photos-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className={inputClassName}
              />
              <p className="mt-2 text-sm font-medium text-gray-600">
                Accepted formats: JPG, PNG, WebP. Max file size: 10MB each.
              </p>
            </div>

            {photoPreview.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Photo Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {photoPreview.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 font-bold shadow-lg"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/add-item')}
              className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating Listing...
                </div>
              ) : (
                'Create Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}