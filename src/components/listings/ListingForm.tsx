// src/components/listings/ListingForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LISTING_CATEGORIES } from '@/lib/constants/categories'
import { ALGERIA_WILAYAS } from '@/lib/constants/algeria'
import ImageUpload from './ImageUpload'

interface ListingFormData {
  title: string
  description: string
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  subcategory: string
  price: string
  location_city: string
  location_wilaya: string
  photos: string[]
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
    [key: string]: any
  }
}

interface ListingFormProps {
  initialData?: Partial<ListingFormData>
  listingId?: string
  mode?: 'create' | 'edit'
  onSuccess?: () => void
}

export default function ListingForm({
  initialData,
  listingId,
  mode = 'create',
  onSuccess
}: ListingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    category: 'for_sale',
    subcategory: '',
    price: '',
    location_city: '',
    location_wilaya: '',
    photos: [],
    metadata: {},
    ...initialData
  })

  const categoryData = LISTING_CATEGORIES[formData.category.toUpperCase() as keyof typeof LISTING_CATEGORIES]
  const requiresImages = formData.category === 'for_sale' || formData.category === 'for_rent'
  const requiresPrice = formData.category !== 'job'

  const handleInputChange = (field: keyof ListingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    if (formData.title.length < 3 || formData.title.length > 200) {
      setError('Title must be between 3 and 200 characters')
      return false
    }
    if (!formData.description.trim()) {
      setError('Description is required')
      return false
    }
    if (!formData.location_wilaya) {
      setError('Wilaya is required')
      return false
    }
    if (!formData.location_city.trim()) {
      setError('City is required')
      return false
    }
    if (requiresPrice && (!formData.price.trim() || isNaN(Number(formData.price)) || Number(formData.price) <= 0)) {
      setError('Valid price is required for this category')
      return false
    }
    if (requiresImages && formData.photos.length === 0) {
      setError('At least 1 image is required for this category')
      return false
    }
    if (formData.photos.length > 3) {
      setError('Maximum 3 images allowed')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const url = mode === 'edit' && listingId 
        ? `/api/listings/${listingId}`
        : '/api/listings'
      
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          subcategory: formData.subcategory.trim() || null,
          price: requiresPrice ? parseFloat(formData.price) : null,
          location_city: formData.location_city.trim(),
          location_wilaya: formData.location_wilaya,
          photos: formData.photos,
          metadata: formData.metadata
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save listing')
      }

      setSuccess(`Listing ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      
      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }

    } catch (err) {
      console.error('Error saving listing:', err)
      setError(err instanceof Error ? err.message : 'Failed to save listing')
    } finally {
      setLoading(false)
    }
  }

  const inputClassName = "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500 bg-white font-medium"
  const selectClassName = "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white font-medium"
  const labelClassName = "block text-sm font-semibold text-gray-800 mb-2"

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 font-medium">{success}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className={labelClassName}>
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter a descriptive title (3-200 characters)"
              className={inputClassName}
              maxLength={200}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.title.length}/200 characters
            </p>
          </div>

          <div>
            <label htmlFor="description" className={labelClassName}>
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Provide detailed information about your listing"
              className={`${inputClassName} min-h-[120px] resize-y`}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className={labelClassName}>
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={selectClassName}
                disabled={mode === 'edit'} // Don't allow category change in edit mode
              >
                {Object.entries(LISTING_CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subcategory" className={labelClassName}>
                Subcategory
              </label>
              <select
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => handleInputChange('subcategory', e.target.value)}
                className={selectClassName}
              >
                <option value="">Select subcategory</option>
                {categoryData?.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {requiresPrice && (
            <div>
              <label htmlFor="price" className={labelClassName}>
                Price (DZD) *
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="Enter price in DZD"
                className={inputClassName}
              />
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Location</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="wilaya" className={labelClassName}>
              Wilaya *
            </label>
            <select
              id="wilaya"
              value={formData.location_wilaya}
              onChange={(e) => handleInputChange('location_wilaya', e.target.value)}
              className={selectClassName}
            >
              <option value="">Select Wilaya</option>
              {ALGERIA_WILAYAS.map((wilaya) => (
                <option key={wilaya.code} value={wilaya.name}>
                  {wilaya.code} - {wilaya.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className={labelClassName}>
              City *
            </label>
            <input
              id="city"
              type="text"
              value={formData.location_city}
              onChange={(e) => handleInputChange('location_city', e.target.value)}
              placeholder="Enter city name"
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Images {requiresImages && <span className="text-red-500">*</span>}
        </h2>
        
        <ImageUpload
          images={formData.photos}
          onImagesChange={(photos) => handleInputChange('photos', photos)}
          category={formData.category}
          maxImages={3}
          required={requiresImages}
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-colors"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              {mode === 'edit' ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            mode === 'edit' ? 'Update Listing' : 'Create Listing'
          )}
        </button>
      </div>
    </form>
  )
}
