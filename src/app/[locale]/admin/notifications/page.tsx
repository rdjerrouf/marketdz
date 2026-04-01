'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  user_id?: string
  metadata?: Record<string, unknown> | null
  read: boolean
  created_at: string
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      // Mock notifications data for now
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'info',
          title: 'New User Registration',
          message: 'A new user has registered: test@example.com',
          user_id: 'user-123',
          read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: { email: 'test@example.com' }
        },
        {
          id: '2',
          type: 'warning',
          title: 'High Traffic Alert',
          message: 'Website traffic is 150% above normal levels',
          read: false,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          metadata: { traffic_increase: '150%' }
        },
        {
          id: '3',
          type: 'success',
          title: 'Backup Completed',
          message: 'Daily database backup completed successfully',
          read: true,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          type: 'error',
          title: 'Payment Processing Error',
          message: 'Failed to process payment for order #12345',
          user_id: 'user-456',
          read: false,
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          metadata: { order_id: '12345', amount: '150.00' }
        },
        {
          id: '5',
          type: 'info',
          title: 'New Listing Posted',
          message: 'New listing "iPhone 14 Pro" posted in Electronics category',
          user_id: 'user-789',
          read: true,
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          metadata: { listing_title: 'iPhone 14 Pro', category: 'Electronics' }
        }
      ]

      setNotifications(mockNotifications)
      toast.success('Notifications loaded')
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
    toast.success('Marked as read')
  }

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
    toast.success('All notifications marked as read')
  }

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    )
    toast.success('Notification deleted')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return '🚨'
      case 'warning': return '⚠️'
      case 'success': return '✅'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800 border-red-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'success': return 'bg-green-100 text-green-800 border-green-300'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-600">
            System notifications and alerts
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>

        {/* Filter and Actions */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    filter === 'unread'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    filter === 'read'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Read ({notifications.length - unreadCount})
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white shadow rounded-lg">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400 text-sm mt-1">
                {filter === 'unread' ? 'All notifications have been read' : 'Check back later for updates'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-lg font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                          {!notification.read && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                          {notification.user_id && (
                            <span>User: {notification.user_id}</span>
                          )}
                        </div>
                        {notification.metadata && (
                          <div className="mt-2 text-xs text-gray-400">
                            <details>
                              <summary className="cursor-pointer hover:text-gray-600">
                                View metadata
                              </summary>
                              <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(notification.metadata, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl">📊</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl">🔔</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl">✅</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Read</p>
                <p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl">🚨</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Alerts</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.type === 'error' || n.type === 'warning').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}