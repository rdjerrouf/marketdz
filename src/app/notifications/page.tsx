// src/app/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/signin')
      return
    }

    // For now, show sample notifications
    // In production, fetch from your notifications API
    setNotifications([
      {
        id: '1',
        title: 'Welcome to MarketDZ!',
        message: 'Thank you for joining our marketplace. Start exploring listings in your area.',
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'New Message',
        message: 'You have received a new message about your listing.',
        type: 'info',
        is_read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ])
    setLoading(false)
  }, [user, userLoading, router])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, is_read: true }))
    )
  }

  const getNotificationIcon = (type: string) => {
    const icons = {
      success: '✅',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌'
    }
    return icons[type as keyof typeof icons] || 'ℹ️'
  }

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    const alpha = isRead ? '0.1' : '0.2'
    const colors = {
      success: `bg-green-50 border-green-200`,
      info: `bg-blue-50 border-blue-200`,
      warning: `bg-yellow-50 border-yellow-200`,
      error: `bg-red-50 border-red-200`
    }
    return colors[type as keyof typeof colors] || colors.info
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-500 text-lg">No notifications yet</div>
                <p className="text-gray-400 text-sm mt-2">
                  You'll see notifications here when you have new messages, updates, or important information.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        getNotificationBgColor(notification.type, notification.is_read)
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </span>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className={`mt-1 text-sm ${
                        !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Push Notification Settings */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-500">Get notified about new messages and updates</p>
              </div>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                onClick={() => {
                  // Request notification permission
                  if ('Notification' in window) {
                    Notification.requestPermission().then((permission) => {
                      if (permission === 'granted') {
                        new Notification('Notifications enabled!', {
                          body: 'You will now receive push notifications.',
                          icon: '/icons/icon-192x192.png'
                        })
                      }
                    })
                  }
                }}
              >
                Enable Push Notifications
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive important updates via email</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-gray-600">Enable</span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-500">Get SMS alerts for urgent messages</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-600">Enable</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
