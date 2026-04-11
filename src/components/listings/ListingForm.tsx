// src/components/listings/ListingForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase/client'
import { LISTING_CATEGORIES } from '@/lib/constants/categories'
import { ALGERIA_WILAYAS, getWilayaByName, getLocalizedName } from '@/lib/constants/algeria'
import ImageUpload from './ImageUpload'
import ComingSoonModal from '@/components/premium/ComingSoonModal'
import { Zap } from 'lucide-react'

interface ListingFormData {
  title: string
  description: string
  category: 'for_sale' | 'job' | 'service' | 'for_rent' | 'urgent'
  subcategory: string
  price: string
  location_city: string
  location_wilaya: string
  photos: string[]
  // Category-specific columns
  available_from?: string
  available_to?: string
  rental_period?: string
  salary_min?: string
  salary_max?: string
  salary_type?: string
  salary_amount?: string
  job_type?: string
  company_name?: string
  condition?: string
  // Application fields for jobs
  application_email?: string
  application_phone?: string
  application_instructions?: string
  // Service contact fields
  service_phone?: string
  // Urgent category fields
  urgent_type?: string
  urgent_expires_at?: string
  urgent_contact_preference?: string
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
  const t = useTranslations('addItem')
  const locale = useLocale()
  const isRtl = locale === 'ar'
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
    // Category-specific fields
    available_from: '',
    available_to: '',
    rental_period: '',
    salary_min: '',
    salary_max: '',
    salary_type: '',
    salary_amount: '',
    job_type: '',
    company_name: '',
    condition: '',
    // Application fields initialization
    application_email: '',
    application_phone: '',
    application_instructions: '',
    // Service fields initialization
    service_phone: '',
    // Urgent fields initialization
    urgent_type: '',
    urgent_expires_at: '',
    urgent_contact_preference: '',
    metadata: {},
    ...initialData
  })

  const categoryData = LISTING_CATEGORIES[formData.category.toUpperCase() as keyof typeof LISTING_CATEGORIES]
  const requiresImages = formData.category === 'for_sale' || formData.category === 'for_rent'
  const requiresPrice = formData.category !== 'job' && formData.category !== 'service' && formData.category !== 'urgent'
  
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
      setError(t('validation.titleRequired'))
      return false
    }
    if (formData.title.length < 3 || formData.title.length > 200) {
      setError(t('validation.titleLength'))
      return false
    }
    if (!formData.description.trim()) {
      setError(t('validation.descriptionRequired'))
      return false
    }
    if (!formData.location_wilaya) {
      setError(t('validation.wilayaRequired'))
      return false
    }
    if (!formData.location_city.trim()) {
      setError(t('validation.cityRequired'))
      return false
    }
    if (requiresPrice && (!formData.price.trim() || isNaN(Number(formData.price)) || Number(formData.price) <= 0)) {
      setError(t('validation.priceRequired'))
      return false
    }
    // Rental-specific validation
    if (formData.category === 'for_rent' && !formData.rental_period) {
      setError(t('validation.rentalPeriodRequired'))
      return false
    }
    // Job-specific salary validation
    if (formData.category === 'job') {
      if (formData.salary_type === 'fixed' && (!formData.salary_amount || isNaN(Number(formData.salary_amount)) || Number(formData.salary_amount) <= 0)) {
        setError(t('validation.fixedSalaryRequired'))
        return false
      }
      if (formData.salary_type === 'range') {
        if (!formData.salary_min || !formData.salary_max ||
            isNaN(Number(formData.salary_min)) || isNaN(Number(formData.salary_max)) ||
            Number(formData.salary_min) <= 0 || Number(formData.salary_max) <= 0) {
          setError(t('validation.salaryRangeRequired'))
          return false
        }
        if (Number(formData.salary_min) >= Number(formData.salary_max)) {
          setError(t('validation.salaryRangeOrder'))
          return false
        }
      }
    }
    // Job application validation - require at least one contact method
    if (formData.category === 'job') {
      if (!formData.application_email?.trim() && !formData.application_phone?.trim()) {
        setError(t('validation.jobContactRequired'))
        return false
      }
    }
    // Service contact validation - require phone number
    if (formData.category === 'service') {
      if (!formData.service_phone?.trim()) {
        setError(t('validation.servicePhoneRequired'))
        return false
      }
    }
    // Urgent category validation
    if (formData.category === 'urgent') {
      if (!formData.urgent_type) {
        setError(t('validation.urgentTypeRequired'))
        return false
      }
      if (!formData.urgent_contact_preference) {
        setError(t('validation.urgentContactRequired'))
        return false
      }
    }
    if (requiresImages && formData.photos.length === 0) {
      setError(t('validation.imageRequired'))
      return false
    }
    // Photo limits: 5 for rentals, 3 for sale, 2 for urgent
    let maxPhotos = 3
    if (formData.category === 'for_rent') maxPhotos = 5
    if (formData.category === 'urgent') maxPhotos = 2
    if (formData.photos.length > maxPhotos) {
      setError(t('validation.maxImages', { max: maxPhotos }))
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
        throw new Error(t('validation.signedInRequired'))
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
          // Category-specific fields
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
          // Urgent category fields
          urgent_type: formData.urgent_type || null,
          urgent_expires_at: formData.urgent_expires_at || null,
          urgent_contact_preference: formData.urgent_contact_preference || null,
          metadata: formData.metadata
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save listing')
      }

      setSuccess(mode === 'edit' ? t('form.successUpdated') : t('form.successCreated'))
      
      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }

    } catch (err) {
      console.error('Error saving listing:', err)
      setError(err instanceof Error ? err.message : t('form.failedSave'))
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('form.basicInfo')}</h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="title" className={labelClassName}>
              {t('form.titleLabel')} *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t('form.titlePlaceholderLong')}
              className={inputClassName}
              maxLength={200}
            />
            <p className="mt-1 text-sm text-gray-500">
              {t('form.charCount', { count: formData.title.length })}
            </p>
          </div>

          <div>
            <label htmlFor="description" className={labelClassName}>
              {t('form.descriptionLabel')} *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('form.descriptionPlaceholderLong')}
              className={`${inputClassName} min-h-[120px] resize-y`}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className={labelClassName}>
                {t('form.categoryLabel')} *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={selectClassName}
                disabled={mode === 'edit' || fixedCategory}
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
                {t('form.subcategoryLabel')}
              </label>
              <select
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => handleInputChange('subcategory', e.target.value)}
                className={selectClassName}
              >
                <option value="">{t('form.selectSubcategoryOption')}</option>
                {categoryData?.subcategories.map((sub) => (
                  <option key={sub.name} value={sub.name}>
                    {getLocalizedName(sub, locale)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {requiresPrice && formData.category !== 'for_rent' && (
            <div>
              <label htmlFor="price" className={labelClassName}>
                {t('form.priceLabel')} *
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                dir="ltr"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder={t('form.priceEnterDzd')}
                className={inputClassName}
              />
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('form.locationSection')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="wilaya" className={labelClassName}>
              {t('form.wilayaLabel')} *
            </label>
            <select
              id="wilaya"
              value={formData.location_wilaya}
              onChange={(e) => handleInputChange('location_wilaya', e.target.value)}
              className={selectClassName}
            >
              <option value="">{t('form.selectWilayaOption')}</option>
              {ALGERIA_WILAYAS.map((wilaya) => (
                <option key={wilaya.code} value={wilaya.name}>
                  {wilaya.code} - {getLocalizedName(wilaya, locale)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className={labelClassName}>
              {t('form.cityLabel')} *
            </label>
            {availableCities.length > 0 ? (
              <select
                id="city"
                value={formData.location_city}
                onChange={(e) => handleInputChange('location_city', e.target.value)}
                className={selectClassName}
              >
                <option value="">{t('form.selectCityOption')}</option>
                {availableCities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {getLocalizedName(city, locale)}
                  </option>
                ))}
                <option value="other">{t('form.cityOther')}</option>
              </select>
            ) : (
              <input
                id="city"
                type="text"
                value={formData.location_city}
                onChange={(e) => handleInputChange('location_city', e.target.value)}
                placeholder={t('form.enterCityName')}
                className={inputClassName}
              />
            )}
          </div>
        </div>
      </div>

      {/* Category-Specific Fields */}
      {(formData.category === 'for_rent' || formData.category === 'job' || formData.category === 'for_sale' || formData.category === 'service' || formData.category === 'urgent') && (
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {formData.category === 'for_rent' ? t('form.rentalDetails') :
             formData.category === 'job' ? t('form.jobDetails') :
             formData.category === 'service' ? t('form.serviceDetails') :
             formData.category === 'urgent' ? t('form.urgentDetails') : t('form.itemDetails')}
          </h2>
          
          <div className="space-y-6">
            {/* For Rent specific fields */}
            {formData.category === 'for_rent' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="available_from" className={labelClassName}>
                      {t('form.availableFrom')}
                    </label>
                    <input
                      id="available_from"
                      type="date"
                      dir="ltr"
                      value={formData.available_from}
                      onChange={(e) => handleInputChange('available_from', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="available_to" className={labelClassName}>
                      {t('form.availableUntil')}
                    </label>
                    <input
                      id="available_to"
                      type="date"
                      dir="ltr"
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
                      {t('form.rentalPrice')} *
                    </label>
                    <input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      dir="ltr"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder={t('form.rentalPricePlaceholder')}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="rental_period" className={labelClassName}>
                      {t('form.rentalPeriodLabel')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="rental_period"
                      value={formData.rental_period}
                      onChange={(e) => handleInputChange('rental_period', e.target.value)}
                      className={selectClassName}
                      required
                    >
                      <option value="">{t('form.selectRentalPeriod')}</option>
                      <option value="hourly">{t('form.rentalHourly')}</option>
                      <option value="daily">{t('form.rentalDaily')}</option>
                      <option value="weekly">{t('form.rentalWeekly')}</option>
                      <option value="monthly">{t('form.rentalMonthly')}</option>
                      <option value="yearly">{t('form.rentalYearly')}</option>
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
                    {t('form.companyName')}
                  </label>
                  <input
                    id="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder={t('form.enterCompanyName')}
                    className={inputClassName}
                  />
                </div>

                {/* Salary Type Selection */}
                <div>
                  <label htmlFor="salary_type" className={labelClassName}>
                    {t('form.salaryInfo')}
                  </label>
                  <select
                    id="salary_type"
                    value={formData.salary_type}
                    onChange={(e) => handleInputChange('salary_type', e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">{t('form.selectSalaryType')}</option>
                    <option value="fixed">{t('form.salaryFixed')}</option>
                    <option value="range">{t('form.salaryRange')}</option>
                    <option value="market_based">{t('form.salaryMarketBased')}</option>
                    <option value="negotiable">{t('form.salaryNegotiable')}</option>
                    <option value="tbd">{t('form.salaryTbd')}</option>
                    <option value="performance">{t('form.salaryPerformance')}</option>
                    <option value="interview">{t('form.salaryInterview')}</option>
                  </select>
                </div>

                {/* Conditional Salary Fields */}
                {formData.salary_type === 'fixed' && (
                  <div>
                    <label htmlFor="salary_amount" className={labelClassName}>
                      {t('form.fixedSalaryAmount')}
                    </label>
                    <input
                      id="salary_amount"
                      type="number"
                      min="0"
                      dir="ltr"
                      value={formData.salary_amount}
                      onChange={(e) => handleInputChange('salary_amount', e.target.value)}
                      placeholder={t('form.enterFixedSalary')}
                      className={inputClassName}
                    />
                  </div>
                )}

                {formData.salary_type === 'range' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="salary_min" className={labelClassName}>
                        {t('form.minSalary')}
                      </label>
                      <input
                        id="salary_min"
                        type="number"
                        min="0"
                        dir="ltr"
                        value={formData.salary_min}
                        onChange={(e) => handleInputChange('salary_min', e.target.value)}
                        placeholder={t('form.minSalaryPlaceholder')}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label htmlFor="salary_max" className={labelClassName}>
                        {t('form.maxSalary')}
                      </label>
                      <input
                        id="salary_max"
                        type="number"
                        min="0"
                        dir="ltr"
                        value={formData.salary_max}
                        onChange={(e) => handleInputChange('salary_max', e.target.value)}
                        placeholder={t('form.maxSalaryPlaceholder')}
                        className={inputClassName}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="job_type" className={labelClassName}>
                    {t('form.jobTypeLabel')}
                  </label>
                  <select
                    id="job_type"
                    value={formData.job_type}
                    onChange={(e) => handleInputChange('job_type', e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">{t('form.selectJobType')}</option>
                    <option value="full-time">{t('form.jobFullTime')}</option>
                    <option value="part-time">{t('form.jobPartTime')}</option>
                    <option value="contract">{t('form.jobContract')}</option>
                    <option value="internship">{t('form.jobInternship')}</option>
                    <option value="freelance">{t('form.jobFreelance')}</option>
                  </select>
                </div>
              </>
            )}

            {/* For Sale specific fields */}
            {formData.category === 'for_sale' && (
              <div>
                <label htmlFor="condition" className={labelClassName}>
                  {t('form.conditionLabel')}
                </label>
                <select
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className={selectClassName}
                >
                  <option value="">{t('form.selectCondition')}</option>
                  <option value="new">{t('form.conditionNew')}</option>
                  <option value="like_new">{t('form.conditionLikeNew')}</option>
                  <option value="good">{t('form.conditionGood')}</option>
                  <option value="fair">{t('form.conditionFair')}</option>
                  <option value="poor">{t('form.conditionPoor')}</option>
                </select>
              </div>
            )}

            {/* Service specific fields */}
            {formData.category === 'service' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="service_phone" className={labelClassName}>
                    {t('form.servicePhoneLabel')} *
                  </label>
                  <input
                    id="service_phone"
                    type="tel"
                    dir="ltr"
                    value={formData.service_phone}
                    onChange={(e) => handleInputChange('service_phone', e.target.value)}
                    placeholder="+213 XX XX XX XX"
                    className={inputClassName}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('form.servicePhoneVisible')}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ms-3">
                      <h3 className="text-lg font-medium text-blue-900">
                        {t('form.servicePricingTitle')}
                      </h3>
                    </div>
                  </div>
                  <p className="text-blue-800 font-medium">
                    💬 {t('form.servicePricingNote')}
                  </p>
                  <p className="text-blue-700 text-sm mt-2">
                    {t('form.servicePricingDesc')}
                  </p>
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mt-3">
                    <p className="text-blue-800 text-sm font-medium">
                      📞 {t('form.servicePricingReminder')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Urgent category specific fields */}
            {formData.category === 'urgent' && (
              <div className="space-y-6">
                {/* Urgent alert banner */}
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl me-3">🚨</span>
                    <h3 className="text-lg font-bold text-red-900">
                      {t('form.urgentBannerTitle')}
                    </h3>
                  </div>
                  <p className="text-red-800 font-medium mb-2">
                    {t('form.urgentBannerNote')}
                  </p>
                  <p className="text-red-700 text-sm">
                    {t('form.urgentBannerDesc')}
                  </p>
                </div>

                {/* Urgent Type */}
                <div>
                  <label htmlFor="urgent_type" className={labelClassName}>
                    {t('form.urgentTypeLabel')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="urgent_type"
                    value={formData.urgent_type}
                    onChange={(e) => handleInputChange('urgent_type', e.target.value)}
                    className={selectClassName}
                    required
                  >
                    <option value="">{t('form.selectUrgentType')}</option>
                    <option value="blood_donation">🩸 {t('form.urgentBlood')}</option>
                    <option value="medicine_needed">💊 {t('form.urgentMedicine')}</option>
                    <option value="food_assistance">🍲 {t('form.urgentFood')}</option>
                    <option value="medical_equipment">🏥 {t('form.urgentMedicalEquipment')}</option>
                    <option value="emergency_housing">🏠 {t('form.urgentHousing')}</option>
                  </select>
                </div>

                {/* Expiration Time */}
                <div>
                  <label htmlFor="urgent_expires_at" className={labelClassName}>
                    {t('form.urgentExpiresLabel')}
                  </label>
                  <select
                    id="urgent_expires_at"
                    value={formData.urgent_expires_at}
                    onChange={(e) => handleInputChange('urgent_expires_at', e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">{t('form.urgentExpiresDefault')}</option>
                    <option value="24h">{t('form.urgentExpires24')}</option>
                    <option value="48h">{t('form.urgentExpires48')}</option>
                    <option value="72h">{t('form.urgentExpires72')}</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('form.urgentExpiresHint')}
                  </p>
                </div>

                {/* Contact Preference */}
                <div>
                  <label htmlFor="urgent_contact_preference" className={labelClassName}>
                    {t('form.urgentContactLabel')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="urgent_contact_preference"
                    value={formData.urgent_contact_preference}
                    onChange={(e) => handleInputChange('urgent_contact_preference', e.target.value)}
                    className={selectClassName}
                    required
                  >
                    <option value="">{t('form.selectContactPreference')}</option>
                    <option value="phone">📞 {t('form.contactPhone')}</option>
                    <option value="whatsapp">💬 {t('form.contactWhatsapp')}</option>
                    <option value="both">📞💬 {t('form.contactBoth')}</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('form.urgentContactHint')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Information for Jobs */}
      {formData.category === 'job' && (
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('form.howToApply')}</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="application_email" className={labelClassName}>
                  {t('form.applicationEmail')}
                </label>
                <input
                  id="application_email"
                  type="email"
                  dir="ltr"
                  value={formData.application_email}
                  onChange={(e) => handleInputChange('application_email', e.target.value)}
                  placeholder="jobs@company.com"
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="application_phone" className={labelClassName}>
                  {t('form.applicationPhone')}
                </label>
                <input
                  id="application_phone"
                  type="tel"
                  dir="ltr"
                  value={formData.application_phone}
                  onChange={(e) => handleInputChange('application_phone', e.target.value)}
                  placeholder="+213 XX XX XX XX"
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="application_instructions" className={labelClassName}>
                {t('form.applicationInstructions')}
              </label>
              <textarea
                id="application_instructions"
                value={formData.application_instructions}
                onChange={(e) => handleInputChange('application_instructions', e.target.value)}
                placeholder={t('form.applicationInstructionsPlaceholder')}
                className={`${inputClassName} min-h-[100px] resize-y`}
                rows={4}
              />
            </div>
          </div>
        </div>
      )}

      {/* Images - Hide for job, service, and urgent categories */}
      {formData.category !== 'job' && formData.category !== 'service' && formData.category !== 'urgent' && (
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t('form.imagesSection')} {requiresImages && <span className="text-red-500">*</span>}
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

      {/* Hot Deal Section - Coming Soon - Hide for urgent category */}
      {formData.category !== 'urgent' && (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-8 shadow-lg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-2xl"></div>

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl me-4 shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  {t('form.hotDealTitle')}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-3 py-1 rounded-full font-bold shadow-md">
                    {t('form.hotDealComingSoon')}
                  </span>
                </h3>
                <p className="text-gray-600 mt-1">{t('form.hotDealSubtitle')}</p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            {t('form.hotDealDesc')}
          </p>

          {/* Disabled Toggle */}
          <div className="flex items-center justify-between bg-white rounded-lg p-4 border-2 border-gray-200 opacity-60 cursor-not-allowed">
            <div className="flex items-center">
              <div className="relative inline-block w-12 h-6 me-3">
                <div className="absolute inset-0 bg-gray-300 rounded-full"></div>
                <div className="absolute start-1 top-1 bg-white w-4 h-4 rounded-full shadow"></div>
              </div>
              <span className="text-gray-600 font-medium">{t('form.hotDealToggle')}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHotDealModal(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {t('form.hotDealLearnMore')}
            </button>
          </div>

          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>🔥</strong> {t('form.hotDealPremium')}
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 border-2 border-white rounded-lg text-white font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        >
          {t('form.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-colors"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {mode === 'edit' ? t('form.updating') : t('form.creating')}
            </div>
          ) : (
            mode === 'edit' ? t('form.updateListing') : t('form.createListing')
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
