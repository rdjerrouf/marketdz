// src/app/admin/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface PlatformSettings {
  site_name: string
  site_description: string
  maintenance_mode: boolean
  registration_enabled: boolean
  listing_approval_required: boolean
  max_images_per_listing: number
  max_listing_price: number
  commission_rate: number
  featured_listing_price: number
  email_notifications: boolean
  sms_notifications: boolean
  auto_delete_expired_listings: boolean
  listing_expiry_days: number
  max_free_listings_per_user: number
  verification_required: boolean
  content_moderation: boolean
  search_algolia_enabled: boolean
  cdn_enabled: boolean
  backup_frequency: string
}

interface NotificationSettings {
  welcome_email: boolean
  listing_approved: boolean
  listing_rejected: boolean
  message_received: boolean
  listing_expired: boolean
  payment_received: boolean
  weekly_summary: boolean
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'notifications' | 'security' | 'performance'>('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Settings state
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    site_name: 'MarketDZ',
    site_description: 'The Premier Marketplace for Algeria',
    maintenance_mode: false,
    registration_enabled: true,
    listing_approval_required: false,
    max_images_per_listing: 5,
    max_listing_price: 10000000,
    commission_rate: 2.5,
    featured_listing_price: 500,
    email_notifications: true,
    sms_notifications: false,
    auto_delete_expired_listings: true,
    listing_expiry_days: 30,
    max_free_listings_per_user: 10,
    verification_required: false,
    content_moderation: true,
    search_algolia_enabled: false,
    cdn_enabled: true,
    backup_frequency: 'daily'
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    welcome_email: true,
    listing_approved: true,
    listing_rejected: true,
    message_received: true,
    listing_expired: true,
    payment_received: true,
    weekly_summary: true
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // In a real app, these would be loaded from a settings table
      // For demo purposes, we'll use localStorage or default values
      const savedSettings = localStorage.getItem('admin_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setPlatformSettings({ ...platformSettings, ...parsed.platform })
        setNotifications({ ...notifications, ...parsed.notifications })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // In a real app, this would save to database
      const settings = {
        platform: platformSettings,
        notifications: notifications
      }
      localStorage.setItem('admin_settings', JSON.stringify(settings))
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handlePlatformChange = (key: keyof PlatformSettings, value: any) => {
    setPlatformSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setPlatformSettings({
        site_name: 'MarketDZ',
        site_description: 'The Premier Marketplace for Algeria',
        maintenance_mode: false,
        registration_enabled: true,
        listing_approval_required: false,
        max_images_per_listing: 5,
        max_listing_price: 10000000,
        commission_rate: 2.5,
        featured_listing_price: 500,
        email_notifications: true,
        sms_notifications: false,
        auto_delete_expired_listings: true,
        listing_expiry_days: 30,
        max_free_listings_per_user: 10,
        verification_required: false,
        content_moderation: true,
        search_algolia_enabled: false,
        cdn_enabled: true,
        backup_frequency: 'daily'
      })
      setNotifications({
        welcome_email: true,
        listing_approved: true,
        listing_rejected: true,
        message_received: true,
        listing_expired: true,
        payment_received: true,
        weekly_summary: true
      })
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'features', name: 'Features', icon: '🔧' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'performance', name: 'Performance', icon: '⚡' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600">Configure platform behavior and features</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">General Platform Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={platformSettings.site_name}
                  onChange={(e) => handlePlatformChange('site_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={platformSettings.commission_rate}
                  onChange={(e) => handlePlatformChange('commission_rate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
              <textarea
                value={platformSettings.site_description}
                onChange={(e) => handlePlatformChange('site_description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Images per Listing</label>
                <input
                  type="number"
                  value={platformSettings.max_images_per_listing}
                  onChange={(e) => handlePlatformChange('max_images_per_listing', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Listing Price (DA)</label>
                <input
                  type="number"
                  value={platformSettings.max_listing_price}
                  onChange={(e) => handlePlatformChange('max_listing_price', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Features Settings */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Platform Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">User Registration</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.registration_enabled}
                      onChange={(e) => handlePlatformChange('registration_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Listing Approval Required</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.listing_approval_required}
                      onChange={(e) => handlePlatformChange('listing_approval_required', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Content Moderation</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.content_moderation}
                      onChange={(e) => handlePlatformChange('content_moderation', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">User Verification Required</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.verification_required}
                      onChange={(e) => handlePlatformChange('verification_required', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Listing Expiry (days)</label>
                  <input
                    type="number"
                    value={platformSettings.listing_expiry_days}
                    onChange={(e) => handlePlatformChange('listing_expiry_days', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Free Listings per User</label>
                  <input
                    type="number"
                    value={platformSettings.max_free_listings_per_user}
                    onChange={(e) => handlePlatformChange('max_free_listings_per_user', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Featured Listing Price (DA)</label>
                  <input
                    type="number"
                    value={platformSettings.featured_listing_price}
                    onChange={(e) => handlePlatformChange('featured_listing_price', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
            
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-500">
                      Send notifications for {key.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleNotificationChange(key as keyof NotificationSettings, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Security & Privacy</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
                  <p className="text-xs text-gray-500">Temporarily disable public access</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.maintenance_mode}
                    onChange={(e) => handlePlatformChange('maintenance_mode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Security Recommendations</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Enable two-factor authentication for admin accounts</li>
                        <li>Regularly update admin passwords</li>
                        <li>Monitor failed login attempts</li>
                        <li>Enable SSL/TLS encryption</li>
                        <li>Regular security audits</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Settings */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Performance & Optimization</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">CDN Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.cdn_enabled}
                      onChange={(e) => handlePlatformChange('cdn_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Auto-delete Expired Listings</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.auto_delete_expired_listings}
                      onChange={(e) => handlePlatformChange('auto_delete_expired_listings', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                  <select
                    value={platformSettings.backup_frequency}
                    onChange={(e) => handlePlatformChange('backup_frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Performance Status</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>• Server Response: Fast (120ms)</div>
                      <div>• CDN Hit Rate: 95%</div>
                      <div>• Database Performance: Good</div>
                      <div>• Cache Efficiency: 87%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}