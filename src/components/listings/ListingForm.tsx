// src/components/listings/ListingForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { LISTING_CATEGORIES } from '@/lib/constants/categories'
import { ALGERIA_WILAYAS, getWilayaByName } from '@/lib/constants/algeria'
import ImageUpload from './ImageUpload'
import ComingSoonModal from '@/components/premium/ComingSoonModal'
import { Zap } from 'lucide-react'

interface ListingFormData {
  title: string
  description: string
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  subcategory: string
  price: string
  location_city: string
  location_wilaya: string
  photos: string[]
  // New category-specific columns
  available_from?: string
  available_to?: string
  rental_period?: string
  salary_min?: string
  salary_max?: string
  salary_type?: string  // Add salary type field
  salary_amount?: string  // For fixed salary
  job_type?: string
  company_name?: string
  condition?: string
  // Application fields for jobs
  application_email?: string
  application_phone?: string
  application_instructions?: string
  // Service contact fields
  service_phone?: string
  metadata: {
    brand?: string
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
  fixedCategory?: boolean // New prop to disable category selection when category is pre-selected from route
}

export default function ListingForm({
  initialData,
  listingId,
  mode = 'create',
  onSuccess,
  fixedCategory = false
}: ListingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showHotDealModal, setShowHotDealModal] = useState(false)

  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    category: 'for_sale',
    subcategory: '',
    price: '',
    location_city: '',
    location_wilaya: '',
    photos: [],
    // New category-specific fields
    available_from: '',
    available_to: '',
    rental_period: '',
    salary_min: '',
    salary_max: '',
    salary_type: '',  // Add salary type initialization
    salary_amount: '',  // For fixed salary
    job_type: '',
    company_name: '',
    condition: '',
    // Application fields initialization
    application_email: '',
    application_phone: '',
    application_instructions: '',
    // Service fields initialization
    service_phone: '',
    metadata: {},
    ...initialData
  })

  const categoryData = LISTING_CATEGORIES[formData.category.toUpperCase() as keyof typeof LISTING_CATEGORIES]
  const requiresImages = formData.category === 'for_sale' || formData.category === 'for_rent'
  const requiresPrice = formData.category !== 'job' && formData.category !== 'service'
  
  // Get cities for selected wilaya
  const selectedWilaya = getWilayaByName(formData.location_wilaya)
  const availableCities = selectedWilaya ? selectedWilaya.cities : []

  const handleInputChange = (field: keyof ListingFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Clear city when wilaya changes
      if (field === 'location_wilaya') {
        newData.location_city = ''
      }
      
      return newData
    })
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
    // Job-specific salary validation
    if (formData.category === 'job') {
      if (formData.salary_type === 'fixed' && (!formData.salary_amount || isNaN(Number(formData.salary_amount)) || Number(formData.salary_amount) <= 0)) {
        setError('Fixed salary amount is required for fixed salary type')
        return false
      }
      if (formData.salary_type === 'range') {
        if (!formData.salary_min || !formData.salary_max || 
            isNaN(Number(formData.salary_min)) || isNaN(Number(formData.salary_max)) ||
            Number(formData.salary_min) <= 0 || Number(formData.salary_max) <= 0) {
          setError('Both minimum and maximum salary values are required for salary range')
          return false
        }
        if (Number(formData.salary_min) >= Number(formData.salary_max)) {
          setError('Maximum salary must be higher than minimum salary')
          return false
        }
      }
    }
    // Job application validation - require at least one contact method
    if (formData.category === 'job') {
      if (!formData.application_email?.trim() && !formData.application_phone?.trim()) {
        setError('Please provide at least one contact method (email or phone) for job applications')
        return false
      }
    }
    // Service contact validation - require phone number
    if (formData.category === 'service') {
      if (!formData.service_phone?.trim()) {
        setError('Phone number is required for service listings')
        return false
      }
    }
    if (requiresImages && formData.photos.length === 0) {
      setError('At least 1 image is required for this category')
      return false
    }
    // Allow 5 photos for rentals, 3 for other categories
    const maxPhotos = formData.category === 'for_rent' ? 5 : 3
    if (formData.photos.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} images allowed${formData.category === 'for_rent' ? ' for rentals' : ''}`)
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
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('You must be signed in to create a listing')
      }

      const url = mode === 'edit' && listingId 
        ? `/api/listings/${listingId}`
        : '/api/listings'
      
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          subcategory: formData.subcategory.trim() || null,
          price: requiresPrice ? parseFloat(formData.price) : null,
          location_city: formData.location_city.trim(),
          location_wilaya: formData.location_wilaya,
          photos: formData.photos,
          // New category-specific fields
          available_from: formData.available_from || null,
          available_to: formData.available_to || null,
          rental_period: formData.rental_period || null,
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
          salary_type: formData.salary_type || null,
          salary_amount: formData.salary_amount ? parseInt(formData.salary_amount) : null,
          job_type: formData.job_type || null,
          company_name: formData.company_name?.trim() || null,
          condition: formData.condition || null,
          // Application information for jobs
          application_email: formData.application_email?.trim() || null,
          application_phone: formData.application_phone?.trim() || null,
          application_instructions: formData.application_instructions?.trim() || null,
          // Service contact information
          service_phone: formData.service_phone?.trim() || null,
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
                disabled={mode === 'edit' || fixedCategory} // Don't allow category change in edit mode or when category is fixed from route
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

          {requiresPrice && formData.category !== 'for_rent' && (
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
            {availableCities.length > 0 ? (
              <select
                id="city"
                value={formData.location_city}
                onChange={(e) => handleInputChange('location_city', e.target.value)}
                className={selectClassName}
              >
                <option value="">Select city</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
                <option value="other">Other (please specify in description)</option>
              </select>
            ) : (
              <input
                id="city"
                type="text"
                value={formData.location_city}
                onChange={(e) => handleInputChange('location_city', e.target.value)}
                placeholder="Enter city name"
                className={inputClassName}
              />
            )}
          </div>
        </div>
      </div>

      {/* Category-Specific Fields */}
      {(formData.category === 'for_rent' || formData.category === 'job' || formData.category === 'for_sale' || formData.category === 'service') && (
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {formData.category === 'for_rent' ? 'Rental Details' :
             formData.category === 'job' ? 'Job Details' :
             formData.category === 'service' ? 'Service Details' : 'Item Details'}
          </h2>
          
          <div className="space-y-6">
            {/* For Rent specific fields */}
            {formData.category === 'for_rent' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="available_from" className={labelClassName}>
                      Available From
                    </label>
                    <input
                      id="available_from"
                      type="date"
                      value={formData.available_from}
                      onChange={(e) => handleInputChange('available_from', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="available_to" className={labelClassName}>
                      Available Until
                    </label>
                    <input
                      id="available_to"
                      type="date"
                      value={formData.available_to}
                      onChange={(e) => handleInputChange('available_to', e.target.value)}
                      min={formData.available_from || new Date().toISOString().split('T')[0]}
                      className={inputClassName}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      placeholder="Enter rental price in DZD"
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="rental_period" className={labelClassName}>
                      Rental Period
                    </label>
                    <select
                      id="rental_period"
                      value={formData.rental_period}
                      onChange={(e) => handleInputChange('rental_period', e.target.value)}
                      className={selectClassName}
                    >
                      <option value="">Select rental period</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Job specific fields */}
            {formData.category === 'job' && (
              <>
                <div>
                  <label htmlFor="company_name" className={labelClassName}>
                    Company Name
                  </label>
                  <input
                    id="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                    className={inputClassName}
                  />
                </div>
                
                {/* Salary Type Selection */}
                <div>
                  <label htmlFor="salary_type" className={labelClassName}>
                    Salary Information
                  </label>
                  <select
                    id="salary_type"
                    value={formData.salary_type}
                    onChange={(e) => handleInputChange('salary_type', e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Select salary type</option>
                    <option value="fixed">Fixed Salary</option>
                    <option value="range">Salary Range</option>
                    <option value="market_based">Market-Based</option>
                    <option value="negotiable">Negotiable</option>
                    <option value="tbd">To Be Discussed (TBD)</option>
                    <option value="performance">Performance-Based</option>
                    <option value="interview">Salary details shared during interviews</option>
                  </select>
                </div>

                {/* Conditional Salary Fields */}
                {formData.salary_type === 'fixed' && (
                  <div>
                    <label htmlFor="salary_amount" className={labelClassName}>
                      Fixed Salary Amount (DZD)
                    </label>
                    <input
                      id="salary_amount"
                      type="number"
                      min="0"
                      value={formData.salary_amount}
                      onChange={(e) => handleInputChange('salary_amount', e.target.value)}
                      placeholder="Enter fixed salary amount"
                      className={inputClassName}
                    />
                  </div>
                )}

                {formData.salary_type === 'range' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="salary_min" className={labelClassName}>
                        Minimum Salary (DZD)
                      </label>
                      <input
                        id="salary_min"
                        type="number"
                        min="0"
                        value={formData.salary_min}
                        onChange={(e) => handleInputChange('salary_min', e.target.value)}
                        placeholder="Minimum salary"
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label htmlFor="salary_max" className={labelClassName}>
                        Maximum Salary (DZD)
                      </label>
                      <input
                        id="salary_max"
                        type="number"
                        min="0"
                        value={formData.salary_max}
                        onChange={(e) => handleInputChange('salary_max', e.target.value)}
                        placeholder="Maximum salary"
                        className={inputClassName}
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="job_type" className={labelClassName}>
                    Job Type
                  </label>
                  <select
                    id="job_type"
                    value={formData.job_type}
                    onChange={(e) => handleInputChange('job_type', e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Select job type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
              </>
            )}

            {/* For Sale specific fields */}
            {formData.category === 'for_sale' && (
              <div>
                <label htmlFor="condition" className={labelClassName}>
                  Condition
                </label>
                <select
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Select condition</option>
                  <option value="new">New</option>
                  <option value="used">Used - Like New</option>
                  <option value="good">Used - Good</option>
                  <option value="fair">Used - Fair</option>
                  <option value="poor">Used - Poor</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
            )}

            {/* Service specific fields */}
            {formData.category === 'service' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="service_phone" className={labelClassName}>
                    Contact Phone Number *
                  </label>
                  <input
                    id="service_phone"
                    type="tel"
                    value={formData.service_phone}
                    onChange={(e) => handleInputChange('service_phone', e.target.value)}
                    placeholder="+213 XX XX XX XX"
                    className={inputClassName}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This phone number will be visible to potential clients
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-blue-900">
                        Service Pricing
                      </h3>
                    </div>
                  </div>
                  <p className="text-blue-800 font-medium">
                    💬 Estimation will be provided after discussion/inspection
                  </p>
                  <p className="text-blue-700 text-sm mt-2">
                    Interested clients will be able to contact you through the platform messaging system or directly at the phone number provided above to discuss your specific services and get a customized quote.
                  </p>
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mt-3">
                    <p className="text-blue-800 text-sm font-medium">
                      📞 Remember: Clients will contact you directly for pricing discussions
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Information for Jobs */}
      {formData.category === 'job' && (
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Apply</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="application_email" className={labelClassName}>
                  Application Email
                </label>
                <input
                  id="application_email"
                  type="email"
                  value={formData.application_email}
                  onChange={(e) => handleInputChange('application_email', e.target.value)}
                  placeholder="jobs@company.com"
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="application_phone" className={labelClassName}>
                  Application Phone
                </label>
                <input
                  id="application_phone"
                  type="tel"
                  value={formData.application_phone}
                  onChange={(e) => handleInputChange('application_phone', e.target.value)}
                  placeholder="+213 XX XX XX XX"
                  className={inputClassName}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="application_instructions" className={labelClassName}>
                Application Instructions
              </label>
              <textarea
                id="application_instructions"
                value={formData.application_instructions}
                onChange={(e) => handleInputChange('application_instructions', e.target.value)}
                placeholder="Please provide application instructions, required documents, deadline, or any specific requirements..."
                className={`${inputClassName} min-h-[100px] resize-y`}
                rows={4}
              />
            </div>
          </div>
        </div>
      )}

      {/* Images - Hide for job and service categories */}
      {formData.category !== 'job' && formData.category !== 'service' && (
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Images {requiresImages && <span className="text-red-500">*</span>}
          </h2>
          
          <ImageUpload
            images={formData.photos}
            onImagesChange={(photos) => handleInputChange('photos', photos)}
            category={formData.category}
            maxImages={formData.category === 'for_rent' ? 5 : 3}
            required={requiresImages}
          />
        </div>
      )}

      {/* Hot Deal Section - Coming Soon */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-8 shadow-lg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-2xl"></div>

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl mr-4 shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  Hot Deal
                  <span className="ml-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-3 py-1 rounded-full font-bold shadow-md">
                    Coming Soon
                  </span>
                </h3>
                <p className="text-gray-600 mt-1">Boost your listing visibility</p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Mark your listing as a hot deal to get <strong>3x more visibility</strong>, appear at the top of search results, and sell faster with eye-catching badges.
          </p>

          {/* Disabled Toggle */}
          <div className="flex items-center justify-between bg-white rounded-lg p-4 border-2 border-gray-200 opacity-60 cursor-not-allowed">
            <div className="flex items-center">
              <div className="relative inline-block w-12 h-6 mr-3">
                <div className="absolute inset-0 bg-gray-300 rounded-full"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow"></div>
              </div>
              <span className="text-gray-600 font-medium">Mark as Hot Deal</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHotDealModal(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Learn More
            </button>
          </div>

          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>🔥 Premium Feature:</strong> Hot deals will be available soon. Be among the first to boost your listings!
            </p>
          </div>
        </div>
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

      {/* Coming Soon Modal for Hot Deals */}
      <ComingSoonModal
        isOpen={showHotDealModal}
        onClose={() => setShowHotDealModal(false)}
        featureName="Hot Deals"
        featureIcon={<Zap className="w-12 h-12 text-white" />}
        benefits={[
          'Boost your listings to the top of search results',
          'Get 3x more visibility and views',
          'Special hot deal badges and highlights',
          'Priority placement in homepage carousel',
          'Sell faster with urgency indicators',
          'Stand out from regular listings'
        ]}
      />
    </form>
  )
}
