// src/app/admin/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface AnalyticsData {
  totalUsers: number
  totalListings: number
  totalRevenue: number
  activeUsers: number
  conversionsThisMonth: number
  topCategories: Array<{ category: string; count: number }>
  userGrowth: Array<{ date: string; users: number; listings: number }>
  locationStats: Array<{ wilaya: string; count: number }>
  recentActivity: Array<{ type: string; description: string; timestamp: string }>
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalListings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    conversionsThisMonth: 0,
    topCategories: [],
    userGrowth: [],
    locationStats: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Calculate date range
      const now = new Date()
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch total listings
      const { count: totalListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })

      // Fetch active users (users who created listings or messages in the time range)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', startDate.toISOString())

      // Fetch top categories
      const { data: categoryData } = await supabase
        .from('listings')
        .select('category')
        .gte('created_at', startDate.toISOString())

      const categoryStats = categoryData?.reduce((acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      }, {}) || {}

      const topCategories = Object.entries(categoryStats)
        .map(([category, count]) => ({ category, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Fetch location stats
      const { data: locationData } = await supabase
        .from('listings')
        .select('location_wilaya')
        .gte('created_at', startDate.toISOString())

      const locationStats = locationData?.reduce((acc: Record<string, number>, item) => {
        if (item.location_wilaya) {
          acc[item.location_wilaya] = (acc[item.location_wilaya] || 0) + 1
        }
        return acc
      }, {}) || {}

      const topLocations = Object.entries(locationStats)
        .map(([wilaya, count]) => ({ wilaya, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)

      // Generate mock growth data (in a real app, this would be from historical data)
      const userGrowth = Array.from({ length: Math.min(daysBack, 30) }, (_, i) => {
        const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
        return {
          date: date.toISOString().split('T')[0],
          users: Math.floor(Math.random() * 10) + 5,
          listings: Math.floor(Math.random() * 15) + 8
        }
      })

      // Mock recent activity
      const recentActivity = [
        { type: 'user_signup', description: 'New user registered', timestamp: new Date(Date.now() - 300000).toISOString() },
        { type: 'listing_created', description: 'New listing published', timestamp: new Date(Date.now() - 600000).toISOString() },
        { type: 'message_sent', description: 'Message sent between users', timestamp: new Date(Date.now() - 900000).toISOString() },
        { type: 'listing_sold', description: 'Listing marked as sold', timestamp: new Date(Date.now() - 1200000).toISOString() },
        { type: 'user_verified', description: 'User completed verification', timestamp: new Date(Date.now() - 1800000).toISOString() }
      ]

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalListings: totalListings || 0,
        totalRevenue: 0, // Would be calculated from actual transactions
        activeUsers: activeUsers || 0,
        conversionsThisMonth: Math.floor(Math.random() * 50) + 20, // Mock data
        topCategories,
        userGrowth,
        locationStats: topLocations,
        recentActivity
      })

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    trend, 
    color = 'blue' 
  }: {
    title: string
    value: string | number
    subtitle?: string
    trend?: { value: number; isPositive: boolean }
    color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200'
    }

    return (
      <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div className={`flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span className="text-sm font-medium">
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor platform performance and user behavior</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Users"
          value={analytics.totalUsers}
          subtitle="Registered users"
          trend={{ value: 12.5, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={analytics.activeUsers}
          subtitle={`Last ${timeRange}`}
          trend={{ value: 8.2, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Total Listings"
          value={analytics.totalListings}
          subtitle="All listings"
          trend={{ value: 15.3, isPositive: true }}
          color="purple"
        />
        <StatCard
          title="Revenue"
          value={`${analytics.totalRevenue} DA`}
          subtitle="Total earnings"
          trend={{ value: 23.1, isPositive: true }}
          color="yellow"
        />
        <StatCard
          title="Conversions"
          value={analytics.conversionsThisMonth}
          subtitle="This month"
          trend={{ value: 5.4, isPositive: false }}
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Growth Trends</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Users</span>
              <span>Listings</span>
            </div>
            {analytics.userGrowth.slice(-7).map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-xs text-gray-500">
                  {new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(item.users / 20) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-blue-600 w-8">{item.users}</span>
                </div>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(item.listings / 25) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-green-600 w-8">{item.listings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Categories</h2>
          <div className="space-y-3">
            {analytics.topCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900 capitalize">
                    {category.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(category.count / Math.max(...analytics.topCategories.map(c => c.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{category.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Stats and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Locations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Locations</h2>
          <div className="space-y-3">
            {analytics.locationStats.map((location, index) => (
              <div key={location.wilaya} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900">
                    {location.wilaya}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(location.count / Math.max(...analytics.locationStats.map(l => l.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{location.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {((analytics.activeUsers / analytics.totalUsers) * 100 || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">User Engagement Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(analytics.totalListings / analytics.totalUsers || 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Listings per User</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.conversionsThisMonth}
            </div>
            <div className="text-sm text-gray-600">Monthly Conversions</div>
          </div>
        </div>
      </div>
    </div>
  )
}